/**
 * cart.html (Figma "Cart & Checkout" → سبد خرید).
 *  phone/tablet: items, "جزئیات پرداخت", floating total bar
 *  desktop:      items on the right, summary column with the CTA on the left
 */
(function () {
  "use strict";

  const Maso = window.Maso;
  const { html, icon, fmt, url, cx, dom, ui, co } = Maso;

  /**
   * One cart row (Figma edit 28): 113px photo (32px radius); name, price and
   * the quantity counter in one row from tablets up (stacked on phones, the
   * counter last); a hairline, then the chosen finishes and "تغییر انتخاب‌ها"
   * back to the product page. The counter's bin at 1 removes the row.
   */
  const lineCounter = (line) =>
    ui.counter({ cls: "w-[156px]", key: line.id, step: `data-action="qty" data-id="${line.id}"` });

  const cartItem = (line) => {
    const href = url.product(line.slug);
    return html`
      <article class="flex w-full gap-4">
        <a href="${href}" tabindex="-1" class="group relative size-[113px] shrink-0 overflow-hidden rounded-[32px] bg-surface-low">
          ${ui.img(line.image, { cls: "absolute inset-0 size-full object-cover transition-transform duration-700 ease-out-expo group-hover:scale-105" })}
        </a>
        <div class="flex min-w-0 flex-1 flex-col gap-4">
          <div class="flex flex-col gap-4 md:flex-row md:items-start md:gap-6">
            <h2 class="text-20 text-ink md:min-w-0 md:flex-1"><a href="${href}" class="transition-opacity hover:opacity-70">${line.name}</a></h2>
            ${ui.price({ price: line.price, regularPrice: line.regularPrice, size: "sm" })}
            <div class="hidden md:block">${lineCounter(line)}</div>
          </div>
          <hr class="border-hairline" />
          <div class="flex items-center justify-between gap-2">
            <ul class="flex items-center gap-2" aria-label="انتخاب‌ها">
              ${line.options
                .filter((o) => o.swatch)
                .map(
                  (o) => html`<li
                    title="${`${o.label}: ${o.value}`}"
                    class="relative size-6 overflow-hidden rounded-full after:absolute after:inset-0 after:rounded-full after:shadow-[inset_0_5px_2px_rgba(0,0,0,0.25)]"
                  >
                    ${ui.img(o.swatch, { alt: o.value, width: 24, height: 24, cls: "size-full object-cover" })}
                  </li>`,
                )}
            </ul>
            <a href="${href}" class="group flex h-8 shrink-0 items-center gap-1 text-16 text-secondary transition-opacity hover:opacity-80">
              تغییر انتخاب‌ها ${icon("chevronLeft", { size: 18, cls: "transition-transform duration-300 group-hover:-translate-x-0.5" })}
            </a>
          </div>
          <div class="md:hidden">${lineCounter(line)}</div>
        </div>
      </article>
    `;
  };

  /** Not in the design: a quiet empty state in the same visual language */
  const emptyCart = () => html`
    ${co.stepHeader("سبد خرید", "shop.html")}
    <div class="animate-fade-up flex min-h-[60dvh] flex-col items-center justify-center gap-6 px-12 text-center">
      <span class="flex size-20 items-center justify-center rounded-full bg-surface-low text-primary">${icon("bag", { size: 32 })}</span>
      <p class="text-16 text-on-surface-var">سبد خرید شما خالی است.</p>
      <a href="shop.html" class="${co.CTA}">مشاهده محصولات</a>
    </div>
  `;

  dom.ready(() => {
    const root = dom.$("#step");
    const cta = html`<a href="checkout-shipping.html" class="${co.CTA}">ادامه پرداخت</a>`;
    let drawnCount = -1;

    const quote = co.quoteLoader((state) => {
      co.fill(root, "totals", co.totals(state, false));
      co.fill(root, "payable", co.payable(state.quote?.payable));
    });

    let drawnIds = "";
    /** Puts every counter on its line's quantity */
    const syncCounters = (animate) =>
      dom.$$("[data-counter]", root).forEach((el) => {
        const line = Maso.cart.lines().find((l) => l.id === el.dataset.counter);
        if (line) ui.syncCounter(el, line.qty, animate);
      });

    /** Full redraw (first load, or the cart changed in another tab) */
    function draw() {
      const lines = Maso.cart.lines();
      drawnCount = lines.length;
      drawnIds = lines.map((l) => l.id).join("|");
      if (!lines.length) {
        dom.render(root, emptyCart());
        return;
      }
      dom.render(
        root,
        co.frame(
          html`
            ${co.stepHeader("سبد خرید", "shop.html")}
            <!-- Items: 48px gutters (24px on the left on phones so the 354px row fits) -->
            <ul data-items class="flex flex-col gap-8 border-b-2 border-divider py-8 ps-12 pe-6 md:pe-12 lg:border-b-0">
              ${lines.map(
                (line, i) => html`<li data-line="${line.id}" class="${cx("animate-fade-up", i > 0 && "border-t border-hairline pt-8")}" style="--rise-delay:${i * 60}ms">
                  ${cartItem(line)}
                </li>`,
              )}
            </ul>
            <!-- Summary under the items on phones and tablets -->
            <section class="flex flex-col gap-6 px-12 py-6 lg:hidden">
              ${co.blockTitle("جزئیات پرداخت")}
              <div data-slot="totals">${co.totalsSkeleton()}</div>
            </section>
            ${co.checkoutBar(html`<span data-slot="payable">${co.payable(null)}</span>${cta}`)}
          `,
          co.summaryAside(),
        ),
      );
      co.fill(root, "cta", cta);
      // Quote state survives the redraw
      if (quote.state.quote || quote.state.pending) {
        co.fill(root, "totals", co.totals(quote.state, false));
        co.fill(root, "payable", co.payable(quote.state.quote?.payable));
      }
      syncCounters(false);
    }

    function refresh() {
      quote.refresh({ lines: Maso.cart.toInputs(Maso.cart.lines()) });
    }

    draw();
    refresh();

    Maso.cart.subscribe((lines) => {
      // A row removed here: take just that row out (no replayed animations)
      const list = dom.$("[data-items]", root);
      if (list && lines.map((l) => l.id).join("|") === drawnIds) {
        // Only quantities changed: the counters roll in place
        syncCounters(true);
      } else if (list && lines.length && lines.length === drawnCount - 1) {
        const ids = new Set(lines.map((l) => l.id));
        dom.$$("[data-line]", list).forEach((li) => !ids.has(li.dataset.line) && li.remove());
        // The new first row loses its divider
        list.firstElementChild?.classList.remove("border-t", "border-hairline", "pt-8");
        drawnCount = lines.length;
        drawnIds = lines.map((l) => l.id).join("|");
      } else {
        draw();
      }
      refresh();
    });

    dom.actions(root, {
      qty(el) {
        const line = Maso.cart.lines().find((l) => l.id === el.dataset.id);
        if (line) Maso.cart.setQty(line.id, line.qty + Number(el.dataset.delta));
      },
    });
  });
})();
