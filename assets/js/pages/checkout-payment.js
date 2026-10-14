/**
 * checkout-payment.html — "نهایی سازی و پرداخت" (step 2 of 2): payment
 * method, coupon, totals and the final CTA, which creates the order in
 * WordPress and sends the shopper to the bank gateway.
 */
(function () {
  "use strict";

  const Maso = window.Maso;
  const { html, icon, fmt, url, cx, dom, api, co, fields, ui } = Maso;

  const ICONS = { card: "card", split: "split", cheque: "cheque", installments: "layers" };

  /**
   * 90px radio row: icon, title and description on the right, optional
   * provider logo, the radio on the left. A real (visually hidden) radio
   * keeps keyboard and screen-reader behaviour native.
   */
  const paymentOption = (method, checked, payableAmount) => {
    const per = method.installments && payableAmount ? Math.ceil(payableAmount / method.installments / 1000) * 1000 : undefined;
    return html`
      <label class="flex min-h-[90px] cursor-pointer items-center gap-6 border-b border-outline-var py-4 last:border-b-0">
        <span class="flex min-w-0 flex-1 items-start gap-2">
          ${icon(ICONS[method.icon], { cls: "shrink-0 text-ink" })}
          <span class="flex flex-col gap-2">
            <span class="text-16 text-on-surface">${method.title}</span>
            ${method.installments
              ? html`<span class="flex items-center gap-2 text-13 text-on-surface-var">
                  ${method.description}
                  <span class="flex items-center gap-1">
                    <span class="text-16 font-semibold text-installment">${per ? fmt.price(per) : "…"}</span>
                    ${icon("toman", { cls: "shrink-0 text-ink" })}
                  </span>
                </span>`
              : html`<span class="text-13 text-on-surface-var">${method.description}</span>`}
          </span>
        </span>
        ${method.logo && ui.img(method.logo, { width: 48, height: Math.round((48 * method.logo.height) / method.logo.width), cls: "shrink-0" })}
        <input type="radio" name="payment-method" value="${method.id}" ${checked ? html`checked` : ""} class="peer sr-only" />
        <span
          aria-hidden="true"
          class="flex size-6 shrink-0 items-center justify-center rounded-full border border-outline p-1 peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-primary peer-checked:[&>span]:scale-100"
        >
          <span class="size-full scale-0 rounded-full bg-secondary transition-transform duration-300 ease-out-expo"></span>
        </span>
      </label>
    `;
  };

  /** "کد تخفیف ⊕" — or, once applied, the discount with its percent badge and a remove button */
  const couponRow = (quote) => {
    const d = quote?.discount;
    if (!d) {
      return html`<button type="button" data-action="coupon" class="group flex w-full items-center justify-between">
        <span class="flex items-center gap-2 text-16 text-on-surface">${icon("discount", { cls: "text-primary" })} کد تخفیف</span>
        <span class="flex size-12 items-center justify-center text-primary transition-transform duration-300 ease-out-expo group-hover:rotate-90">${icon("plusCircle")}</span>
      </button>`;
    }
    return html`<div class="animate-fade-up flex items-center gap-8">
      <div class="flex min-w-0 flex-1 items-center gap-2">
        ${icon("discountActive")}
        <div class="flex flex-col gap-1">
          <span class="text-16 text-ink">تخفیف</span>
          <span class="flex items-center gap-2.5 text-20 font-semibold text-ink">${fmt.price(d.amount)} ${icon("toman", { cls: "shrink-0" })}</span>
        </div>
      </div>
      <span dir="ltr" class="rounded-full bg-error px-1 text-13 text-on-error">${`- ${fmt.digits(d.percent)}٪`}</span>
      <button
        type="button"
        data-action="remove-coupon"
        aria-label="${`حذف کد تخفیف ${d.code}`}"
        class="-m-2 flex size-10 items-center justify-center text-ink-var transition-colors hover:text-error"
      >
        ${icon("trash")}
      </button>
    </div>`;
  };

  dom.ready(async () => {
    const root = dom.$("#step");
    const lines = () => Maso.cart.lines();

    // Steps can't be skipped: no cart → cart, no address → shipping
    if (!lines().length) return location.replace("cart.html");
    if (!Maso.checkout.currentAddress()) return location.replace("checkout-shipping.html");

    const methods = await api.paymentMethods();
    const methodId = () => {
      const chosen = Maso.checkout.choices().paymentMethodId;
      return methods.some((m) => m.id === chosen) ? chosen : methods[0]?.id;
    };

    let paying = false;
    let error = null;

    const payButton = () =>
      html`<button type="button" data-action="pay" ${paying || quote.state.pending || !quote.state.quote ? html`disabled` : ""} class="${co.CTA}">
        ${paying ? "در حال انتقال…" : "ادامه پرداخت"}
      </button>`;

    const quote = co.quoteLoader(paintQuote);

    function paintQuote(state) {
      co.fill(root, "totals", co.totals(state));
      co.fill(root, "payable", co.payable(state.quote?.payable));
      co.fill(root, "coupon", couponRow(state.quote));
      co.fill(root, "cta", payButton());
      co.fill(root, "pay", payButton());
      co.fill(root, "error", error ? co.errorText(error) : "");
      // Keep keyboard focus on the radio group when it is redrawn (arrow keys change the method)
      const hadFocus = document.activeElement?.name === "payment-method";
      co.fill(root, "methods", methods.map((m) => paymentOption(m, m.id === methodId(), state.quote?.payable)));
      if (hadFocus) dom.$("input[name=payment-method]:checked", root)?.focus();
    }

    dom.render(
      root,
      co.frame(
        html`
          ${co.stepHeader("نهایی سازی و پرداخت", "checkout-shipping.html", 2)}
          <section class="flex flex-col gap-6 border-b-2 border-divider p-6 lg:border-b-0 lg:px-12">
            ${co.blockTitle("روش پرداخت")}
            <div data-slot="methods" role="radiogroup" aria-label="روش پرداخت" class="flex flex-col gap-4"></div>
          </section>
          <!-- Phones & tablets: coupon and totals in the flow -->
          <section data-slot="coupon" class="border-b-4 border-hairline px-6 py-8 lg:hidden"></section>
          <section class="flex flex-col gap-6 px-12 py-6 lg:hidden">
            ${co.blockTitle("جزئیات پرداخت")}
            <div data-slot="totals">${co.totalsSkeleton()}</div>
            <div data-slot="error" class="contents"></div>
          </section>
          ${co.checkoutBar(html`<span data-slot="payable">${co.payable(null)}</span><span data-slot="pay" class="contents"></span>`, co.termsNote("text-center"))}
        `,
        co.summaryAside(),
      ),
    );
    co.fill(
      root,
      "aside-extra",
      html`<div data-slot="error" class="contents"></div>
        <div data-slot="coupon" class="rounded-[24px] bg-surface-low p-4"></div>`,
    );

    function refresh() {
      const address = Maso.checkout.currentAddress();
      quote.refresh({
        lines: Maso.cart.toInputs(lines()),
        provinceId: address?.provinceId,
        cityId: address?.cityId,
        coupon: Maso.checkout.choices().coupon,
      });
      paintQuote(quote.state);
    }
    refresh();
    Maso.checkout.subscribe(refresh);
    Maso.cart.subscribe((l) => (l.length ? refresh() : location.replace("cart.html")));

    root.addEventListener("change", (e) => {
      if (e.target.name === "payment-method") Maso.checkout.choose({ paymentMethodId: e.target.value });
    });

    /* --- Coupon sheet: one field and "اعمال"; the code is checked by WordPress --- */
    const couponSheet = Maso.sheet({ title: "کد تخفیف", variant: "sheet", cardRadius: 32 });
    function paintCouponForm(err) {
      dom.render(
        couponSheet.body,
        html`<form class="flex flex-col gap-4 px-6 pt-4 pb-6" novalidate>
          ${fields.text({ name: "code", label: "کد تخفیف را وارد کنید", error: err, attrs: { autocapitalize: "characters", autocomplete: "off", dir: "ltr" } })}
          <button type="submit" class="${cx(co.CTA, "w-full")}">اعمال</button>
        </form>`,
      );
    }
    couponSheet.body.addEventListener("input", () => fields.setError(dom.$('[data-field="code"]', couponSheet.body), null));
    couponSheet.body.addEventListener("submit", async (e) => {
      e.preventDefault();
      const form = e.target;
      const code = form.elements.namedItem("code").value.trim();
      const button = dom.$("button[type=submit]", form);
      if (!code) return fields.setError(dom.$('[data-field="code"]', form), "کد تخفیف را وارد کنید.");
      button.disabled = true;
      button.textContent = "در حال بررسی…";
      const result = await api.coupon(code, Maso.cart.toInputs(lines())).catch(() => ({ ok: false, error: "بررسی کد انجام نشد." }));
      button.disabled = false;
      button.textContent = "اعمال";
      if (!result.ok) return fields.setError(dom.$('[data-field="code"]', form), result.error);
      Maso.checkout.choose({ coupon: code.toUpperCase() });
      couponSheet.close();
    });

    /* --- Pay: create the order, then go to the gateway (or the result page) --- */
    async function pay() {
      paying = true;
      error = null;
      paintQuote(quote.state);
      const address = Maso.checkout.currentAddress();
      try {
        const result = await api.placeOrder({
          lines: Maso.cart.toInputs(lines()),
          address,
          paymentMethodId: methodId(),
          coupon: Maso.checkout.choices().coupon,
        });
        // Bank gateways live on other origins; the result page is ours
        location.assign(/^https?:\/\//.test(result.redirectUrl) ? result.redirectUrl : url.page(result.redirectUrl));
      } catch {
        paying = false;
        error = "ثبت سفارش انجام نشد. لطفا دوباره تلاش کنید.";
        paintQuote(quote.state);
      }
    }

    dom.actions(root, {
      coupon() {
        paintCouponForm();
        couponSheet.open();
        dom.$("input", couponSheet.body).focus();
      },
      "remove-coupon": () => Maso.checkout.choose({ coupon: undefined }),
      pay,
    });
  });
})();
