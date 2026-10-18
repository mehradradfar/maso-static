/**
 * checkout-shipping.html — "اطلاعات ارسال" (step 1 of 2).
 *  no address: illustration + "اضافه کردن اطلاعات ارسال"
 *  addresses:  "افزودن آدرس", every saved address as a card (Figma edit 19:
 *              the chosen one outlined in primary; tap a card to choose it,
 *              "تغییر" edits it), and the delivery method WordPress resolves
 *              for the chosen city
 */
(function () {
  "use strict";

  const Maso = window.Maso;
  const { html, icon, cx, dom, api, co } = Maso;

  /** 110px card: "ارسال به آدرس" caption, the address, "تغییر" on the left; the chosen one has a primary outline */
  const addressCard = (address, chosen) => html`
    <li
      class="${cx(
        "relative flex min-h-[110px] items-center justify-between rounded-[26px] border px-4 py-3 transition-colors duration-300",
        chosen ? "border-primary" : "border-black-10 hover:border-outline-var",
      )}"
    >
      <button
        type="button"
        data-action="pick-address"
        data-id="${address.id}"
        role="radio"
        aria-checked="${chosen}"
        class="flex min-w-0 flex-1 flex-col items-start gap-0.5 px-4 text-start after:absolute after:inset-0 after:rounded-[26px]"
      >
        <span class="text-10 text-ink-var">ارسال به آدرس</span>
        <span class="line-clamp-2 text-16 text-ink">${Maso.formatAddress(address)}</span>
      </button>
      <button
        type="button"
        data-action="edit-address"
        data-id="${address.id}"
        aria-label="${`تغییر آدرس ${Maso.formatAddress(address)}`}"
        class="relative z-[1] flex h-14 shrink-0 items-center px-3 text-16 text-secondary transition-opacity hover:opacity-80"
      >
        تغییر
      </button>
    </li>
  `;

  /** Truck + method name/description (Maso wordmark for in-house delivery), then its notice */
  const shippingMethod = (method, pending) => html`
    <div class="${cx("flex flex-col gap-4 transition-opacity duration-300", pending && "opacity-60")}">
      <div class="flex min-h-[90px] items-center justify-between gap-4 py-4">
        <div class="flex items-start gap-2">
          ${icon("truck", { cls: "shrink-0 text-ink" })}
          <div class="flex flex-col gap-2">
            <span class="text-16 text-on-surface">${method.title}</span>
            <span class="text-13 text-on-surface-var">${method.description}</span>
          </div>
        </div>
        ${method.branded && icon("logo", { size: 50, cls: "shrink-0 text-primary" })}
      </div>
      ${method.notice && co.notice(method.notice)}
    </div>
  `;

  dom.ready(async () => {
    const root = dom.$("#step");

    // Nothing to ship: back to the cart
    if (!Maso.cart.lines().length) {
      location.replace("cart.html");
      return;
    }

    const provinces = await api.locations();
    const nextLink = html`<a href="checkout-payment.html" class="${co.CTA}">ادامه پرداخت</a>`;
    const addButton = html`<button type="button" data-action="add-address" class="${co.CTA_OUTLINE}">افزودن آدرس</button>`;

    const quote = co.quoteLoader(paintQuote);
    let address = null;

    function paintQuote(state) {
      co.fill(root, "totals", co.totals(state));
      co.fill(root, "payable", co.payable(state.quote?.payable));
      const slot = dom.$('[data-slot="method"]', root);
      if (slot)
        dom.render(
          slot,
          state.quote?.shipping
            ? shippingMethod(state.quote.shipping, state.pending)
            : html`<div aria-hidden="true" class="h-[90px] animate-pulse rounded-[16px] bg-skeleton"></div>`,
        );
    }

    function draw() {
      address = Maso.checkout.currentAddress();
      dom.render(
        root,
        co.frame(
          html`
            ${co.stepHeader("اطلاعات ارسال", "cart.html", 1)}
            ${address
              ? html`<!-- phone/tablet: 24px rhythm · desktop: 32px under "افزودن آدرس", 48px before the method -->
                  <div class="animate-fade-up flex flex-col gap-6 p-6 lg:gap-12 lg:px-12">
                    <div class="flex flex-col gap-6 lg:gap-8">
                      <button type="button" data-action="add-address" class="group flex h-8 items-center gap-1 self-start text-16 text-secondary">
                        ${icon("plus", { size: 20, cls: "transition-transform duration-300 group-hover:rotate-90" })} افزودن آدرس
                      </button>
                      <ul role="radiogroup" aria-label="آدرس ارسال" class="flex flex-col gap-4">
                        ${Maso.checkout.addresses().map((a) => addressCard(a, a.id === address.id))}
                      </ul>
                    </div>
                    <div data-slot="method"><div aria-hidden="true" class="h-[90px] animate-pulse rounded-[16px] bg-skeleton"></div></div>
                  </div>
                  ${co.checkoutBar(html`<span data-slot="payable">${co.payable(null)}</span>${nextLink}`)}`
              : html`<div class="animate-fade-up flex flex-1 flex-col items-center justify-center gap-8 px-12 py-8">
                    ${icon("locationEmpty")}
                    <p class="text-16 text-on-surface-var">آدرسی برای شما وجود ندارد</p>
                  </div>
                  <!-- Phones & tablets: the add-address button when there is no address -->
                  <div class="sticky bottom-0 mt-auto bg-gradient-to-b from-white/0 to-white p-4 lg:hidden">
                    <button type="button" data-action="add-address" class="${cx(co.CTA_OUTLINE, "w-full")}">اضافه کردن اطلاعات ارسال</button>
                  </div>`}
          `,
          co.summaryAside(),
        ),
      );
      co.fill(root, "cta", address ? nextLink : addButton);
      paintQuote(quote.state);
      quote.refresh({
        lines: Maso.cart.toInputs(Maso.cart.lines()),
        provinceId: address?.provinceId,
        cityId: address?.cityId,
        coupon: Maso.checkout.choices().coupon,
      });
    }

    draw();

    /* --- Add address --- */
    // Signed-out shoppers confirm the address's mobile number with a one-time code first (Figma edit 16)
    const dialog = Maso.addressDialog({
      provinces,
      onSaved: Maso.checkout.saveAddress,
      verify: (address) => Boolean(Maso.session.get()) || co.confirmMobile(address.mobile),
    });

    dom.actions(root, {
      "add-address": () => dialog.open(),
      "edit-address"(el) {
        const found = Maso.checkout.addresses().find((a) => a.id === el.dataset.id);
        if (found) dialog.open(found);
      },
      "pick-address"(el) {
        if (el.dataset.id !== address?.id) Maso.checkout.choose({ addressId: el.dataset.id });
      },
    });

    // Saved/picked addresses (also from other tabs) → redraw
    Maso.checkout.subscribe(draw);
    Maso.cart.subscribe((lines) => (lines.length ? draw() : location.replace("cart.html")));
  });
})();
