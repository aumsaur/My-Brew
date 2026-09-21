import { useState } from "react";
import { uiId } from "@/features/coffee/ids";

// The payoff for opening the fridge: a grocery turns out to be a project.
//
// DOM rather than a drei <Text> panel, for three reasons that all matter here:
// the link has to be clickable and keyboard-reachable, the tag chips need real
// text layout, and troika text inside the <Selection> pass outlines as its
// bounding quad (the bug the bean bags hit). None of that is worth fighting in
// 3D for a card that is, in the end, a card.
//
// The SHOT is the most important element on it. A project card without a
// picture of the project asks the reader to take your word for it; every
// portfolio worth copying leads with the screenshot. These are captured from
// the live sites, so they go stale — recapture rather than describe.
//
// Colour comes from the project itself (projects.js), not from the grocery it
// is dressed as, so a project looks like itself wherever it is shown.
const SHOTS = `${import.meta.env.BASE_URL}projects/`;

export default function ProjectCard({ stash, onClose }) {
  // one failed image must not leave a broken-picture box in the card
  const [broken, setBroken] = useState(false);
  if (!stash) return null;
  const { project, label } = stash;

  return (
    <div
      {...uiId("project-card")}
      style={{
        position: "absolute",
        left: 24,
        top: "50%",
        transform: "translateY(-50%)",
        width: 408,
        maxHeight: "calc(100vh - 48px)",
        overflowY: "auto",
        font: "13px ui-monospace, monospace",
        color: "#e6dccd",
        background: "#1b1412f2",
        border: "1px solid #ffffff1f",
        borderLeft: `3px solid ${project.color}`,
        borderRadius: 10,
        padding: "17px 19px 19px",
        lineHeight: 1.6,
        boxShadow: `0 10px 40px #000000a8, 0 0 34px -12px ${project.glow}`,
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          gap: 8,
        }}
      >
        <span
          style={{
            fontSize: 10,
            letterSpacing: 1.2,
            opacity: 0.5,
            textTransform: "uppercase",
          }}
        >
          {stash.from ?? "from the fridge"} · {label}
        </span>
        <button
          type="button"
          onClick={onClose}
          aria-label="close"
          style={{
            font: "13px ui-monospace, monospace",
            lineHeight: 1,
            color: "#e6dccd",
            background: "#ffffff12",
            border: "1px solid #ffffff24",
            borderRadius: 5,
            padding: "3px 7px",
            cursor: "pointer",
            flex: "0 0 auto",
          }}
        >
          ×
        </button>
      </div>

      <div
        style={{
          marginTop: 9,
          fontSize: 22,
          letterSpacing: 0.3,
          color: project.color,
        }}
      >
        {project.label}
      </div>

      {project.shot && !broken && (
        <img
          src={`${SHOTS}${project.shot}`}
          alt={`${project.label} screenshot`}
          onError={() => setBroken(true)}
          style={{
            display: "block",
            width: "100%",
            aspectRatio: "8 / 5",
            objectFit: "cover",
            objectPosition: "top",
            marginTop: 9,
            borderRadius: 6,
            border: "1px solid #ffffff1c",
            background: "#0d0a09",
          }}
        />
      )}

      <div style={{ marginTop: 9, opacity: 0.9 }}>{project.sub}</div>
      {project.blurb && (
        <p style={{ margin: "8px 0 0", opacity: 0.7, fontSize: 12.5 }}>
          {project.blurb}
        </p>
      )}

      <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginTop: 11 }}>
        {project.tags.map((t) => (
          <span
            key={t}
            style={{
              fontSize: 11,
              letterSpacing: 0.4,
              padding: "3px 8px",
              borderRadius: 4,
              background: "#ffffff10",
              border: "1px solid #ffffff1c",
              opacity: 0.85,
            }}
          >
            {t}
          </span>
        ))}
      </div>

      {/* `home` is this very site — there is nowhere to send you */}
      <div style={{ marginTop: 13 }}>
        {project.url ? (
          <a
            href={project.url}
            target="_blank"
            rel="noreferrer"
            style={{
              display: "inline-block",
              fontSize: 12.5,
              letterSpacing: 0.6,
              color: "#14100f",
              background: project.color,
              borderRadius: 6,
              padding: "8px 15px",
              textDecoration: "none",
            }}
          >
            open it ↗
          </a>
        ) : (
          <span style={{ fontSize: 12, opacity: 0.55 }}>
            {project.home
              ? "you are standing in it"
              : "no link on this one yet"}
          </span>
        )}
      </div>
    </div>
  );
}
