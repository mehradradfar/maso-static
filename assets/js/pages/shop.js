/**
 * shop.html — product listing (Figma page "PLP").
 *
 *   breadcrumbs
 *   category rail (+ desktop filter/sort pills)      compact chip bar when scrolled (phones)
 *   product grid with the dark promo band after the first row(s)
 *   infinite scroll; filters & sort live in the URL (replaceState, no reload)
 *   phones/tablets: floating glass bar with "مرتب سازی" / "فیلتر"
 */
(function () {
  "use strict";

  const Maso = window.Maso;
  const { html, icon, url, cx, dom, api, shopQuery, ui } = Maso;

  const SORT_LABELS = {
    "price-desc": "قیمت: زیاد به کم",
    "price-asc": "قیمت: کم به زیاد",
    newest: "جدید‌ترین",
  };

  /* ------------------------------------------------------------------ */
  /* Markup                                                              */
  /* ------------------------------------------------------------------ */

  /**
   * Horizontally scrolling category cards (150×110, 32px radius, 126×50
   * picture + 13px label). Starts at the right edge (RTL). On desktop a white
   * fade on the left hints that there is more to scroll.
   */
  const categoryRail = (categories, active) => html`
    <div id="category-rail" class="relative min-w-0 flex-1 lg:max-w-[900px]">
      <ul class="no-scrollbar flex snap-x gap-2 overflow-x-auto overscroll-x-contain p-6">
        ${categories.map((c) => {
          const current = c.slug === active;
          return html`<li class="snap-start">
            <a
              href="${current ? url.shop() : url.shop(c.slug)}"
              ${current ? html`aria-current="page"` : ""}
              class="${cx(
                "flex h-[110px] w-[150px] flex-col items-center gap-4 rounded-[32px] p-3 transition-colors duration-300",
                current ? "bg-surface-low" : "hover:bg-surface-low",
              )}"
            >
              ${ui.img(c.image, { alt: "", width: 126, height: 50, eager: true, cls: "h-[50px] w-[126px] object-contain" })}
              <span class="text-13 whitespace-nowrap text-ink">${c.name}</span>
            </a>
          </li>`;
        })}
      </ul>
      <!-- Scroll hint (desktop) -->
      <div
        aria-hidden="true"
        class="pointer-events-none absolute bottom-px left-0 hidden h-[157px] w-[129px] bg-linear-to-l from-transparent to-surface [mask-image:linear-gradient(to_left,transparent,black)] backdrop-blur-[2px] lg:block"
      ></div>
    </div>
  `;

  /** Phone/tablet: compact chips that slide in under the header once the rail has scrolled away */
  const compactBar = (categories, active) => html`
    <nav
      id="compact-categories"
      aria-label="دسته‌بندی‌ها"
      aria-hidden="true"
      inert
      class="pointer-events-none fixed inset-x-0 top-20 z-40 -translate-y-4 bg-white/50 opacity-0 backdrop-blur-[30px] transition-[translate,opacity] duration-500 ease-out-expo data-visible:pointer-events-auto data-visible:translate-y-0 data-visible:opacity-100 lg:hidden"
    >
      <ul class="no-scrollbar flex gap-2 overflow-x-auto px-6 py-3">
        ${categories.map(
          (c) => html`<li class="shrink-0">
            <a
              href="${url.shop(c.slug)}"
              ${c.slug === active ? html`aria-current="page"` : ""}
              class="${cx(
                "flex h-8 items-center gap-2 rounded-[32px] px-3 py-2 text-13 whitespace-nowrap text-ink transition-colors",
                c.slug === active ? "bg-surf-container" : "bg-surface-low",
              )}"
            >
              ${c.name} ${c.icon && ui.img(c.icon, { alt: "", cls: "h-4 w-auto" })}
            </a>
          </li>`,
        )}
      </ul>
    </nav>
  `;

  const pill = (iconName, label, panel) => html`
    <button
      type="button"
      data-action="panel"
      data-panel="${panel}"
      aria-haspopup="dialog"
      class="flex items-center gap-2 rounded-full border border-outline-var px-4 py-2 text-16 text-ink transition-colors duration-300 hover:border-ink hover:bg-surface-low"
    >
      ${icon(iconName)} ${label}
    </button>
  `;

  const barButton = (iconName, label, panel) => html`
    <button
      type="button"
      data-action="panel"
      data-panel="${panel}"
      aria-haspopup="dialog"
      class="flex h-9 flex-1 items-center justify-center gap-2 text-16 text-ink active:opacity-60"
    >
      ${icon(iconName)} ${label}
    </button>
  `;

  /** Desktop pills (RTL order: sort, then filter on the far left) + phone/tablet floating bar */
  const controls = () => html`
    <div class="hidden shrink-0 items-start gap-2 lg:flex">
      ${pill("sort", "مرتب سازی", "sort")} ${pill("filter", "فیلتر", "filter")}
    </div>
    <div class="pointer-events-none fixed inset-x-0 bottom-0 z-40 flex h-[129px] items-end justify-center bg-linear-to-b from-white/0 to-white pb-5 lg:hidden">
      <div class="pointer-events-auto flex h-[68px] w-[295px] items-center gap-2.5 rounded-full border border-hairline bg-white/50 p-4 shadow-[0_0_12px_rgba(0,0,0,0.08)] backdrop-blur-md">
        ${barButton("sort", "مرتب سازی", "sort")}
        <span aria-hidden="true" class="h-9 w-px shrink-0 bg-black-10"></span>
        ${barButton("filter", "فیلتر", "filter")}
      </div>
    </div>
  `;

  /**
   * Dark promo band between product rows (Figma "Frame 1000004188").
   *  phone/tablet: 793px tall, copy on top, picture below bleeding off the edge
   *  desktop:      397px tall, copy on the right, picture on the left, 124px gap
   * 32px above/below instead of the 48px row gap → -16px margins.
   * Order slots: after 1 row on phones (2 cards), 2 rows on tablet and desktop.
   */
  const promoBand = (promo) => html`
    <section data-reveal class="order-3 col-span-full -my-4 md:order-7 lg:order-11">
      <div class="relative mx-auto flex h-[793px] max-w-[1100px] flex-col items-end overflow-hidden bg-promo px-8 py-12 md:items-center lg:h-[397px] lg:flex-row lg:items-start lg:justify-center lg:gap-[124px]">
        <div class="relative z-10 flex w-full flex-col items-start gap-6 md:w-[324px]">
          <div class="flex w-full flex-col gap-3 text-start">
            <h2 class="text-39 font-bold text-outline-var">${promo.title}</h2>
            <p class="text-13 text-outline">${promo.description}</p>
          </div>
          <a
            href="${url.page(promo.cta.href)}"
            class="group/button relative inline-flex h-12 w-[190px] shrink-0 items-center justify-center gap-2 rounded-full bg-on-primary px-3 text-16 whitespace-nowrap text-primary transition-[background-color,color,border-color,transform] duration-300 ease-out-expo hover:bg-surface-low active:scale-[0.98]"
          >
            <span>${promo.cta.label}</span>
            <span class="transition-transform duration-300 ease-out-expo group-hover/button:-translate-x-1">${icon("arrowLeft")}</span>
          </a>
        </div>
        ${ui.img(promo.image, {
          cls: "absolute top-[397px] left-[calc(50%-130px)] h-[339px] w-[452px] max-w-none md:left-[calc(50%-226px)] lg:static lg:shrink-0",
        })}
      </div>
    </section>
  `;

  /** Cards keep even `order` values so the promo band can slot in between rows */
  const cards = (items, { from = 0, orderBase = 0, eagerFirst = false } = {}) =>
    items.map(
      (product, i) => html`<div style="order:${orderBase ? orderBase + from + i : (from + i) * 2}">
        ${ui.productCard(product, { index: from + i, eager: eagerFirst && from + i < 3 })}
      </div>`,
    );

  const loadingCards = () =>
    [0, 1, 2].map(
      (i) => html`<div data-loading style="order:${5000 + i}" class="${i > 0 ? "hidden md:block" : ""}">${ui.productCardSkeleton()}</div>`,
    );

  /* ------------------------------------------------------------------ */
  /* Sort & filter panels                                                */
  /* ------------------------------------------------------------------ */

  /** Radio with a ring and an inner dot (4px padding leaves a 14px dot when checked) */
  const RADIO =
    "size-6 shrink-0 cursor-pointer appearance-none rounded-full border border-ink-muted bg-clip-content p-1 transition-colors checked:bg-primary";

  const sortPanel = (query) => html`
    <fieldset class="p-6">
      <legend class="sr-only">مرتب سازی بر اساس</legend>
      <div class="px-4">
        ${Object.keys(SORT_LABELS).map(
          (key) => html`<label class="flex h-14 cursor-pointer items-center gap-3 border-b border-hairline py-2 last:border-b-0">
            <input type="radio" name="sort" value="${key}" ${query.sort === key ? html`checked` : ""} class="${RADIO}" />
            <span class="${cx("text-16", query.sort === key ? "text-ink" : "text-ink-var")}">${SORT_LABELS[key]}</span>
          </label>`,
        )}
      </div>
    </fieldset>
  `;

  /** The last group starts open, like the design; groups with active filters too */
  const filterPanel = (facets, query, openKeys) => html`
    <div class="flex flex-col">
      <!-- In-stock switch -->
      <label class="flex cursor-pointer items-center justify-between border-b border-black-20 py-5">
        <span class="text-16 text-ink">فقط کالا‌های موجود</span>
        <input
          type="checkbox"
          role="switch"
          name="stock"
          ${query.inStock ? html`checked` : ""}
          class="relative h-8 w-12 shrink-0 cursor-pointer appearance-none rounded-full bg-[#b3b3b3] transition-colors duration-300 before:absolute before:start-1 before:top-1 before:size-6 before:rounded-full before:bg-white before:transition-[inset-inline-start] before:duration-300 before:ease-out-expo checked:bg-primary checked:before:start-5"
        />
      </label>
      ${facets.map((facet, i) => {
        const open = openKeys.has(facet.key);
        const selected = query.facets[facet.key] || [];
        return html`<section class="${cx("py-5", i < facets.length - 1 && "border-b border-black-20")}">
          <h3>
            <button
              type="button"
              data-action="toggle-facet"
              data-key="${facet.key}"
              aria-expanded="${open}"
              aria-controls="facet-${facet.key}"
              class="flex w-full items-center justify-between text-16 text-ink"
            >
              ${facet.label}
              <span class="flex size-12 items-center justify-center">
                ${icon("chevronDown", { cls: cx("transition-transform duration-300 ease-out-expo", open && "rotate-180") })}
              </span>
            </button>
          </h3>
          <!-- grid-rows trick animates height without measuring -->
          <div id="facet-${facet.key}" class="${cx("grid transition-[grid-template-rows] duration-500 ease-out-expo", open ? "grid-rows-[1fr]" : "grid-rows-[0fr]")}">
            <ul class="overflow-hidden px-4" ${open ? "" : html`inert`}>
              ${facet.options.map((opt) => {
                const checked = selected.includes(opt.value);
                return html`<li class="border-b border-hairline last:border-b-0">
                  <label class="flex h-12 cursor-pointer items-center gap-3 py-2">
                    <span class="relative flex size-6 shrink-0">
                      <input
                        type="checkbox"
                        name="facet"
                        data-key="${facet.key}"
                        value="${opt.value}"
                        ${checked ? html`checked` : ""}
                        class="peer size-6 cursor-pointer appearance-none rounded-lg border border-ink-muted transition-colors checked:border-primary checked:bg-primary"
                      />
                      ${icon("tick", { cls: "pointer-events-none absolute inset-0 text-white opacity-0 transition-opacity peer-checked:opacity-100" })}
                    </span>
                    <span class="${cx("text-16", checked ? "text-ink" : "text-ink-var")}">${opt.label}</span>
                  </label>
                </li>`;
              })}
            </ul>
          </div>
        </section>`;
      })}
    </div>
  `;

  /* ------------------------------------------------------------------ */
  /* Page                                                                */
  /* ------------------------------------------------------------------ */

  dom.ready(async () => {
    const root = dom.$("#shop");
    let query = shopQuery.parse(new URLSearchParams(location.search));

    let categories, facets, promo, result;
    try {
      [categories, facets, promo, result] = await Promise.all([
        api.categories(),
        api.facets(query.category),
        api.promo(query.category),
        api.products(query),
      ]);
    } catch {
      dom.render(root, html`<p class="px-6 py-24 text-center text-16 text-ink-var">بارگذاری محصولات انجام نشد. لطفا صفحه را دوباره باز کنید.</p>`);
      return;
    }

    const current = categories.find((c) => c.slug === query.category);
    if (query.category && !current) {
      location.replace("404.html");
      return;
    }
    if (current) document.title = `${current.name} | فروشگاه | ماسو`;

    const crumbs = [{ label: "فروشگاه", href: "/shop" }];
    if (current) crumbs.push({ label: current.name, href: `/shop/${current.slug}` });

    dom.render(
      root,
      html`
        ${ui.breadcrumbs(crumbs, { cls: "lg:border-b lg:border-black-10" })}
        <!-- Category rail + desktop filter/sort pills -->
        <div class="mx-auto flex max-w-[1100px] items-center justify-between">${categoryRail(categories, query.category)} ${controls()}</div>
        ${compactBar(categories, query.category)}
        <div id="listing" class="transition-opacity duration-300"></div>
        ${ui.jsonLd({
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: crumbs.map((c, i) => ({ "@type": "ListItem", position: i + 1, name: c.label, item: new URL(url.page(c.href), location.href).href })),
        })}
      `,
    );

    const listing = dom.$("#listing", root);
    let stopInfinite = () => {};

    /** Draws the grid for the current result and starts infinite scroll */
    function renderListing(eager = false) {
      stopInfinite();
      if (!result.items.length) {
        dom.render(listing, html`<p class="px-6 py-24 text-center text-16 text-ink-var">محصولی با این فیلترها پیدا نشد.</p>`);
        return;
      }
      const showPromo = promo && query.page === 1 && result.items.length > 2;
      dom.render(
        listing,
        html`<div id="grid" class="mx-auto grid max-w-[1148px] grid-cols-1 gap-x-4 gap-y-12 py-8 md:grid-cols-2 lg:grid-cols-3 lg:px-6">
          ${cards(result.items, { eagerFirst: eager })} ${showPromo && promoBand(promo)}
          <div id="more" style="order:9999" class="col-span-full flex justify-center">
            <a href="${url.shop() + "?" + shopQuery.toParams({ ...query, page: query.page + 1 })}" class="sr-only focus:not-sr-only">صفحه بعد</a>
          </div>
        </div>`,
      );
      stopInfinite = infiniteScroll();
    }

    /**
     * Infinite scroll: when the sentinel nears the viewport, fetch the next
     * page and append the cards. The "صفحه بعد" link stays as a no-JS / crawler fallback.
     */
    function infiniteScroll() {
      const grid = dom.$("#grid", listing);
      const sentinel = dom.$("#more", listing);
      let page = result.page;
      let loaded = 0;
      let busy = false;
      if (page >= result.totalPages) {
        sentinel.remove();
        return () => {};
      }
      const io = new IntersectionObserver(
        async ([entry]) => {
          if (!entry.isIntersecting || busy) return;
          busy = true;
          grid.insertAdjacentHTML("beforeend", String(html`${loadingCards()}`));
          try {
            const next = await api.products({ ...query, page: page + 1 });
            dom.$$("[data-loading]", grid).forEach((el) => el.remove());
            grid.insertAdjacentHTML("beforeend", String(html`${cards(next.items, { from: loaded, orderBase: 1000 })}`));
            loaded += next.items.length;
            page = next.page;
            if (page >= next.totalPages) {
              io.disconnect();
              sentinel.remove();
            }
          } catch {
            dom.$$("[data-loading]", grid).forEach((el) => el.remove());
          }
          busy = false;
        },
        { rootMargin: "800px 0px" },
      );
      io.observe(sentinel);
      return () => io.disconnect();
    }

    renderListing(true);

    /** Applies a change (always back to page 1), updates the URL and reloads the grid */
    async function update(change) {
      query = { ...query, ...change, page: 1 };
      const params = shopQuery.toParams(query).toString();
      history.replaceState(null, "", `shop.html${params ? `?${params}` : ""}`);
      listing.classList.add("opacity-50");
      listing.setAttribute("aria-busy", "true");
      try {
        result = await api.products(query);
        renderListing();
      } finally {
        listing.classList.remove("opacity-50");
        listing.removeAttribute("aria-busy");
      }
    }

    /* --- Compact category bar (phones/tablets) --- */
    const bar = dom.$("#compact-categories", root);
    Maso.scrolledPast(dom.$("#category-rail", root), 80, (visible) => {
      bar.toggleAttribute("data-visible", visible);
      bar.toggleAttribute("inert", !visible);
      bar.setAttribute("aria-hidden", String(!visible));
    });

    /* --- Sort sheet --- */
    const sortSheet = Maso.sheet({ title: "مرتب سازی بر اساس", variant: "sheet" });
    sortSheet.body.addEventListener("change", (e) => {
      if (e.target.name !== "sort") return;
      update({ sort: e.target.value });
      sortSheet.close();
    });

    /* --- Filter drawer --- */
    const openKeys = new Set(facets.filter((f, i) => i === facets.length - 1 || query.facets[f.key]?.length).map((f) => f.key));
    const filterSheet = Maso.sheet({ title: "فیلتر‌ها", variant: "drawer" });
    const paintFilters = () => dom.render(filterSheet.body, filterPanel(facets, query, openKeys));

    filterSheet.body.addEventListener("change", (e) => {
      const input = e.target;
      if (input.name === "stock") update({ inStock: input.checked });
      if (input.name === "facet") {
        const key = input.dataset.key;
        const values = new Set(query.facets[key] || []);
        if (input.checked) values.add(input.value);
        else values.delete(input.value);
        update({ facets: { ...query.facets, [key]: [...values].sort() } });
        // Selected options read black, the rest grey
        input.closest("label").lastElementChild.className = cx("text-16", input.checked ? "text-ink" : "text-ink-var");
      }
    });

    dom.actions(filterSheet.body, {
      "toggle-facet"(button) {
        const key = button.dataset.key;
        const open = !openKeys.has(key);
        if (open) openKeys.add(key);
        else openKeys.delete(key);
        // Animate this group only (no full redraw, so focus stays put)
        button.setAttribute("aria-expanded", String(open));
        dom.$("svg", button).classList.toggle("rotate-180", open);
        const panel = dom.$(`#facet-${key}`, filterSheet.body);
        panel.classList.toggle("grid-rows-[1fr]", open);
        panel.classList.toggle("grid-rows-[0fr]", !open);
        panel.firstElementChild.toggleAttribute("inert", !open);
      },
    });

    dom.actions(root, {
      panel(button) {
        if (button.dataset.panel === "sort") {
          dom.render(sortSheet.body, sortPanel(query));
          sortSheet.open();
        } else {
          paintFilters();
          filterSheet.open();
        }
      },
    });
  });
})();
