(()=>{(function(){"use strict";let m=window.Maso,{html:n,icon:g,fmt:p,cx:c,dom:o,api:y}=m,j="inline-flex h-12 shrink-0 items-center justify-center gap-2 rounded-full bg-primary px-6 text-16 text-on-primary transition-[background-color,transform,opacity] duration-300 ease-out-expo hover:bg-primary/90 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-40",M="inline-flex h-12 shrink-0 items-center justify-center rounded-full border border-primary px-6 text-16 text-primary transition-[background-color,transform] duration-300 ease-out-expo hover:bg-surface-low active:scale-[0.98]",T=(e,t)=>n`
    <div class="lg:mx-auto lg:flex lg:min-h-[calc(100dvh-80px)] lg:max-w-[1266px]">
      <div class="flex min-h-[calc(100dvh-80px)] min-w-0 flex-1 flex-col lg:min-h-0">${e}</div>
      <aside aria-label="خلاصه سفارش" class="hidden w-[409px] shrink-0 border-s border-outline-var lg:block">
        <div class="no-scrollbar sticky top-20 flex max-h-[calc(100dvh-80px)] flex-col gap-4 overflow-y-auto p-8">${t}</div>
      </aside>
    </div>
  `,E=e=>{let t=a=>c("size-4 rounded-full border-[1.5px] border-primary transition-colors duration-500",a?"bg-primary":"bg-transparent");return n`<div role="img" aria-label="${`مرحله ${p.digits(e)} از ۲`}" class="flex items-center gap-1">
      <span class="${t(!0)}"></span>
      <span class="w-[22px] border-t border-dotted border-primary"></span>
      <span class="${t(e===2)}"></span>
    </div>`},C=(e,t,a)=>n`
    <div class="${c("flex items-center justify-between px-12 py-4",a&&"lg:py-6")}">
      <a href="${t}" class="group flex items-center gap-2 text-13 text-on-surface-var transition-colors hover:text-on-surface">
        <!-- chevron pointing right = "back" in RTL -->
        ${g("chevronLeft",{cls:"-scale-x-100 text-on-surface transition-transform duration-300 group-hover:translate-x-0.5"})}
        <h1>${e}</h1>
      </a>
      ${a&&E(a)}
    </div>
  `,q=(e,t="")=>n`<h2 class="${c("text-13 text-on-surface-var",t)}">${e}</h2>`,N=e=>e.amount===void 0?n`<span>${e.text}</span>`:n`<span class="flex items-center gap-1">${g("toman",{size:13,cls:"shrink-0"})}<span>${p.price(e.amount)}</span></span>`,O=(e,t,a="")=>n`
    <dl class="${c("flex flex-col gap-2 text-13",a)}">
      ${e.map(r=>n`<div class="flex items-center justify-between">
          <dt class="text-outline">${r.label}</dt>
          <dd class="text-on-surface-var">${N(r)}</dd>
        </div>`)}
      ${t&&t.amount>0&&n`<div class="flex items-center justify-between">
        <dt class="text-outline">تخفیف</dt>
        <dd class="flex items-center gap-1 text-on-error-container">
          ${g("toman",{size:13,cls:"shrink-0"})}<span dir="ltr">${`- ${p.price(t.amount)}`}</span>
        </dd>
      </div>`}
    </dl>
  `,$=()=>n`
    <div aria-hidden="true" class="flex flex-col gap-2">
      ${[0,1,2,3,4].map(()=>n`<div class="flex h-5 items-center justify-between">
          <span class="h-3.5 w-16 animate-pulse rounded-[6px] bg-skeleton"></span>
          <span class="h-3.5 w-20 animate-pulse rounded-[6px] bg-skeleton"></span>
        </div>`)}
    </div>
  `,R=(e,t=!0)=>e.quote?O(e.quote.rows,t?e.quote.discount:void 0,c("transition-opacity duration-300",e.pending&&"opacity-60")):$(),D=(e,t="")=>n`
    <span class="${c("flex items-center gap-2.5 text-16 font-bold text-ink",t)}">
      ${e==null?n`<span class="h-5 w-28 animate-pulse rounded-[6px] bg-skeleton"></span>`:n`<span>${p.price(e)}</span>`}
      ${g("toman",{cls:"shrink-0"})}
    </span>
  `,_=()=>n`
    <div class="flex flex-col gap-4">${q("جزئیات پرداخت")}<div data-slot="totals">${$()}</div></div>
    <hr class="border-outline-var" />
    <div class="flex flex-col gap-6 [&_a]:w-full [&_button]:w-full">
      <div class="flex items-center justify-between">
        <span class="text-13 text-outline">قابل پرداخت</span>
        <span data-slot="payable">${D(null)}</span>
      </div>
      <div data-slot="cta" class="contents"></div>
    </div>
    <div data-slot="aside-extra" class="contents"></div>
  `,B=(e,t="")=>n`
    <div class="sticky bottom-0 z-10 mt-auto flex flex-col items-center gap-2.5 bg-gradient-to-b from-white/0 to-white p-4 backdrop-blur-[2px] md:px-12 lg:hidden">
      <div class="flex w-full items-center justify-between rounded-[32px] border border-black-10 bg-white/50 p-4">${e}</div>
      ${t}
    </div>
  `,J=e=>n`<p class="rounded-[16px] bg-warning-container p-4 text-13 whitespace-pre-line text-warning-text">${e}</p>`,F=(e="")=>n`
    <p class="${c("text-13 text-ink-var",e)}">
      با ادامه شما با <a href="terms.html" class="text-secondary underline underline-offset-2">شرایط و قوانین</a> ماسو موافقت می‌کنید.
    </p>
  `,H=e=>n`<p role="alert" class="rounded-[16px] bg-error-container p-4 text-13 text-on-error-container">${e}</p>`,P=()=>n`
    <div aria-busy="true" class="flex flex-col gap-6 px-12 py-6">
      <div class="h-6 w-32 animate-pulse rounded-[6px] bg-skeleton"></div>
      <div class="h-[110px] animate-pulse rounded-[26px] bg-skeleton"></div>
      <div class="h-[90px] animate-pulse rounded-[16px] bg-skeleton"></div>
    </div>
  `;function U(e){let t={quote:null,pending:!1},a="";return{state:t,refresh(r){let i=r.lines.length?JSON.stringify(r):"";if(i!==a){if(a=i,!i){Object.assign(t,{quote:null,pending:!1}),e(t);return}t.pending=!0,e(t),y.quote(JSON.parse(i)).then(f=>{i===a&&(Object.assign(t,{quote:f,pending:!1}),e(t))}).catch(()=>{i===a&&(a="")})}}}}function V(e){return new Promise(t=>{let a=!1,r=5,i=0,f=0,w=!1,b=m.sheet({title:"تایید شماره همراه",cardRadius:32,removeOnClose:!0,onClose(){clearInterval(f),t(a)}});o.render(b.body,n`<form novalidate class="flex flex-col gap-6 p-6">
          <button type="button" data-close-otp class="flex items-center gap-1 self-start text-13 text-on-surface transition-opacity hover:opacity-70">
            ${g("chevronRight",{size:18})} بازگشت
          </button>
          <div class="flex flex-col gap-2">
            <h3 class="text-20 font-bold text-on-surface">کد یکبارمصرف</h3>
            <p class="text-13 text-on-surface-var">کد یکبار مصرف ارسال شده به شماره <span class="text-on-surface">${p.digits(e)}</span></p>
          </div>
          <div>
            <label data-ring class="relative flex h-14 w-full cursor-text items-center justify-center rounded-[16px] bg-field ring-1 ring-transparent transition-shadow">
              <input inputmode="numeric" autocomplete="one-time-code" aria-label="کد یکبار مصرف" class="absolute inset-0 size-full bg-transparent text-transparent caret-transparent outline-none" />
              <span data-slots dir="ltr" aria-hidden="true" class="pointer-events-none flex w-[190px] justify-between text-16"></span>
            </label>
            <p data-error role="alert" hidden class="mt-1 ps-4 text-13 text-error"></p>
          </div>
          <button type="button" data-resend class="mx-auto flex h-12 items-center justify-center rounded-[12px] px-4 text-13 text-ink transition-opacity"></button>
          <button type="submit" class="${j}">ادامه</button>
        </form>`);let d=o.$("form",b.body),l=o.$("input",d),G=o.$("[data-slots]",d),h=o.$("[data-resend]",d),S=o.$("button[type=submit]",d),v=s=>{let x=o.$("[data-error]",d);x.textContent=s||"",x.hidden=!s,o.$("[data-ring]",d).classList.toggle("ring-error",!!s)},u=()=>{l.maxLength=r;let s=document.activeElement===l;o.render(G,Array.from({length:r},(x,I)=>{let L=l.value[I];return n`<span class="${c("w-2.5 text-center",L?"text-on-surface":"text-ink-muted",s&&I===l.value.length&&"animate-pulse text-primary")}"
              >${L?p.digits(L):"-"}</span
            >`}))},k=()=>{let s=Math.max(0,Math.ceil((i-Date.now())/1e3));h.disabled=s>0,h.classList.toggle("opacity-30",s>0),h.classList.toggle("text-secondary",!s),h.textContent=s>0?`ارسال مجدد در ${p.digits(`${Math.floor(s/60)}:${String(s%60).padStart(2,"0")}`)}`:"ارسال مجدد کد",s||clearInterval(f)};async function z(){i=Date.now()+120*1e3,k();try{let s=await y.requestOtp(e);r=s.length||r,i=Date.now()+(s.resendIn||120)*1e3,u()}catch(s){i=0,v(s?.status===429?"تعداد درخواست‌ها زیاد است. کمی بعد دوباره تلاش کنید.":"ارسال کد انجام نشد. کمی بعد دوباره تلاش کنید.")}clearInterval(f),f=setInterval(k,1e3),k()}async function A(){if(w)return;let s=m.text.latinDigits(l.value).replace(/\D/g,"");if(s.length<r)return v("کد را کامل وارد کنید.");w=!0,S.disabled=!0;try{let x=await y.verifyOtp(e,s);if(!x)return l.value="",u(),v("کد وارد شده صحیح نیست.");m.session.set({token:x.token,customer:x.customer}),a=!0,b.close()}catch{v("تایید انجام نشد. لطفا دوباره تلاش کنید.")}finally{w=!1,S.disabled=!1}}l.addEventListener("input",()=>{l.value=l.value.replace(/[^\d۰-۹]/g,"").slice(0,r),v(null),u(),l.value.length===r&&A()}),l.addEventListener("focus",u),l.addEventListener("blur",u),d.addEventListener("submit",s=>{s.preventDefault(),A()}),o.$("[data-close-otp]",d).addEventListener("click",()=>b.close()),h.addEventListener("click",()=>{l.value="",v(null),u(),z()}),u(),b.open(),z(),requestAnimationFrame(()=>l.focus())})}m.co={confirmMobile:V,CTA:j,CTA_OUTLINE:M,frame:T,stepHeader:C,stepDots:E,blockTitle:q,totalsList:O,totalsSkeleton:$,totals:R,payable:D,summaryAside:_,checkoutBar:B,notice:J,termsNote:F,errorText:H,stepSkeleton:P,quoteLoader:U,fill(e,t,a){o.$$(`[data-slot="${t}"]`,e).forEach(r=>o.render(r,a))}}})();})();
//# sourceMappingURL=checkout.js.map?v=fe17da1b5b
