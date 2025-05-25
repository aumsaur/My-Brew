import Wave from "react-wavify";
import gsap from "gsap";
import { useRef, useEffect } from "react";

export function LiquidTransition({
  active = false, // when true: raise; when false: collapse
  duration = 1, // seconds
  color = "rgba(255,255,255,0.5)",
  waveFill = "#f79902",
  waveOpts = { height: 1, amplitude: 70, speed: 0.3, points: 3 },
}) {
  const container = useRef();

  useEffect(() => {
    gsap.to(container.current, {
      height: active ? "calc(100dvh + 60px)" : "0px",
      duration,
      ease: "power2.inOut",
    });
  }, [active, duration]);

  return (
    <>
      <div
        ref={container}
        style={{
          position: "fixed",
          bottom: 0,
          left: 0,
          width: "100%",
          height: "0px", // start collapsed
          overflow: "hidden",
          pointerEvents: "none",
          zIndex: 90,
          backgroundColor: color,
        }}>
        <Wave
          fill={waveFill}
          paused={false}
          className="w-full h-full"
          style={{ position: "absolute", top: 0, left: 0 }}
          options={waveOpts}
        />
      </div>
    </>
  );
}
