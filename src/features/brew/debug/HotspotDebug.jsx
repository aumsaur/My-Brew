import { useDebug } from "@/shared/store/debug";
import { HOTSPOTS } from "@/features/brew/data/hotspots";

// Dev-only panel: toggles the in-scene hotspot rings and lists every registered
// click target (where to click in the outer world). Edit src/constants/hotspots.js
// to add/move targets.
export default function HotspotDebug() {
  const show = useDebug((s) => s.showHotspots);
  const toggle = useDebug((s) => s.toggleHotspots);

  return (
    <div
      style={{
        position: "absolute",
        top: 16,
        left: 16,
        width: 220,
        pointerEvents: "auto",
        fontFamily: "monospace",
        color: "#cbb6ff",
        background: "rgba(10,4,26,0.82)",
        border: "1px solid rgba(192,119,255,0.3)",
        borderRadius: 10,
        padding: 10,
      }}
    >
      <div style={{ fontSize: 11, opacity: 0.7, marginBottom: 8 }}>
        DEBUG · hotspots
      </div>

      <label
        style={{
          display: "flex",
          alignItems: "center",
          gap: 7,
          cursor: "pointer",
          fontSize: 12,
        }}
      >
        <input
          type="checkbox"
          checked={show}
          onChange={toggle}
          style={{ accentColor: "#88ce02" }}
        />
        show click hotspots
      </label>

      <div
        style={{
          marginTop: 10,
          display: "flex",
          flexDirection: "column",
          gap: 7,
        }}
      >
        {HOTSPOTS.map((s) => (
          <div
            key={s.id}
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: 7,
              fontSize: 11,
            }}
          >
            <span style={{ color: s.color, marginTop: 1 }}>
              {s.active ? "●" : "○"}
            </span>
            <div>
              <div style={{ color: "#e9ddff" }}>{s.label}</div>
              <div style={{ opacity: 0.45, fontSize: 10 }}>
                [{s.pos.map((n) => n.toFixed(2)).join(", ")}]
              </div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ marginTop: 8, fontSize: 9, opacity: 0.4 }}>
        ● wired · ○ planned
      </div>
    </div>
  );
}
