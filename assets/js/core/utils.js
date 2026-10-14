/**
 * Maso core — shared helpers. Every script attaches to the single global
 * `Maso` namespace (no build step, no modules, so the site also opens
 * straight from disk).
 *
 *   Maso.html`…`    safe HTML templates (values are escaped)
 *   Maso.fmt        Persian numbers, prices and dates
 *   Maso.url        page links and media paths
 *   Maso.text       search-term normalisation, digit conversion
 *   Maso.dom        tiny DOM helpers
 */
(function () {
  "use strict";

  const Maso = (window.Maso = window.Maso || {});

  /* ------------------------------------------------------------------ */
  /* HTML templates                                                      */
  /* ------------------------------------------------------------------ */

  /** Trusted markup (output of `html`, icons) — inserted without escaping */
  class Raw {
    constructor(value) {
      this.value = value;
    }
    toString() {
      return this.value;
    }
  }

  const ESCAPES = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };
  const escape = (s) => String(s).replace(/[&<>"']/g, (c) => ESCAPES[c]);

  function renderValue(v) {
    if (v === null || v === undefined || v === false) return "";
    if (Array.isArray(v)) return v.map(renderValue).join("");
    if (v instanceof Raw) return v.value;
    return escape(v);
  }

  /**
   * Tagged template: html`<p class="${cls}">${userText}</p>`
   * Interpolated strings are escaped; arrays are joined; null/false render
   * nothing; nested html`` and Maso.raw() pass through untouched.
   */
  Maso.html = function html(strings, ...values) {
    let out = strings[0];
    for (let i = 0; i < values.length; i++) out += renderValue(values[i]) + strings[i + 1];
    return new Raw(out);
  };

  /** Marks a string as trusted HTML (e.g. rich text from the WordPress editor) */
  Maso.raw = (value) => new Raw(value);

  /** Joins class names, skipping falsy ones: cx("a", on && "b") */
  Maso.cx = (...parts) => parts.filter(Boolean).join(" ");

  /* ------------------------------------------------------------------ */
  /* Formatting (Intl objects are created once — that's the costly part) */
  /* ------------------------------------------------------------------ */

  const TZ = "Asia/Tehran";
  const jalaliLong = new Intl.DateTimeFormat("fa-IR-u-ca-persian", { day: "numeric", month: "long", year: "numeric", timeZone: TZ });
  const jalaliNumeric = new Intl.DateTimeFormat("fa-IR-u-ca-persian", { day: "2-digit", month: "2-digit", year: "numeric", timeZone: TZ });
  const timeFormat = new Intl.DateTimeFormat("fa-IR", { hour: "2-digit", minute: "2-digit", hour12: false, timeZone: TZ });
  const faNumber = new Intl.NumberFormat("fa-IR");

  Maso.fmt = {
    /** 1480000000 → "۱,۴۸۰,۰۰۰,۰۰۰" (Persian digits, comma grouping as in the design) */
    price: (value) => faNumber.format(value).replace(/٬/g, ","),
    /** Any Latin digits in a string → Persian digits */
    digits: (input) => String(input).replace(/\d/g, (d) => "۰۱۲۳۴۵۶۷۸۹"[Number(d)]),
    /** "۱۲ شهریور ۱۴۰۵" */
    dateLong: (iso) => jalaliLong.format(new Date(iso)),
    /** "۱۴۰۵/۰۵/۰۵" */
    dateNumeric: (iso) => jalaliNumeric.format(new Date(iso)),
    /** "۱۲:۳۲" (Tehran time) */
    time: (iso) => timeFormat.format(new Date(iso)),
  };

  /* ------------------------------------------------------------------ */
  /* Text                                                                */
  /* ------------------------------------------------------------------ */

  Maso.text = {
    /**
     * Normalises a search term so "مبل", "مبل " and "مبل" typed on an Arabic
     * keyboard (ي / ك) all match the same products and recent-search entry.
     */
    normalize(input) {
      return String(input)
        .replace(/ي/g, "ی")
        .replace(/ك/g, "ک")
        .replace(/[ً-ْ]/g, "") // harakat
        .replace(/\s+/g, " ")
        .trim()
        .slice(0, 80);
    },
    /** Looser form used only for matching: also ignores zero-width non-joiners */
    matchKey(input) {
      return Maso.text.normalize(input).replace(/‌/g, "").toLowerCase();
    },
    /** Persian/Arabic-Indic digits → Latin, so "۰۹۱۲…" validates like "0912…" */
    latinDigits(input) {
      return String(input)
        .replace(/[۰-۹]/g, (d) => String(d.charCodeAt(0) - 0x06f0))
        .replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 0x0660));
    },
    /** "۰۹۱۲ ۳۴۵ ۶۷۸۹" / "+989123456789" → "09123456789", or null when invalid */
    mobile(input) {
      const m = Maso.text
        .latinDigits(input || "")
        .replace(/[\s-]/g, "")
        .replace(/^(\+98|0098|98)(?=9)/, "0");
      return /^09\d{9}$/.test(m) ? m : null;
    },
  };

  /* ------------------------------------------------------------------ */
  /* URLs                                                                */
  /* ------------------------------------------------------------------ */

  /**
   * WordPress (and the sample data) speak in site paths such as
   * "/shop/beds" or "/product/hamdam-bed". These map them to the pages of
   * this static site. Pages that aren't built yet (about, blog, …) map to
   * "<name>.html" and show the 404 page until they exist.
   */
  const PAGES = {
    "/": "index.html",
    "/shop": "shop.html",
    "/search": "search.html",
    "/cart": "cart.html",
    "/checkout": "checkout-shipping.html",
    "/checkout/shipping": "checkout-shipping.html",
    "/checkout/payment": "checkout-payment.html",
    "/checkout/result": "checkout-result.html",
    "/login": "login.html",
    "/custom-order": "custom-order.html",
    "/maintenance": "maintenance.html",
  };

  Maso.url = {
    shop: (category) => (category ? `shop.html?category=${encodeURIComponent(category)}` : "shop.html"),
    product: (slug) => `product.html?slug=${encodeURIComponent(slug)}`,
    search: (q) => (q ? `search.html?q=${encodeURIComponent(q)}` : "search.html"),

    /** Site path from WordPress → link on this site */
    page(path) {
      if (!path || /^(https?:|mailto:|tel:|#)/.test(path)) return path;
      const [, pathname = "/", rest = ""] = path.match(/^([^?#]*)(.*)$/) || [];
      const clean = pathname.replace(/\/+$/, "") || "/";
      const extra = rest.startsWith("?") ? `&${rest.slice(1)}` : rest;
      let m;
      if (PAGES[clean]) return PAGES[clean] + rest;
      if ((m = clean.match(/^\/shop\/([^/]+)$/))) return Maso.url.shop(decodeURIComponent(m[1])) + extra;
      if ((m = clean.match(/^\/product\/([^/]+)$/))) return Maso.url.product(decodeURIComponent(m[1])) + extra;
      if ((m = clean.match(/^\/blog\/([^/]+)$/))) return `blog-post.html?slug=${m[1]}${extra}`;
      return `${clean.slice(1).replace(/\//g, "-")}.html${rest}`;
    },

    /** Image path from the sample data ("/images/…") → file in assets/; absolute URLs untouched */
    media(src) {
      if (!src) return "";
      if (/^(https?:|data:|blob:)/.test(src)) return src;
      return src.startsWith("/images/") || src.startsWith("/brand/") ? `assets/images${src.replace(/^\/images/, "")}` : src;
    },

    /** Query-string value of the current page */
    param(name) {
      return new URLSearchParams(location.search).get(name);
    },
  };

  /* ------------------------------------------------------------------ */
  /* DOM                                                                 */
  /* ------------------------------------------------------------------ */

  Maso.dom = {
    $: (selector, root = document) => root.querySelector(selector),
    $$: (selector, root = document) => Array.from(root.querySelectorAll(selector)),

    /** Replaces an element's content with a template */
    render(el, view) {
      // Same rules as inside html`` (arrays joined, null/false → nothing)
      el.innerHTML = renderValue(view);
      return el;
    },

    /** Builds a single element from a template */
    create(view) {
      const t = document.createElement("template");
      t.innerHTML = String(view).trim();
      return t.content.firstElementChild;
    },

    /**
     * Event delegation: one listener on `root` handles clicks on any
     * `[data-action="name"]` inside it, even ones rendered later.
     *   Maso.dom.actions(root, { remove: (el, event) => … })
     */
    actions(root, handlers, { type = "click", signal } = {}) {
      root.addEventListener(
        type,
        (event) => {
          const el = event.target.closest("[data-action]");
          if (!el || !root.contains(el)) return;
          const handler = handlers[el.dataset.action];
          if (handler) handler(el, event);
        },
        { signal },
      );
    },

    /** Calls `fn` at most once per `ms` of quiet */
    debounce(fn, ms) {
      let timer;
      return (...args) => {
        clearTimeout(timer);
        timer = setTimeout(() => fn(...args), ms);
      };
    },

    /** Runs after the document is parsed (scripts are `defer`, so usually immediately) */
    ready(fn) {
      if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", fn, { once: true });
      else fn();
    },
  };
})();
