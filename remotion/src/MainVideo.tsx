import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, staticFile, Img } from "remotion";

export const MainVideo = () => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();

  const imgW = 9167;
  const imgH = 5834;
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

  // Simple fade in/out
  const opacity = interpolate(frame, [0, 8, durationInFrames - 10, durationInFrames], [0, 1, 1, 0], {
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
          }}
        />
      </div>
    </AbsoluteFill>
  );
};
