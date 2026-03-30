import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, staticFile, Img } from "remotion";

export const MainVideo = () => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();

  const imgW = 4500;
  const imgH = 2863;
  const videoW = 1920;
  const videoH = 1080;

  // Fixed zoom level — no zoom out
  const zoom = 2.8;

  const scaledW = (imgW / imgH) * videoH * zoom;
  const scaledH = videoH * zoom;

  // Pan from left to right across the journey frames
  const panStartX = -150;
  const panEndX = -(scaledW - videoW - 100);

  const x = interpolate(frame, [0, durationInFrames], [panStartX, panEndX], {
    extrapolateRight: "clamp",
  });

  // Gentle vertical positioning to center on the content
  const y = interpolate(frame, [0, durationInFrames], [-scaledH * 0.18, -scaledH * 0.22], {
    extrapolateRight: "clamp",
  });

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
