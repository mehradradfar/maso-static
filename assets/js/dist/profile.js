(()=>{(function(){"use strict";let g=window.Maso,{html:s,icon:m,fmt:f,cx:E,dom:c,api:h,ui:D,text:_,fields:M}=g,U=matchMedia("(width >= 64rem)"),B=[{key:"pre",label:"پیش‌فاکتور"},{key:"current",label:"جاری"},{key:"delivered",label:"تحویل‌شده"},{key:"returned",label:"مرجوعی"}],S="inline-flex h-14 w-full shrink-0 items-center justify-center gap-2 rounded-full bg-primary px-6 text-16 text-on-primary transition-[background-color,transform,opacity] duration-300 ease-out-expo hover:bg-primary/90 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-40",C=t=>`profile.html${t?`?${new URLSearchParams(t)}`:""}`,q=t=>t?s`<span class="inline-flex shrink-0 flex-col items-center rounded-full bg-warning-container px-2 py-1 text-center text-warning-text">
          ${t.caption&&s`<span class="text-10">${t.caption}</span>`}
          <span class="text-13">${t.label}</span>
        </span>`:"",O=(t,e="h-20 w-[116px] rounded-[16px]")=>s`<span class="${E("block shrink-0 overflow-hidden bg-surface-low",e)}">${D.img(t,{cls:"size-full object-cover",alt:""})}</span>`,$=(t,e)=>s`
    <div class="flex items-center justify-between gap-4 text-16">
      <dt class="text-outline">${t}</dt>
      <dd class="text-on-surface">${e}</dd>
    </div>
  `,Q=t=>s`<span class="inline-flex items-center gap-2.5">${f.price(t)} ${m("toman")}</span>`,X=(t=C())=>s`
    <div class="flex h-14 items-center px-6 md:px-12 lg:hidden">
      <a href="${t}" data-nav class="flex items-center gap-2 text-13 text-on-surface-var transition-opacity hover:opacity-70">
        ${m("chevronRight")} بازگشت
      </a>
    </div>
  `,A=(t,e)=>s`
    <div class="flex min-h-14 flex-col justify-center rounded-[16px] px-4 py-2">
      <span class="text-10 text-on-surface-var">${t}</span>
      <span class="text-16 text-on-surface">${e}</span>
    </div>
  `,F=t=>s`<p class="animate-fade-up py-16 text-center text-16 text-on-surface-var">${t}</p>`,Z=()=>s`<p class="m-6 rounded-[16px] bg-error-container p-4 text-center text-13 text-on-error-container">بارگذاری اطلاعات انجام نشد. لطفا صفحه را دوباره باز کنید.</p>`,K=[{key:"info",label:"اطلاعات فردی",icon:"user",href:C({view:"info"})},{key:"addresses",label:"آدرس‌ها",icon:"mapPinHouse",href:C({view:"addresses"})},{key:"orders",label:"سفارش‌ها",icon:"truck",href:C({view:"orders"})},{key:"support",label:"پشتیبانی",icon:"lifeBuoy",href:"contact.html"}];function V(t,{active:e=!1,compact:a=!1}={}){return t?s`
      <a
        href="${C({view:"order",id:t.id})}"
        data-nav
        aria-label="${`سفارش جاری، ${t.badge?[t.badge.caption,t.badge.label].filter(Boolean).join(" "):""}`}"
        class="${E("flex items-center justify-between gap-4 transition-colors",!a&&"rounded-[24px] border border-hairline p-6 hover:bg-surface-low",e&&!a&&"bg-surface-low")}"
      >
        ${O(t.image)} ${q(t.badge)} ${m("chevronLeft",{cls:"shrink-0 text-on-surface"})}
      </a>
    `:""}function ee(t,e){let{customer:a,currentOrder:n}=t.account,l=e.name==="order"&&n&&e.id===n.id,d=e.name==="order"?l?"":"orders":e.name;return s`
      <aside aria-label="حساب کاربری" class="hidden w-[400px] shrink-0 flex-col gap-4 p-8 lg:flex xl:w-[463px]">
        ${V(n,{active:l})}
        <nav class="flex flex-col gap-8 rounded-[32px] border border-black-10 p-6">
          ${K.map(i=>{let r=i.key===d;return s`
              <a
                href="${i.href}"
                ${i.key!=="support"?s`data-nav`:""}
                ${r?s`aria-current="page"`:""}
                class="${E("flex items-start gap-2 rounded-[24px] p-4 transition-colors",r?"bg-field":"hover:bg-surface-low")}"
              >
                ${m(i.icon,{cls:"shrink-0 text-on-surface"})}
                <span class="flex flex-col gap-2.5">
                  <span class="text-16 text-ink">${i.label}</span>
                  ${i.key==="info"&&s`<span class="text-13 text-ink-var">${H(a)} - ${f.digits(a.mobile)}</span>`}
                </span>
              </a>
            `})}
          <button type="button" data-action="logout" class="flex items-center gap-2 rounded-[24px] p-4 text-16 text-error transition-colors hover:bg-error-container/40">
            ${m("logOut",{cls:"shrink-0"})} خروج از حساب کاربری
          </button>
        </nav>
      </aside>
    `}let H=t=>[t.firstName,t.lastName].filter(Boolean).join(" ")||"کاربر ماسو";function te(t){let{customer:e,currentOrder:a}=t.account;return s`
      <div class="animate-fade-up w-full">
        <div class="p-6 md:px-12">
          <h1 class="bg-linear-to-b from-on-surface-var to-on-surface-var/60 bg-clip-text text-20 font-bold text-transparent">حساب کاربری</h1>
        </div>
        ${a&&s`<section aria-label="سفارش جاری" class="flex flex-col gap-6 border-b-4 border-outline-var p-6 md:px-12">
          <h2 class="text-13 text-on-surface-var">سفارش جاری</h2>
          ${V(a,{compact:!0})}
        </section>`}
        <nav class="flex flex-col gap-6 p-6 md:px-12">
          ${K.map(n=>s`
              <a
                href="${n.href}"
                ${n.key!=="support"?s`data-nav`:""}
                class="flex items-center justify-between gap-4 border-b border-[#e8e8e8] pb-6 transition-opacity hover:opacity-70"
              >
                <span class="flex items-start gap-2">
                  ${m(n.icon,{cls:"shrink-0 text-on-surface"})}
                  <span class="flex flex-col gap-2.5">
                    <span class="text-16 text-on-surface">${n.label}</span>
                    ${n.key==="info"&&s`<span class="text-13 text-on-surface-var">${H(e)} - ${f.digits(e.mobile)}</span>`}
                  </span>
                </span>
                ${m("chevronLeft",{cls:"shrink-0 text-on-surface"})}
              </a>
            `)}
          <button type="button" data-action="logout" class="flex items-center gap-2 self-start text-16 text-error transition-opacity hover:opacity-70">
            ${m("logOut",{cls:"shrink-0"})} خروج از حساب کاربری
          </button>
        </nav>
      </div>
    `}function ae(t){let e=t.account.customer,a=(n,l,d,i,r)=>s`
      <div class="${E("flex items-center justify-between gap-4",!r&&"border-b border-outline-var pb-4 lg:border-hairline")}">
        <div class="flex min-w-0 flex-col gap-2.5">
          <span class="text-13 text-on-surface-var lg:text-ink-var">${n}</span>
          <span class="text-16 break-words text-on-surface lg:text-ink">${l||"-"}</span>
        </div>
        <button
          type="button"
          data-action="${d}"
          aria-label="${i}"
          class="flex size-12 shrink-0 items-center justify-center rounded-full text-on-surface transition-colors hover:bg-surface-low"
        >
          ${m(d==="email"&&!e.email?"plusCircle":"pencil")}
        </button>
      </div>
    `;return s`
      <div class="animate-fade-up flex flex-col gap-6 p-6 md:px-12 lg:py-6">
        <h1 class="sr-only">اطلاعات فردی</h1>
        ${a("نام",e.firstName,"firstName","تغییر نام")}
        ${a("نام خانوادگی",e.lastName,"lastName","تغییر نام خانوادگی")}
        ${a("شماره همراه",f.digits(e.mobile),"mobile","تغییر شماره همراه")}
        ${a("ایمیل",e.email,"email",e.email?"تغییر ایمیل":"افزودن ایمیل",!0)}
      </div>
    `}function R(t,e,a){let n=t.account.customer,l={firstName:{title:"تغییر نام",label:"نام",max:60,attrs:{autocomplete:"given-name"}},lastName:{title:"تغییر نام خانوادگی",label:"نام خانوادگی",max:60,attrs:{autocomplete:"family-name"}},email:{title:n.email?"تغییر ایمیل":"افزودن ایمیل",label:"ایمیل",max:120,attrs:{type:"email",dir:"ltr",autocomplete:"email",inputmode:"email"}}}[e],d=g.sheet({title:l.title,cardRadius:32,removeOnClose:!0});c.render(d.body,s`<form novalidate class="flex flex-col gap-4 p-6">
        ${M.text({name:e,label:l.label,value:n[e]||"",attrs:{maxlength:l.max,...l.attrs}})}
        <p data-form-error role="alert" hidden class="text-13 text-error"></p>
        <button type="submit" class="${S}">ذخیره</button>
      </form>`);let i=c.$("form",d.body),r=i.elements.namedItem(e);r.addEventListener("input",()=>M.setError(c.$(`[data-field="${e}"]`,i),null)),i.addEventListener("submit",async o=>{o.preventDefault();let u=r.value.replace(/\s+/g," ").trim().slice(0,l.max),x=null;if(e!=="email"&&u.length<2&&(x=`${l.label} را وارد کنید.`),e==="email"&&u&&!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(u)&&(x="ایمیل معتبر نیست."),M.setError(c.$(`[data-field="${e}"]`,i),x),x)return r.focus();let k=c.$("button[type=submit]",i);k.disabled=!0;try{t.account.customer=await h.account.update({[e]:u}),d.close(),a()}catch(I){if(w(I))return;let z=c.$("[data-form-error]",i);z.textContent="ذخیره انجام نشد. لطفا دوباره تلاش کنید.",z.hidden=!1,k.disabled=!1}}),d.open(),requestAnimationFrame(()=>r.focus())}function re(t,e){let a=g.sheet({title:"تغییر شماره",cardRadius:32,removeOnClose:!0,onClose:()=>clearInterval(i)}),n="",l=4,d=0,i=0,r=!1,o=(b,p)=>s`
      <div class="flex flex-col gap-2">
        <h3 class="text-20 font-bold text-on-surface">${b}</h3>
        <p class="text-13 text-on-surface-var">${p}</p>
      </div>
    `,u=s`<p data-error role="alert" hidden class="mt-1 ps-4 text-13 text-error"></p>`,x=b=>{let p=c.$("[data-error]",a.body);p.textContent=b||"",p.hidden=!b,c.$("[data-ring]",a.body)?.classList.toggle("ring-error",!!b)};async function k(b,p){let L=_.mobile(b);if(!L)return x("شماره همراه معتبر نیست.");if(L===t.account.customer.mobile)return x("این شماره همین الان روی حساب شماست.");r=!0;try{let y=await h.account.requestMobileChange(L);n=L,l=y.length||4,d=Date.now()+(y.resendIn||120)*1e3,p()}catch(y){if(w(y))return;x(y?.status===409?"این شماره روی حساب دیگری ثبت شده است.":"ارسال کد انجام نشد. کمی بعد دوباره تلاش کنید.")}finally{r=!1}}function I(){clearInterval(i),c.render(a.body,s`<form novalidate class="flex min-h-[300px] flex-col justify-between gap-6 p-6">
          <div class="flex flex-col gap-4">
            ${o("شماره همراه جدید","شماره همراهی که می‌خواهید حسابتان به آن تغییر کند را وارد کنید.")}
            <div>
              <input
                data-ring
                type="tel"
                inputmode="tel"
                autocomplete="tel-national"
                dir="ltr"
                value="${n}"
                placeholder="شماره همراه"
                aria-label="شماره همراه جدید"
                class="h-14 w-full rounded-[16px] bg-field px-4 text-right text-16 text-on-surface ring-1 ring-transparent outline-none transition-shadow placeholder:text-outline focus:ring-primary/30"
              />
              ${u}
            </div>
          </div>
          <button type="submit" class="${S}">ادامه</button>
        </form>`);let b=c.$("input",a.body);b.addEventListener("input",()=>x(null)),c.$("form",a.body).addEventListener("submit",p=>{p.preventDefault(),r||k(b.value,z)}),requestAnimationFrame(()=>b.focus())}function z(){c.render(a.body,s`<form novalidate class="flex flex-col gap-6 p-6">
          <button type="button" data-step-back class="flex items-center gap-1 self-start text-13 text-on-surface transition-opacity hover:opacity-70">
            ${m("chevronRight",{size:18})} بازگشت
          </button>
          ${o("کد یکبارمصرف",s`کد یکبار مصرف ارسال شده به شماره <span class="text-on-surface">${f.digits(n)}</span>`)}
          <div>
            <label data-ring class="relative flex h-14 w-full cursor-text items-center justify-center rounded-[16px] bg-field ring-1 ring-transparent transition-shadow">
              <input inputmode="numeric" autocomplete="one-time-code" maxlength="${l}" aria-label="کد یکبار مصرف" class="absolute inset-0 size-full bg-transparent text-transparent caret-transparent outline-none" />
              <span data-slots dir="ltr" aria-hidden="true" class="pointer-events-none flex w-[190px] justify-between text-16"></span>
            </label>
            ${u}
          </div>
          <button type="button" data-resend class="mx-auto flex h-12 items-center justify-center rounded-[12px] px-4 text-13 text-ink transition-opacity"></button>
          <button type="submit" class="${S}">ادامه</button>
        </form>`);let b=c.$("form",a.body),p=c.$("input",b),L=c.$("[data-slots]",b),y=c.$("[data-resend]",b),j=()=>{let v=document.activeElement===p;c.render(L,Array.from({length:l},(N,J)=>{let P=p.value[J];return s`<span class="${E("w-2.5 text-center",P?"text-on-surface":"text-ink-muted",v&&J===p.value.length&&"animate-pulse text-primary")}"
              >${P?f.digits(P):"-"}</span
            >`}))},T=()=>{let v=Math.max(0,Math.ceil((d-Date.now())/1e3));y.disabled=v>0,y.classList.toggle("opacity-30",v>0),y.classList.toggle("text-secondary",!v),y.textContent=v>0?`ارسال مجدد در ${f.digits(`${Math.floor(v/60)}:${String(v%60).padStart(2,"0")}`)}`:"ارسال مجدد کد",v||clearInterval(i)};async function G(){if(r)return;let v=_.latinDigits(p.value).replace(/\D/g,"");if(v.length<l)return x("کد را کامل وارد کنید.");r=!0;try{let N=await h.account.confirmMobileChange(n,v);if(!N)return p.value="",j(),x("کد وارد شده صحیح نیست.");t.account.customer=N,a.close(),e()}catch(N){w(N)||x("تغییر شماره انجام نشد. لطفا دوباره تلاش کنید.")}finally{r=!1}}p.addEventListener("input",()=>{p.value=p.value.replace(/[^\d۰-۹]/g,"").slice(0,l),x(null),j(),p.value.length===l&&G()}),p.addEventListener("focus",j),p.addEventListener("blur",j),b.addEventListener("submit",v=>{v.preventDefault(),G()}),c.$("[data-step-back]",b).addEventListener("click",I),y.addEventListener("click",()=>k(n,()=>{p.value="",x(null),j(),clearInterval(i),i=setInterval(T,1e3),T()})),clearInterval(i),i=setInterval(T,1e3),T(),j(),requestAnimationFrame(()=>p.focus())}I(),a.open()}let se="inline-flex h-14 w-full max-w-[354px] items-center justify-center gap-1 rounded-full bg-[#cce3ff] px-3 text-16 text-[#003a80] transition-[background-color,transform] duration-300 ease-out-expo hover:bg-[#b8d8ff] active:scale-[0.98]";function ne(t,e){return s`
      <li data-reveal style="--reveal-index:${e%4}" class="flex items-center gap-4 rounded-[26px] bg-surface-low p-4">
        <div class="flex min-w-0 flex-1 flex-col gap-2">
          ${A("آدرس",g.formatAddress(t))} ${A("کد پستی",f.digits(t.postalCode))}
        </div>
        <div class="flex shrink-0 flex-col">
          <button type="button" data-action="edit-address" data-id="${t.id}" aria-label="ویرایش آدرس" class="flex size-12 items-center justify-center rounded-full text-on-surface transition-colors hover:bg-surf-container">
            ${m("pencil")}
          </button>
          <button type="button" data-action="delete-address" data-id="${t.id}" aria-label="حذف آدرس" class="flex size-12 items-center justify-center rounded-full text-error transition-colors hover:bg-error-container/50">
            ${m("trash")}
          </button>
        </div>
      </li>
    `}function le(t){let e=t.addresses;return e?s`
      <div class="flex flex-col gap-8 p-6 pb-28 md:px-12 lg:px-0 lg:pb-6">
        <h1 class="sr-only">آدرس‌ها</h1>
        ${e.length?s`<ul class="flex flex-col gap-4">${e.map(ne)}</ul>`:s`<div class="flex flex-col items-center gap-4 py-8 text-center">
              ${m("locationEmpty",{size:200})}
              <p class="text-16 text-on-surface-var">هنوز آدرسی ثبت نکرده‌اید.</p>
            </div>`}
        <!-- Phones: pinned to the bottom of the screen; desktop: under the list -->
        <div class="fixed inset-x-0 bottom-0 z-30 flex justify-center bg-linear-to-t from-white via-white/90 to-white/0 p-6 pt-10 lg:static lg:bg-none lg:p-0">
          <button type="button" data-action="new-address" class="${se}">${m("plusCircle",{size:18})} آدرس جدید</button>
        </div>
      </div>
    `:s`<div class="flex flex-col gap-4 p-6 lg:px-0">${[0,1,2].map(()=>s`<div class="h-[152px] animate-pulse rounded-[26px] bg-skeleton"></div>`)}</div>`}function oe(t,e,a){let n=g.sheet({title:"حذف آدرس",cardRadius:32,removeOnClose:!0});c.render(n.body,s`<div class="flex flex-col gap-4 p-6">
        <p class="text-16 font-semibold text-on-surface">آیا از حذف آدرس زیر مطمعنید؟</p>
        <div class="flex flex-col gap-2 rounded-[24px] border border-black-10 py-2">${A("آدرس",g.formatAddress(e))} ${A("کد پستی",f.digits(e.postalCode))}</div>
        <p data-form-error role="alert" hidden class="text-13 text-error"></p>
        <div class="flex items-center gap-2 pt-2">
          <button type="button" data-cancel class="h-14 px-4 text-16 text-on-surface transition-opacity hover:opacity-70">انصراف</button>
          <button
            type="button"
            data-confirm
            class="inline-flex h-14 flex-1 items-center justify-center rounded-full bg-error px-6 text-16 text-white transition-[background-color,transform,opacity] duration-300 ease-out-expo hover:bg-error/90 active:scale-[0.98] disabled:opacity-40"
          >
            بله، حذف کن
          </button>
        </div>
      </div>`),c.$("[data-cancel]",n.body).addEventListener("click",n.close),c.$("[data-confirm]",n.body).addEventListener("click",async l=>{l.currentTarget.disabled=!0;try{await h.account.removeAddress(e.id),t.addresses=t.addresses.filter(d=>d.id!==e.id),n.close(),a()}catch(d){if(w(d))return;let i=c.$("[data-form-error]",n.body);i.textContent="حذف آدرس انجام نشد. لطفا دوباره تلاش کنید.",i.hidden=!1,l.currentTarget.disabled=!1}}),n.open()}function ie(t,e){let a=t.status==="pre";return s`
      <li data-reveal style="--reveal-index:${e%4}">
        <a
          href="${C({view:"order",id:t.id})}"
          ${a?s`data-action="pre-invoice" data-id="${t.id}"`:s`data-nav`}
          class="group flex flex-col gap-6 border-b border-outline-var pb-4"
        >
          <span class="flex items-center justify-between">
            ${O(t.image)} ${m("chevronLeft",{cls:"text-on-surface transition-transform duration-300 group-hover:-translate-x-1"})}
          </span>
          <dl class="flex flex-col gap-3">
            ${$("شماره سفارش",f.digits(t.number))} ${$("پرداختی",Q(t.total))}
            ${t.badge&&s`<div class="flex items-center justify-between gap-4 text-16"><dt class="text-outline">وضعیت</dt><dd>${q(t.badge)}</dd></div>`}
          </dl>
        </a>
      </li>
    `}function ce(t,e){let a=e.tab,n=t.orders[a],l={pre:"پیش‌فاکتوری برای تایید ندارید.",current:"سفارش در حال انجامی ندارید.",delivered:"هنوز سفارشی تحویل نگرفته‌اید.",returned:"سفارش مرجوعی ندارید."};return s`
      <div class="flex flex-col gap-4 lg:pt-0">
        <h1 class="sr-only">سفارش‌ها</h1>
        <div role="tablist" aria-label="وضعیت سفارش" class="no-scrollbar flex overflow-x-auto border-b border-outline-var md:px-12 lg:px-12">
          ${B.map(d=>s`<a
              role="tab"
              href="${C({view:"orders",tab:d.key})}"
              data-nav
              data-replace
              aria-selected="${d.key===a}"
              class="${E("flex h-10 min-w-[25%] flex-1 shrink-0 items-center justify-center border-b-2 px-3 text-16 whitespace-nowrap transition-colors lg:w-[169px] lg:min-w-0 lg:flex-none",d.key===a?"border-on-surface text-on-surface":"border-transparent text-on-surface-var hover:text-on-surface")}"
              >${d.label}</a
            >`)}
        </div>
        <div role="tabpanel" class="p-6 md:px-12">
          ${n?n.length?s`<ul class="flex flex-col gap-4">${n.map(ie)}</ul>`:F(l[a]):s`<div class="flex flex-col gap-4">${[0,1].map(()=>s`<div class="h-60 animate-pulse rounded-[16px] bg-skeleton"></div>`)}</div>`}
        </div>
      </div>
    `}async function de(t){let e=g.sheet({title:"پیش فاکتور شما",variant:"drawer",removeOnClose:!0});e.body.classList.add("flex","flex-1","flex-col","gap-6"),c.render(e.body,s`<div class="aspect-[354/198] animate-pulse rounded-[32px] bg-skeleton"></div>`),e.open();let a;try{a=await h.account.order(t)}catch(l){if(w(l))return}let n=a?.preInvoice;if(!n){c.render(e.body,s`<p class="rounded-[16px] bg-error-container p-4 text-center text-13 text-on-error-container">پیش فاکتور پیدا نشد.</p>`);return}c.render(e.body,s`
        <div class="animate-fade-up flex flex-col gap-4">
          ${D.img(n.image,{cls:"aspect-[354/198] w-full rounded-[32px] object-cover",alt:n.image.alt||""})}
          <p class="line-clamp-6 text-center text-13 text-on-surface">${n.description}</p>
        </div>
        <hr class="-mx-6 border-0 border-t-2 border-outline-var" />
        <div class="flex flex-col gap-6">
          <h3 class="text-13 text-on-surface-var">رسید پرداخت</h3>
          <dl class="flex flex-col gap-2">
            ${$("نام و نام خانوادگی",n.customerName)} ${$("شماره پیگیری",f.digits(n.trackingCode))} ${$("شماره همراه",f.digits(n.mobile))}
            ${$("تاریخ",f.dateNumeric(n.date))}
          </dl>
        </div>
        <div class="mt-auto pt-2">
          ${n.downloadUrl?s`<a href="${n.downloadUrl}" download="${`pre-invoice-${a.number}`}" target="_blank" rel="noopener" class="${S}">دانلود پیش فاکتور</a>`:s`<button type="button" disabled class="${S}">دانلود پیش فاکتور</button>`}
        </div>
      `)}let ue=[{label:"محصول در حال آماده سازی",icon:"package"},{label:"محصول ارسال شده",icon:"truck"},{label:"تحویل گرفته شده",icon:"circleCheck"}],pe=s`<svg width="32" height="3" viewBox="0 0 32 3" aria-hidden="true" class="mt-2.5 shrink-0 text-on-surface-var"><path d="M0 1.5h32" stroke="currentColor" stroke-width="3" stroke-dasharray="8 4" /></svg>`;function fe(t,e){return s`
      <li ${e?s`hidden data-more-item`:""} class="flex items-center gap-4 border-b border-outline-var pb-4 last:border-b-0">
        ${O(t.image,"size-[113px] rounded-[32px]")}
        <!-- Figma edit 27: name and price side by side, the chosen finishes underneath -->
        <div class="flex min-w-0 flex-1 flex-col gap-4">
          <div class="flex flex-wrap items-start justify-between gap-x-2 gap-y-3">
            <h3 class="text-20 text-on-surface">
              ${t.slug?s`<a href="${g.url.product(t.slug)}" class="hover:underline">${t.name}</a>`:t.name}
              ${t.qty>1&&s`<span class="text-13 text-on-surface-var">× ${f.digits(t.qty)}</span>`}
            </h3>
            ${D.price({price:t.price,regularPrice:t.regularPrice,size:"sm"})}
          </div>
          ${t.options?.some(a=>a.swatch)&&s`<ul class="flex items-center gap-2" aria-label="انتخاب‌ها">
            ${t.options.filter(a=>a.swatch).map(a=>s`<li
                  title="${`${a.label}: ${a.value}`}"
                  class="relative size-6 overflow-hidden rounded-full after:absolute after:inset-0 after:rounded-full after:shadow-[inset_0_5px_2px_rgba(0,0,0,0.25)]"
                >
                  ${D.img(a.swatch,{alt:a.value,width:24,height:24,cls:"size-full object-cover"})}
                </li>`)}
          </ul>`}
        </div>
      </li>
    `}function xe(t,e){let a=t.orderCache[e.id];if(a===void 0)return s`<div class="flex flex-col gap-6 p-6 md:px-12">
        <div class="h-[60px] animate-pulse rounded-[16px] bg-skeleton"></div>
        <div class="h-[110px] animate-pulse rounded-[26px] bg-skeleton"></div>
        <div class="h-[260px] animate-pulse rounded-[16px] bg-skeleton"></div>
      </div>`;if(!a)return F("این سفارش پیدا نشد.");let n=Math.max(1,Math.min(3,a.step||1)),l=2,d="flex flex-col gap-6 border-b-2 border-outline-var p-6 md:px-12";return s`
      <div class="animate-fade-up">
        <h1 class="sr-only">${`سفارش ${f.digits(a.number)}`}</h1>
        <section aria-label="وضعیت سفارش" class="${d}">
          <ol class="flex items-start justify-center gap-3 md:gap-6">
            ${ue.map((i,r)=>s`${r>0?pe:""}
                <li ${r+1===n?s`aria-current="step"`:""} class="${E("flex max-w-[172px] flex-1 flex-col items-center gap-4 text-center",r+1>n&&"opacity-50")}">
                  ${m(i.icon,{cls:r+1===n?"text-secondary":"text-on-surface"})}
                  <span class="text-13 text-on-surface">${i.label}</span>
                </li>`)}
          </ol>
          ${a.address&&s`<div class="rounded-[26px] border border-black-10 px-4 py-6">${A("ارسال به آدرس",a.address)}</div>`}
        </section>

        <section aria-labelledby="order-items" class="${d}">
          <h2 id="order-items" class="text-13 text-on-surface-var">محصولات</h2>
          <ul class="flex flex-col gap-6">${a.items.map((i,r)=>fe(i,r>=l))}</ul>
          ${a.items.length>l&&s`<button type="button" data-action="more-items" class="mx-auto flex h-12 items-center gap-1 rounded-[16px] px-3 text-16 text-primary transition-opacity hover:opacity-70">
            ${m("chevronDown",{size:18})} بیشتر
          </button>`}
        </section>

        ${a.receipt&&s`<section aria-labelledby="order-receipt" class="flex flex-col gap-6 p-6 md:px-12">
          <div class="flex items-center justify-between gap-4">
            <h2 id="order-receipt" class="text-13 text-on-surface-var">رسید پرداخت</h2>
            <a
              href="${g.url.page(a.receiptUrl||`/checkout/result?order=${a.id}`)}"
              class="inline-flex h-12 items-center justify-center rounded-full border border-secondary px-3 text-16 text-secondary transition-colors hover:bg-secondary/5"
              >مشاهده رسید پرداخت</a
            >
          </div>
          <dl class="flex flex-col gap-2">
            ${$("شماره سفارش",f.digits(a.receipt.orderNumber))} ${$("شماره پیگیری",f.digits(a.receipt.trackingCode))}
            ${a.receipt.transactionId&&$("شماره تراکنش",s`<span dir="ltr">${f.digits(a.receipt.transactionId)}</span>`)}
            ${$("تاریخ",f.dateNumeric(a.receipt.date))} ${$("زمان",f.time(a.receipt.date))}
          </dl>
        </section>`}
      </div>
    `}function W(){location.replace(`login.html?next=${encodeURIComponent(`profile.html${location.search}`)}`)}function w(t){return t?.status!==401?!1:(g.session.clear(),W(),!0)}async function me(){await h.account.logout(),g.session.clear(),location.href="index.html"}function Y(){let t=new URLSearchParams(location.search),e=t.get("view")||"";["info","addresses","orders","order"].includes(e)||(e=""),e==="order"&&!t.get("id")&&(e="orders"),!e&&U.matches&&(e="info");let a=B.some(n=>n.key===t.get("tab"))?t.get("tab"):"current";return{name:e||"menu",tab:a,id:t.get("id")||""}}let be={menu:"حساب کاربری",info:"اطلاعات فردی",addresses:"آدرس‌ها",orders:"سفارش‌ها",order:"جزئیات سفارش"};c.ready(async()=>{if(!g.session.get())return W();let t=c.$("#profile"),e={account:null,addresses:null,orders:{},orderCache:{},provinces:null},a=null;try{e.account=await h.account.get()}catch(r){if(w(r))return;c.render(t,Z()),t.removeAttribute("aria-busy");return}function n(r){if(r.name==="addresses"&&!e.addresses&&h.account.addresses().then(o=>e.addresses=o).catch(o=>w(o)?null:e.addresses=[]).then(l),r.name==="orders"&&!e.orders[r.tab]){let o=r.tab;h.account.orders(o).then(u=>e.orders[o]=u).catch(u=>w(u)?null:e.orders[o]=[]).then(l)}if(r.name==="order"&&!(r.id in e.orderCache)){let o=r.id;h.account.order(o).then(u=>e.orderCache[o]=u).catch(u=>w(u)?null:e.orderCache[o]=null).then(l)}}function l(){let r=Y();document.title=`${be[r.name]} | ماسو`;let o=r.name==="menu"?te(e):r.name==="info"?ae(e):r.name==="addresses"?le(e):r.name==="orders"?ce(e,r):xe(e,r),u=r.name==="info"||r.name==="order",x=r.name==="order"?C({view:"orders",tab:e.orderCache[r.id]?.status||"current"}):C();c.render(t,s`
          ${ee(e,r)}
          <div class="${E("min-w-0 flex-1 lg:py-8 lg:pe-8",u&&"lg:border-s lg:border-outline-var")}">
            ${r.name!=="menu"?X(x):""}
            <div class="lg:ps-0">${o}</div>
          </div>
        `),t.removeAttribute("aria-busy")}function d(){l(),n(Y())}async function i(r){return a||(r.disabled=!0,e.provinces??(e.provinces=await h.locations().catch(()=>null)),r.disabled=!1,e.provinces?(a=g.addressDialog({provinces:e.provinces,async onSaved(o){try{let u=await h.account.saveAddress(o),x=e.addresses||[];e.addresses=x.some(k=>k.id===o.id)?x.map(k=>k.id===o.id?u:k):[u,...x],l()}catch(u){w(u)}}}),a):null)}t.addEventListener("click",r=>{let o=r.target.closest("a[data-nav]");if(!o||r.ctrlKey||r.metaKey||r.shiftKey||r.button!==0)return;r.preventDefault();let u=o.getAttribute("href");u!==`profile.html${location.search}`&&history[o.hasAttribute("data-replace")?"replaceState":"pushState"](null,"",u),d(),o.hasAttribute("data-replace")||window.scrollTo({top:0})}),addEventListener("popstate",d),U.addEventListener("change",d),c.actions(t,{logout:me,firstName:()=>R(e,"firstName",l),lastName:()=>R(e,"lastName",l),email:()=>R(e,"email",l),mobile:()=>re(e,l),async"new-address"(r){(await i(r))?.open()},async"edit-address"(r){let o=e.addresses?.find(u=>u.id===r.dataset.id);o&&(await i(r))?.open(o)},"delete-address"(r){let o=e.addresses?.find(u=>u.id===r.dataset.id);o&&oe(e,o,l)},"pre-invoice"(r,o){o.preventDefault(),de(r.dataset.id)},"more-items"(r){c.$$("[data-more-item]",t).forEach(o=>{o.hidden=!1,o.classList.add("animate-fade-up")}),r.remove()}}),d()})})();})();
//# sourceMappingURL=profile.js.map?v=a9f27d9d5b
