(()=>{(function(){"use strict";let g=window.Maso,{html:i,icon:A,fmt:b,cx:$,dom:n,api:w,text:L}=g,k="inline-flex h-12 w-full shrink-0 items-center justify-center gap-2 rounded-full bg-primary px-6 text-16 text-on-primary transition-[background-color,transform,opacity] duration-300 ease-out-expo hover:bg-primary/90 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-40",E=e=>i`
    <form novalidate class="animate-rise flex min-h-[350px] w-full max-w-[354px] flex-col justify-between gap-4 rounded-[32px] bg-white/60 p-6 backdrop-blur-[11px]">${e}</form>
  `,I=(e,o)=>{let l="group flex items-center gap-1 self-start text-16 text-on-surface transition-opacity hover:opacity-70",p=A("chevronLeft",{size:18,cls:"-scale-x-100 transition-transform duration-300 group-hover:translate-x-0.5"});return o?i`<a href="${o}" class="${l}">${p}${e}</a>`:i`<button type="button" data-action="back" class="${l}">${p}${e}</button>`},D=(e,o)=>i`
    <div class="flex flex-col gap-2">
      <h1 class="text-20 font-bold text-on-surface">${e}</h1>
      <p class="text-13 text-on-surface-var">${o}</p>
    </div>
  `,j=()=>i`<p id="login-error" role="alert" class="mt-1 ps-4 text-13 text-error" hidden></p>`,N=()=>i`
    <p class="text-13 text-ink-var">
      با ادامه شما با <a href="terms.html" class="text-secondary underline underline-offset-2">شرایط و قوانین</a> ماسو موافقت می‌کنید.
    </p>
  `;n.ready(()=>{let e=n.$("#login"),o="",l=4,p=0,m=!1,f=0;function O(){let t=g.url.param("next");location.replace(t&&/^[\w-]+\.html([?#].*)?$/.test(t)?t:"index.html")}function u(t){let s=n.$("#login-error",e);s.textContent=t||"",s.hidden=!t;let r=n.$("[data-ring]",e);r?.classList.toggle("ring-error",!!t),r?.classList.toggle("ring-transparent",!t),t&&r?.classList.remove("ring-primary/30")}function x(t,s){m=t;let r=n.$("button[type=submit]",e);r.disabled=t,r.textContent=t?s:"ادامه"}function M(){clearInterval(f),n.render(e,E(i`
          ${I("خانه","index.html")} ${D("ثبت نام / ورود","برای ثبت نام یا ورود شماره همراه خود را وارد کنید.")}
          <div class="flex flex-col gap-4">
            <div>
              <input
                data-ring
                type="tel"
                inputmode="tel"
                autocomplete="tel-national"
                dir="ltr"
                value="${o}"
                placeholder="شماره همراه"
                aria-label="شماره همراه"
                aria-describedby="login-error"
                class="h-14 w-full rounded-[16px] bg-field px-4 text-right text-16 text-on-surface ring-1 ring-transparent outline-none transition-shadow placeholder:text-outline focus:ring-primary/30"
              />
              ${j()}
            </div>
            <button type="submit" class="${k}">ادامه</button>
          </div>
          ${N()}
        `));let t=n.$("input",e);t.focus(),t.addEventListener("input",()=>u(null)),n.$("form",e).addEventListener("submit",s=>{s.preventDefault(),m||S(t.value,q)})}async function S(t,s){let r=L.mobile(t);if(!r)return u("شماره همراه معتبر نیست.");x(!0,"در حال ارسال…");try{let c=await w.requestOtp(r);o=r,l=c.length,p=Date.now()+c.resendIn*1e3,m=!1,s()}catch{x(!1),u("ارسال کد انجام نشد. کمی بعد دوباره تلاش کنید.")}}function q(){n.render(e,E(i`
          <div class="flex flex-col gap-4">
            ${I("بازگشت")}
            ${D("کد یکبارمصرف",i`کد یکبار مصرف ارسال شده به شماره <span class="text-on-surface">${b.digits(o)}</span>`)}
            <div class="flex flex-col items-center gap-4">
              <div class="w-full">
                <label data-ring class="relative flex h-14 w-full cursor-text items-center justify-center rounded-[16px] bg-field ring-1 ring-transparent transition-shadow">
                  <input
                    inputmode="numeric"
                    autocomplete="one-time-code"
                    maxlength="${l}"
                    aria-label="کد یکبار مصرف"
                    aria-describedby="login-error"
                    class="absolute inset-0 size-full bg-transparent text-transparent caret-transparent outline-none"
                  />
                  <span data-slots dir="ltr" aria-hidden="true" class="pointer-events-none flex w-[190px] justify-between text-16"></span>
                </label>
                ${j()}
              </div>
              <button type="button" data-action="resend" class="flex h-12 items-center justify-center rounded-[12px] px-4 text-13 text-ink transition-opacity"></button>
            </div>
          </div>
          <button type="submit" class="${k}">ادامه</button>
        `));let t=n.$("input",e),s=n.$("[data-ring]",e),r=n.$("[data-slots]",e);function c(){let a=t.value,d=document.activeElement===t;s.classList.toggle("ring-primary/30",d&&!s.classList.contains("ring-error")),n.render(r,Array.from({length:l},(R,z)=>{let y=a[z],B=d&&z===a.length;return i`<span class="${$("w-2.5 text-center transition-colors",y?"animate-fade-up text-on-surface":"text-ink-muted",B&&"animate-pulse text-primary")}"
              >${y?b.digits(y):"-"}</span
            >`}))}t.addEventListener("input",()=>{t.value=t.value.replace(/[^\d۰-۹]/g,"").slice(0,l),u(null),c(),t.value.length===l&&C()}),t.addEventListener("focus",c),t.addEventListener("blur",c),n.$("form",e).addEventListener("submit",a=>{a.preventDefault(),C()});let h=n.$('[data-action="resend"]',e);function v(){let a=Math.max(0,Math.ceil((p-Date.now())/1e3)),d=`${Math.floor(a/60)}:${String(a%60).padStart(2,"0")}`;h.disabled=a>0||m,h.className=$("flex h-12 items-center justify-center rounded-[12px] px-4 text-13 text-ink transition-opacity",a>0?"opacity-30":"text-secondary hover:opacity-80"),h.textContent=a>0?`ارسال مجدد در ${b.digits(d)}`:"ارسال مجدد کد",a||clearInterval(f)}clearInterval(f),f=setInterval(v,1e3),v(),t.focus(),c();async function C(){if(m)return;let a=L.latinDigits(t.value).replace(/\D/g,"");if(a.length<l)return u("کد را کامل وارد کنید.");x(!0,"در حال بررسی…");try{let d=await w.verifyOtp(o,a);if(!d)return x(!1),t.value="",c(),u("کد وارد شده صحیح نیست.");g.session.set({token:d.token,customer:d.customer}),O()}catch{x(!1),u("ورود انجام نشد. لطفا دوباره تلاش کنید.")}}n.actions(n.$("form",e),{back(){clearInterval(f),M()},resend(){S(o,()=>{t.value="",x(!1),u(null),p=Math.max(p,Date.now()),c(),v(),clearInterval(f),f=setInterval(v,1e3)})}})}M()})})();})();
//# sourceMappingURL=login.js.map?v=7406d3374f
