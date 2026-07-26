// Meshy text-to-3D generator for My-Brew ingredient + vessel props.
//
//   npm run meshy                     REVIEW every kind's prompt + params — no API calls, no cost
//   npm run meshy -- --only crystal,dream-draught   review just these (comma-separate)
//   npm run meshy -- --exclude crystal-spire,crystal-cluster,crystal-gem   review all BUT these
//   npm run meshy -- --send           actually generate everything reviewed above
//   npm run meshy -- --send --only crystal   generate just one
//   npm run meshy -- --send --exclude crystal-spire,crystal-cluster,crystal-gem   generate all but these
//   npm run meshy -- --send --force   regenerate even if the file already exists
//   npm run meshy -- --send --refine  also run Meshy's texture stage (per-run override)
//
// Review is the DEFAULT so prompts get eyeballed (and edited in prompts.mjs)
// before any credits are spent — nothing is sent to Meshy without --send.
// Requires MESHY_API_KEY (put it in .env — see .env.example) once you do send.
// Downloads GLBs to public/models/<key>.glb — ingredient KINDS and recipe
// VESSEL IDS share one flat output folder + one review/send flow (prompts.mjs
// exports MODELS for ingredients, VESSEL_MODELS for vessels; merged below).
// Zero dependencies — uses Node's built-in fetch (Node 18+).

import { readFile, writeFile, mkdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join, resolve } from "node:path";
import { DEFAULTS, MODELS, VESSEL_MODELS, INNERWORLD_MODELS } from "./prompts.mjs";

const ALL_MODELS = { ...MODELS, ...VESSEL_MODELS, ...INNERWORLD_MODELS };

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..", "..");
const OUT_DIR = join(ROOT, "public", "models");
const API = "https://api.meshy.ai/openapi/v2/text-to-3d";
const POLL_MS = 5000;
const TIMEOUT_MS = 15 * 60 * 1000;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// ── tiny .env loader (no dependency) ─────────────────────────────────────────
async function loadEnv() {
  const p = join(ROOT, ".env");
  if (!existsSync(p)) return;
  const txt = await readFile(p, "utf8");
  for (const line of txt.split("\n")) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/i);
    if (!m) continue;
    const val = m[2].replace(/^["']|["']$/g, "");
    if (!(m[1] in process.env)) process.env[m[1]] = val;
  }
}

// ── args ─────────────────────────────────────────────────────────────────────
function parseArgs(argv) {
  const a = { only: null, exclude: [], force: false, refine: false, send: false };
  const split = (s) => s.split(",").map((x) => x.trim()).filter(Boolean);
  for (let i = 0; i < argv.length; i++) {
    const v = argv[i];
    if (v === "--force") a.force = true;
    else if (v === "--refine") a.refine = true;
    else if (v === "--send") a.send = true;
    else if (v === "--only") a.only = split(argv[++i] || "");
    else if (v.startsWith("--only=")) a.only = split(v.slice(7));
    else if (v === "--exclude") a.exclude = split(argv[++i] || "");
    else if (v.startsWith("--exclude=")) a.exclude = split(v.slice(10));
  }
  return a;
}

// Resolves a model's per-kind overrides against DEFAULTS — the single source
// of truth for what actually gets submitted, used by BOTH the review printer
// and the real request so what you review is exactly what gets sent.
function resolveParams(def) {
  return {
    ai_model: def.aiModel ?? DEFAULTS.aiModel,
    model_type: def.modelType ?? DEFAULTS.modelType,
    topology: def.topology ?? DEFAULTS.topology,
    target_polycount: def.targetPolycount ?? DEFAULTS.targetPolycount,
    should_remesh: def.shouldRemesh ?? DEFAULTS.shouldRemesh,
    refine: def.refine ?? DEFAULTS.refine,
    negative_prompt: def.negativePrompt ?? DEFAULTS.negativePrompt ?? "",
  };
}

// ── Meshy REST helpers ────────────────────────────────────────────────────────
function headers() {
  return {
    Authorization: `Bearer ${process.env.MESHY_API_KEY}`,
    "Content-Type": "application/json",
  };
}

async function api(method, url, body) {
  const res = await fetch(url, {
    method,
    headers: headers(),
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let json;
  try {
    json = text ? JSON.parse(text) : {};
  } catch {
    json = { raw: text };
  }
  if (!res.ok) throw new Error(`${method} ${url} → ${res.status}: ${json.message || text}`);
  return json;
}

async function createPreview(def) {
  const p = resolveParams(def);
  const body = {
    mode: "preview",
    prompt: def.prompt,
    ai_model: p.ai_model,
    model_type: p.model_type,
    topology: p.topology,
    target_polycount: p.target_polycount,
    should_remesh: p.should_remesh,
    target_formats: ["glb"],
  };
  if (p.negative_prompt) body.negative_prompt = p.negative_prompt;
  const { result } = await api("POST", API, body);
  return result; // task id
}

async function createRefine(previewId) {
  const { result } = await api("POST", API, {
    mode: "refine",
    preview_task_id: previewId,
    enable_pbr: false,
    target_formats: ["glb"],
  });
  return result;
}

async function waitFor(id, label) {
  const start = Date.now();
  let last = -1;
  for (;;) {
    const task = await api("GET", `${API}/${id}`);
    if (task.status === "SUCCEEDED") {
      process.stdout.write("\r");
      return task;
    }
    if (task.status === "FAILED" || task.status === "CANCELED") {
      throw new Error(`${label} ${task.status}: ${task.task_error?.message || "unknown error"}`);
    }
    if (task.progress !== last) {
      process.stdout.write(`\r  ${label}: ${task.status} ${task.progress ?? 0}%   `);
      last = task.progress;
    }
    if (Date.now() - start > TIMEOUT_MS) throw new Error(`${label} timed out`);
    await sleep(POLL_MS);
  }
}

async function download(url, dest) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`download ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  await writeFile(dest, buf);
  return buf.length;
}

async function generate(kind, def, args) {
  const dest = join(OUT_DIR, `${kind}.glb`);
  if (!args.force && existsSync(dest)) {
    console.log(`• ${kind}: exists, skipping (use --force to regenerate)`);
    return;
  }
  console.log(`▸ ${kind}: ${def.prompt.slice(0, 68)}…`);

  const previewId = await createPreview(def);
  let task = await waitFor(previewId, `${kind} preview`);
  let credits = task.consumed_credits || 0;

  if (args.refine || def.refine || DEFAULTS.refine) {
    const refineId = await createRefine(previewId);
    task = await waitFor(refineId, `${kind} refine`);
    credits += task.consumed_credits || 0;
  }

  const glb = task.model_urls?.glb;
  if (!glb) throw new Error(`${kind}: no glb url in result`);
  const bytes = await download(glb, dest);
  console.log(`  ✓ ${kind} → public/models/${kind}.glb (${(bytes / 1024).toFixed(0)} KB, ${credits} credits)`);
}

function printReview(kinds) {
  console.log(`Reviewing ${kinds.length} model prompt(s) — nothing sent yet.\n`);
  for (const k of kinds) {
    const def = ALL_MODELS[k];
    const p = resolveParams(def);
    console.log(`▸ ${k}`);
    console.log(`  prompt: ${def.prompt}`);
    if (p.negative_prompt) console.log(`  negative: ${p.negative_prompt}`);
    console.log(
      `  model_type:${p.model_type} · topology:${p.topology} · target_polycount:${p.target_polycount} · ai_model:${p.ai_model} · refine:${p.refine}`
    );
    console.log("");
  }
  console.log(
    "Edit prompts.mjs to change any of these, then re-run to review again.\n" +
      "When they look right: npm run meshy -- --send   (add --only k1,k2 to send just some)"
  );
}

async function main() {
  await loadEnv();
  const args = parseArgs(process.argv.slice(2));
  const kinds = Object.keys(ALL_MODELS).filter(
    (k) => (!args.only || args.only.includes(k)) && !args.exclude.includes(k)
  );

  const unknown = [...(args.only || []), ...args.exclude].filter((k) => !ALL_MODELS[k]);
  if (unknown.length) {
    console.error(`✗ unknown kind(s): ${unknown.join(", ")}. Known: ${Object.keys(ALL_MODELS).join(", ")}`);
    process.exit(1);
  }

  if (!args.send) {
    printReview(kinds);
    return;
  }

  if (!process.env.MESHY_API_KEY) {
    console.error("✗ MESHY_API_KEY not set. Add it to .env (see .env.example).");
    process.exit(1);
  }

  await mkdir(OUT_DIR, { recursive: true });
  console.log(`Generating ${kinds.length} model(s) → public/models\n`);

  let ok = 0;
  let failed = 0;
  for (const kind of kinds) {
    try {
      await generate(kind, ALL_MODELS[kind], args);
      ok++;
    } catch (e) {
      console.error(`  ✗ ${kind}: ${e.message}`);
      failed++;
    }
  }
  console.log(`\nDone. ${ok} ok, ${failed} failed.`);
  if (failed) process.exit(1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
