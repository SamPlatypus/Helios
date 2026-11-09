import { copyFileSync, existsSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const dir = join(process.cwd(), "dist", "client");
const indexPath = join(dir, "index.html");
if (!existsSync(indexPath)) {
  console.error("[pages] missing dist/client/index.html");
  process.exit(1);
}

const assets = readdirSync(join(dir, "assets"));
const css = assets.filter((name) => name.startsWith("styles-") && name.endsWith(".css"));
if (css.length !== 1) {
  console.error("[pages] expected one styles-*.css, found", css);
  process.exit(1);
}
const cssHref = `/Helios/assets/${css[0]}`;

let html = readFileSync(indexPath, "utf8");
html = html.replace(/href="\/Helios\/assets\/styles-[^"]+\.css"/g, `href="${cssHref}"`);
writeFileSync(indexPath, html);
copyFileSync(indexPath, join(dir, "404.html"));
writeFileSync(join(dir, ".nojekyll"), "");
console.log("[pages] css", cssHref);
