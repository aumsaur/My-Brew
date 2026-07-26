import { Html } from "@react-three/drei";
import { toRoman } from "@/shared/utils/lib";

// Hover detail: brand logo + name + Roman-numeral years. Kept mounted always and
// cross-faded via the `hovered` prop (the floating NameLabel fades out as this
// fades in), so don't gate it behind `{hovered && ...}` at the call site.
export default function InfoCard({ data, top, hovered = false }) {
  return (
    <Html
      center
      position={[0, top, 0]}
      distanceFactor={9}
      pointerEvents="none"
      zIndexRange={[20, 0]}
    >
      <div
        style={{
          pointerEvents: "none",
          whiteSpace: "nowrap",
          display: "flex",
          alignItems: "center",
          gap: 11,
          padding: "9px 15px",
          borderRadius: 12,
          background: "rgba(8, 3, 22, 0.88)",
          border: `1px solid ${data.color}`,
          boxShadow: `0 0 20px ${data.color}66`,
          fontFamily: "'Cinzel', Georgia, serif",
          color: "#f4ecff",
          // cross-fade with NameLabel: dissolve in + a subtle rise on hover
          opacity: hovered ? 1 : 0,
          transform: hovered ? "translateY(-6px)" : "translateY(2px)",
          transition: "opacity 0.28s ease, transform 0.28s ease",
        }}
      >
        <svg
          width="26"
          height="26"
          viewBox="0 0 24 24"
          style={{ flex: "0 0 auto" }}
          aria-hidden="true"
        >
          {/* tint with the skill colour, not the brand hex — some brand icons
            (e.g. Three.js = #000000) are black and vanish on the dark card */}
        <path d={data.icon.path} fill={data.color} />
        </svg>
        <div style={{ textAlign: "left" }}>
          <div
            style={{ fontSize: 15, fontWeight: 600, letterSpacing: "0.04em" }}
          >
            {data.label}
          </div>
          <div
            style={{
              marginTop: 2,
              fontSize: 13,
              color: data.color,
              letterSpacing: "0.12em",
            }}
          >
            {toRoman(data.years)}{" "}
            <span style={{ opacity: 0.7, fontSize: 11 }}>
              {data.years === 1 ? "year" : "years"}
            </span>
          </div>
        </div>
      </div>
    </Html>
  );
}
