import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
  staticFile,
  Img,
  Sequence,
} from "remotion";
import { loadFont } from "@remotion/google-fonts/Inter";

const { fontFamily } = loadFont("normal", {
  weights: ["400", "600", "700"],
  subsets: ["latin"],
});

// --- Shared constants ---
const BG = "#1A1A2E";
const BG_LIGHT = "#F5F0EB";
const ACCENT = "#C75B12";
const DIVIDER_X = 720; // left panel width

// --- Helper: fade+slide in from direction ---
function useEntrance(
  frame: number,
  fps: number,
  delay: number,
  direction: "left" | "right" | "up" | "down" = "up",
  distance = 40
) {
  const f = frame - delay * fps;
  const progress = spring({ frame: Math.max(0, f), fps, config: { damping: 20, stiffness: 180 } });
  const opacity = interpolate(progress, [0, 1], [0, 1]);
  const offsets = {
    left: { x: -distance, y: 0 },
    right: { x: distance, y: 0 },
    up: { x: 0, y: distance },
    down: { x: 0, y: -distance },
  };
  const tx = interpolate(progress, [0, 1], [offsets[direction].x, 0]);
  const ty = interpolate(progress, [0, 1], [offsets[direction].y, 0]);
  return { opacity, transform: `translate(${tx}px, ${ty}px)` };
}

// --- Glow pulse for active tile ---
function useGlow(frame: number, fps: number, startSec: number, durSec: number) {
  const f = frame - startSec * fps;
  if (f < 0 || f > durSec * fps) return 0;
  const t = f / fps;
  return 0.6 + 0.4 * Math.sin(t * Math.PI * 3);
}

// --- Code Panel (left side) ---
const CodePanel: React.FC<{ frame: number; fps: number }> = ({ frame, fps }) => {
  // Three code snippets cycle through
  const snippets = [
    { src: "images/code-types.png", label: "types/property.ts", start: 0 },
    { src: "images/code-paydown.png", label: "PaydownChart.tsx", start: 1.5 },
    { src: "images/code-stamp.png", label: "lib/stampDuty.ts", start: 3.2 },
  ];

  return (
    <div
      style={{
        position: "absolute",
        left: 0,
        top: 0,
        width: DIVIDER_X,
        height: 1080,
        backgroundColor: BG,
        overflow: "hidden",
      }}
    >
      {/* Subtle gradient overlay */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: `linear-gradient(180deg, ${BG} 0%, #16213E 100%)`,
        }}
      />

      {/* "CODE" label */}
      <div
        style={{
          ...useEntrance(frame, fps, 0.1, "left"),
          position: "absolute",
          top: 36,
          left: 32,
          fontFamily,
          fontSize: 13,
          fontWeight: 600,
          letterSpacing: 3,
          color: ACCENT,
          textTransform: "uppercase" as const,
        }}
      >
        Source Code
      </div>

      {/* Code snippets stacked, fading in sequentially */}
      {snippets.map((snip, i) => {
        const entrance = useEntrance(frame, fps, snip.start, "left", 60);
        // Fade out when next snippet starts
        const nextStart = snippets[i + 1]?.start ?? 99;
        const fadeOutProgress =
          frame > nextStart * fps
            ? interpolate(frame, [nextStart * fps, (nextStart + 0.4) * fps], [1, 0.15], {
                extrapolateRight: "clamp",
                extrapolateLeft: "clamp",
              })
            : 1;

        return (
          <div
            key={snip.src}
            style={{
              position: "absolute",
              left: 24,
              top: 70,
              width: DIVIDER_X - 48,
              opacity: entrance.opacity * fadeOutProgress,
              transform: entrance.transform,
            }}
          >
            <Img
              src={staticFile(snip.src)}
              style={{
                width: "100%",
                borderRadius: 12,
                boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
              }}
            />
          </div>
        );
      })}

      {/* Decorative floating bracket */}
      <div
        style={{
          position: "absolute",
          bottom: 40,
          right: 30,
          fontFamily: "monospace",
          fontSize: 120,
          color: "rgba(199,91,18,0.08)",
          fontWeight: 700,
          transform: `translateY(${Math.sin(frame / 20) * 8}px)`,
        }}
      >
        {"{ }"}
      </div>
    </div>
  );
};

// --- UI Panel (right side) - tiles highlighting sequentially ---
const UIPanel: React.FC<{ frame: number; fps: number }> = ({ frame, fps }) => {
  // Journey steps - each tile highlights in sequence
  const steps = [
    { src: "images/tile-header.png", x: 40, y: 30, w: 460, h: 55, label: "Hero Banner", time: 0.2 },
    { src: "images/tile-loan_simple.png", x: 40, y: 105, w: 360, h: 110, label: "Loan to Pay Down", time: 0.5 },
    { src: "images/tile-progress.png", x: 40, y: 230, w: 360, h: 80, label: "Progress Tracker", time: 1.0 },
    { src: "images/tile-ppor_value.png", x: 40, y: 325, w: 360, h: 90, label: "PPOR Value & Equity", time: 1.4 },
    { src: "images/tile-target.png", x: 420, y: 105, w: 360, h: 80, label: "Target Paydown", time: 1.8 },
    { src: "images/tile-chart.png", x: 420, y: 200, w: 360, h: 200, label: "Projection Chart", time: 2.2 },
    { src: "images/tile-sidebar.png", x: 800, y: 105, w: 180, h: 450, label: "PPOR Details", time: 2.8 },
    { src: "images/tile-marsden.png", x: 40, y: 440, w: 240, h: 120, label: "Marsden Park", time: 3.3 },
    { src: "images/tile-hoppers.png", x: 300, y: 440, w: 240, h: 120, label: "Hoppers Crossing", time: 3.6 },
    { src: "images/tile-portfolio.png", x: 40, y: 580, w: 540, h: 80, label: "Portfolio Summary", time: 4.0 },
  ];

  return (
    <div
      style={{
        position: "absolute",
        left: DIVIDER_X,
        top: 0,
        width: 1920 - DIVIDER_X,
        height: 1080,
        backgroundColor: BG_LIGHT,
        overflow: "hidden",
      }}
    >
      {/* Subtle grid pattern */}
      <svg
        style={{ position: "absolute", inset: 0, opacity: 0.15 }}
        width="100%"
        height="100%"
      >
        <defs>
          <pattern id="grid" width="30" height="30" patternUnits="userSpaceOnUse">
            <circle cx="15" cy="15" r="1" fill="#999" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />
      </svg>

      {/* "UI" label */}
      <div
        style={{
          ...useEntrance(frame, fps, 0.1, "right"),
          position: "absolute",
          top: 36,
          right: 32,
          fontFamily,
          fontSize: 13,
          fontWeight: 600,
          letterSpacing: 3,
          color: ACCENT,
          textTransform: "uppercase" as const,
        }}
      >
        Customer Journey
      </div>

      {/* Render each tile */}
      {steps.map((step, i) => {
        const entrance = useEntrance(frame, fps, step.time, "up", 30);
        const isActive =
          frame >= step.time * fps &&
          (steps[i + 1] ? frame < steps[i + 1].time * fps + fps * 0.3 : true);
        const glowIntensity = isActive ? useGlow(frame, fps, step.time, 0.8) : 0;

        return (
          <div
            key={step.src}
            style={{
              position: "absolute",
              left: step.x,
              top: step.y + 50,
              width: step.w,
              height: step.h,
              opacity: entrance.opacity,
              transform: entrance.transform,
            }}
          >
            {/* Glow border when active */}
            <div
              style={{
                position: "absolute",
                inset: -3,
                borderRadius: 10,
                border: `2px solid ${ACCENT}`,
                opacity: glowIntensity,
                boxShadow: `0 0 ${12 * glowIntensity}px ${ACCENT}40`,
              }}
            />
            {/* Tile label */}
            <div
              style={{
                position: "absolute",
                top: -22,
                left: 4,
                fontFamily,
                fontSize: 11,
                fontWeight: 600,
                color: isActive ? ACCENT : "#888",
                opacity: entrance.opacity,
              }}
            >
              {step.label}
            </div>
            {/* Tile image */}
            <Img
              src={staticFile(step.src)}
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                borderRadius: 8,
                boxShadow: isActive
                  ? "0 4px 20px rgba(199,91,18,0.2)"
                  : "0 2px 8px rgba(0,0,0,0.08)",
              }}
            />
          </div>
        );
      })}

      {/* Connector lines between related tiles */}
      <svg
        style={{ position: "absolute", inset: 0, pointerEvents: "none" }}
        width="100%"
        height="100%"
      >
        {/* Loan → Sidebar */}
        <line
          x1={400}
          y1={210}
          x2={800}
          y2={210}
          stroke={ACCENT}
          strokeWidth={1.5}
          strokeDasharray="6 4"
          opacity={interpolate(frame, [2.8 * fps, 3.2 * fps], [0, 0.6], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          })}
        />
        {/* Marsden → Hoppers */}
        <line
          x1={280}
          y1={560}
          x2={300}
          y2={560}
          stroke={ACCENT}
          strokeWidth={1.5}
          strokeDasharray="6 4"
          opacity={interpolate(frame, [3.6 * fps, 4 * fps], [0, 0.6], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          })}
        />
      </svg>
    </div>
  );
};

// --- Divider line ---
const Divider: React.FC<{ frame: number; fps: number }> = ({ frame, fps }) => {
  const height = interpolate(
    spring({ frame, fps, config: { damping: 30, stiffness: 100 } }),
    [0, 1],
    [0, 1080]
  );

  return (
    <div
      style={{
        position: "absolute",
        left: DIVIDER_X - 1,
        top: 0,
        width: 2,
        height,
        background: `linear-gradient(180deg, ${ACCENT}00, ${ACCENT}, ${ACCENT}00)`,
      }}
    />
  );
};

// --- Brand watermark ---
const Brand: React.FC<{ frame: number; fps: number }> = ({ frame, fps }) => {
  const entrance = useEntrance(frame, fps, 4.2, "up", 20);
  return (
    <div
      style={{
        position: "absolute",
        bottom: 30,
        left: DIVIDER_X / 2,
        transform: `translateX(-50%) ${entrance.transform}`,
        opacity: entrance.opacity,
        fontFamily,
        fontSize: 14,
        fontWeight: 600,
        color: "rgba(255,255,255,0.4)",
        letterSpacing: 2,
      }}
    >
      ATELIER WEALTH
    </div>
  );
};

// --- Main composition ---
export const MainVideo = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  return (
    <AbsoluteFill style={{ backgroundColor: BG }}>
      <UIPanel frame={frame} fps={fps} />
      <CodePanel frame={frame} fps={fps} />
      <Divider frame={frame} fps={fps} />
      <Brand frame={frame} fps={fps} />
    </AbsoluteFill>
  );
};
