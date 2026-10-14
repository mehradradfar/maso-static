/** checkout-result.html — payment outcome (Figma "Cart & Checkout" → پرداخت موفق / ناموفق) */
(function () {
  "use strict";

  const Maso = window.Maso;
  const { html, icon, fmt, url, cx, dom, api, co } = Maso;

  dom.ready(async () => {
    const root = dom.$("#result");
    const orderId = url.param("order");
    const result = orderId ? await api.orderResult(orderId, url.param("status") || undefined).catch(() => null) : null;
    if (!result) {
      location.replace("404.html");
      return;
    }

    const ok = result.status !== "failed";
    // The order is placed: empty the cart and drop the coupon
    if (ok) {
      Maso.cart.clear();
      Maso.checkout.reset();
    }

    const info = [
      { label: "شماره سفارش", value: result.orderNumber },
      { label: "شماره پیگیری", value: result.trackingCode },
      { label: "شماره تراکنش", value: result.transactionId },
      { label: "تاریخ", value: fmt.dateNumeric(result.date) },
      { label: "زمان", value: fmt.time(result.date) },
    ].filter((r) => r.value);

    dom.render(
      root,
      html`
        <div class="animate-rise flex w-full max-w-[400px] flex-1 flex-col lg:flex-none">
          <!-- Phones: top offsets as drawn (the failure layout sits lower, its text is longer) -->
          <div class="${cx("flex flex-col items-center gap-6 text-center lg:pt-0", ok ? "pt-[87px]" : "pt-[147px]")}">
            ${icon(ok ? "resultSuccess" : "resultFailed")}
            <h1 class="text-20 text-on-surface">${result.status === "pending" ? "سفارش شما ثبت شد" : ok ? "پرداخت موفق" : "پرداخت ناموفق"}</h1>
            ${!ok &&
            html`<p class="max-w-[290px] text-16 text-on-surface-var">
              در صورت کسر وجه از حساب شما، نهایتا وجه کسر شده تا ۷۲ ساعت به حساب شما بازخواهد گشت. در صورت عدم بازگشت پس از این مدت به شعبه بانک خود مراجعه فرمایید.
            </p>`}
          </div>

          <div class="${cx("flex flex-col gap-6 p-6", !ok && "mt-8")}">
            <hr class="border-dotted border-outline" />
            ${ok &&
            html`<dl class="flex flex-col gap-2 text-16">
                ${info.map(
                  (r) => html`<div class="flex items-center justify-between">
                    <dt class="text-outline">${r.label}</dt>
                    <dd class="text-on-surface">${fmt.digits(r.value)}</dd>
                  </div>`,
                )}
              </dl>
              <hr class="border-dotted border-outline" />`}
            ${co.totalsList(result.rows)}
          </div>

          <!-- Pinned to the bottom on phones, inline on desktop -->
          <div class="sticky bottom-0 -mx-12 mt-auto flex flex-col items-center gap-2.5 bg-white/50 p-6 backdrop-blur-[2px] lg:static lg:mx-0 lg:mt-0">
            ${ok
              ? html`<a href="profile-orders.html" class="${cx(co.CTA, "w-full")}">پیگیری و وضعیت سفارش</a>
                  <a href="index.html" class="flex h-14 w-full items-center justify-center rounded-full text-16 text-primary transition-colors hover:bg-surface-low">بازگشت به صفحه اصلی</a>`
              : html`<a href="checkout-payment.html" class="${cx(co.CTA, "w-full")}">پرداخت مجدد</a>`}
          </div>
        </div>
      `,
    );
  });
})();
