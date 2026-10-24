/**
 * Small render functions shared by several pages. Each returns markup
 * (Maso.html) to drop into a template; behaviour is wired by the page.
 */
(function () {
  "use strict";

  const Maso = window.Maso;
  const { html, icon, fmt, url, cx } = Maso;

  /**
   * <img> for a WordPress media object. Lazy by default; pass
   * { eager: true } for pictures above the fold.
   */
  function img(media, { cls = "", alt, eager = false, sizes, width, height } = {}) {
    return html`<img
      src="${url.media(media.src)}"
      alt="${alt ?? media.alt ?? ""}"
      width="${width ?? media.width}"
      height="${height ?? media.height}"
      ${eager ? html`fetchpriority="high"` : html`loading="lazy"`}
      decoding="async"
      ${sizes ? html`sizes="${sizes}"` : ""}
      class="${cls}"
    />`;
  }

  /**
   * Price block from the product card:
   *   ۱,۴۸۰,۰۰۰,۰۰۰ تومان          (20px bold + toman sign, 10px gap)
   *   ۲۰۰,۰۰۰,۰۰۰  [- ۱۰٪]          (struck-through old price + red badge)
   * size "md": 20px bold · "card": 16px semibold (product cards) · "sm": 16px regular (search rows, cart)
   */
  function price({ price, regularPrice, size = "md", cls = "" }) {
    const discount = regularPrice && regularPrice > price ? Math.round((1 - price / regularPrice) * 100) : 0;
    return html`
      <div class="${cx("flex shrink-0 flex-col items-start gap-1", cls)}">
        <p class="flex items-center gap-2.5 text-ink">
          <span class="${size === "md" ? "text-20 font-bold" : size === "card" ? "text-16 font-semibold" : "text-16"}">${fmt.price(price)}</span>
          ${icon("toman")}
        </p>
        ${discount > 0 &&
        html`<p class="flex items-start gap-2">
          <del class="text-13 text-ink-muted"><span class="sr-only">قیمت قبل: </span>${fmt.price(regularPrice)}</del>
          <span dir="ltr" class="rounded-full bg-error px-1 text-13 text-on-error"><span class="sr-only">تخفیف </span>${`- ${fmt.digits(discount)}٪`}</span>
        </p>`}
      </div>
    `;
  }

  /**
   * Overlapping 24px finish swatches with an inner shadow, preceded by a "+N"
   * bubble for the rest. Drawn left-to-right like the design, independent of RTL.
   */
  function swatches(list) {
    if (!list.length) return "";
    const VISIBLE = 3;
    const extra = list.length - VISIBLE;
    return html`
      <div dir="ltr" class="flex items-center" role="img" aria-label="${`رنگ‌بندی: ${list.map((s) => s.name).join("، ")}`}">
        ${extra > 0 &&
        html`<span class="relative -me-1 flex size-6 items-center justify-center rounded-full bg-surf-container text-14 leading-none text-primary">${`+${fmt.digits(extra)}`}</span>`}
        ${list.slice(0, VISIBLE).map(
          (s) => html`<span class="relative -me-1 size-6 overflow-hidden rounded-full after:absolute after:inset-0 after:rounded-full after:shadow-[inset_0_5px_2px_rgba(0,0,0,0.25)] last:me-0">
            ${img(s.image, { alt: "", width: 24, height: 24, cls: "size-full object-cover" })}
          </span>`,
        )}
      </div>
    `;
  }

  /** Round swatch of an option (24px in cards, 40px in pickers) */
  function swatchDot(option, size = 24) {
    return html`<span
      class="relative shrink-0 overflow-hidden rounded-full after:absolute after:inset-0 after:rounded-full after:shadow-[inset_0_5px_2px_rgba(0,0,0,0.25)]"
      style="width:${size}px;height:${size}px"
      >${img(option.swatch, { alt: "", width: size, height: size, cls: "size-full object-cover" })}</span
    >`;
  }

  /**
   * Product card (Figma "Frame 1000004115"): 375px picture (244px on phones) with a 4px primary
   * underline, then name/capacity, divider, short description, and the
   * swatches + price row. Width comes from the grid.
   * variant "rounded" (blog's suggested products): 32px-radius picture, no
   * underline, 12px side padding.
   */
  function productCard(product, { index = 0, eager = false, variant = "default" } = {}) {
    const rounded = variant === "rounded";
    return html`
      <article data-reveal style="--reveal-index:${index % 3}" class="group relative flex flex-col gap-4">
        <div class="${cx(
          "relative overflow-hidden bg-linear-to-b from-[#677b9c] to-[#e0ebff]",
          rounded ? "h-[375px] rounded-[32px]" : "h-[244px] border-b-4 border-primary md:h-[375px]",
        )}">
          ${img(product.image, {
            alt: product.image.alt || product.name,
            eager,
            cls: "absolute inset-0 size-full object-cover transition-transform duration-700 ease-out-expo group-hover:scale-[1.04]",
          })}
          ${!product.inStock &&
          html`<span class="absolute start-4 top-4 rounded-full bg-surface/90 px-3 py-1 text-13 text-ink-var">ناموجود</span>`}
        </div>
        <div class="${cx("flex flex-col gap-4", rounded ? "px-3" : "px-6")}">
          <div class="flex items-center justify-between gap-4">
            <h3 class="text-20 text-ink">
              <!-- The whole card is clickable through this link's ::after -->
              <a href="${url.product(product.slug)}" class="after:absolute after:inset-0">${product.name}</a>
            </h3>
            ${product.capacity && html`<span class="shrink-0 text-13 text-outline">${product.capacity}</span>`}
          </div>
          <hr class="border-0 border-t border-black-10" />
          <p class="text-13 text-ink-var">${product.shortDescription}</p>
          <div class="flex items-center justify-between">
            ${price({ price: product.price, regularPrice: product.regularPrice, size: "card" })} ${swatches(product.swatches)}
          </div>
        </div>
      </article>
    `;
  }

  /**
   * Blog post card (Figma "Frame 1000004146"): square picture with a 32px
   * radius and hairline border, 2-line title, excerpt, date.
   * size "list": fills its grid cell, 5 lines of excerpt on desktop
   * size "rail": 224px wide ("مقالات دیگر"), 4 lines
   */
  function postCard(post, { index = 0, size = "list", eager = false } = {}) {
    const rail = size === "rail";
    return html`
      <article data-reveal style="--reveal-index:${index % 3}" class="${cx("group relative flex flex-col gap-4", rail && "w-[224px]")}">
        <div class="aspect-[263/264] overflow-hidden rounded-[32px] border border-hairline bg-surface-low">
          ${img(post.image, {
            alt: post.image.alt || "",
            eager,
            cls: "size-full object-cover transition-transform duration-700 ease-out-expo group-hover:scale-[1.04]",
          })}
        </div>
        <div class="flex flex-col gap-4">
          <div class="flex flex-col gap-2">
            <h3 class="line-clamp-2 text-20 font-bold text-ink">
              <a href="${url.post(post.slug)}" class="after:absolute after:inset-0">${post.title}</a>
            </h3>
            <p class="${cx("text-16 text-ink-var", rail ? "line-clamp-4" : "line-clamp-4 lg:line-clamp-5")}">${post.excerpt}</p>
          </div>
          <time datetime="${post.date}" class="text-13 text-ink-var">${fmt.dateNumeric(post.date)}</time>
        </div>
      </article>
    `;
  }

  function postCardSkeleton() {
    return html`
      <div aria-hidden="true" class="flex flex-col gap-4">
        <div class="aspect-[263/264] animate-pulse rounded-[32px] bg-skeleton"></div>
        ${block("h-[62px] w-4/5")} ${block("h-[100px] w-full")} ${block("h-5 w-24")}
      </div>
    `;
  }

  /** Loading placeholder in the style of the Figma skeleton frame */
  const block = (cls) => html`<div class="${cx("animate-pulse rounded-[6px] bg-skeleton", cls)}"></div>`;

  function productCardSkeleton() {
    return html`
      <div aria-hidden="true" class="flex flex-col gap-4">
        <div class="h-[244px] animate-pulse bg-skeleton md:h-[375px]"></div>
        <div class="flex flex-col gap-4 px-6">
          <div class="flex items-center justify-between">${block("h-[31px] w-[150px]")} ${block("h-5 w-16")}</div>
          ${block("h-10 w-full")}
          <div class="flex items-center justify-between">${block("h-[31px] w-[150px]")} ${block("h-6 w-20")}</div>
        </div>
      </div>
    `;
  }

  /**
   * "فروشگاه / تخت" trail under the header on shop pages. Ancestors are
   * on-surface-var, the current page is full black; "/ " belongs to the
   * following crumb, exactly like the design.
   * size "compact": 8px vertical padding (listing) · "roomy": 16px (product page)
   */
  function breadcrumbs(items, { size = "compact", cls = "" } = {}) {
    return html`
      <nav aria-label="مسیر صفحه" class="${cx(size === "compact" ? "px-4 py-2 md:px-12" : "p-4 md:px-12", cls)}">
        <ol class="no-scrollbar mx-auto flex max-w-[900px] items-start gap-2 overflow-x-auto text-16 whitespace-nowrap">
          ${items.map((item, i) => {
            const slash = i > 0 && html`<span aria-hidden="true">/ </span>`;
            return html`<li class="shrink-0">
              ${i === items.length - 1
                ? html`<span aria-current="page" class="text-ink">${slash}${item.label}</span>`
                : html`<a href="${url.page(item.href)}" class="text-ink-var transition-colors hover:text-ink">${slash}${item.label}</a>`}
            </li>`;
          })}
        </ol>
      </nav>
    `;
  }

  /** Structured data for search engines */
  function jsonLd(data) {
    return Maso.raw(`<script type="application/ld+json">${JSON.stringify(data).replace(/</g, "\\u003c")}</script>`);
  }

  /* ------------------------------------------------------------------ */
  /* Cart counter (Figma "Button" set, edit 26)                           */
  /* ------------------------------------------------------------------ */

  /*
   * One pill that reads `label` ("افزودن به سبد") until the line is in the
   * cart, then a stepper: [bin / −] [count] [+]. The element stays in the
   * page while the count changes so CSS can animate between states (main.css
   * "Cart counter"):
   *   add → stepper   label slides up, the three parts rise from below,
   *                   navy → light grey (300ms ease-out, like the prototype)
   *   +1 / −1         the number rolls (new one from above / below)
   *   1 ↔ 2           the bin and the minus swap places vertically
   *   bin at 1        everything runs backwards (product page) or the row goes (cart)
   *
   *   ui.counter({ label, cls, key, add: 'data-action="add"', step: 'data-action="qty" data-id="…"' })
   *   ui.syncCounter(el, qty, animate)
   * `add` / `step` are extra attributes for the label button and the two stepper buttons.
   */
  const PLUS_CIRCLE = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><path d="M8 12h8M12 8v8"/></svg>`;
  const MINUS_CIRCLE = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><path d="M8 12h8"/></svg>`;

  function counter({ label = "", cls = "", key = "", add = "", step = "" } = {}) {
    return html`
      <div data-counter="${key}" data-state="add" class="${cx("counter relative h-12 overflow-hidden rounded-full", cls)}">
        <button type="button" ${Maso.raw(add)} class="counter-add absolute inset-0 flex items-center justify-center px-6 text-16 whitespace-nowrap text-on-primary">
          ${label}
        </button>
        <div dir="ltr" role="group" aria-label="تعداد در سبد خرید" class="counter-stepper absolute inset-0 flex items-center justify-between px-1" inert>
          <button type="button" ${Maso.raw(step)} data-delta="-1" class="counter-dec relative flex size-12 items-center justify-center overflow-hidden rounded-full text-[#999] transition-colors hover:bg-black/5">
            <span class="counter-bin absolute">${icon("trash")}</span>
            <span class="counter-minus absolute">${Maso.raw(MINUS_CIRCLE)}</span>
          </button>
          <span class="counter-num relative h-[31px] min-w-6 text-center text-20 font-bold text-ink" aria-live="polite"><span data-num class="absolute inset-0"></span></span>
          <button type="button" ${Maso.raw(step)} data-delta="1" aria-label="افزودن یکی" class="counter-inc flex size-12 items-center justify-center rounded-full text-[#212121] transition-colors hover:bg-black/5">
            ${Maso.raw(PLUS_CIRCLE)}
          </button>
        </div>
      </div>
    `;
  }

  /** Moves a counter to `qty`; animated unless it was just drawn */
  function syncCounter(el, qty, animate = true) {
    const $ = (sel) => el.querySelector(sel);
    const before = Number(el.dataset.qty || 0);
    el.dataset.qty = String(qty);
    if (!animate) el.classList.add("counter-instant");
    el.dataset.state = qty > 0 ? "qty" : "add";
    el.toggleAttribute("data-many", qty > 1);
    $(".counter-add").toggleAttribute("inert", qty > 0);
    $(".counter-stepper").toggleAttribute("inert", qty === 0);
    $(".counter-dec").setAttribute("aria-label", qty > 1 ? "کم کردن یکی" : "حذف از سبد");

    const box = $(".counter-num");
    const shown = fmt.digits(Math.max(qty, 1));
    const old = box.querySelector("[data-num]");
    if (animate && before > 0 && qty > 0 && qty !== before && !matchMedia("(prefers-reduced-motion: reduce)").matches) {
      // Count went up: the new number drops in from above and the old one leaves downwards
      const up = qty > before;
      const next = document.createElement("span");
      next.dataset.num = "";
      next.className = "absolute inset-0";
      next.textContent = shown;
      box.append(next);
      const opts = { duration: 300, easing: "ease-out" };
      next.animate([{ transform: `translateY(${up ? -36 : 40}px)` }, { transform: "translateY(0)" }], opts);
      old.animate([{ transform: "translateY(0)" }, { transform: `translateY(${up ? 40 : -36}px)` }], opts).finished.then(
        () => old.remove(),
        () => old.remove(),
      );
    } else {
      [...box.querySelectorAll("[data-num]")].slice(1).forEach((n) => n.remove());
      old.textContent = shown;
    }
    if (!animate) requestAnimationFrame(() => requestAnimationFrame(() => el.classList.remove("counter-instant")));
  }

  Maso.ui = { img, price, swatches, swatchDot, productCard, productCardSkeleton, postCard, postCardSkeleton, block, breadcrumbs, jsonLd, counter, syncCounter };
})();
