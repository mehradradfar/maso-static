/**
 * product.html?slug=… — product page (Figma page "PDP").
 *
 *  phones/tablets: one column — title, gallery, option cards, sections,
 *                  and a floating bar with the price and the cart button
 *  desktop:        content on the right, 409px sticky buy sidebar on the left
 *
 * State is the configuration being built (size, wood, fabric). Everything
 * derived from it — exact price, cart line, quantity — is redrawn into the
 * `[data-slot]` elements whenever it (or the cart) changes.
 */
(function () {
  "use strict";

  const Maso = window.Maso;
  const { html, icon, fmt, url, cx, dom, api, pricing, ui } = Maso;

  const SECTION_X = "px-6 md:px-12";

  /* ================================================================== */
  /* Static sections                                                     */
  /* ================================================================== */

  /** Product name (gradient) + "تحویل تا ۴۵ روز کاری" */
  const titleBlock = (product, tag) => html`
    <div class="flex flex-col items-start">
      ${Maso.raw(`<${tag} class="bg-linear-to-b from-black to-black/30 bg-clip-text text-25 font-bold text-transparent">`)}${product.name}${Maso.raw(`</${tag}>`)}
      <p class="text-16 text-on-surface">تحویل تا <strong class="font-extrabold">${fmt.digits(product.deliveryDays)}</strong> روز کاری</p>
    </div>
  `;

  /** "۲,۴۸۰,۰۰۰,۰۰۰ - ۱,۴۸۰,۰۰۰,۰۰۰" + toman (always left-to-right, as drawn) */
  const priceRangeText = (min, max, cls) => html`
    <p class="${cx("flex items-center gap-2.5 text-ink", cls)}">
      <span dir="ltr">${min === max ? fmt.price(min) : `${fmt.price(max)} - ${fmt.price(min)}`}</span>
      ${icon("toman")}
    </p>
  `;

  const exactPrice = (value, cls) => html`
    <p class="${cx("flex items-center gap-2.5 font-bold text-ink", cls)}"><span>${fmt.price(value)}</span>${icon("toman")}</p>
  `;

  /**
   * 340×340 rounded photos in a horizontal snap-scroller that starts on the
   * right (RTL), with the pill-and-dots indicator underneath.
   */
  const gallery = (images, name) => html`
    <div class="flex w-full flex-col gap-8">
      <ul
        data-gallery
        aria-label="${`تصاویر ${name}`}"
        class="no-scrollbar -mx-6 flex snap-x snap-mandatory scroll-px-6 gap-6 overflow-x-auto overscroll-x-contain px-6 md:-mx-12 md:scroll-px-12 md:px-12 lg:ms-0 lg:-me-12 lg:scroll-ps-0 lg:ps-0 lg:pe-12"
      >
        ${images.map(
          (img, i) => html`<li class="relative size-[340px] shrink-0 snap-start overflow-hidden rounded-[32px] bg-surface-low">
            ${ui.img(img, {
              eager: i === 0,
              cls: "absolute inset-0 size-full object-cover transition-transform duration-700 ease-out-expo hover:scale-[1.03]",
            })}
          </li>`,
        )}
      </ul>
      ${images.length > 1 &&
      html`<!-- Physical left-to-right like the design: dots first, active pill last (image 0 is the right-most slide) -->
        <div dir="ltr" data-dots class="flex items-center justify-center gap-1" role="tablist" aria-label="انتخاب تصویر">
          ${images.map((_, i) => {
            const index = images.length - 1 - i;
            return html`<button type="button" role="tab" data-index="${index}" aria-label="${`تصویر ${fmt.digits(index + 1)}`}"></button>`;
          })}
        </div>`}
    </div>
  `;

  const features = (list) => html`
    <section aria-label="ویژگی‌ها" class="flex justify-center pt-6 pb-20 ${SECTION_X}">
      <ul class="flex w-full max-w-[900px] gap-3 lg:gap-8">
        ${list.map(
          (f, i) => html`<li data-reveal style="--reveal-index:${i}" class="flex flex-1 flex-col items-start gap-4 overflow-hidden rounded-2xl border border-hairline p-3">
            <p class="text-16 text-ink">${f.text}</p>
            ${ui.img(f.icon, { alt: "", width: 24, height: 24 })}
          </li>`,
        )}
      </ul>
    </section>
  `;

  const specRow = (spec) => html`
    <li class="flex items-center gap-2 overflow-hidden rounded-2xl border border-hairline bg-surface-low">
      <span class="flex h-12 min-w-0 flex-1 items-center justify-center px-[27px] py-1 text-16 whitespace-nowrap text-ink-var">${spec.label}</span>
      <span class="flex min-w-0 flex-1 items-center justify-center self-stretch rounded-2xl bg-hairline px-4 py-3 text-16 whitespace-nowrap text-ink">
        ${spec.value === true ? icon("checkCircle") : spec.value === false ? icon("crossCircle") : html`<span dir="ltr">${spec.value}</span>`}
      </span>
    </li>
  `;

  /** "در یک نگاه. مشخصات تخصصی محصول" table with "بیشتر" / "کمتر" */
  const specs = (list, visible) => html`
    <section class="flex flex-col items-center gap-6 pt-6 pb-20 ${SECTION_X}">
      <h2 class="w-full max-w-[900px] text-25 font-semibold text-ink">در یک نگاه. <span class="text-ink-muted">مشخصات تخصصی محصول</span></h2>
      <ul class="flex w-full max-w-[900px] flex-col gap-2">${list.slice(0, visible).map(specRow)}</ul>
      ${list.length > visible &&
      html`<ul data-more-specs hidden class="-mt-4 flex w-full max-w-[900px] flex-col gap-2">${list.slice(visible).map(specRow)}</ul>
        <button
          type="button"
          data-action="more-specs"
          aria-expanded="false"
          class="flex h-12 w-full max-w-[900px] items-center justify-center gap-1 rounded-2xl px-3 text-16 text-ink-strong"
        >
          <span>بیشتر</span>${icon("chevronDown", { size: 18, cls: "transition-transform" })}
        </button>`}
    </section>
  `;

  /** "فضای مورد نیاز" — numbers on one side, top-view diagram with dimensions on the other */
  const space = (s) => html`
    <section class="flex justify-center bg-surface-low pt-6 pb-6 md:pb-20 ${SECTION_X}">
      <div class="flex w-full max-w-[900px] flex-col gap-6 md:gap-8 lg:flex-row lg:items-center lg:justify-between lg:gap-0">
        <!-- Diagram — below the numbers on phones, on the right on desktop. Drawn LTR so the dimension lines sit where the design puts them. -->
        <div class="order-last flex flex-1 justify-center md:py-6 lg:order-first">
          <figure dir="ltr" class="flex flex-col items-center gap-3 md:gap-4">
            <div class="hidden h-[51px] md:block" aria-hidden="true"></div>
            <div class="flex h-[189px] items-center gap-3 md:gap-4">
              <div class="w-[51px]" aria-hidden="true"></div>
              ${ui.img(s.diagram, { width: 152, height: 189 })}
              <div class="flex h-full w-[51px] items-center justify-center border-l border-on-surface text-13 text-on-surface">${s.depth}</div>
            </div>
            <figcaption class="flex h-[51px] w-[189px] items-center justify-center border-t border-on-surface text-13 text-on-surface">${s.width}</figcaption>
          </figure>
        </div>
        <div class="flex flex-1 flex-col gap-3">
          <h2 class="text-25 font-semibold text-ink">فضای مورد نیاز</h2>
          <dl class="flex flex-col gap-2 md:gap-3">
            ${s.rows.map(
              (row) => html`<div class="flex items-center justify-between whitespace-nowrap">
                <dt class="text-13 text-on-surface-var">${row.label}</dt>
                <dd class="text-16 text-on-surface" dir="ltr">${row.value}</dd>
              </div>`,
            )}
          </dl>
        </div>
      </div>
    </section>
  `;

  const gradientTitle = (text) => html`
    <h2 class="w-full max-w-[900px] bg-linear-to-b from-black to-black/30 bg-clip-text text-25 font-bold text-transparent">${text}</h2>
  `;

  /**
   * Rich text from the WordPress editor. WordPress sanitises it; links to
   * other products/pages are rewritten to this site's URLs.
   */
  function description(htmlText) {
    const box = document.createElement("div");
    box.innerHTML = htmlText;
    box.querySelectorAll("a[href^='/']").forEach((a) => a.setAttribute("href", url.page(a.getAttribute("href"))));
    return html`
      <section class="flex flex-col items-center gap-8 pt-6 pb-16 ${SECTION_X}">
        ${gradientTitle("در باره محصول")}
        <div class="prose-maso w-full max-w-[900px]">${Maso.raw(box.innerHTML)}</div>
      </section>
    `;
  }

  /** FAQ accordion on native <details> — no JavaScript; animates where supported */
  const faq = (faqs) =>
    faqs.length &&
    html`
      <section class="flex flex-col items-center gap-8 pt-6 pb-16 ${SECTION_X}">
        ${gradientTitle("سوالات متداول")}
        <div class="flex w-full max-w-[900px] flex-col gap-3">
          ${faqs.map(
            (f) => html`<details name="product-faq" class="group details-animate">
              <summary class="flex h-12 cursor-pointer list-none items-center justify-between text-16 text-[#1c1c1c] [&::-webkit-details-marker]:hidden">
                ${f.question} ${icon("chevronLeft", { cls: "transition-transform duration-300 ease-out-expo group-open:-rotate-90" })}
              </summary>
              <p class="pb-3 text-16 text-ink-var">${f.answer}</p>
            </details>`,
          )}
        </div>
        ${ui.jsonLd({
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: faqs.map((f) => ({ "@type": "Question", name: f.question, acceptedAnswer: { "@type": "Answer", text: f.answer } })),
        })}
      </section>
    `;

  /* ================================================================== */
  /* Page                                                                */
  /* ================================================================== */

  dom.ready(async () => {
    const root = dom.$("#product");
    const slug = url.param("slug") || "";
    const product = slug ? await api.product(slug).catch(() => null) : null;
    if (!product) {
      location.replace("404.html");
      return;
    }

    const [min, max] = pricing.priceRange(product);
    const groups = product.optionGroups;
    /** groupKey → chosen option id */
    const selection = {};

    document.title = `${product.name} | ماسو`;

    /** The product test: a 30×30 sample of the chosen wood & fabric */
    const test = product.test;
    const swatchGroups = groups.filter((g) => g.kind === "swatch");
    /**
     * "product" — the bar sells the configured piece.
     * "test"    — after the visitor opened "سفارش تست محصول" the bar sells the
     *             sample, until they go back to the product's own option cards.
     */
    let mode = "product";
    let orderSheet, aboutSheet;

    /* --- Derived state --- */
    const currentPrice = () => pricing.priceFor(product, selection);
    const lineId = () => Maso.cart.lineId(product.slug, "product", groups.map((g) => selection[g.key] ?? ""));
    const testOptionIds = () => swatchGroups.map((g) => selection[g.key] ?? "");
    const testLineId = () => Maso.cart.lineId(product.slug, "test", testOptionIds());
    const testReady = () => swatchGroups.every((g) => selection[g.key]);
    const inCart = (id) => Maso.cart.lines().some((l) => l.id === id);

    /* ---------------------------------------------------------------- */
    /* Layout                                                            */
    /* ---------------------------------------------------------------- */

    dom.render(
      root,
      html`
        ${ui.breadcrumbs([...product.breadcrumbs, { label: product.name, href: `/product/${product.slug}` }], {
          size: "roomy",
          cls: "lg:border-b lg:border-black-10",
        })}

        <!-- Phones/tablets: one column. Desktop: content on the right, 409px sticky sidebar on the left -->
        <div class="mx-auto max-w-[1266px] pb-[104px] lg:flex lg:items-start lg:pb-0">
          <div class="min-w-0 flex-1">
            <section class="flex flex-col items-start gap-8 px-6 py-8 md:px-12 lg:items-center">
              <div class="flex flex-col items-start gap-3 lg:hidden">${titleBlock(product, "h1")} ${priceRangeText(min, max, "text-16")}</div>
              <div class="w-full lg:max-w-[900px]">${gallery(product.images, product.name)}</div>
            </section>

            <section aria-label="جزئیات محصول" class="flex flex-col gap-4 px-6 pt-6 pb-16 md:px-12 lg:hidden">
              <div data-slot="hint"></div>
              <p class="text-16 text-ink">جزئیات محصول</p>
              <div data-slot="cards"></div>
              ${product.test &&
              html`<div class="flex flex-col items-start gap-3 py-3">
                <p class="w-full text-13 text-on-surface-var">اگر از ترکیب مورد نظر اطمینان ندارید تست محسول را سفارش دهید</p>
                ${testLink("about", "تست محصول چیست؟", "help")}
              </div>`}
            </section>

            ${features(product.features)} ${specs(product.specs, product.specsVisible)} ${product.space && space(product.space)}
            ${description(product.descriptionHtml)} ${faq(product.faqs)}
          </div>

          <aside
            aria-label="خرید"
            class="sticky top-[97px] hidden h-[calc(100dvh-154px)] min-h-[600px] w-[409px] shrink-0 flex-col gap-4 overflow-y-auto border-s border-outline-var bg-surface p-8 lg:flex"
          >
            <div class="flex flex-1 flex-col gap-4">
              ${titleBlock(product, "p")}
              <div class="flex flex-col gap-6">
                <p class="text-16 text-ink">جزئیات محصول</p>
                <div data-slot="cards"></div>
              </div>
              <hr class="border-0 border-t border-black-10" />
              <div data-slot="sidebar-price"></div>
            </div>
            <hr class="border-0 border-t border-black-10" />
            ${product.test &&
            html`<div class="flex flex-col items-center gap-6">
              <p class="w-full text-13 text-on-surface-var">اگر از ترکیب مورد نظر اطمینان ندارید تست محسول را سفارش دهید</p>
              ${testLink("order", "سفارش تست محصول", "chevron")}
            </div>`}
          </aside>
        </div>

        <!-- Phone/tablet bottom bar: price + cart (or the test sample), and the test-order link -->
        <div
          class="pointer-events-none fixed inset-x-0 bottom-0 z-40 bg-linear-to-b from-white/0 to-white [mask-image:linear-gradient(to_bottom,transparent,black_96px)] p-4 pt-24 backdrop-blur-[2px] lg:hidden"
        >
          <div
            data-slot="mobile-buy"
            class="pointer-events-auto mx-auto flex max-w-[672px] flex-col items-center gap-2 rounded-[32px] border border-black-10 bg-white/50 px-4 py-3 backdrop-blur-md"
          ></div>
        </div>

        ${ui.jsonLd({
          "@context": "https://schema.org",
          "@type": "Product",
          name: product.name,
          image: product.images.map((i) => new URL(url.media(i.src), location.href).href),
          brand: { "@type": "Brand", name: "ماسو" },
          // Toman → Rial
          offers: { "@type": "AggregateOffer", priceCurrency: "IRR", lowPrice: min * 10, highPrice: max * 10 },
        })}
      `,
    );

    function testLink(sheet, label, kind) {
      return html`<button type="button" data-action="test" data-sheet="${sheet}" aria-haspopup="dialog" class="group flex h-8 items-center gap-1 rounded-2xl text-16 whitespace-nowrap text-secondary">
        ${kind === "help" && icon("helpCircle")} ${label}
        ${kind === "chevron" && icon("chevronLeft", { size: 18, cls: "transition-transform duration-300 group-hover:-translate-x-1" })}
      </button>`;
    }

    /* ---------------------------------------------------------------- */
    /* State-dependent parts                                             */
    /* ---------------------------------------------------------------- */

    /** The three "جزئیات محصول" cards (size, wood, fabric) */
    const optionCards = () => html`
      <div class="flex flex-col gap-2">
        ${groups.map((group) => {
          const chosen = group.options.find((o) => o.id === selection[group.key]);
          return html`<button
            type="button"
            data-action="picker"
            data-group="${group.key}"
            aria-haspopup="dialog"
            class="flex h-20 w-full items-center justify-between gap-2 overflow-hidden rounded-[24px] border border-hairline bg-surface-low p-4 text-start transition-colors duration-300 hover:border-outline-var"
          >
            <span class="flex min-w-0 flex-1 flex-col items-start gap-2">
              <span class="text-13 text-outline">${chosen ? (group.selectedLabel ?? group.label) : group.label}</span>
              ${chosen
                ? html`<span class="flex items-center gap-3 text-16 whitespace-nowrap text-on-surface">
                    ${chosen.swatch && ui.swatchDot(chosen, 24)}
                    <span class="whitespace-pre">${chosen.detail ? `${chosen.name}  - ${chosen.detail}` : chosen.name}</span>
                  </span>`
                : group.kind === "swatch"
                  ? ui.swatches(group.options.map((o) => ({ name: o.name, image: o.swatch })))
                  : html`<span class="text-16 text-on-surface">${group.options.map((o) => o.name).join("، ")}</span>`}
            </span>
            ${!chosen && html`<span class="shrink-0 text-10 text-warning-text">انتخاب نشده</span>`}
            ${icon("chevronLeft", { cls: "shrink-0 text-ink" })}
          </button>`;
        })}
      </div>
    `;

    const FILLED =
      "flex h-12 shrink-0 items-center justify-center gap-2 rounded-full bg-primary px-6 text-16 whitespace-nowrap text-on-primary transition-[background-color,transform] duration-300 hover:bg-primary/90 active:scale-[0.98]";

    /** Once something is in the cart — piece or sample — the call to action leads there */
    const viewCart = (fullWidth) => html`<a href="cart.html" class="${cx(FILLED, fullWidth && "w-full")}">مشاهده سبد</a>`;

    /** Add-to-cart, or "مشاهده سبد" once this exact configuration is in the cart */
    function cartButton(fullWidth) {
      if (inCart(lineId())) return viewCart(fullWidth);
      // Before everything is chosen the button walks the visitor through the missing pickers
      return html`<button type="button" data-action="add" class="${cx(FILLED, fullWidth && "w-full")}">افزودن به سبد</button>`;
    }

    const barDivider = html`<hr class="w-full border-0 border-t border-black-10" />`;

    /**
     * The floating bar on phones/tablets (Figma comment "different states of the fixed option"):
     *   nothing chosen yet  → "انتخاب جزئیات محصول" (outline) + test link
     *   configured          → price + "افزودن به سبد" + test link
     *   test mode           → sample price + "خرید تست محصول"
     *   in the cart         → price + "مشاهده سبد"
     */
    function mobileBar(price) {
      const row = (amount, button) => html`<div class="flex w-full items-center justify-between gap-6">${exactPrice(amount, "text-16")} ${button}</div>`;
      if (mode === "test" && test) {
        return row(
          test.price,
          inCart(testLineId())
            ? viewCart(false)
            : html`<button type="button" data-action="buy-test" class="${FILLED}">خرید تست محصول</button>`,
        );
      }
      const testFooter = test && html`${barDivider} ${testLink("order", "سفارش تست محصول", "chevron")}`;
      if (price === null) {
        return html`<button
            type="button"
            data-action="add"
            class="flex h-12 w-full items-center justify-center rounded-full border border-primary px-6 text-16 whitespace-nowrap text-primary transition-[background-color,transform] duration-300 hover:bg-primary/5 active:scale-[0.98]"
          >
            انتخاب جزئیات محصول
          </button>
          ${testFooter}`;
      }
      if (inCart(lineId())) return row(price, viewCart(false));
      return html`${row(price, cartButton(false))} ${testFooter}`;
    }

    function paint() {
      const price = currentPrice();
      dom.$$('[data-slot="cards"]', root).forEach((el) => dom.render(el, optionCards()));
      dom.render(
        dom.$('[data-slot="hint"]', root),
        price === null ? html`<p class="text-16 text-warning-text">برای مشاهده قیمت دقیق جزئیات محصول را انتخاب کنید.</p>` : "",
      );
      dom.$('[data-slot="hint"]', root).hidden = price !== null;

      dom.render(
        dom.$('[data-slot="sidebar-price"]', root),
        price === null
          ? html`<div class="flex flex-col items-center gap-6">
              <p class="w-full text-16 text-on-surface">برای <strong class="font-extrabold">مشاهده قیمت دقیق</strong> ابتدا جزئیات محصول را انتخاب کنید.</p>
              ${priceRangeText(min, max, "text-20")}
            </div>`
          : html`<div class="flex flex-col items-center gap-6">${exactPrice(price, "text-20")} ${cartButton(true)}</div>`,
      );

      dom.render(dom.$('[data-slot="mobile-buy"]', root), mobileBar(price));
      if (orderSheet?.dialog.open) paintTest();
    }

    paint();
    Maso.cart.subscribe(paint);

    /* ---------------------------------------------------------------- */
    /* Gallery dots follow the scroll position                           */
    /* ---------------------------------------------------------------- */

    const track = dom.$("[data-gallery]", root);
    const dots = dom.$$("[data-dots] button", root);
    function paintDots(active) {
      dots.forEach((dot) => {
        const on = Number(dot.dataset.index) === active;
        dot.setAttribute("aria-selected", String(on));
        dot.className = cx(
          "h-3 rounded-full transition-[width,background-color] duration-500 ease-out-expo",
          on ? "w-[37px] bg-ink-strong" : "w-3 bg-dim hover:bg-ink-muted",
        );
      });
    }
    paintDots(0);
    let frame = 0;
    // In RTL scrollLeft runs from 0 towards negative values, hence Math.abs
    track.addEventListener(
      "scroll",
      () => {
        if (frame) return;
        frame = requestAnimationFrame(() => {
          frame = 0;
          const step = track.firstElementChild?.offsetWidth ?? 340;
          paintDots(Math.min(product.images.length - 1, Math.round(Math.abs(track.scrollLeft) / (step + 24))));
        });
      },
      { passive: true },
    );
    dots.forEach((dot) =>
      dot.addEventListener("click", () =>
        track.children[Number(dot.dataset.index)]?.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "start" }),
      ),
    );

    /* ---------------------------------------------------------------- */
    /* Option picker                                                     */
    /* ---------------------------------------------------------------- */

    const SMALL_PRICE = (text, cls = "") => html`
      <span class="${cx("flex items-center gap-2.5 text-13 text-on-surface-var", cls)}"><span dir="ltr">${text}</span>${icon("toman", { size: 14.6 })}</span>
    `;
    const RADIO =
      "size-6 shrink-0 cursor-pointer appearance-none rounded-full border border-ink-muted bg-clip-content p-1 transition-colors checked:bg-primary";

    /**
     * One sheet per option group; the choice is a draft until "انتخاب".
     * `back(chosen)` runs once the sheet closes, chosen or dismissed — the
     * test order sheet uses it to come back after each colour, and
     * "انتخاب جزئیات محصول" to walk on to the next missing option.
     */
    const pickers = {};
    let pickerBack = null;
    let pickerChosen = false;
    function openPicker(key, back = null) {
      // Without a key: the first group that has no choice yet
      key ??= groups.find((g) => !selection[g.key])?.key;
      const group = groups.find((g) => g.key === key);
      if (!group) return;
      pickerBack = back;
      pickerChosen = false;

      let sheet = pickers[key];
      if (!sheet) {
        sheet = pickers[key] = Maso.sheet({
          title: group.pickerTitle,
          variant: "sheet",
          cardRadius: 32,
          onClose() {
            const next = pickerBack;
            pickerBack = null;
            next?.(pickerChosen);
          },
        });
        sheet.setFooter(html`<div class="px-6 py-4">
          <button type="button" data-choose class="flex h-12 w-full items-center justify-center rounded-full bg-primary px-6 text-16 text-on-primary transition-colors hover:bg-primary/90">
            انتخاب
          </button>
        </div>`);
        dom.$("[data-choose]", sheet.footer).addEventListener("click", () => {
          const picked = dom.$("input:checked", sheet.body);
          if (picked) selection[key] = picked.value;
          pickerChosen = Boolean(picked);
          paint();
          sheet.close();
        });
        // Checked option reads darker
        sheet.body.addEventListener("change", () =>
          dom.$$("label", sheet.body).forEach((label) => {
            const on = dom.$("input", label).checked;
            dom.$("[data-name]", label).className = cx("text-16", on ? "text-on-surface" : "text-ink-var");
          }),
        );
      }

      const draft = selection[key] ?? group.options[0]?.id;
      dom.render(
        sheet.body,
        html`<fieldset class="p-6">
          <legend class="sr-only">${group.pickerTitle}</legend>
          ${group.options.map((o) => {
            const checked = draft === o.id;
            return html`<label
              class="${cx(
                "flex cursor-pointer border-b border-hairline last:border-b-0",
                group.kind === "size" ? "h-20 items-center justify-between py-2" : "flex-col items-start gap-3 py-4",
              )}"
            >
              <span class="flex items-center gap-3">
                <input type="radio" name="picker-${group.key}" value="${o.id}" ${checked ? html`checked` : ""} class="${RADIO}" />
                ${group.kind === "swatch" && o.swatch && ui.swatchDot(o, 40)}
                <span data-name class="${cx("text-16", checked ? "text-on-surface" : "text-ink-var")}">${o.name}</span>
              </span>
              ${group.kind === "size"
                ? html`<span class="flex flex-col items-end gap-1">
                    <span class="text-16 text-on-surface">${o.detail}</span>
                    ${o.price !== undefined && SMALL_PRICE(fmt.price(o.price))}
                  </span>`
                : SMALL_PRICE(`+ ${fmt.price(o.priceDelta ?? 0)}`, "self-end")}
            </label>`;
          })}
        </fieldset>`,
      );
      sheet.open();
    }

    /* ---------------------------------------------------------------- */
    /* Product test (a 30×30 sample of the chosen wood & fabric)         */
    /* ---------------------------------------------------------------- */

    function addTest() {
      const optionIds = testOptionIds();
      Maso.cart.add({
        id: testLineId(),
        kind: "test",
        slug: product.slug,
        name: `تست ${product.name}`,
        image: test.example.image,
        price: test.price,
        optionIds,
        options: swatchGroups.map((g) => {
          const o = pricing.findOption(product, g.key, selection[g.key]);
          return { label: g.label, value: o.name, swatch: o.swatch };
        }),
      });
    }

    /** "سفارش تست محصول": pick the wood and the fabric (each picker comes back here), then add the sample */
    function paintTest() {
      dom.render(
        orderSheet.body,
        html`<div class="flex flex-col gap-4 p-6">
          ${swatchGroups.map((g) => {
            const chosen = pricing.findOption(product, g.key, selection[g.key]);
            return html`<button
              type="button"
              data-action="test-picker"
              data-group="${g.key}"
              aria-haspopup="dialog"
              class="flex h-20 w-full items-center justify-between overflow-hidden rounded-[24px] border border-hairline bg-surface-low p-4 transition-colors duration-300 hover:border-outline-var"
            >
              <span class="flex flex-1 flex-col items-start gap-2">
                <span class="text-13 text-outline">${g.label}</span>
                ${chosen
                  ? html`<span class="flex items-center gap-3 text-16 text-on-surface">${ui.swatchDot(chosen, 24)} ${chosen.name}</span>`
                  : html`<span class="text-16 text-warning-text">انتخاب نشده</span>`}
              </span>
              ${icon("chevronLeft", { cls: "shrink-0" })}
            </button>`;
          })}
          <hr class="border-0 border-t border-black-10" />
          <p class="text-13 text-error">${test.notice}</p>
          <div class="flex items-center justify-between">
            <span class="text-16 text-on-surface-var">مبلغ تست</span>
            ${exactPrice(test.price, "text-20")}
          </div>
        </div>`,
      );
      orderSheet.setFooter(html`<div class="px-6 py-4">
        ${inCart(testLineId())
          ? viewCart(true)
          : html`<button
              type="button"
              data-add-test
              ${testReady() ? "" : html`disabled`}
              class="flex h-12 w-full items-center justify-center rounded-full bg-primary px-6 text-16 text-on-primary transition-opacity disabled:opacity-40"
            >
              افزودن تست به سبد خرید
            </button>`}
      </div>`);
    }

    function openTest(which) {
      if (which === "about") {
        aboutSheet ??= Maso.sheet({ title: "تست محصول چیست؟", variant: "sheet", cardRadius: 32 });
        dom.render(
          aboutSheet.body,
          html`<div class="flex flex-col items-center gap-4 p-6">
            <p class="w-full text-13 text-error">${test.notice}</p>
            ${test.intro.map((p) => html`<p class="w-full text-16 text-ink-var">${p}</p>`)}
            <div class="flex w-full flex-col gap-4 rounded-[32px] bg-surface-low p-4">
              ${[
                { label: "رنگ چوب", option: test.example.wood },
                { label: "رنگ پارچه", option: test.example.fabric },
              ].map(
                ({ label, option }) => html`<div class="flex flex-col items-start gap-2">
                  <span class="text-13 text-outline">${label}</span>
                  <span class="flex items-center gap-3 text-16 text-on-surface">${ui.swatchDot(option, 24)} ${option.name}</span>
                </div>`,
              )}
              ${ui.img(test.example.image, { cls: "aspect-[614/613] w-full rounded-[24px] object-cover" })}
            </div>
          </div>`,
        );
        aboutSheet.open();
        return;
      }

      if (!orderSheet) {
        orderSheet = Maso.sheet({ title: "سفارش تست محصول", variant: "sheet", cardRadius: 32 });
        dom.actions(orderSheet.body, {
          "test-picker"(el) {
            orderSheet.close();
            openPicker(el.dataset.group, () => openTest("order"));
          },
        });
        orderSheet.footer.addEventListener("click", (e) => {
          if (e.target.closest("[data-add-test]") && testReady()) addTest();
        });
      }

      // From here on the floating bar offers the sample
      mode = "test";
      paint();
      paintTest();
      orderSheet.open();
    }

    /* ---------------------------------------------------------------- */
    /* Clicks                                                            */
    /* ---------------------------------------------------------------- */

    dom.actions(root, {
      picker(el) {
        // Back on the product's own options: the bar sells the piece again
        if (mode !== "product") {
          mode = "product";
          paint();
        }
        openPicker(el.dataset.group);
      },
      test: (el) => openTest(el.dataset.sheet),
      add() {
        const price = currentPrice();
        // Walk through every option still missing, one sheet after the other
        const walk = (chosen) => chosen && currentPrice() === null && openPicker(undefined, walk);
        if (price === null) return openPicker(undefined, walk);
        Maso.cart.add({
          id: lineId(),
          kind: "product",
          slug: product.slug,
          name: product.name,
          image: product.images[0],
          price,
          optionIds: groups.map((g) => selection[g.key] ?? ""),
          options: groups.map((g) => {
            const o = pricing.findOption(product, g.key, selection[g.key]);
            return { label: g.label, value: o.detail ? `${o.name} - ${o.detail}` : o.name, swatch: o.swatch };
          }),
        });
      },
      "buy-test"() {
        if (testReady()) addTest();
        else openTest("order");
      },
      "more-specs"(button) {
        const list = dom.$("[data-more-specs]", root);
        const open = list.hidden;
        list.hidden = !open;
        button.setAttribute("aria-expanded", String(open));
        dom.$("span", button).textContent = open ? "کمتر" : "بیشتر";
        dom.$("svg", button).classList.toggle("rotate-180", open);
      },
    });
  });
})();
