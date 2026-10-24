/**
 * Build script (Node 18+, no dependencies besides the Tailwind CLI).
 *
 *   npm run build   → 1. copies the shared header/footer into every page
 *                     2. compiles assets/css/src/main.css → assets/css/main.css
 *   npm run watch   → the same, again on every change
 *
 * The finished HTML/CSS is committed, so the site itself never needs a build;
 * run this only after editing a partial or adding new utility classes.
 *
 * Partials
 * --------
 * Pages mark where a partial goes, with optional JSON settings:
 *
 *   <!-- @include header {"mode":"overlay"} -->
 *   …generated markup…
 *   <!-- /@include -->
 *
 * Everything between the two markers is regenerated from partials/<name>.html.
 * `{{key}}` placeholders in a partial are filled from the settings (missing
 * keys become empty strings). Header settings:
 *   mode: "overlay" (home) | "page" (default)
 *   rule: "none" — no desktop rule under the header (pages whose design has none)
 *   bare: true → hidden on phones/tablets (payment result)
 * Head settings:
 *   title, description, noindex: true | "follow"
 */
import { spawn } from "node:child_process";
import { readFileSync, readdirSync, watch, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const watching = process.argv.includes("--watch");

const INCLUDE = /<!-- @include (\w[\w-]*)(?: (\{.*?\}))? -->[\s\S]*?<!-- \/@include -->/g;

/** Header attributes derived from the page's settings */
function headerAttrs(opts) {
  let attrs = "";
  if (opts.mode === "overlay") attrs += ' data-mode="overlay"';
  if (opts.rule) attrs += ` data-rule="${opts.rule}"`;
  if (opts.bare) attrs += " data-bare";
  return attrs;
}

const DEFAULT_TITLE = "ماسو | مبلمان چوبی بدون میخ و پیچ";
const DEFAULT_DESCRIPTION = "ماسو؛ چوب، در والاترین شکل خود. مبلمان دست‌ساز بدون استفاده از میخ و پیچ.";

/** Values computed from a page's settings, per partial */
function partialValues(name, opts) {
  if (name === "header") return { attrs: headerAttrs(opts) };
  if (name === "head") {
    return {
      title: opts.title ? `${opts.title} | ماسو` : DEFAULT_TITLE,
      description: opts.description || DEFAULT_DESCRIPTION,
      robots: opts.noindex ? `<meta name="robots" content="${opts.noindex === "follow" ? "noindex, follow" : "noindex, nofollow"}" />\n` : "",
    };
  }
  return {};
}

function renderPartial(name, opts) {
  const source = readFileSync(join(root, "partials", `${name}.html`), "utf8").trim();
  const values = { ...opts, ...partialValues(name, opts) };
  return source.replace(/\{\{(\w+)\}\}/g, (_, key) => (values[key] ?? "").toString());
}

function syncPages() {
  const pages = readdirSync(root).filter((f) => f.endsWith(".html"));
  let changed = 0;
  for (const page of pages) {
    const file = join(root, page);
    const before = readFileSync(file, "utf8");
    const after = before.replace(INCLUDE, (_, name, json) => {
      const opts = json ? JSON.parse(json) : {};
      return `<!-- @include ${name}${json ? ` ${json}` : ""} -->\n${renderPartial(name, opts)}\n<!-- /@include -->`;
    });
    if (after !== before) {
      writeFileSync(file, after);
      changed++;
    }
  }
  console.log(`partials: ${changed} of ${pages.length} pages updated`);
}

function buildCss() {
  return new Promise((resolve, reject) => {
    const args = ["-i", "assets/css/src/main.css", "-o", "assets/css/main.css", "--minify"];
    const child = spawn(join(root, "node_modules/.bin/tailwindcss"), args, { cwd: root, stdio: "inherit" });
    child.on("exit", (code) => (code === 0 ? resolve() : reject(new Error(`tailwindcss exited with ${code}`))));
  });
}

async function build() {
  syncPages();
  await buildCss();
}

await build();

if (watching) {
  let timer;
  const rebuild = (_, file) => {
    // Our own output must not trigger another round
    if (file && (file.endsWith("main.css") && !file.includes("src"))) return;
    clearTimeout(timer);
    timer = setTimeout(() => build().catch((e) => console.error(e.message)), 150);
  };
  for (const dir of ["partials", "assets/css/src", "assets/js"]) {
    watch(join(root, dir), { recursive: true }, rebuild);
  }
  watch(root, (_, file) => file?.endsWith(".html") && rebuild(_, file));
  console.log("watching for changes…");
}
