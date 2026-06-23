import fs from "fs";
import { createCanvas } from "@napi-rs/canvas";
const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");

class NodeCanvasFactory {
  create(w, h) {
    const canvas = createCanvas(Math.ceil(w), Math.ceil(h));
    return { canvas, context: canvas.getContext("2d") };
  }
  reset(cc, w, h) {
    cc.canvas.width = Math.ceil(w);
    cc.canvas.height = Math.ceil(h);
  }
  destroy(cc) {
    cc.canvas.width = 0;
    cc.canvas.height = 0;
  }
}

const src = process.argv[2] || "tmp-mba-report.pdf";
const outDir = process.argv[3] || "pdfcheck";
const scale = Number(process.argv[4] || 1.6);
const data = new Uint8Array(fs.readFileSync(src));
const factory = new NodeCanvasFactory();
const doc = await pdfjs.getDocument({
  data,
  useSystemFonts: true,
  canvasFactory: factory,
}).promise;

for (let i = 1; i <= doc.numPages; i++) {
  const page = await doc.getPage(i);
  const vp = page.getViewport({ scale });
  const { canvas, context } = factory.create(vp.width, vp.height);
  await page.render({ canvasContext: context, viewport: vp, canvasFactory: factory }).promise;
  fs.writeFileSync(`${outDir}/page-${String(i).padStart(2, "0")}.png`, canvas.toBuffer("image/png"));
}
console.log("pages=" + doc.numPages);
