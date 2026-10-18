/**
 * Search (Figma "Search"), shared by the header overlay and search.html:
 *   - 24px input over a hairline; a round primary submit button appears once
 *     something is typed
 *   - empty input  → "جستوجوهای اخیر" (removable) + "جستوجوهای محبوب"
 *   - with a query → product rows (113px rounded photo, name, price)
 * Results are fetched debounced, and answers for outdated terms are
 * dropped, so fast typing never flashes old results.
 */
(function () {
  "use strict";

  const Maso = window.Maso;
  const { html, icon, url, cx, text, dom } = Maso;

  const DEBOUNCE_MS = 250;

  /**
   * Renders the panel into `root`.
   * @param {HTMLElement} root
   * @param {{ popular: string[], initialQuery?: string, onNavigate?: () => void }} opts
   * @returns {{ focus(): void }}
   */
  Maso.searchPanel = function searchPanel(root, { popular, initialQuery = "", onNavigate }) {
    // Re-rendering into the same element (the overlay reopens): drop the previous listeners
    root._teardown?.();
    const life = new AbortController();
    const { signal } = life;

    let input = initialQuery;
    /** Last answer: { q, hits } */
    let result = null;
    let requested = "";

    dom.render(
      root,
      html`
        <div class="flex flex-col gap-8">
          <form role="search" action="search.html" class="flex h-12 items-center py-2">
            <label for="search-input-${root.id}" class="sr-only">جستجوی محصولات</label>
            <input
              id="search-input-${root.id}"
              name="q"
              type="search"
              value="${input}"
              placeholder="جستوجو"
              autocomplete="off"
              enterkeyhint="search"
              class="h-[37px] min-w-0 flex-1 bg-transparent text-[24px] leading-normal text-ink outline-none placeholder:text-ink-var [&::-webkit-search-cancel-button]:appearance-none"
            />
            <!-- Shown once there is a query, as in the second frame -->
            <button
              type="submit"
              aria-label="جستجو"
              data-submit
              class="flex size-12 shrink-0 items-center justify-center rounded-full border border-black-10 bg-primary text-white transition-[opacity,scale] duration-300 ease-out-expo hover:bg-primary/90"
            >
              ${icon("search")}
            </button>
          </form>
          <hr class="border-black-10" />
          <div data-results></div>
        </div>
      `,
    );

    const field = dom.$("input", root);
    const submit = dom.$("[data-submit]", root);
    const out = dom.$("[data-results]", root);

    const termSection = (title, rows) => html`
      <section class="flex flex-col gap-5 px-4">
        <h2 class="text-13 text-ink-var">${title}</h2>
        <ul class="flex flex-col gap-3">${rows}</ul>
      </section>
    `;

    function paint() {
      const q = text.normalize(input);
      const showSubmit = q !== "";
      submit.className = cx(
        "flex size-12 shrink-0 items-center justify-center rounded-full border border-black-10 bg-primary text-white transition-[opacity,scale] duration-300 ease-out-expo hover:bg-primary/90",
        showSubmit ? "scale-100 opacity-100" : "pointer-events-none scale-75 opacity-0",
      );
      submit.tabIndex = showSubmit ? 0 : -1;
      submit.setAttribute("aria-hidden", String(!showSubmit));

      if (!q) {
        const recent = Maso.recentSearches.list();
        dom.render(
          out,
          html`
            <div class="flex flex-col gap-8">
              ${recent.length > 0 &&
              termSection(
                "جستوجوهای اخیر",
                recent.map(
                  (term) => html`<li class="flex h-8 items-center justify-between">
                    <button type="button" data-action="term" data-term="${term}" class="text-16 text-ink-var transition-colors hover:text-ink">${term}</button>
                    <button
                      type="button"
                      data-action="forget"
                      data-term="${term}"
                      aria-label="${`حذف «${term}» از جستجوهای اخیر`}"
                      class="-m-3 flex size-12 items-center justify-center text-ink-var transition-colors hover:text-ink"
                    >
                      ${icon("close")}
                    </button>
                  </li>`,
                ),
              )}
              ${popular.length > 0 &&
              termSection(
                "جستوجوهای محبوب",
                popular.slice(0, 5).map(
                  (term) => html`<li>
                    <button
                      type="button"
                      data-action="term"
                      data-term="${term}"
                      class="group flex h-8 w-full items-center justify-between text-16 text-ink-var transition-colors hover:text-ink"
                    >
                      ${term}
                      ${icon("chevronLeft", { cls: "text-ink transition-transform duration-300 ease-out-expo group-hover:-translate-x-1" })}
                    </button>
                  </li>`,
                ),
              )}
            </div>
          `,
        );
        return;
      }

      const pending = result?.q !== q;
      const hits = result ? result.hits : [];
      dom.render(
        out,
        html`
          <div aria-live="polite" aria-busy="${pending}" class="${cx("transition-opacity duration-300", pending && "opacity-60")}">
            ${hits.length > 0
              ? html`<ul class="flex flex-col gap-6">
                  ${hits.map(
                    (hit, i) => html`<li class="animate-fade-up" style="--rise-delay:${i * 50}ms">
                      <a href="${url.product(hit.slug)}" data-action="open" class="group flex w-full max-w-[354px] items-center gap-4">
                        <span class="relative size-[113px] shrink-0 overflow-hidden rounded-[32px] bg-surface-low">
                          ${Maso.ui.img(hit.image, {
                            alt: "",
                            cls: "absolute inset-0 size-full object-cover transition-transform duration-700 ease-out-expo group-hover:scale-105",
                          })}
                        </span>
                        <span class="flex min-w-0 flex-1 flex-col items-start gap-4">
                          <span class="text-20 text-ink">${hit.name}</span>
                          ${Maso.ui.price({ price: hit.price, regularPrice: hit.regularPrice, size: "sm" })}
                        </span>
                      </a>
                    </li>`,
                  )}
                </ul>`
              : !pending && html`<p class="px-4 text-16 text-ink-var">${`نتیجه‌ای برای «${q}» پیدا نشد.`}</p>`}
          </div>
        `,
      );
    }

    /** Ask for results (debounced); stale answers are ignored */
    const fetchResults = dom.debounce(async (q) => {
      requested = q;
      const hits = await Maso.api.search(q).catch(() => []);
      if (requested !== q || text.normalize(input) !== q) return;
      result = { q, hits };
      paint();
    }, DEBOUNCE_MS);

    function onInput() {
      const q = text.normalize(input);
      paint();
      if (q && result?.q !== q) fetchResults(q);
    }

    field.addEventListener("input", () => {
      input = field.value;
      onInput();
    });

    dom.$("form", root).addEventListener("submit", (e) => {
      e.preventDefault();
      Maso.recentSearches.add(input);
      field.blur(); // closes the on-screen keyboard on phones
      // Keep the address bar in step on the search page
      if (root.dataset.syncUrl !== undefined) history.replaceState(null, "", url.search(text.normalize(input)));
    });

    dom.actions(
      root,
      {
      term(el) {
        input = el.dataset.term;
        field.value = input;
        Maso.recentSearches.add(input);
        field.focus();
        onInput();
      },
      forget(el) {
        Maso.recentSearches.remove(el.dataset.term);
      },
      open() {
        Maso.recentSearches.add(input);
        onNavigate?.();
      },
      },
      { signal },
    );

    // Recent searches changed (here or in another tab): redraw the empty state
    const unsubscribe = Maso.recentSearches.subscribe(() => !text.normalize(input) && paint());
    root._teardown = () => {
      life.abort();
      unsubscribe();
      requested = ""; // ignore any answer still on its way
    };

    onInput();
    return { focus: () => field.focus() };
  };

  /* ------------------------------------------------------------------ */
  /* Header overlay                                                      */
  /* ------------------------------------------------------------------ */

  /**
   * Full-screen overlay (frosted glass over the page, a 900px column with the
   * close button top-left). The header's search icons are real links to
   * search.html (new tab, no JS); a plain click opens the overlay instead.
   * Every opening starts with an empty input.
   */
  function initOverlay() {
    const dialog = dom.$("#search-dialog");
    if (!dialog) return;
    const panelRoot = dom.$("#search-overlay-panel", dialog);
    let popular = null;

    async function open() {
      popular ??= await Maso.api
        .settings()
        .then((s) => s.popularSearches)
        .catch(() => []);
      const panel = Maso.searchPanel(panelRoot, { popular, onNavigate: () => dialog.close() });
      dialog.showModal();
      panel.focus();
    }

    dom.$$("[data-open-search]").forEach((link) =>
      link.addEventListener("click", (e) => {
        if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
        e.preventDefault();
        open();
      }),
    );
    dom.$$("[data-close-search]", dialog).forEach((btn) => btn.addEventListener("click", () => dialog.close()));
    // Clicks on the glass itself (outside the column) close the overlay
    Maso.dom.onBackdropClick(dialog, () => dialog.close());
  }

  dom.ready(initOverlay);
})();
