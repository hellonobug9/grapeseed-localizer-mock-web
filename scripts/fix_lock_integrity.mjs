// Sets every package-lock.json integrity to the one npmjs.org publishes for that
// exact version (versions and URLs are kept). Needed when lock entries were
// first resolved through AWS CodeArtifact, which serves some tarballs with a
// different sha512, so a clean `npm ci` (e.g. on Vercel) fails with EINTEGRITY.
// Usage: node scripts/fix_lock_integrity.mjs package-lock.json [--write]
import fs from "node:fs";
const [file, flag] = process.argv.slice(2);
const lock = JSON.parse(fs.readFileSync(file, "utf8"));
const entries = Object.entries(lock.packages).filter(([k, v]) => k && v.resolved && !v.link);
const nameOf = (key, v) =>
  v.name ?? key.slice(key.lastIndexOf("node_modules/") + "node_modules/".length);
const meta = new Map();
async function fetchMeta(name, version) {
  const id = `${name}@${version}`;
  if (!meta.has(id))
    meta.set(
      id,
      fetch(`https://registry.npmjs.org/${name.replace("/", "%2f")}/${version}`).then(async (r) => {
        if (!r.ok) throw new Error(`${id}: HTTP ${r.status}`);
        return (await r.json()).dist;
      }),
    );
  return meta.get(id);
}
let changed = [],
  urlDiff = [],
  i = 0;
async function worker() {
  while (i < entries.length) {
    const [key, v] = entries[i++];
    const dist = await fetchMeta(nameOf(key, v), v.version);
    if (dist.tarball !== v.resolved) urlDiff.push(`${key}: ${v.resolved} != ${dist.tarball}`);
    if (dist.integrity !== v.integrity) {
      changed.push(`${nameOf(key, v)}@${v.version}`);
      v.integrity = dist.integrity;
    }
  }
}
await Promise.all(Array.from({ length: 16 }, worker));
console.log(
  `checked ${entries.length}, integrity changed ${changed.length}, resolved-url mismatches ${urlDiff.length}`,
);
console.log([...new Set(changed)].sort().join(" "));
if (urlDiff.length) console.log(urlDiff.slice(0, 5).join("\n"));
if (flag === "--write") fs.writeFileSync(file, JSON.stringify(lock, null, 2) + "\n");
