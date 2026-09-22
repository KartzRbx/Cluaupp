#!/usr/bin/env node
/** Audit internal hrefs in the built Starlight site (base /Cluaupp/, trailingSlash always). */
const fs = require("fs");
const path = require("path");

const siteRoot = path.join(__dirname, "..", "site");
const base = "/Cluaupp";
const origin = "https://kartzrbx.github.io";

function walk(dir, acc = []) {
  if (!fs.existsSync(dir)) return acc;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, acc);
    else if (e.name.endsWith(".html")) acc.push(p);
  }
  return acc;
}

function existsForUrl(urlPath) {
  let rel = urlPath.split("#")[0].split("?")[0];
  if (rel.startsWith(base)) rel = rel.slice(base.length) || "/";
  if (!rel.startsWith("/")) rel = "/" + rel;
  if (rel === "/") return fs.existsSync(path.join(siteRoot, "index.html"));
  const trimmed = rel.replace(/\/$/, "");
  return [
    path.join(siteRoot, trimmed.slice(1), "index.html"),
    path.join(siteRoot, trimmed.slice(1) + ".html"),
    path.join(siteRoot, trimmed.slice(1)),
  ].some((c) => fs.existsSync(c));
}

const pages = walk(siteRoot);
const broken = [];
const hrefRe = /href=["']([^"']+)["']/gi;

for (const file of pages) {
  const html = fs.readFileSync(file, "utf8");
  const rel = path.relative(siteRoot, file).split(path.sep).join("/");
  let pagePath;
  if (rel === "index.html") pagePath = base + "/";
  else if (rel === "404.html") pagePath = base + "/404.html";
  else pagePath = base + "/" + rel.replace(/\/index\.html$/, "/").replace(/\.html$/, "/");
  if (!pagePath.endsWith("/") && !pagePath.endsWith(".html")) pagePath += "/";

  const pageUrl = origin + pagePath;
  let m;
  hrefRe.lastIndex = 0;
  while ((m = hrefRe.exec(html))) {
    const href = m[1];
    if (!href || href.startsWith("http") || href.startsWith("mailto:") || href.startsWith("data:") || href.startsWith("#")) {
      continue;
    }
    let resolved;
    try {
      resolved = new URL(href, pageUrl).pathname;
    } catch {
      broken.push({ from: pagePath, href, reason: "bad-url" });
      continue;
    }
    if (resolved.startsWith(base + "/") || resolved === base || resolved === base + "/") {
      if (!existsForUrl(resolved === base ? base + "/" : resolved)) {
        broken.push({ from: pagePath, href, resolved, reason: "missing-file" });
      }
    } else if (resolved.startsWith("/") && !resolved.startsWith(base)) {
      // 404.html hero sometimes resolves "../" above base — ignore only that file.
      if (rel === "404.html" && (resolved === "/" || href === "../" || href === "/")) {
        continue;
      }
      if (!resolved.startsWith("/_astro") && !resolved.includes(".")) {
        broken.push({ from: pagePath, href, resolved, reason: "missing-base" });
      } else if (!existsForUrl(base + resolved) && !fs.existsSync(path.join(siteRoot, resolved.slice(1)))) {
        if (!existsForUrl(resolved) && !existsForUrl(base + resolved)) {
          broken.push({ from: pagePath, href, resolved, reason: "missing-asset" });
        }
      }
    }
  }
}

const unique = [];
const seen = new Set();
for (const b of broken) {
  const k = `${b.from}|${b.href}|${b.resolved || ""}`;
  if (!seen.has(k)) {
    seen.add(k);
    unique.push(b);
  }
}

console.log(JSON.stringify({ pages: pages.length, broken: unique.length, sample: unique.slice(0, 40) }, null, 2));
if (unique.length) process.exitCode = 1;
