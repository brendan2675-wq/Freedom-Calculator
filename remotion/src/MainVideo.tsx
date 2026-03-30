import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, staticFile, Img } from "remotion";

export const MainVideo = () => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();

  // Image is 9167x5834 — aspect ratio ~1.57:1
  // Video is 1920x1080 — aspect ratio ~1.78:1
  // Scale image so height fills the viewport, then pan horizontally
  
  const imgW = 9167;
  const imgH = 5834;
  const videoW = 1920;
  const videoH = 1080;

  // Scale so image height = videoH * zoom factor
  // Start zoomed in more, showing detail
  const zoomStart = 3.2;
  const zoomEnd = 2.0;
  
  const zoom = interpolate(frame, [0, durationInFrames], [zoomStart, zoomEnd], {
    extrapolateRight: "clamp",
  });

  const scaledW = (imgW / imgH) * videoH * zoom;
  const scaledH = videoH * zoom;

  // Pan from left portion to right portion
  // At zoom 3.2, scaledW ≈ 5500, so we have ~3600px to pan
  // Focus on the journey frames area (skip left sidebar, end before right sidebar)
  const panStartX = -200; // start showing hero/loan area
  const panEndX = -(scaledW - videoW - 100); // end showing proposed purchases

  const x = interpolate(frame, [0, durationInFrames], [panStartX, panEndX], {
    extrapolateRight: "clamp",
  });

  // Gentle vertical drift
  const y = interpolate(frame, [0, durationInFrames], [-scaledH * 0.15, -scaledH * 0.25], {
    extrapolateRight: "clamp",
  });

  // Fade in/out
  const opacity = interpolate(frame, [0, 10, durationInFrames - 15, durationInFrames], [0, 1, 1, 0], {
    extrapolateRight: "clamp",
    extrapolateLeft: "clamp",
  });

  return (
    <AbsoluteFill style={{ backgroundColor: "#F5F5F5" }}>
      <div style={{ opacity, width: "100%", height: "100%" }}>
        <Img
          src={staticFile("images/figma-canvas.png")}
          style={{
            position: "absolute",
            width: scaledW,
            height: scaledH,
            left: x,
            top: y,
            transformOrigin: "center center",
          }}
        />
      </div>
      {/* Subtle vignette overlay */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "radial-gradient(ellipse at center, transparent 50%, rgba(0,0,0,0.15) 100%)",
          pointerEvents: "none",
        }}
      />
    </AbsoluteFill>
  );
};
