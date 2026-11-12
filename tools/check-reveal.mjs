/**
 * check-reveal.mjs — Comprueba que ningún texto de los casos queda invisible
 * tras las animaciones de entrada (el bug de los «vacíos», 2026-11-11).
 *
 * Uso:  npm run build && npm run check
 * Requiere Playwright instalado (no es dependencia del proyecto):
 *       npx playwright install chromium   (o usar uno ya instalado)
 * Sirve la carpeta build/ en un puerto local, recorre cada caso bajando por
 * la página y falla (exit 1) si queda algún elemento animado con opacity < 0.9
 * o recortado (clip-path 100 %). Además, en 1440 y 390 px, avisa de scroll horizontal,
 * imágenes recortadas (proporción distinta a la real) o ampliadas por encima de su tamaño real.
 */
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { extname, join, normalize } from "node:path";
import { createRequire } from "node:module";

const ROOT = join(process.cwd(), "build");
const PAGES = ["andy-electric", "ublo", "bellpi", "bnf", "spotify", "jumbomana", "paramo", "qualnet", "iridian", "cv"];
const TYPES = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".json": "application/json", ".webp": "image/webp", ".svg": "image/svg+xml", ".png": "image/png", ".jpg": "image/jpeg" };

const server = createServer(async (req, res) => {
  try {
    let p = normalize(decodeURIComponent(req.url.split("?")[0])).replace(/^(\.\.[/\\])+/, "");
    if (p.endsWith("/")) p += "index.html";
    const data = await readFile(join(ROOT, p));
    res.writeHead(200, { "content-type": TYPES[extname(p)] || "application/octet-stream" });
    res.end(data);
  } catch {
    res.writeHead(404).end();
  }
}).listen(0);

const { chromium } = createRequire(import.meta.url)("playwright");
const port = server.address().port;
const browser = await chromium.launch();
let failed = 0;

for (const page of PAGES) {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const p = await ctx.newPage();
  await p.goto(`http://localhost:${port}/projects/${page}/index.html`, { waitUntil: "networkidle" });
  const H = await p.evaluate(() => document.documentElement.scrollHeight);
  for (let y = 0; y < H; y += 500) {
    await p.evaluate((v) => window.scrollTo(0, v), y);
    await p.waitForTimeout(120);
  }
  await p.waitForTimeout(2500);
  const hidden = await p.evaluate(() =>
    [...document.querySelectorAll("main .cm-fade, main .cm-title")]
      .filter((e) => {
        const s = getComputedStyle(e);
        return +s.opacity < 0.9 || s.clipPath.includes("100%");
      })
      .map((e) => e.textContent.trim().slice(0, 50))
  );
  console.log(`${hidden.length ? "✗" : "✓"} ${page}${hidden.length ? " — ocultos: " + hidden.join(" | ") : ""}`);
  if (hidden.length) failed++;
  await ctx.close();

  for (const width of [1440, 390]) {
    const c2 = await browser.newContext({ viewport: { width, height: 900 } });
    const q = await c2.newPage();
    await q.goto(`http://localhost:${port}/projects/${page}/index.html`, { waitUntil: "networkidle" });
    await q.waitForTimeout(800);
    const issues = await q.evaluate(() => {
      const out = [];
      if (document.documentElement.scrollWidth > window.innerWidth + 1) out.push("scroll horizontal");
      document.querySelectorAll("main.cs-frame img").forEach((img) => {
        const r = img.getBoundingClientRect();
        if (!r.width || !r.height || !img.naturalWidth || img.closest(".cs-hide-m, .cs-only-desktop, .cs-only-mobile") && getComputedStyle(img.closest(".cs-hide-m, .cs-only-desktop, .cs-only-mobile")).display === "none") return;
        const name = (img.getAttribute("src") || "").split("/").pop().slice(0, 30);
        if (/^icon-|\.svg/.test(name)) return;
        const ratio = r.width / r.height / (img.naturalWidth / img.naturalHeight);
        if (Math.abs(ratio - 1) > 0.04) out.push(`recortada ${name}`);
        const k = /@2x/.test(img.getAttribute("src") || "") ? 2 : 1;
        if (r.width > (img.naturalWidth / k) * 1.08 && !img.closest(".cs-cover")) out.push(`ampliada ${name}`);
      });
      return [...new Set(out)];
    });
    if (issues.length) {
      console.log(`⚠ ${page} @${width}: ${issues.join(", ")}`);
      failed++;
    }
    await c2.close();
  }
}

await browser.close();
server.close();
process.exit(failed ? 1 : 0);
