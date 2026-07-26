import { useRef, useState } from "react";
import { INGREDIENTS, PAGE_COUNT } from "@/features/brew/data/ingredients";
import { POT_CAPACITY, MIN_FILL_RATIO } from "@/features/brew/data/recipes";
import { useBrew } from "@/features/brew/store";
import { downloadShareCard } from "@/features/brew/overlay/shareCard";
import VesselPreview from "@/features/brew/overlay/VesselPreview";

const FONT = "'Cinzel', Georgia, serif";
const CARD_BG = "rgba(10,4,26,0.9)";

function chipStyle(color, filled) {
  return {
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    padding: "3px 9px",
    borderRadius: 20,
    background: filled ? "rgba(255,255,255,0.05)" : "transparent",
    border: `1px solid ${color}${filled ? "88" : "44"}`,
    fontSize: 11.5,
    color: filled ? "#e9ddff" : "#8f82a8",
  };
}

// The pot's live fill gauge while you pour/stir: no target, no order — just how
// full it is and what's gone in so far. ONE bar whose length is fill (toward
// capacity), split into colored segments per ingredient in pour order.
function PotGauge() {
  const pours = useBrew((s) => s.pours);
  const phase = useBrew((s) => s.phase);
  if (phase === "served") return null;

  const ids = Object.keys(pours).filter((id) => (pours[id] || 0) > 0.001);
  const total = ids.reduce((s, id) => s + pours[id], 0);
  const fill = Math.min(1, total / POT_CAPACITY);
  const enough = total >= POT_CAPACITY * MIN_FILL_RATIO;

  const hint =
    phase === "stirring"
      ? "keep stirring…"
      : ids.length === 0
        ? "hold an ingredient to pour it into the pot"
        : enough
          ? "full enough — hold the stick to stir and see what you've brewed"
          : `keep pouring — the pot is ${Math.round(fill * 100)}% full`;

  return (
    <div
      style={{
        pointerEvents: "none",
        minWidth: 340,
        maxWidth: 460,
        padding: "14px 18px 12px",
        borderRadius: 14,
        background: CARD_BG,
        border: "1px solid rgba(157,78,221,0.5)",
        boxShadow: "0 0 26px rgba(60,20,90,0.6)",
        color: "#e9ddff",
      }}
    >
      <div style={{ fontSize: 11, letterSpacing: "0.14em", textTransform: "uppercase", opacity: 0.6 }}>
        the cauldron
      </div>
      <div style={{ fontSize: 13, opacity: 0.6, fontStyle: "italic", margin: "2px 0 10px" }}>
        pour a mix of your own — see what it becomes ✨
      </div>

      {/* the cauldron gauge: fill length = how full · segments = composition */}
      <div
        style={{
          position: "relative",
          height: 18,
          borderRadius: 9,
          background: "rgba(255,255,255,0.06)",
          border: "1px solid rgba(157,78,221,0.35)",
          overflow: "hidden",
          display: "flex",
        }}
      >
        {ids.map((id) => (
          <div
            key={id}
            style={{
              width: `${(pours[id] / POT_CAPACITY) * 100}%`,
              flexShrink: 0,
              background: INGREDIENTS[id].color,
              transition: "width .05s linear",
            }}
          />
        ))}
        {/* brew line — the pot must be filled to here before you can stir */}
        <div
          style={{
            position: "absolute",
            top: -2,
            bottom: -2,
            left: `${MIN_FILL_RATIO * 100}%`,
            width: 2,
            background: enough ? "rgba(155,232,155,0.9)" : "rgba(255,230,168,0.95)",
            boxShadow: "0 0 5px rgba(0,0,0,0.6)",
          }}
        />
      </div>
      <div style={{ fontSize: 10, opacity: 0.5, marginTop: 3, textAlign: "right" }}>
        {Math.round(fill * 100)}% full · brew line {Math.round(MIN_FILL_RATIO * 100)}%
      </div>

      {/* per-ingredient badges, colored to match their segments */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 8 }}>
        {ids.map((id) => {
          const share = total > 0 ? pours[id] / total : 0;
          return (
            <span key={id} style={chipStyle(INGREDIENTS[id].color, true)}>
              <span style={{ width: 9, height: 9, borderRadius: "50%", background: INGREDIENTS[id].color }} />
              {INGREDIENTS[id].name}
              <b style={{ fontWeight: 600 }}>{Math.round(share * 100)}%</b>
            </span>
          );
        })}
      </div>

      <div style={{ marginTop: 10, fontSize: 11.5, opacity: 0.55, textAlign: "center" }}>
        {hint}
      </div>
    </div>
  );
}

// Progress arc while the stir is underway.
function StirGauge() {
  const phase = useBrew((s) => s.phase);
  const progress = useBrew((s) => s.stirProgress);
  if (phase !== "stirring") return null;
  return (
    <div style={{ marginTop: 12, pointerEvents: "none", textAlign: "center" }}>
      <div
        style={{
          width: 220,
          height: 8,
          borderRadius: 6,
          margin: "0 auto",
          background: "rgba(255,255,255,0.08)",
          overflow: "hidden",
          border: "1px solid rgba(157,78,221,0.4)",
        }}
      >
        <div
          style={{
            height: "100%",
            width: `${progress * 100}%`,
            background: "linear-gradient(90deg,#9d4edd,#ffce8a)",
            transition: "width .06s linear",
          }}
        />
      </div>
    </div>
  );
}

// The reveal once the brew is served: your personalized brew, ready to save as a
// shareable square. No grading, no fail state — every blend gets a name.
function ShareCard() {
  const result = useBrew((s) => s.result);
  const phase = useBrew((s) => s.phase);
  const reset = useBrew((s) => s.reset);
  const [saving, setSaving] = useState(false);
  const canvasElRef = useRef(null);
  if (phase !== "served" || !result) return null;

  const accent = result.color || "#c077ff";
  const ingredients = result.ids.map((id) => ({
    name: INGREDIENTS[id].name,
    color: INGREDIENTS[id].color,
  }));

  const handleSave = async () => {
    setSaving(true);
    try {
      const slug =
        result.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || "my-brew";
      // snapshot the live 3D vessel preview straight into the export
      const vesselImage = canvasElRef.current?.toDataURL("image/png");
      await downloadShareCard(
        {
          name: result.name,
          vesselImage,
          blurb: result.blurb,
          color: accent,
          secret: result.secret,
          ingredients,
        },
        `${slug}.png`
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      style={{
        pointerEvents: "auto",
        width: 340,
        padding: "18px 20px 16px",
        borderRadius: 16,
        textAlign: "center",
        background: CARD_BG,
        border: `1px solid ${result.secret ? "#e8c27a" : accent}`,
        boxShadow: `0 0 34px ${accent}55`,
        color: "#f2e9ff",
        fontFamily: FONT,
      }}
    >
      <VesselPreview
        recipeId={result.recipeId}
        vessel={result.vessel}
        color={accent}
        secret={result.secret}
        onReady={(el) => (canvasElRef.current = el)}
      />
      <div style={{ fontSize: 23, margin: "6px 0 4px" }}>{result.name}</div>

      {result.secret && result.isNew && (
        <div style={{ color: "#ffd76a", fontSize: 14, marginTop: 4 }}>
          ✦ Secret discovered — a page writes itself in the grimoire
        </div>
      )}
      {!result.secret && result.isNew && (
        <div style={{ color: "#c9a6ff", fontSize: 13, marginTop: 4 }}>
          ✦ New recipe — added to your grimoire
        </div>
      )}

      <p style={{ fontSize: 12.5, lineHeight: 1.5, opacity: 0.75, margin: "10px 4px 4px" }}>
        {result.blurb}
      </p>

      <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: 6, marginTop: 10 }}>
        {ingredients.map((ing, i) => (
          <span key={i} style={chipStyle(ing.color, true)}>
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: ing.color }} />
            {ing.name}
          </span>
        ))}
      </div>

      <div style={{ display: "flex", gap: 10, marginTop: 16, justifyContent: "center" }}>
        <button onClick={handleSave} disabled={saving} style={btnStyle(true, accent)}>
          {saving ? "saving…" : "💾 Save image"}
        </button>
        <button onClick={reset} style={btnStyle(false)}>
          ✨ Brew again
        </button>
      </div>
    </div>
  );
}

function btnStyle(primary, accent = "#c077ff") {
  return {
    fontFamily: FONT,
    fontSize: 13,
    letterSpacing: "0.03em",
    padding: "8px 16px",
    borderRadius: 10,
    cursor: "pointer",
    color: primary ? "#160a26" : "#e9ddff",
    background: primary ? accent : "rgba(255,255,255,0.06)",
    border: `1px solid ${primary ? accent : "rgba(157,78,221,0.5)"}`,
  };
}

// Cabinet shelf pager — sits by the cabinet (lower-right) and flips its pages.
// Kept in the HUD (not the 3D scene) so the buttons stay crisp + reliably placed.
function ShelfPager() {
  const page = useBrew((s) => s.cabinetPage);
  const flipPage = useBrew((s) => s.flipPage);
  if (PAGE_COUNT <= 1) return null;

  const btn = {
    pointerEvents: "auto",
    width: 38,
    height: 38,
    borderRadius: "50%",
    border: "1px solid rgba(157,78,221,0.6)",
    background: "rgba(20,8,40,0.85)",
    color: "#e9d5ff",
    fontSize: 22,
    lineHeight: 1,
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    paddingBottom: 3,
    boxShadow: "0 0 14px rgba(157,78,221,0.45)",
  };
  const dot = (on) => ({
    width: 7,
    height: 7,
    borderRadius: "50%",
    background: on ? "#e9d5ff" : "rgba(233,213,255,0.3)",
    boxShadow: on ? "0 0 6px #c9a6ff" : "none",
  });

  return (
    <div
      style={{
        position: "absolute",
        right: 40,
        bottom: 92,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 8,
        pointerEvents: "none",
      }}
    >
      <div style={{ fontSize: 10, letterSpacing: "0.18em", textTransform: "uppercase", color: "rgba(233,213,255,0.55)" }}>
        the cabinet
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <button style={btn} onClick={() => flipPage(-1)} aria-label="Previous shelf">
          ‹
        </button>
        <div style={{ display: "flex", gap: 6 }}>
          {Array.from({ length: PAGE_COUNT }).map((_, i) => (
            <span key={i} style={dot(i === page)} />
          ))}
        </div>
        <button style={btn} onClick={() => flipPage(1)} aria-label="Next shelf">
          ›
        </button>
      </div>
    </div>
  );
}

// The brewing HUD: a live fill gauge hovering over the pot, a stir gauge while
// mixing, the personalized share card once served, and the cabinet pager.
// Ingredients are poured by holding the cabinet cubbies.
export default function BrewShelf({ visible }) {
  if (!visible) return null;

  return (
    <div style={{ position: "absolute", inset: 0, pointerEvents: "none", fontFamily: FONT }}>
      {/* gauge + stir progress, pinned to the top-middle so it stays clear of
          the cauldron and the pointer while you pour/stir */}
      <div
        style={{
          position: "absolute",
          top: 20,
          left: "50%",
          transform: "translateX(-50%)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        <PotGauge />
        <StirGauge />
      </div>

      {/* reveal, centered */}
      <div
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          display: "flex",
          justifyContent: "center",
        }}
      >
        <ShareCard />
      </div>

      <ShelfPager />
    </div>
  );
}
