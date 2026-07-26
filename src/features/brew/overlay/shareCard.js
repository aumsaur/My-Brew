// Canvas renderer for the shareable "your brew" square (1080×1080 — feed-ready,
// crops cleanly into an Instagram Story too). Drawn on demand into an offscreen
// canvas (nothing is kept mounted in the DOM) and exported as a PNG download.
// The hero image is a snapshot of the REAL 3D vessel model (see
// VesselPreview.jsx / scene/Vessel.jsx) rather than a flat icon — `vesselImage`
// is a dataURL captured from that live WebGL canvas at export time.

const SIZE = 1080;

function hexToRgb(hex) {
  const n = parseInt(hex.replace("#", ""), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
function rgba(hex, a) {
  const [r, g, b] = hexToRgb(hex);
  return `rgba(${r},${g},${b},${a})`;
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

// Word-wraps `text` centered at `x`, starting at `startY`; returns the y just
// past the last line drawn.
function wrapCentered(ctx, text, x, startY, maxWidth, lineHeight) {
  const words = text.split(" ");
  let line = "";
  let y = startY;
  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    if (line && ctx.measureText(test).width > maxWidth) {
      ctx.fillText(line, x, y);
      line = word;
      y += lineHeight;
    } else {
      line = test;
    }
  }
  if (line) {
    ctx.fillText(line, x, y);
    y += lineHeight;
  }
  return y;
}

// Small deterministic PRNG so a given brew always scatters its sparkles the
// same way (nice for reproducibility, not that anyone will notice).
function makeRand(seed) {
  let s = seed || 1;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

async function ensureFonts() {
  if (!document.fonts) return;
  try {
    await Promise.all([
      document.fonts.load("700 60px Cinzel"),
      document.fonts.load("400 32px Georgia"),
    ]);
    await document.fonts.ready;
  } catch {
    /* fall back to default fonts if the load races or fails */
  }
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

// `ingredients`: [{ name, color }] — what went into this specific blend.
// `vesselImage`: dataURL snapshot of the live VesselPreview canvas (may be
// omitted, e.g. if the capture failed — the card still renders without it).
export async function renderShareCard({ name, vesselImage, blurb, color, secret, ingredients = [] }) {
  await ensureFonts();

  const canvas = document.createElement("canvas");
  canvas.width = SIZE;
  canvas.height = SIZE;
  const ctx = canvas.getContext("2d");

  // background — deep witchy base, glowing toward the brew's own hue
  const bg = ctx.createRadialGradient(SIZE / 2, SIZE * 0.38, SIZE * 0.08, SIZE / 2, SIZE * 0.5, SIZE * 0.78);
  bg.addColorStop(0, rgba(color, 0.55));
  bg.addColorStop(0.55, "#160a26");
  bg.addColorStop(1, "#0a0416");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, SIZE, SIZE);

  // scattered sparkles
  const rand = makeRand(secret ? 7 : 3);
  for (let i = 0; i < 70; i++) {
    const x = rand() * SIZE;
    const y = rand() * SIZE;
    const r = rand() * 1.6 + 0.4;
    ctx.globalAlpha = rand() * 0.5 + 0.12;
    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;

  // frame — gold ring for secrets, a soft glow of the brew's own colour otherwise
  const frameColor = secret ? "#e8c27a" : rgba(color, 0.75);
  ctx.strokeStyle = frameColor;
  ctx.lineWidth = secret ? 6 : 3;
  ctx.strokeRect(28, 28, SIZE - 56, SIZE - 56);

  ctx.textAlign = "center";

  let cursorY = 300;
  if (secret) {
    ctx.fillStyle = "#e8c27a";
    ctx.font = "600 28px 'Cinzel', Georgia, serif";
    ctx.fillText("✦  S E C R E T   B R E W  ✦", SIZE / 2, 128);
    cursorY = 340;
  }

  // the real 3D vessel, snapshotted live and composited in
  let vesselBottom = cursorY + 60;
  if (vesselImage) {
    try {
      const img = await loadImage(vesselImage);
      const h = 420;
      const w = (img.width / img.height) * h;
      const vy = cursorY - h * 0.55;
      ctx.drawImage(img, SIZE / 2 - w / 2, vy, w, h);
      vesselBottom = vy + h * 0.92; // vessels don't fill their square capture bounds
    } catch {
      /* no snapshot available — fall through, the card still reads fine */
    }
  }

  // name
  ctx.fillStyle = "#f2e9ff";
  ctx.font = "700 60px 'Cinzel', Georgia, serif";
  let y = wrapCentered(ctx, name, SIZE / 2, vesselBottom, SIZE - 220, 70);

  // blurb
  ctx.fillStyle = "rgba(242,233,255,0.8)";
  ctx.font = "32px Georgia, serif";
  wrapCentered(ctx, blurb, SIZE / 2, y + 36, SIZE - 260, 44);

  // ingredient chips, bottom
  if (ingredients.length) {
    const chipFont = "24px Georgia, serif";
    ctx.font = chipFont;
    const padX = 18;
    const dotR = 6;
    const gap = 14;
    const chipH = 44;
    const widths = ingredients.map((ing) => dotR * 2 + 10 + ctx.measureText(ing.name).width + padX * 2);
    const totalW = widths.reduce((a, b) => a + b, 0) + gap * (widths.length - 1);
    let cx = SIZE / 2 - totalW / 2;
    const chipY = SIZE - 148;

    ingredients.forEach((ing, i) => {
      const w = widths[i];
      ctx.fillStyle = "rgba(255,255,255,0.08)";
      roundRect(ctx, cx, chipY, w, chipH, chipH / 2);
      ctx.fill();
      ctx.strokeStyle = rgba(ing.color, 0.75);
      ctx.lineWidth = 1.5;
      roundRect(ctx, cx, chipY, w, chipH, chipH / 2);
      ctx.stroke();

      ctx.fillStyle = ing.color;
      ctx.beginPath();
      ctx.arc(cx + padX + dotR, chipY + chipH / 2, dotR, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = "#f2e9ff";
      ctx.font = chipFont;
      ctx.textAlign = "left";
      ctx.fillText(ing.name, cx + padX + dotR * 2 + 10, chipY + chipH / 2 + 8);
      ctx.textAlign = "center";

      cx += w + gap;
    });
  }

  // signature
  ctx.fillStyle = "rgba(242,233,255,0.45)";
  ctx.font = "22px Georgia, serif";
  ctx.fillText("brewed at Aumster's Cauldron", SIZE / 2, SIZE - 54);

  return canvas;
}

export async function downloadShareCard(data, filename = "my-brew.png") {
  const canvas = await renderShareCard(data);
  const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/png"));
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
