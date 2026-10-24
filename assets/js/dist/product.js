(()=>{(function(){"use strict";let d=window.Maso,{html:a,icon:f,fmt:g,url:A,cx:m,dom:o,api:se,pricing:y,ui:p}=d,H="px-6 md:px-12",G="اگر ترکیب مطمئن نیستید، تست محصول را سفارش دهید.",ne=(t,l)=>a`
    <div class="flex flex-col items-start">
      ${d.raw(`<${l} class="bg-linear-to-b from-black to-black/30 bg-clip-text text-20 font-bold text-transparent">`)}${t.name}${d.raw(`</${l}>`)}
      <p class="text-16 text-on-surface">تحویل تا <strong class="font-extrabold">${g.digits(t.deliveryDays)}</strong> روز کاری</p>
    </div>
  `,Q=(t,l,r)=>a`
    <p class="${m("flex items-center gap-2.5 text-ink",r)}">
      <span dir="ltr">${t===l?g.price(t):`${g.price(l)} - ${g.price(t)}`}</span>
      ${f("toman")}
    </p>
  `,D=(t,l)=>a`
    <p class="${m("flex items-center gap-2.5 font-bold text-ink",l)}"><span>${g.price(t)}</span>${f("toman")}</p>
  `,E=(t,l,{gap:r="gap-8",top:h="pt-4"}={})=>a`
    <details data-accordion class="group/acc shadow-[inset_0_-1.5px_0_var(--color-outline-var)]">
      <summary class="acc-summary flex cursor-pointer list-none items-center justify-between gap-6 [&::-webkit-details-marker]:hidden">
        ${t}
        <span aria-hidden="true" class="flex size-12 shrink-0 items-center justify-center text-ink transition-transform duration-500 ease-out-expo group-hover/acc:scale-110">
          <svg class="acc-plus" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" shape-rendering="geometricPrecision">
            <path d="M5 12h14" />
            <path d="M12 5v14" class="acc-plus-v" />
          </svg>
        </span>
      </summary>
      <div data-accordion-body><div class="${m("flex flex-col pb-6",h,r)}">${l}</div></div>
    </details>
  `,re=t=>a`<h2 class="text-16 font-bold text-ink">${t}</h2>`,V=t=>a`<h2 class="bg-linear-to-b from-black to-black/30 bg-clip-text text-16 font-bold text-transparent">${t}</h2>`,le=(t,l)=>a`
    <div class="flex w-full flex-col gap-8">
      <ul
        data-gallery
        aria-label="${`تصاویر ${l}`}"
        class="no-scrollbar -mx-6 flex snap-x snap-mandatory scroll-px-6 gap-6 overflow-x-auto lg:gap-5 overscroll-x-contain px-6 md:-mx-12 md:scroll-px-12 md:px-12 lg:ms-0 lg:-me-12 lg:scroll-ps-0 lg:ps-0 lg:pe-12"
      >
        ${t.map((r,h)=>a`<li class="relative size-[340px] shrink-0 snap-start overflow-hidden rounded-[32px] bg-surface-low lg:size-[290px]">
            ${p.img(r,{eager:h===0,cls:"absolute inset-0 size-full object-cover transition-transform duration-700 ease-out-expo hover:scale-[1.03]"})}
          </li>`)}
      </ul>
      ${t.length>1&&a`<!-- Physical left-to-right like the design: dots first, active pill last (image 0 is the right-most slide) -->
        <div dir="ltr" data-dots class="flex items-center justify-center gap-1" role="tablist" aria-label="انتخاب تصویر">
          ${t.map((r,h)=>{let w=t.length-1-h;return a`<button type="button" role="tab" data-index="${w}" aria-label="${`تصویر ${g.digits(w+1)}`}"></button>`})}
        </div>`}
    </div>
  `,ie=t=>a`
    <section aria-label="ویژگی‌ها" class="flex justify-center pt-6 pb-20 ${H}">
      <ul class="flex w-full max-w-[900px] gap-3 lg:gap-8">
        ${t.map((l,r)=>a`<li data-reveal style="--reveal-index:${r}" class="flex flex-1 flex-col items-start gap-4 overflow-hidden rounded-2xl border border-hairline p-[11px]">
            <p class="text-16 text-ink">${l.text}</p>
            ${p.img(l.icon,{alt:"",width:24,height:24})}
          </li>`)}
      </ul>
    </section>
  `,U=t=>a`
    <li class="flex items-center gap-2 overflow-hidden rounded-2xl border border-hairline bg-surface-low">
      <span class="flex h-[46px] min-w-0 flex-1 items-center justify-center px-[27px] py-1 text-16 whitespace-nowrap text-ink-var">${t.label}</span>
      <span class="flex min-w-0 flex-1 items-center justify-center self-stretch rounded-2xl bg-hairline px-4 py-[11px] text-16 whitespace-nowrap text-ink">
        ${t.value===!0?f("checkCircle"):t.value===!1?f("crossCircle"):a`<span dir="ltr">${t.value}</span>`}
      </span>
    </li>
  `,oe=(t,l)=>E(a`<h2 class="text-16 font-bold text-ink">در یک نگاه. <span class="text-[#999]">مشخصات تخصصی محصول</span></h2>`,a`<ul class="flex flex-col gap-2">${t.slice(0,l).map(U)}</ul>
        ${t.length>l&&a`<ul data-more-specs hidden class="-mt-4 flex flex-col gap-2">${t.slice(l).map(U)}</ul>
          <button
            type="button"
            data-action="more-specs"
            aria-expanded="false"
            class="flex h-12 w-full items-center justify-center gap-1 rounded-2xl px-3 text-16 text-ink-strong"
          >
            <span>بیشتر</span>${f("chevronDown",{size:18,cls:"transition-transform"})}
          </button>`}`,{gap:"gap-6",top:"pt-2"}),ce=t=>E(re("فضای مورد نیاز"),a`<div class="flex flex-col gap-8 lg:flex-row lg:items-center lg:py-4">
        <dl class="flex flex-col gap-2 lg:flex-1">
          ${t.rows.map(l=>a`<div class="flex items-center justify-between gap-3 whitespace-nowrap">
              <dt class="text-13 text-on-surface-var">${l.label}</dt>
              <dd class="text-16 text-on-surface" dir="ltr">${l.value}</dd>
            </div>`)}
        </dl>
        <!-- Drawn LTR so the dimension lines sit where the design puts them -->
        <figure dir="ltr" class="flex flex-col items-center gap-3 self-center lg:flex-1">
          <div class="flex h-[189px] items-center gap-3">
            <div class="w-[51px]" aria-hidden="true"></div>
            ${p.img(t.diagram,{width:152,height:189})}
            <div class="flex h-full w-[51px] items-center justify-center border-l border-on-surface text-13 text-on-surface">${t.depth}</div>
          </div>
          <figcaption class="flex h-[51px] w-[189px] items-center justify-center border-t border-on-surface text-13 text-on-surface">${t.width}</figcaption>
        </figure>
      </div>`);function de(t){let l=document.createElement("div");return l.innerHTML=t,l.querySelectorAll("a[href^='/']").forEach(r=>r.setAttribute("href",A.page(r.getAttribute("href")))),E(V("در باره محصول"),a`<div class="prose-maso">${d.raw(l.innerHTML)}</div>`)}let pe=t=>t.length&&a`${E(V("سوالات متداول"),a`<div class="flex flex-col gap-3">
        ${t.map(l=>a`<details data-accordion data-accordion-group="product-faq">
            <summary class="flex h-12 cursor-pointer list-none items-center justify-between text-16 text-[#1c1c1c] [&::-webkit-details-marker]:hidden">
              ${l.question} ${f("chevronLeft",{cls:"acc-chevron"})}
            </summary>
            <div data-accordion-body><p class="pb-3 text-16 text-ink-var">${l.answer}</p></div>
          </details>`)}
      </div>`,{gap:"gap-0"})}
    ${p.jsonLd({"@context":"https://schema.org","@type":"FAQPage",mainEntity:t.map(l=>({"@type":"Question",name:l.question,acceptedAnswer:{"@type":"Answer",text:l.answer}}))})}`,xe=t=>a`
    <div class="${H} pb-16">
      <!-- The last section has no rule under it -->
      <div class="mx-auto flex max-w-[900px] flex-col [&>details:last-of-type]:shadow-none">
        ${oe(t.specs,t.specsVisible)} ${t.space&&ce(t.space)} ${de(t.descriptionHtml)}
        ${pe(t.faqs)}
      </div>
    </div>
  `;o.ready(async()=>{let t=o.$("#product"),l=A.param("slug")||"",r=l?await se.product(l).catch(()=>null):null;if(!r){location.replace("404.html");return}let[h,w]=y.priceRange(r),$=r.optionGroups,x={};document.title=`${r.name} | ماسو`;let u=r.test,T=$.filter(e=>e.kind==="swatch"),k="product",b,z,q=()=>y.priceFor(r,x),I=()=>d.cart.lineId(r.slug,"product",$.map(e=>x[e.key]??"")),W=()=>T.map(e=>x[e.key]??""),j=()=>d.cart.lineId(r.slug,"test",W()),M=()=>T.every(e=>x[e.key]),ue=e=>d.cart.lines().some(s=>s.id===e);o.render(t,a`
        ${p.breadcrumbs([...r.breadcrumbs,{label:r.name,href:`/product/${r.slug}`}])}

        <!-- Phones/tablets: one column. Desktop: 1000px row — 650px content on the right, 350px sticky sidebar on the left -->
        <div class="mx-auto max-w-[1000px] pb-[104px] lg:flex lg:items-start lg:pb-0">
          <div class="min-w-0 flex-1">
            <section class="flex flex-col items-start gap-8 px-6 py-8 md:px-12 lg:gap-12 lg:pt-4">
              <!-- Name and delivery time on every screen; the price range only where there is no sidebar -->
              <div class="flex w-full flex-col items-start gap-3">${ne(r,"h1")} ${Q(h,w,"text-16 lg:hidden")}</div>
              <div class="w-full">${le(r.images,r.name)}</div>
            </section>

            <section aria-label="جزئیات محصول" class="flex flex-col gap-4 px-6 pt-6 pb-16 md:px-12 lg:hidden">
              <div data-slot="hint"></div>
              <p class="text-16 text-ink">جزئیات محصول</p>
              <div data-slot="cards"></div>
              ${r.test&&a`<div class="flex flex-col items-start gap-3 py-3">
                <p class="w-full text-13 text-on-surface-var">${G}</p>
                ${_("about","تست محصول چیست؟","help")}
              </div>`}
            </section>

            ${ie(r.features)} ${xe(r)}
          </div>

          <aside
            aria-label="خرید"
            class="sticky top-20 hidden h-[calc(100dvh-153px)] min-h-[600px] w-[350px] shrink-0 flex-col gap-4 overflow-y-auto border-s border-outline-var bg-surface p-8 ps-[31px] lg:flex"
          >
            <div class="flex flex-1 flex-col gap-4">
              <div class="flex flex-col gap-6">
                <p class="text-16 text-ink">جزئیات محصول</p>
                <div data-slot="cards"></div>
              </div>
              <p data-slot="sidebar-hint" class="text-13 font-extrabold text-on-surface-var">برای مشاهده قیمت دقیق ابتدا جزئیات محصول را انتخاب کنید.</p>
            </div>
            <hr class="border-0 border-t border-black-10" />
            <div data-slot="sidebar-price"></div>
            ${r.test&&a`<hr class="border-0 border-t border-black-10" />
              <div class="flex flex-col items-center gap-2">
                <p class="w-full text-13 text-on-surface-var">${G}</p>
                ${_("order","سفارش تست محصول","chevron")}
              </div>`}
          </aside>
        </div>

        <!-- Phone/tablet bottom bar: price + cart (or the test sample), and the test-order link -->
        <div
          data-fixed-bar
          class="pointer-events-none fixed inset-x-0 bottom-0 z-40 bg-linear-to-b from-white/0 to-white [mask-image:linear-gradient(to_bottom,transparent,black_96px)] p-4 pt-24 backdrop-blur-[2px] lg:hidden"
        >
          <div
            data-slot="mobile-buy"
            class="pointer-events-auto mx-auto flex max-w-[672px] flex-col items-center gap-2 rounded-[32px] border border-black-10 bg-white/50 px-[15px] py-[11px] backdrop-blur-md"
          ></div>
        </div>

        ${p.jsonLd({"@context":"https://schema.org","@type":"Product",name:r.name,image:r.images.map(e=>new URL(A.media(e.src),location.href).href),brand:{"@type":"Brand",name:"ماسو"},offers:{"@type":"AggregateOffer",priceCurrency:"IRR",lowPrice:h*10,highPrice:w*10}})}
      `);function _(e,s,n){return a`<button type="button" data-action="test" data-sheet="${e}" aria-haspopup="dialog" class="group flex h-8 items-center gap-1 rounded-2xl text-16 whitespace-nowrap text-secondary">
        ${n==="help"&&f("helpCircle")} ${s}
        ${n==="chevron"&&f("chevronLeft",{size:18,cls:"transition-transform duration-300 group-hover:-translate-x-1"})}
      </button>`}let fe=()=>a`
      <div class="flex flex-col gap-4 lg:gap-2">
        ${$.map(e=>{let s=e.options.find(n=>n.id===x[e.key]);return a`<button
            type="button"
            data-action="picker"
            data-group="${e.key}"
            aria-haspopup="dialog"
            class="flex h-20 w-full items-center justify-between gap-4 overflow-hidden rounded-[24px] border border-hairline bg-surface-low px-[15px] py-[11px] text-start transition-colors duration-300 hover:border-outline-var"
          >
            <span class="flex min-w-0 flex-1 flex-col items-start gap-2">
              <span class="text-13 text-outline">${s?e.selectedLabel??e.label:e.label}</span>
              ${s?a`<span class="flex items-center gap-3 text-16 whitespace-nowrap text-on-surface">
                    ${s.swatch&&p.swatchDot(s,24)}
                    <span class="whitespace-pre">${s.detail?`${s.name}  - ${s.detail}`:s.name}</span>
                  </span>`:e.kind==="swatch"?p.swatches(e.options.map(n=>({name:n.name,image:n.swatch}))):a`<span class="text-16 text-on-surface">${e.options.map(n=>n.name).join("، ")}</span>`}
            </span>
            ${!s&&a`<span class="shrink-0 text-10 text-error">انتخاب نشده</span>`}
            ${f("chevronLeft",{cls:"shrink-0 text-ink"})}
          </button>`})}
      </div>
    `,S=(e,s,n)=>p.counter({label:s,cls:n,key:e,add:`data-action="${e==="test"?"buy-test":"add"}"`,step:`data-action="qty" data-kind="${e}"`}),me=p.syncCounter,X=e=>d.cart.lines().find(s=>s.id===e)?.qty??0,he=e=>a`<a
      href="cart.html"
      class="${m("flex h-12 shrink-0 items-center justify-center rounded-full bg-primary px-6 text-16 whitespace-nowrap text-on-primary transition-colors duration-300 hover:bg-primary/90",e&&"w-full")}"
      >مشاهده سبد</a
    >`,be=a`<hr class="w-full border-0 border-t border-black-10" />`;function ge(e){let s=(i,v)=>a`<div class="flex w-full items-center justify-between gap-6">${D(i,"text-16")} ${v}</div>`;if(k==="test"&&u)return s(u.price,S("test","خرید تست محصول","w-[175px] shrink-0"));let n=u&&a`${be} ${_("order","سفارش تست محصول","chevron")}`;return e===null?a`<button
            type="button"
            data-action="add"
            class="flex h-12 w-full items-center justify-center rounded-full border border-primary px-6 text-16 whitespace-nowrap text-primary transition-[background-color,transform] duration-300 hover:bg-primary/5 active:scale-[0.98]"
          >
            انتخاب جزئیات محصول
          </button>
          ${n}`:a`${s(e,S("product","افزودن به سبد","w-[156px] shrink-0"))} ${n}`}let $e=e=>e===null?a`<div class="flex h-[103px] items-center justify-between gap-2.5">
            <span class="text-13 text-ink">قیمت</span>
            ${Q(h,w,"text-16 font-bold")}
          </div>`:a`<div class="flex h-[103px] flex-col justify-between">
            <div class="flex items-center justify-between gap-2.5">
              <span class="text-13 text-ink">قیمت</span>
              ${D(e,"text-16")}
            </div>
            ${S("product","افزودن به سبد","w-full")}
          </div>`,J={};function L(){let e=q();o.$$('[data-slot="cards"]',t).forEach(i=>o.render(i,fe())),o.render(o.$('[data-slot="hint"]',t),e===null?a`<p class="text-16 text-warning-text">برای مشاهده قیمت دقیق جزئیات محصول را انتخاب کنید.</p>`:""),o.$('[data-slot="hint"]',t).hidden=e!==null,o.$('[data-slot="sidebar-hint"]',t).hidden=e!==null;let s=`${k}|${e}|${I()}|${j()}`,n=[];for(let[i,v]of[["sidebar-price",()=>$e(e)],["mobile-buy",()=>ge(e)]]){if(J[i]===s)continue;J[i]=s;let c=o.$(`[data-slot="${i}"]`,t);o.render(c,v()),n.push(c)}o.$$("[data-counter]",t).forEach(i=>{let v=X(i.dataset.counter==="test"?j():I());me(i,v,!n.some(c=>c.contains(i)))}),b?.dialog.open&&ae()}L(),d.cart.subscribe(L);let C=o.$("[data-gallery]",t),K=o.$$("[data-dots] button",t);function Y(e){K.forEach(s=>{let n=Number(s.dataset.index)===e;s.setAttribute("aria-selected",String(n)),s.className=m("h-3 rounded-full transition-[width,background-color] duration-500 ease-out-expo",n?"w-[37px] bg-ink-strong":"w-3 bg-dim hover:bg-ink-muted")})}Y(0);let N=0;C.addEventListener("scroll",()=>{N||(N=requestAnimationFrame(()=>{N=0;let e=(C.firstElementChild?.offsetWidth??340)+(parseFloat(getComputedStyle(C).columnGap)||24);Y(Math.min(r.images.length-1,Math.round(Math.abs(C.scrollLeft)/e)))}))},{passive:!0}),K.forEach(e=>e.addEventListener("click",()=>C.children[Number(e.dataset.index)]?.scrollIntoView({behavior:"smooth",block:"nearest",inline:"start"})));let Z=(e,s="")=>a`
      <span class="${m("flex items-center gap-2.5 text-13 text-on-surface-var",s)}"><span dir="ltr">${e}</span>${f("toman",{size:14.6})}</span>
    `,ve="size-6 shrink-0 cursor-pointer appearance-none rounded-full border border-ink-muted bg-clip-content p-1 transition-colors checked:bg-primary",ee={},O=null,F=!1;function P(e,s=null){e??(e=$.find(c=>!x[c.key])?.key);let n=$.find(c=>c.key===e);if(!n)return;O=s,F=!1;let i=ee[e];i||(i=ee[e]=d.sheet({title:n.pickerTitle,variant:"sheet",cardRadius:32,onClose(){let c=O;O=null,c?.(F)}}),i.setFooter(a`<div class="px-6 py-4">
          <button type="button" data-choose class="flex h-12 w-full items-center justify-center rounded-full bg-primary px-6 text-16 text-on-primary transition-colors hover:bg-primary/90">
            انتخاب
          </button>
        </div>`),o.$("[data-choose]",i.footer).addEventListener("click",()=>{let c=o.$("input:checked",i.body);c&&(x[e]=c.value),F=!!c,L(),i.close()}),i.body.addEventListener("change",()=>o.$$("label",i.body).forEach(c=>{let R=o.$("input",c).checked;o.$("[data-name]",c).className=m("text-16",R?"text-on-surface":"text-ink-var")})));let v=x[e]??n.options[0]?.id;o.render(i.body,a`<fieldset class="p-6">
          <legend class="sr-only">${n.pickerTitle}</legend>
          ${n.options.map(c=>{let R=v===c.id;return a`<label
              class="${m("flex cursor-pointer border-b border-hairline last:border-b-0",n.kind==="size"?"h-20 items-center justify-between py-2":"flex-col items-start gap-3 py-4")}"
            >
              <span class="flex items-center gap-3">
                <input type="radio" name="picker-${n.key}" value="${c.id}" ${R?a`checked`:""} class="${ve}" />
                ${n.kind==="swatch"&&c.swatch&&p.swatchDot(c,40)}
                <span data-name class="${m("text-16",R?"text-on-surface":"text-ink-var")}">${c.name}</span>
              </span>
              ${n.kind==="size"?a`<span class="flex flex-col items-end gap-1">
                    <span class="text-16 text-on-surface">${c.detail}</span>
                    ${c.price!==void 0&&Z(g.price(c.price))}
                  </span>`:Z(`+ ${g.price(c.priceDelta??0)}`,"self-end")}
            </label>`})}
        </fieldset>`),i.open()}function te(){let e=W();d.cart.add({id:j(),kind:"test",slug:r.slug,name:`تست ${r.name}`,image:u.example.image,price:u.price,optionIds:e,options:T.map(s=>{let n=y.findOption(r,s.key,x[s.key]);return{label:s.label,value:n.name,swatch:n.swatch}})})}function ae(){o.render(b.body,a`<div class="flex flex-col gap-4 p-6">
          ${T.map(e=>{let s=y.findOption(r,e.key,x[e.key]);return a`<button
              type="button"
              data-action="test-picker"
              data-group="${e.key}"
              aria-haspopup="dialog"
              class="flex h-20 w-full items-center justify-between overflow-hidden rounded-[24px] border border-hairline bg-surface-low p-4 transition-colors duration-300 hover:border-outline-var"
            >
              <span class="flex flex-1 flex-col items-start gap-2">
                <span class="text-13 text-outline">${e.label}</span>
                ${s?a`<span class="flex items-center gap-3 text-16 text-on-surface">${p.swatchDot(s,24)} ${s.name}</span>`:a`<span class="text-16 text-warning-text">انتخاب نشده</span>`}
              </span>
              ${f("chevronLeft",{cls:"shrink-0"})}
            </button>`})}
          <hr class="border-0 border-t border-black-10" />
          <p class="text-13 text-error">${u.notice}</p>
          <div class="flex items-center justify-between">
            <span class="text-16 text-on-surface-var">مبلغ تست</span>
            ${D(u.price,"text-20")}
          </div>
        </div>`),b.setFooter(a`<div class="px-6 py-4">
        ${ue(j())?he(!0):a`<button
              type="button"
              data-add-test
              ${M()?"":a`disabled`}
              class="flex h-12 w-full items-center justify-center rounded-full bg-primary px-6 text-16 text-on-primary transition-opacity disabled:opacity-40"
            >
              افزودن تست به سبد خرید
            </button>`}
      </div>`)}function B(e){if(e==="about"){z??(z=d.sheet({title:"تست محصول چیست؟",variant:"sheet",cardRadius:32})),o.render(z.body,a`<div class="flex flex-col items-center gap-4 p-6">
            <p class="w-full text-13 text-error">${u.notice}</p>
            ${u.intro.map(s=>a`<p class="w-full text-16 text-ink-var">${s}</p>`)}
            <div class="flex w-full flex-col gap-4 rounded-[32px] bg-surface-low p-4">
              ${[{label:"رنگ چوب",option:u.example.wood},{label:"رنگ پارچه",option:u.example.fabric}].map(({label:s,option:n})=>a`<div class="flex flex-col items-start gap-2">
                  <span class="text-13 text-outline">${s}</span>
                  <span class="flex items-center gap-3 text-16 text-on-surface">${p.swatchDot(n,24)} ${n.name}</span>
                </div>`)}
              ${p.img(u.example.image,{cls:"aspect-[614/613] w-full rounded-[24px] object-cover"})}
            </div>
          </div>`),z.open();return}b||(b=d.sheet({title:"سفارش تست محصول",variant:"sheet",cardRadius:32}),o.actions(b.body,{"test-picker"(s){b.close(),P(s.dataset.group,()=>B("order"))}}),b.footer.addEventListener("click",s=>{s.target.closest("[data-add-test]")&&M()&&te()})),k="test",L(),ae(),b.open()}o.actions(t,{picker(e){k!=="product"&&(k="product",L()),P(e.dataset.group)},test:e=>B(e.dataset.sheet),add(){let e=q(),s=n=>n&&q()===null&&P(void 0,s);if(e===null)return P(void 0,s);d.cart.add({id:I(),kind:"product",slug:r.slug,name:r.name,image:r.images[0],price:e,optionIds:$.map(n=>x[n.key]??""),options:$.map(n=>{let i=y.findOption(r,n.key,x[n.key]);return{label:n.label,value:i.detail?`${i.name} - ${i.detail}`:i.name,swatch:i.swatch}})})},"buy-test"(){M()?te():B("order")},qty(e){let s=e.dataset.kind==="test"?j():I();d.cart.setQty(s,X(s)+Number(e.dataset.delta))},"more-specs"(e){let s=o.$("[data-more-specs]",t),n=s.hidden;s.hidden=!n,e.setAttribute("aria-expanded",String(n)),o.$("span",e).textContent=n?"کمتر":"بیشتر",o.$("svg",e).classList.toggle("rotate-180",n)}})})})();})();
//# sourceMappingURL=product.js.map?v=6d63f420b3
