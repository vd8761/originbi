import fs from "fs";
const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
const data = new Uint8Array(fs.readFileSync(process.argv[2] || "tmp-mba-report.pdf"));
const doc = await pdfjs.getDocument({ data, useSystemFonts: true }).promise;
const pg = Number(process.argv[3] || 1);
const p = await doc.getPage(pg);
const tc = await p.getTextContent();
console.log(tc.items.map((x) => x.str).join(" ").replace(/\s+/g, " ").trim());
