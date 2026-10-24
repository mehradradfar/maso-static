(()=>{(function(){"use strict";let a=window.Maso,{html:o,icon:c,cx:l,dom:n,api:b,co:s}=a,m=(t,d)=>o`
    <li
      class="${l("relative flex min-h-[110px] items-center justify-between rounded-[26px] border px-4 py-3 transition-colors duration-300",d?"border-primary":"border-black-10 hover:border-outline-var")}"
    >
      <button
        type="button"
        data-action="pick-address"
        data-id="${t.id}"
        role="radio"
        aria-checked="${d}"
        class="flex min-w-0 flex-1 flex-col items-start gap-0.5 px-4 text-start after:absolute after:inset-0 after:rounded-[26px]"
      >
        <span class="text-10 text-ink-var">ارسال به آدرس</span>
        <span class="line-clamp-2 text-16 text-ink">${a.formatAddress(t)}</span>
      </button>
      <button
        type="button"
        data-action="edit-address"
        data-id="${t.id}"
        aria-label="${`تغییر آدرس ${a.formatAddress(t)}`}"
        class="relative z-[1] flex h-14 shrink-0 items-center px-3 text-16 text-secondary transition-opacity hover:opacity-80"
      >
        تغییر
      </button>
    </li>
  `,v=(t,d)=>o`
    <div class="${l("flex flex-col gap-4 transition-opacity duration-300",d&&"opacity-60")}">
      <div class="flex min-h-[90px] items-center justify-between gap-4 py-4">
        <div class="flex items-start gap-2">
          ${c("truck",{cls:"shrink-0 text-ink"})}
          <div class="flex flex-col gap-2">
            <span class="text-16 text-on-surface">${t.title}</span>
            <span class="text-13 text-on-surface-var">${t.description}</span>
          </div>
        </div>
        ${t.branded&&c("logo",{size:50,cls:"shrink-0 text-primary"})}
      </div>
      ${t.notice&&s.notice(t.notice)}
    </div>
  `;n.ready(async()=>{let t=n.$("#step");if(!a.cart.lines().length){location.replace("cart.html");return}let d=await b.locations(),u=o`<a href="checkout-payment.html" class="${s.CTA}">ادامه پرداخت</a>`,y=o`<button type="button" data-action="add-address" class="${s.CTA_OUTLINE}">افزودن آدرس</button>`,f=s.quoteLoader(x),i=null;function x(e){s.fill(t,"totals",s.totals(e)),s.fill(t,"payable",s.payable(e.quote?.payable));let r=n.$('[data-slot="method"]',t);r&&n.render(r,e.quote?.shipping?v(e.quote.shipping,e.pending):o`<div aria-hidden="true" class="h-[90px] animate-pulse rounded-[16px] bg-skeleton"></div>`)}function p(){i=a.checkout.currentAddress(),n.render(t,s.frame(o`
            ${s.stepHeader("اطلاعات ارسال","cart.html",1)}
            ${i?o`<!-- phone/tablet: 24px rhythm · desktop: 32px under "افزودن آدرس", 48px before the method -->
                  <div class="animate-fade-up flex flex-col gap-6 p-6 lg:gap-12 lg:px-12">
                    <div class="flex flex-col gap-6 lg:gap-8">
                      <button type="button" data-action="add-address" class="group flex h-8 items-center gap-1 self-start text-16 text-secondary">
                        ${c("plus",{size:20,cls:"transition-transform duration-300 group-hover:rotate-90"})} افزودن آدرس
                      </button>
                      <ul role="radiogroup" aria-label="آدرس ارسال" class="flex flex-col gap-4">
                        ${a.checkout.addresses().map(e=>m(e,e.id===i.id))}
                      </ul>
                    </div>
                    <div data-slot="method"><div aria-hidden="true" class="h-[90px] animate-pulse rounded-[16px] bg-skeleton"></div></div>
                  </div>
                  ${s.checkoutBar(o`<span data-slot="payable">${s.payable(null)}</span>${u}`)}`:o`<div class="animate-fade-up flex flex-1 flex-col items-center justify-center gap-8 px-12 py-8">
                    ${c("locationEmpty")}
                    <p class="text-16 text-on-surface-var">آدرسی برای شما وجود ندارد</p>
                  </div>
                  <!-- Phones & tablets: the add-address button when there is no address -->
                  <div class="sticky bottom-0 mt-auto bg-gradient-to-b from-white/0 to-white p-4 lg:hidden">
                    <button type="button" data-action="add-address" class="${l(s.CTA_OUTLINE,"w-full")}">اضافه کردن اطلاعات ارسال</button>
                  </div>`}
          `,s.summaryAside())),s.fill(t,"cta",i?u:y),x(f.state),f.refresh({lines:a.cart.toInputs(a.cart.lines()),provinceId:i?.provinceId,cityId:i?.cityId,coupon:a.checkout.choices().coupon})}p();let h=a.addressDialog({provinces:d,onSaved:a.checkout.saveAddress,verify:e=>!!a.session.get()||s.confirmMobile(e.mobile)});n.actions(t,{"add-address":()=>h.open(),"edit-address"(e){let r=a.checkout.addresses().find(g=>g.id===e.dataset.id);r&&h.open(r)},"pick-address"(e){e.dataset.id!==i?.id&&a.checkout.choose({addressId:e.dataset.id})}}),a.checkout.subscribe(p),a.cart.subscribe(e=>e.length?p():location.replace("cart.html"))})})();})();
//# sourceMappingURL=checkout-shipping.js.map?v=0042a58c51
