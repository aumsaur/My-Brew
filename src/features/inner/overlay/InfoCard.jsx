import { Html } from "@react-three/drei";
import { toRoman } from "@/shared/utils/lib";

// Hover detail: brand logo + name + Roman-numeral years
export default function InfoCard({ data, top }) {
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
          transform: "translateY(-6px)",
        }}
      >
        <svg
          width="26"
          height="26"
          viewBox="0 0 24 24"
          style={{ flex: "0 0 auto" }}
          aria-hidden="true"
        >
          <path d={data.icon.path} fill={`#${data.icon.hex}`} />
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
