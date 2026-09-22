#!/usr/bin/env node
/**
 * Rewrite internal markdown links for Starlight + trailingSlash: "always".
 * Interprets existing relative hrefs as file-style (no trailing slash) to recover
 * intended targets, then emits directory-style relatives that work in the browser.
 */
const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..", "docs", "src", "content", "docs");

function walk(dir, acc = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, acc);
    else if (/\.(md|mdx)$/.test(e.name)) acc.push(p);
  }
  return acc;
}

function toPosix(p) {
  return p.split(path.sep).join("/");
}

function urlSegments(relPosix) {
  const parts = relPosix.split("/");
  const file = parts.pop();
  const isIndex = /^index\.(md|mdx)$/.test(file);
  if (isIndex) return parts;
  return [...parts, file.replace(/\.(md|mdx)$/, "")];
}

const files = walk(root);
const slugToRel = new Map();
for (const file of files) {
  const rel = toPosix(path.relative(root, file));
  const segs = urlSegments(rel);
  slugToRel.set(segs.join("/"), rel);
}

function resolveSlug(href, fromSegs) {
  let h = String(href).trim();
  if (!h || /^https?:/i.test(h) || h.startsWith("mailto:") || h.startsWith("#")) return null;
  if (/\.(clpp|clh|clp|luau|ts|js|json|cpp|hpp)$/i.test(h.split("#")[0])) return null;

  const hashIdx = h.indexOf("#");
  const hash = hashIdx >= 0 ? h.slice(hashIdx) : "";
  h = hashIdx >= 0 ? h.slice(0, hashIdx) : h;

  const candidates = new Set();

  // Absolute site path /foo/bar/
  if (h.startsWith("/")) {
    candidates.add(h.replace(/^\/+/, "").replace(/\/$/, ""));
  }

  // File-style base (no trailing slash) — recovers "same folder" ./ and content-depth ../
  const fileBase =
    "https://example.local/" + (fromSegs.length ? fromSegs.join("/") : "index");
  try {
    const p = new URL(h, fileBase).pathname.replace(/^\/+/, "").replace(/\/$/, "");
    candidates.add(p);
  } catch {
    /* ignore */
  }

  // Directory-style base (current trailingSlash URL)
  const dirBase = "https://example.local/" + fromSegs.join("/") + "/";
  try {
    const p = new URL(h, dirBase).pathname.replace(/^\/+/, "").replace(/\/$/, "");
    candidates.add(p);
  } catch {
    /* ignore */
  }

  // Strip leading ../ noise
  candidates.add(h.replace(/^(\.\.\/)+/, "").replace(/^\.\//, "").replace(/\/$/, ""));

  for (const c of candidates) {
    if (slugToRel.has(c)) return { slug: c, hash };
    // index slug "" for home
    if (c === "" || c === "." || c === "index") return { slug: "", hash };
  }

  // Last-segment fallback for short names unique enough
  for (const c of candidates) {
    const parts = c.split("/").filter(Boolean);
    for (let i = 0; i < parts.length; i++) {
      const cand = parts.slice(i).join("/");
      if (slugToRel.has(cand)) return { slug: cand, hash };
    }
  }

  return null;
}

function linkTo(fromSegs, targetSlug, hash) {
  const targetSegs = targetSlug === "" ? [] : targetSlug.split("/").filter(Boolean);
  let i = 0;
  while (i < fromSegs.length && i < targetSegs.length && fromSegs[i] === targetSegs[i]) i++;
  const up = fromSegs.length - i;
  const down = targetSegs.slice(i);
  let rel;
  if (up === 0 && down.length === 0) rel = "./";
  else if (up === 0) rel = down.join("/") + "/";
  else if (down.length === 0) rel = "../".repeat(up);
  else rel = "../".repeat(up) + down.join("/") + "/";
  return rel + (hash || "");
}

let changedFiles = 0;
let rewrites = 0;
let unresolved = [];

for (const file of files) {
  const rel = toPosix(path.relative(root, file));
  // Starlight 404 is emitted as 404.html; keep hero link as "/" so Astro prefixes base.
  if (rel === "404.md") continue;
  const fromSegs = urlSegments(rel);
  let text = fs.readFileSync(file, "utf8");

  const next = text.replace(/\]\(([^)]+)\)/g, (full, href) => {
    const hit = resolveSlug(href, fromSegs);
    if (!hit) {
      // track internal-looking misses
      if (/^(\.\.\/|\.\/|\/)/.test(href) && !/^https?:/i.test(href)) {
        unresolved.push({ file: rel, href });
      }
      return full;
    }
    const out = linkTo(fromSegs, hit.slug, hit.hash);
    if (out === href) return full;
    rewrites += 1;
    return "](" + out + ")";
  });

  const next2 = next.replace(/^(\s*link:\s*)(.+)$/gm, (full, a, val) => {
    const v = val.trim();
    if (v === "/" || v === "./" || v === ".") {
      return a + linkTo(fromSegs, "", "");
    }
    return full;
  });

  if (next2 !== text) {
    fs.writeFileSync(file, next2);
    changedFiles += 1;
  }
}

const uniqMiss = [...new Map(unresolved.map((u) => [u.file + "|" + u.href, u])).values()].slice(0, 30);
console.log(JSON.stringify({ files: files.length, changedFiles, rewrites, unresolvedSample: uniqMiss }, null, 2));
