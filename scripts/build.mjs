/**
 * Build script (Node 18+; dev dependencies: the Tailwind CLI and esbuild).
 *
 *   npm run build   → 1. bundles + minifies the JavaScript  assets/js/** → assets/js/dist/
 *                     2. compiles + minifies the CSS        assets/css/src/main.css → assets/css/main.css
 *                     3. copies the shared partials (head, header, footer, scripts) into every page
 *                        and stamps every CSS/JS link with a content hash (?v=…)
 *   npm run watch   → the same, again on every change
 *
 * The finished HTML/CSS/JS is committed, so the site itself never needs a
 * build; run this after editing anything under assets/js, assets/css/src or
 * partials. assets/js/config.js is the one file that is NOT bundled — it can
 * be edited on the server directly.
 *
 * JavaScript bundles (BUNDLES below)
 * ----------------------------------
 * The sources stay small readable files; each bundle is those files in order,
 * minified into one request, with a source map so the browser's developer
 * tools still show the original files.
 *   core   — every page (helpers, store, data layer, components, header/search, form fields)
 *   mock   — the sample data, loaded only while MASO_CONFIG.WP_URL is empty
 *   checkout, address — shared by the cart/checkout/profile pages
 *   <page> — assets/js/pages/<page>.js
 * Pages load bundles with <script src="assets/js/dist/<name>.js" defer>.
 *
 * Cache busting
 * -------------
 * Every assets/css/main.css and assets/js/dist/*.js reference in the pages
 * gets ?v=<hash of the file>, so browsers may keep them for a year (see
 * vercel.json / .htaccess) and still pick up every new build at once.
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
import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, readdirSync, rmSync, watch, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const watching = process.argv.includes("--watch");

/* ------------------------------------------------------------------ */
/* JavaScript                                                          */
/* ------------------------------------------------------------------ */

const JS = join(root, "assets/js");
const DIST = join(JS, "dist");

/** Bundle name → source files (relative to assets/js), in execution order */
const BUNDLES = {
  core: [
    "core/utils.js",
    "core/icons.js",
    "core/store.js",
    "core/api.js",
    "core/components.js",
    "core/ui.js",
    "core/search.js",
    "core/fields.js",
  ],
  mock: ["data/mock.js"],
  checkout: ["pages/checkout-common.js"],
  address: ["data/service-areas.js", "pages/address-dialog.js"],
};
const SHARED_PAGE_FILES = new Set(Object.values(BUNDLES).flat());
for (const file of readdirSync(join(JS, "pages"))) {
  if (file.endsWith(".js") && !SHARED_PAGE_FILES.has(`pages/${file}`)) BUNDLES[file.slice(0, -3)] = [`pages/${file}`];
}

const hash = (text) => createHash("sha256").update(text).digest("hex").slice(0, 10);

/** Asset path (as written in the pages) → content hash */
const versions = new Map();

async function bundleJs() {
  mkdirSync(DIST, { recursive: true });
  const written = new Set();
  await Promise.all(
    Object.entries(BUNDLES).map(async ([name, files]) => {
      // Every source file is a self-contained IIFE; importing them in order
      // runs them in order, and lets esbuild write one minified file + map.
      const result = await esbuild.build({
        stdin: { contents: files.map((f) => `import "./${f}";`).join("\n"), resolveDir: JS, sourcefile: `${name}.bundle.js` },
        bundle: true,
        format: "iife",
        minify: true,
        target: "es2020",
        legalComments: "none",
        charset: "utf8",
        sourcemap: "linked",
        sourcesContent: true,
        outfile: join(DIST, `${name}.js`),
        write: false,
        logLevel: "warning",
      });
      const map = result.outputFiles.find((f) => f.path.endsWith(".map"));
      const js = result.outputFiles.find((f) => f.path.endsWith(".js"));
      // The map is cached like the bundle, so its link gets a version too
      const code = js.text.replace(`sourceMappingURL=${name}.js.map`, `sourceMappingURL=${name}.js.map?v=${hash(map.contents)}`);
      writeFileSync(map.path, map.contents);
      writeFileSync(js.path, code);
      written.add(map.path).add(js.path);
      versions.set(`assets/js/dist/${name}.js`, hash(code));
    }),
  );
  // Bundles that no longer exist
  for (const file of readdirSync(DIST)) if (!written.has(join(DIST, file))) rmSync(join(DIST, file));
  console.log(`js: ${Object.keys(BUNDLES).length} bundles`);
}

/* ------------------------------------------------------------------ */
/* CSS                                                                 */
/* ------------------------------------------------------------------ */

function buildCss() {
  return new Promise((resolve, reject) => {
    const args = ["-i", "assets/css/src/main.css", "-o", "assets/css/main.css", "--minify"];
    const child = spawn(join(root, "node_modules/.bin/tailwindcss"), args, { cwd: root, stdio: "inherit" });
    child.on("exit", (code) => {
      if (code !== 0) return reject(new Error(`tailwindcss exited with ${code}`));
      versions.set("assets/css/main.css", hash(readFileSync(join(root, "assets/css/main.css"))));
      resolve();
    });
  });
}

/* ------------------------------------------------------------------ */
/* Pages                                                               */
/* ------------------------------------------------------------------ */

const INCLUDE = /<!-- @include (\w[\w-]*)(?: (\{.*?\}))? -->[\s\S]*?<!-- \/@include -->/g;
const VERSIONED = /(assets\/(?:css\/main\.css|js\/dist\/[\w-]+\.js))(?:\?v=[0-9a-f]+)?/g;

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

function stampVersions(text, page) {
  return text.replace(VERSIONED, (_, path) => {
    const v = versions.get(path);
    if (!v) throw new Error(`${page}: ${path} is not built (unknown bundle?)`);
    return `${path}?v=${v}`;
  });
}

function syncPages() {
  const pages = readdirSync(root).filter((f) => f.endsWith(".html"));
  let changed = 0;
  for (const page of pages) {
    const file = join(root, page);
    const before = readFileSync(file, "utf8");
    const included = before.replace(INCLUDE, (_, name, json) => {
      const opts = json ? JSON.parse(json) : {};
      return `<!-- @include ${name}${json ? ` ${json}` : ""} -->\n${renderPartial(name, opts)}\n<!-- /@include -->`;
    });
    const after = stampVersions(included, page);
    if (after !== before) {
      writeFileSync(file, after);
      changed++;
    }
  }
  console.log(`pages: ${changed} of ${pages.length} updated`);
}

/* ------------------------------------------------------------------ */

async function build() {
  versions.clear();
  await Promise.all([bundleJs(), buildCss()]);
  syncPages();
}

await build();

if (watching) {
  let timer;
  const rebuild = (_, file) => {
    // Our own output must not trigger another round
    if (file && ((file.endsWith("main.css") && !file.includes("src")) || file.includes("dist"))) return;
    clearTimeout(timer);
    timer = setTimeout(() => build().catch((e) => console.error(e.message)), 150);
  };
  for (const dir of ["partials", "assets/css/src", "assets/js"]) {
    watch(join(root, dir), { recursive: true }, rebuild);
  }
  watch(root, (_, file) => file?.endsWith(".html") && rebuild(_, file));
  console.log("watching for changes…");
}
