import { useState } from "react";
import { Canvas } from "@react-three/fiber";
import InnerScene from "./InnerScene";
import { PROJECTS, MINI, PARTICLES, RAYS, TRAVEL } from "./data/projects";
import {
  diveProgress,
  innerProgressOf,
  floorRevealOf,
} from "@/shared/constants/journey";

export default function InnerWorld({ scrollProgress }) {
  const [hoveredId, setHoveredId] = useState(null);

  // All timing comes from the data-driven journey layout so the navbar targets
  // and the actual on-screen positions can't drift apart.
  const transitionIn = diveProgress(scrollProgress);
  const innerProgress = innerProgressOf(scrollProgress);
  // crystals reveal once the descent passes the projects portion
  const floorReveal = floorRevealOf(innerProgress);
  const htmlOpacity = 1 - floorReveal;

  if (transitionIn === 0) return null;

  const topGlow = (1 - innerProgress * 0.6) * 0.7;

  // Submersion mask: the dark liquid rises from below with a SOFT, feathered
  // edge (a ~26% blurred band) instead of a hard ellipse clip — so it reads as
  // murk closing over you rather than a shape wiping in. The opaque front and
  // its feather both grow with transitionIn; centred just below the bottom edge
  // so the curvature suggests liquid welling up around you.
  const feather = 26; // width of the soft edge band, in % of the gradient radius
  const front = transitionIn * 132; // leading edge of the reveal
  const solid = Math.max(0, front - feather); // fully-opaque up to here
  const mask = `radial-gradient(150% 135% at 50% 112%, #000 ${solid}%, transparent ${front}%)`;

  // Glowing meniscus that rides the rising boundary — a luminous crest tracking
  // the SAME gradient geometry as the mask, so it sits exactly on the liquid's
  // leading edge. Brightest mid-transition (sin curve → 0 at both ends).
  const ripple = `radial-gradient(150% 135% at 50% 112%,
    transparent ${front - 9}%,
    rgba(199,125,255,0.4) ${front - 4}%,
    rgba(240,214,255,0.9) ${front - 1}%,
    rgba(199,125,255,0.3) ${front + 2}%,
    transparent ${front + 7}%)`;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 10,
        pointerEvents: transitionIn < 0.6 ? "none" : "auto",
      }}
    >
      {/* dark liquid world — masked so it wells up from below */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "#060218",
          overflow: "hidden",
          WebkitMaskImage: mask,
          maskImage: mask,
        }}
      >
        {/* 3D floor scene. Mounted as soon as InnerWorld itself is (i.e. from
            the moment the dive starts), NOT gated behind `floorReveal > 0` —
            creating the WebGL context and compiling its shaders is a genuine
            hitch: measured a reproducible 2.7-3.8s single-frame stall right
            at the moment floorReveal first crossed 0 (i.e. exactly when the
            user scrolls into the crystal hall, mid-gesture). Mounting it here
            instead spends that cost much earlier — overlapping the dive/mask
            transition, while a second WebGL context is cheap to spin up next
            to the already-active brew canvas — and gives it the whole
            projects section to be ready before it's ever visible. Its own
            frameloop stays paused until there's something to show. */}
        <Canvas
          shadows
          gl={{ powerPreference: "high-performance" }}
          camera={{ position: [0, 5, 8], fov: 55 }}
          frameloop={floorReveal > 0.01 ? "always" : "never"}
          style={{ position: "absolute", inset: 0, opacity: floorReveal }}
        >
          {/* crystals only drop/grow once you're actually at the bottom */}
          <InnerScene play={floorReveal > 0.55} />
        </Canvas>

        {/* HTML liquid world — fades out as floor reveals */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            opacity: htmlOpacity,
            pointerEvents: floorReveal > 0.5 ? "none" : "auto",
          }}
        >
          {/* Background gradient */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: `radial-gradient(ellipse 90% 45% at 50% -10%, rgba(157,78,221,${topGlow}) 0%, #0d0520 50%, #060218 100%)`,
            }}
          />

          {/* Light rays */}
          {RAYS.map((r) => (
            <div
              key={r.id}
              style={{
                position: "absolute",
                left: r.left,
                top: 0,
                width: r.width,
                height: "65%",
                background:
                  "linear-gradient(to bottom, rgba(199,125,255,0.18), rgba(157,78,221,0.06) 60%, transparent)",
                transform: `rotate(${r.rotate}deg)`,
                transformOrigin: "top center",
                animation: `rayShimmer ${r.dur}s ${r.delay}s ease-in-out infinite`,
                pointerEvents: "none",
              }}
            />
          ))}

          {/* Surface glow */}
          <div
            style={{
              position: "absolute",
              top: 0,
              left: "50%",
              transform: "translateX(-50%)",
              width: "120%",
              height: "30%",
              background:
                "radial-gradient(ellipse at 50% 0%, rgba(199,125,255,0.25) 0%, transparent 70%)",
              filter: "blur(12px)",
              opacity: Math.max(0, 1 - innerProgress * 1.2),
              pointerEvents: "none",
            }}
          />

          {/* Ambient particles */}
          {PARTICLES.map((p) => (
            <div
              key={p.id}
              style={{
                position: "absolute",
                left: `${p.xPct}%`,
                bottom: "-5%",
                width: p.size,
                height: p.size,
                borderRadius: "50%",
                background: p.color,
                boxShadow: `0 0 ${p.size * 2}px ${p.color}`,
                animation: `particleDrift ${p.dur}s ${p.delay}s linear infinite`,
                pointerEvents: "none",
              }}
            />
          ))}

          {/* Mini decorative bubbles */}
          {MINI.map((b) => {
            const yVh = (b.depth - innerProgress) * TRAVEL;
            return (
              <div
                key={b.id}
                style={{
                  position: "absolute",
                  left: `${b.xPct}%`,
                  top: "50%",
                  width: b.size,
                  height: b.size,
                  // transform instead of an animated `top`/margin: `top` is a
                  // layout property, so a scroll-driven change to it forces a
                  // reflow + full repaint of this (glowing, blurred) element
                  // every single scroll tick. transform is compositor-only —
                  // the browser can reposition it without repainting.
                  transform: `translate(-50%, calc(-50% + ${yVh}vh))`,
                  pointerEvents: "none",
                }}
              >
                <div
                  style={{
                    width: "100%",
                    height: "100%",
                    borderRadius: "50%",
                    border: `1px solid rgba(157,78,221,${b.opacity + 0.1})`,
                    background: `rgba(157,78,221,${b.opacity * 0.4})`,
                    animation: `innerSway ${3 + b.id * 0.4}s ${b.id * 0.3}s ease-in-out infinite`,
                  }}
                />
              </div>
            );
          })}

          {/* Project bubbles */}
          {PROJECTS.map((p, i) => {
            const yVh = (p.depth - innerProgress) * TRAVEL;
            const isHovered = hoveredId === p.id;
            return (
              <div
                key={p.id}
                style={{
                  position: "absolute",
                  left: `${p.xPct}%`,
                  top: "50%",
                  width: p.size,
                  height: p.size,
                  // see the MINI bubbles above — transform avoids a per-scroll-
                  // tick reflow + repaint of this glowing bubble
                  transform: `translate(-50%, calc(-50% + ${yVh}vh))`,
                }}
              >
                <div
                  style={{
                    width: "100%",
                    height: "100%",
                    animation: `innerFloat ${3.5 + i * 0.4}s ${i * 0.7}s ease-in-out infinite`,
                  }}
                >
                  <div
                    onMouseEnter={() => setHoveredId(p.id)}
                    onMouseLeave={() => setHoveredId(null)}
                    onClick={() => {
                      if (p.url) window.open(p.url, "_blank", "noopener,noreferrer");
                      else if (p.home) window.scrollTo({ top: 0, behavior: "smooth" });
                    }}
                    style={{
                      width: "100%",
                      height: "100%",
                      borderRadius: "50%",
                      border: `1.5px solid ${isHovered ? "rgba(255,255,255,0.5)" : p.color}`,
                      background: `radial-gradient(circle at 37% 33%, rgba(255,255,255,${isHovered ? 0.22 : 0.13}) 0%, ${p.color}22 55%, ${p.color}0d 100%)`,
                      boxShadow: isHovered
                        ? `0 0 70px ${p.glow}, 0 0 30px ${p.color}88, inset 0 0 35px ${p.color}33`
                        : `0 0 45px ${p.glow}, inset 0 0 25px ${p.color}18`,
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 6,
                      cursor: p.url || p.home ? "pointer" : "default",
                      transform: `scale(${isHovered ? 1.06 : 1})`,
                      transition:
                        "transform 0.3s ease, box-shadow 0.3s ease, border-color 0.3s ease",
                      padding: "0 20px",
                      textAlign: "center",
                    }}
                  >
                    <span
                      style={{
                        color: "#fff",
                        fontSize: 18,
                        fontWeight: 700,
                        letterSpacing: 2,
                        textTransform: "uppercase",
                      }}
                    >
                      {p.label}
                    </span>
                    <span
                      style={{
                        color: "rgba(255,255,255,0.5)",
                        fontSize: 11,
                        letterSpacing: 1,
                      }}
                    >
                      {p.sub}
                    </span>
                    <div
                      style={{
                        display: "flex",
                        gap: 4,
                        flexWrap: "wrap",
                        justifyContent: "center",
                        marginTop: 4,
                      }}
                    >
                      {p.tags.map((t) => (
                        <span
                          key={t}
                          style={{
                            fontSize: 9,
                            letterSpacing: 1,
                            textTransform: "uppercase",
                            color: p.color,
                            border: `1px solid ${p.color}66`,
                            borderRadius: 3,
                            padding: "1px 5px",
                            background: `${p.color}15`,
                          }}
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                    {(p.url || p.home) && (
                      <span
                        style={{
                          color: p.color,
                          fontSize: 10,
                          letterSpacing: 1,
                          marginTop: 2,
                          opacity: isHovered ? 0.9 : 0,
                          transition: "opacity 0.3s ease",
                        }}
                      >
                        {p.url ? "visit ↗" : "back to top ↑"}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* glowing surface ripple riding the rising boundary (unmasked, on top) */}
      {transitionIn < 1 && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: ripple,
            filter: "blur(4px)",
            mixBlendMode: "screen",
            opacity: Math.sin(transitionIn * Math.PI),
            pointerEvents: "none",
          }}
        />
      )}
    </div>
  );
}
