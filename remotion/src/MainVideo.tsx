import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, staticFile, Img } from "remotion";

export const MainVideo = () => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();

  const imgW = 5800;
  const imgH = 2800;
  const videoW = 1920;
  const videoH = 1080;

  // Zoom to show content nicely
  const zoom = 2.2;

  const scaledW = (imgW / imgH) * videoH * zoom;
  const scaledH = videoH * zoom;

  // Pan from left to right across the full canvas
  const panStartX = -40;
  const contentEndX = scaledW * 0.78;
  const panEndX = -(contentEndX - videoW);

  const x = interpolate(frame, [0, durationInFrames], [panStartX, panEndX], {
    extrapolateRight: "clamp",
  });

  // Fixed vertical position — centered on the main content row
  const y = -scaledH * 0.06;

  return (
    <AbsoluteFill style={{ backgroundColor: "#F5F5F0" }}>
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
