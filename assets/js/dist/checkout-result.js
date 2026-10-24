(()=>{(function(){"use strict";let o=window.Maso,{html:l,icon:u,fmt:r,url:n,cx:s,dom:c,api:f,co:i}=o;c.ready(async()=>{let x=c.$("#result"),d=n.param("order"),e=d?await f.orderResult(d,n.param("status")||void 0).catch(()=>null):null;if(!e){location.replace("404.html");return}let t=e.status!=="failed";t&&(o.cart.clear(),o.checkout.reset());let m=[{label:"شماره سفارش",value:e.orderNumber},{label:"شماره پیگیری",value:e.trackingCode},{label:"شماره تراکنش",value:e.transactionId},{label:"تاریخ",value:r.dateNumeric(e.date)},{label:"زمان",value:r.time(e.date)}].filter(a=>a.value);c.render(x,l`
        <div class="animate-rise flex w-full max-w-[400px] flex-1 flex-col lg:flex-none">
          <!-- Phones: top offsets as drawn (the failure layout sits lower, its text is longer) -->
          <div class="${s("flex flex-col items-center gap-6 text-center lg:pt-0",t?"pt-[87px]":"pt-[147px]")}">
            ${u(t?"resultSuccess":"resultFailed")}
            <h1 class="text-20 text-on-surface">${e.status==="pending"?"سفارش شما ثبت شد":t?"پرداخت موفق":"پرداخت ناموفق"}</h1>
            ${!t&&l`<p class="max-w-[290px] text-16 text-on-surface-var">
              در صورت کسر وجه از حساب شما، نهایتا وجه کسر شده تا ۷۲ ساعت به حساب شما بازخواهد گشت. در صورت عدم بازگشت پس از این مدت به شعبه بانک خود مراجعه فرمایید.
            </p>`}
          </div>

          <div class="${s("flex flex-col gap-6 p-6",!t&&"mt-8")}">
            <hr class="border-dotted border-outline" />
            ${t&&l`<dl class="flex flex-col gap-2 text-16">
                ${m.map(a=>l`<div class="flex items-center justify-between">
                    <dt class="text-outline">${a.label}</dt>
                    <dd class="text-on-surface">${r.digits(a.value)}</dd>
                  </div>`)}
              </dl>
              <hr class="border-dotted border-outline" />`}
            ${i.totalsList(e.rows)}
          </div>

          <!-- Pinned to the bottom on phones, inline on desktop -->
          <div class="sticky bottom-0 -mx-12 mt-auto flex flex-col items-center gap-2.5 bg-white/50 p-6 backdrop-blur-[2px] lg:static lg:mx-0 lg:mt-0">
            ${t?l`<a href="profile-orders.html" class="${s(i.CTA,"w-full")}">پیگیری و وضعیت سفارش</a>
                  <a href="index.html" class="flex h-14 w-full items-center justify-center rounded-full text-16 text-primary transition-colors hover:bg-surface-low">بازگشت به صفحه اصلی</a>`:l`<a href="checkout-payment.html" class="${s(i.CTA,"w-full")}">پرداخت مجدد</a>`}
          </div>
        </div>
      `)})})();})();
//# sourceMappingURL=checkout-result.js.map?v=49b87868fa
