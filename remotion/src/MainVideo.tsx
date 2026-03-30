import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, staticFile, Img } from "remotion";

export const MainVideo = () => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();

  const imgW = 4500;
  const imgH = 2531;
  const videoW = 1920;
  const videoH = 1080;

  // Zoom to show content nicely
  const zoom = 2.4;

  const scaledW = (imgW / imgH) * videoH * zoom;
  const scaledH = videoH * zoom;

  // Pan from left (hero/loan area) to right (property cards) — stop before empty space
  // Content occupies roughly the left 75% of the image
  const panStartX = -80;
  const contentEndX = scaledW * 0.72;
  const panEndX = -(contentEndX - videoW);

  const x = interpolate(frame, [0, durationInFrames], [panStartX, panEndX], {
    extrapolateRight: "clamp",
  });

  // Fixed vertical position — centered on content area (top portion)
  const y = -scaledH * 0.08;

  return (
    <AbsoluteFill style={{ backgroundColor: "#F5F5F5" }}>
      <Img
        src={staticFile("images/figma-canvas.png")}
        style={{
          position: "absolute",
          width: scaledW,
          height: scaledH,
          left: x,
          top: y,
        }}
      />
    </AbsoluteFill>
  );
};
