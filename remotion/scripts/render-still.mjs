import { bundle } from "@remotion/bundler";
import { renderStill, selectComposition, openBrowser } from "@remotion/renderer";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const frameNum = parseInt(process.argv[2] || "45", 10);
const outPath = process.argv[3] || "/tmp/frame-check.png";

const bundled = await bundle({
  entryPoint: path.resolve(__dirname, "../src/index.ts"),
  webpackOverride: (config) => config,
});

const browser = await openBrowser("chrome", {
  browserExecutable: process.env.PUPPETEER_EXECUTABLE_PATH ?? "/bin/chromium",
  chromiumOptions: { args: ["--no-sandbox", "--disable-gpu", "--disable-dev-shm-usage"] },
  chromeMode: "chrome-for-testing",
});

const composition = await selectComposition({
  serveUrl: bundled,
  id: "main",
  puppeteerInstance: browser,
});

await renderStill({
  composition,
  serveUrl: bundled,
  output: outPath,
  frame: frameNum,
  puppeteerInstance: browser,
});

await browser.close({ silent: false });
console.log(`Still rendered: frame ${frameNum} → ${outPath}`);
