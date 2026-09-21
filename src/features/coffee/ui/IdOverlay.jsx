import { useCallback, useEffect, useState } from "react";

// THE LABEL LAYER. F2 paints every addressable thing's id on screen and a
// click copies it, so an adjustment can be asked for by name.
//
// Clicking is the point, not a flourish: the whole reason this exists is to
// get an exact id into a message without retyping it from a screenshot.
//
// NOT gated on import.meta.env.DEV. The dev-only hooks on the wrapper div
// cannot be used against a production build, which has already cost an
// afternoon once; this is the tool for saying what is wrong with the built
// site, so it has to work there too. F2 is obscure enough to stay out of a
// visitor's way.

const TINT = {
  ui: { bg: "#1d3557e6", edge: "#7fb2ff", text: "#dcebff" },
  scene: { bg: "#3d2a10e6", edge: "#e0a05e", text: "#ffe6c4" },
};

function Badge({ id, x, y, kind, onCopy, copied }) {
  const t = TINT[kind];
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onCopy(id);
      }}
      title={`${id} — click to copy`}
      style={{
        position: "absolute",
        left: Math.round(x),
        top: Math.round(y),
        transform: "translate(-50%, -50%)",
        font: "10px ui-monospace, monospace",
        letterSpacing: 0.3,
        whiteSpace: "nowrap",
        color: copied ? "#20191a" : t.text,
        background: copied ? "#9ad07a" : t.bg,
        border: `1px solid ${t.edge}`,
        borderRadius: 4,
        padding: "1px 5px",
        cursor: "pointer",
        pointerEvents: "auto",
        userSelect: "none",
      }}
    >
      {copied ? "copied" : id}
    </button>
  );
}

/**
 * @param enabled    F2 state, owned by CoffeeApp
 * @param scenePos   [{id, x, y}] from scene/SceneIds, already in screen px
 */
export default function IdOverlay({ enabled, scenePos = [] }) {
  const [uiPos, setUiPos] = useState([]);
  const [copied, setCopied] = useState(null);

  // DOM ids are measured rather than registered: an element that re-renders,
  // scrolls or resizes moves without telling anyone, and re-measuring on a
  // timer is both simpler and more honest than trying to observe all of it.
  useEffect(() => {
    if (!enabled) {
      setUiPos([]);
      return undefined;
    }
    const measure = () => {
      const found = [];
      document.querySelectorAll("[data-ui-id]").forEach((el) => {
        const r = el.getBoundingClientRect();
        if (r.width === 0 && r.height === 0) return; // not shown right now
        found.push({ id: el.dataset.uiId, x: r.left + r.width / 2, y: r.top });
      });
      setUiPos(found);
    };
    measure();
    const t = setInterval(measure, 250);
    window.addEventListener("resize", measure);
    return () => {
      clearInterval(t);
      window.removeEventListener("resize", measure);
    };
  }, [enabled]);

  const copy = useCallback((id) => {
    setCopied(id);
    setTimeout(() => setCopied((c) => (c === id ? null : c)), 900);
    // clipboard access throws outside a secure context and in some embeds;
    // the overlay must not go down with it
    try {
      navigator.clipboard?.writeText(id);
    } catch {
      /* the id is on screen to read either way */
    }
  }, []);

  if (!enabled) return null;

  return (
    <div
      style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 60 }}
    >
      {scenePos.map((p) => (
        <Badge
          key={p.id}
          {...p}
          kind="scene"
          onCopy={copy}
          copied={copied === p.id}
        />
      ))}
      {uiPos.map((p) => (
        <Badge
          key={p.id}
          {...p}
          kind="ui"
          onCopy={copy}
          copied={copied === p.id}
        />
      ))}
      <div
        style={{
          position: "absolute",
          left: "50%",
          bottom: 10,
          transform: "translateX(-50%)",
          font: "11px ui-monospace, monospace",
          color: "#e6dccd",
          background: "#1b1412e6",
          border: "1px solid #ffffff24",
          borderRadius: 6,
          padding: "4px 10px",
          pointerEvents: "none",
        }}
      >
        <b style={{ color: "#e0a05e" }}>F2</b> ids ·{" "}
        <span style={{ color: "#7fb2ff" }}>ui</span> {uiPos.length} ·{" "}
        <span style={{ color: "#e0a05e" }}>scene</span> {scenePos.length} ·
        click to copy
      </div>
    </div>
  );
}
