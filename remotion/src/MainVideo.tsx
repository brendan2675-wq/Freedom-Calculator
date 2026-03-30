import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
  staticFile,
  Img,
} from "remotion";
import { loadFont } from "@remotion/google-fonts/Inter";

const { fontFamily } = loadFont("normal", {
  weights: ["400", "600", "700"],
  subsets: ["latin"],
});

const BG = "#1A1A2E";
const BG_LIGHT = "#F5F0EB";
const ACCENT = "#C75B12";
const DIVIDER_X = 660;
const RIGHT_W = 1920 - DIVIDER_X;

function useEntrance(frame: number, fps: number, delaySec: number, dir: "left" | "right" | "up" = "up", dist = 30) {
  const f = frame - delaySec * fps;
  const p = spring({ frame: Math.max(0, f), fps, config: { damping: 22, stiffness: 180 } });
  const opacity = interpolate(p, [0, 1], [0, 1]);
  const offset = interpolate(p, [0, 1], [dir === "left" ? -dist : dir === "right" ? dist : 0, 0]);
  const offsetY = interpolate(p, [0, 1], [dir === "up" ? dist : 0, 0]);
  return { opacity, transform: `translate(${offset}px, ${offsetY}px)` };
}

// Each step: show ONE tile at a time, centered and fully visible
interface Step {
  src: string;
  label: string;
  time: number;      // start time in seconds
  maxW: number;      // max width it can take on the right panel
  maxH: number;      // max height
  codeIdx: number;   // which code snippet to show
}

const steps: Step[] = [
  { src: "images/tile-header.png", label: "Hero Banner", time: 0.0, maxW: 900, maxH: 160, codeIdx: 0 },
  { src: "images/tile-loan_full.png", label: "Loan to Pay Down", time: 0.7, maxW: 700, maxH: 620, codeIdx: 0 },
  { src: "images/tile-sidebar.png", label: "PPOR Details Sheet", time: 1.5, maxW: 380, maxH: 750, codeIdx: 0 },
  { src: "images/tile-progress.png", label: "Progress Tracker", time: 2.1, maxW: 800, maxH: 200, codeIdx: 1 },
  { src: "images/tile-target.png", label: "Target Paydown", time: 2.6, maxW: 800, maxH: 200, codeIdx: 1 },
  { src: "images/tile-chart.png", label: "Paydown Projection", time: 3.0, maxW: 850, maxH: 500, codeIdx: 1 },
  { src: "images/tile-marsden.png", label: "Marsden Park", time: 3.5, maxW: 500, maxH: 320, codeIdx: 2 },
  { src: "images/tile-hoppers.png", label: "Hoppers Crossing", time: 3.9, maxW: 500, maxH: 320, codeIdx: 2 },
  { src: "images/tile-portfolio.png", label: "Portfolio Summary", time: 4.3, maxW: 950, maxH: 200, codeIdx: 2 },
];

const codeSnippets = [
  "images/code-types.png",
  "images/code-paydown.png",
  "images/code-stamp.png",
];

const CodePanel: React.FC<{ frame: number; fps: number }> = ({ frame, fps }) => {
  // Determine which code snippet to show based on current step
  let activeCodeIdx = 0;
  for (const step of steps) {
    if (frame >= step.time * fps) activeCodeIdx = step.codeIdx;
  }

  return (
    <div style={{ position: "absolute", left: 0, top: 0, width: DIVIDER_X, height: 1080, backgroundColor: BG, overflow: "hidden" }}>
      <div style={{ position: "absolute", inset: 0, background: `linear-gradient(180deg, ${BG} 0%, #16213E 100%)` }} />

      <div style={{ ...useEntrance(frame, fps, 0.1, "left"), position: "absolute", top: 32, left: 28, fontFamily, fontSize: 12, fontWeight: 600, letterSpacing: 3, color: ACCENT, textTransform: "uppercase" as const }}>
        Source Code
      </div>

      {codeSnippets.map((src, i) => {
        const entrance = useEntrance(frame, fps, steps.find(s => s.codeIdx === i)?.time ?? 0, "left", 50);
        const isActive = activeCodeIdx === i;
        const isFuture = activeCodeIdx < i;
        const isPast = activeCodeIdx > i;

        let finalOpacity = entrance.opacity;
        if (isPast) finalOpacity = 0.12;
        if (isFuture) finalOpacity = 0;

        return (
          <div key={src} style={{
            position: "absolute", left: 20, top: 60, width: DIVIDER_X - 40,
            opacity: finalOpacity, transform: entrance.transform,
          }}>
            <Img src={staticFile(src)} style={{
              width: "100%", borderRadius: 12,
              boxShadow: isActive ? "0 8px 40px rgba(199,91,18,0.25)" : "0 4px 16px rgba(0,0,0,0.3)",
            }} />
          </div>
        );
      })}

      {/* Floating decorative bracket */}
      <div style={{
        position: "absolute", bottom: 30, right: 24, fontFamily: "monospace", fontSize: 100,
        color: "rgba(199,91,18,0.06)", fontWeight: 700, transform: `translateY(${Math.sin(frame / 20) * 6}px)`,
      }}>
        {"{ }"}
      </div>
    </div>
  );
};

const UIPanel: React.FC<{ frame: number; fps: number }> = ({ frame, fps }) => {
  // Find which step is currently active
  let activeIdx = 0;
  for (let i = 0; i < steps.length; i++) {
    if (frame >= steps[i].time * fps) activeIdx = i;
  }

  return (
    <div style={{ position: "absolute", left: DIVIDER_X, top: 0, width: RIGHT_W, height: 1080, backgroundColor: BG_LIGHT, overflow: "hidden" }}>
      {/* Subtle dot grid */}
      <svg style={{ position: "absolute", inset: 0, opacity: 0.12 }} width="100%" height="100%">
        <defs>
          <pattern id="grid" width="28" height="28" patternUnits="userSpaceOnUse">
            <circle cx="14" cy="14" r="1" fill="#999" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />
      </svg>

      <div style={{ ...useEntrance(frame, fps, 0.1, "right"), position: "absolute", top: 32, right: 28, fontFamily, fontSize: 12, fontWeight: 600, letterSpacing: 3, color: ACCENT, textTransform: "uppercase" as const }}>
        Customer Journey
      </div>

      {/* Show ONE tile at a time, centered, fully visible */}
      {steps.map((step, i) => {
        const entrance = useEntrance(frame, fps, step.time, "up", 40);
        const isActive = activeIdx === i;

        // Fade out previous tiles
        let finalOpacity = entrance.opacity;
        if (i < activeIdx) {
          const nextTime = steps[i + 1]?.time ?? step.time + 0.5;
          finalOpacity = interpolate(frame, [nextTime * fps, (nextTime + 0.3) * fps], [1, 0], {
            extrapolateLeft: "clamp", extrapolateRight: "clamp",
          });
        }
        if (i > activeIdx) finalOpacity = 0;

        return (
          <div key={step.src} style={{
            position: "absolute",
            left: 0, top: 0, width: RIGHT_W, height: 1080,
            display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
            opacity: finalOpacity, transform: entrance.transform,
          }}>
            {/* Label */}
            <div style={{
              fontFamily, fontSize: 16, fontWeight: 600, color: ACCENT,
              marginBottom: 16, letterSpacing: 1,
            }}>
              {step.label}
            </div>

            {/* Tile container — objectFit contain so nothing is cut off */}
            <div style={{
              maxWidth: step.maxW, maxHeight: step.maxH,
              display: "flex", alignItems: "center", justifyContent: "center",
              borderRadius: 12,
              boxShadow: isActive ? `0 0 0 3px ${ACCENT}40, 0 8px 32px rgba(0,0,0,0.1)` : "0 4px 16px rgba(0,0,0,0.06)",
              overflow: "hidden",
              backgroundColor: "#fff",
            }}>
              <Img src={staticFile(step.src)} style={{
                maxWidth: step.maxW, maxHeight: step.maxH,
                objectFit: "contain",
                borderRadius: 12,
              }} />
            </div>

            {/* Step counter */}
            <div style={{
              marginTop: 20, fontFamily, fontSize: 13, fontWeight: 400,
              color: "#999", letterSpacing: 1,
            }}>
              {i + 1} / {steps.length}
            </div>
          </div>
        );
      })}
    </div>
  );
};

const Divider: React.FC<{ frame: number; fps: number }> = ({ frame, fps }) => {
  const h = interpolate(spring({ frame, fps, config: { damping: 30, stiffness: 100 } }), [0, 1], [0, 1080]);
  return <div style={{ position: "absolute", left: DIVIDER_X - 1, top: 0, width: 2, height: h, background: `linear-gradient(180deg, ${ACCENT}00, ${ACCENT}, ${ACCENT}00)` }} />;
};

const Brand: React.FC<{ frame: number; fps: number }> = ({ frame, fps }) => {
  const e = useEntrance(frame, fps, 4.2, "up", 15);
  return (
    <div style={{ position: "absolute", bottom: 24, left: DIVIDER_X / 2, transform: `translateX(-50%) ${e.transform}`, opacity: e.opacity, fontFamily, fontSize: 13, fontWeight: 600, color: "rgba(255,255,255,0.35)", letterSpacing: 2 }}>
      ATELIER WEALTH
    </div>
  );
};

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
