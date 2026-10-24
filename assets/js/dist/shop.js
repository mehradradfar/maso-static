(()=>{(function(){"use strict";let k=window.Maso,{html:r,icon:v,url:h,cx:u,dom:n,api:m,shopQuery:S,ui:x}=k,E={"price-desc":"قیمت: زیاد به کم","price-asc":"قیمت: کم به زیاد",newest:"جدید‌ترین"},_=(a,e)=>r`
    <div id="category-rail" class="relative min-w-0 flex-1 lg:max-w-[900px]">
      <ul class="no-scrollbar flex snap-x gap-2 overflow-x-auto overscroll-x-contain p-6">
        ${a.map(o=>{let i=o.slug===e;return r`<li class="snap-start">
            <a
              href="${i?h.shop():h.shop(o.slug)}"
              ${i?r`aria-current="page"`:""}
              class="${u("flex h-[110px] w-[150px] flex-col items-center gap-4 rounded-[32px] p-3 transition-colors duration-300",i?"bg-surface-low":"hover:bg-surface-low")}"
            >
              ${x.img(o.image,{alt:"",width:126,height:50,eager:!0,cls:"h-[50px] w-[126px] object-contain"})}
              <span class="text-13 whitespace-nowrap text-ink">${o.name}</span>
            </a>
          </li>`})}
      </ul>
      <!-- Scroll hint (desktop) -->
      <div
        aria-hidden="true"
        class="pointer-events-none absolute bottom-px left-0 hidden h-[157px] w-[129px] bg-linear-to-l from-transparent to-surface [mask-image:linear-gradient(to_left,transparent,black)] backdrop-blur-[2px] lg:block"
      ></div>
    </div>
  `,O=(a,e)=>r`
    <nav
      id="compact-categories"
      aria-label="دسته‌بندی‌ها"
      aria-hidden="true"
      inert
      data-fixed-bar
      class="pointer-events-none fixed inset-x-0 top-20 z-40 -translate-y-4 bg-white/50 opacity-0 backdrop-blur-[30px] transition-[translate,opacity] duration-500 ease-out-expo data-visible:pointer-events-auto data-visible:translate-y-0 data-visible:opacity-100 lg:hidden"
    >
      <ul class="no-scrollbar flex gap-2 overflow-x-auto px-6 py-3">
        ${a.map(o=>r`<li class="shrink-0">
            <a
              href="${h.shop(o.slug)}"
              ${o.slug===e?r`aria-current="page"`:""}
              class="${u("flex h-8 items-center gap-2 rounded-[32px] px-3 py-2 text-13 whitespace-nowrap text-ink transition-colors",o.slug===e?"bg-surf-container":"bg-surface-low")}"
            >
              ${o.name} ${o.icon&&x.img(o.icon,{alt:"",cls:"h-4 w-auto"})}
            </a>
          </li>`)}
      </ul>
    </nav>
  `,C=(a,e,o)=>r`
    <button
      type="button"
      data-action="panel"
      data-panel="${o}"
      aria-haspopup="dialog"
      class="flex items-center gap-2 rounded-full border border-outline-var px-4 py-2 text-16 text-ink transition-colors duration-300 hover:border-ink hover:bg-surface-low"
    >
      ${v(a)} ${e}
    </button>
  `,I=(a,e,o)=>r`
    <button
      type="button"
      data-action="panel"
      data-panel="${o}"
      aria-haspopup="dialog"
      class="flex h-9 flex-1 items-center justify-center gap-2 text-16 text-ink active:opacity-60"
    >
      ${v(a)} ${e}
    </button>
  `,T=()=>r`
    <div class="hidden shrink-0 items-start gap-2 lg:flex">
      ${C("sort","مرتب سازی","sort")} ${C("filter","فیلتر","filter")}
    </div>
    <div data-fixed-bar class="pointer-events-none fixed inset-x-0 bottom-0 z-40 flex h-[98px] items-end justify-center bg-linear-to-b from-white/0 to-white pb-4 lg:hidden">
      <div class="pointer-events-auto flex h-14 w-[295px] items-center gap-2.5 rounded-full border border-hairline bg-white/50 px-4 shadow-[0_0_12px_rgba(0,0,0,0.08)] backdrop-blur-md">
        ${I("sort","مرتب سازی","sort")}
        <span aria-hidden="true" class="h-9 w-px shrink-0 bg-black-10"></span>
        ${I("filter","فیلتر","filter")}
      </div>
    </div>
  `,D=a=>r`
    <section data-reveal class="order-3 col-span-full -my-4 md:order-7 lg:order-11">
      <div class="relative mx-auto flex h-[500px] max-w-[1100px] flex-col items-end overflow-hidden bg-promo px-8 py-12 md:h-[793px] md:items-center lg:h-[397px] lg:flex-row lg:items-start lg:justify-center lg:gap-[124px]">
        <div class="relative z-10 flex w-full flex-col items-start gap-6 md:w-[324px]">
          <div class="flex w-full flex-col gap-3 text-start">
            <h2 class="text-25 font-bold text-outline-var md:text-39">${a.title}</h2>
            <p class="text-13 text-outline">${a.description}</p>
          </div>
          <a
            href="${h.page(a.cta.href)}"
            class="group/button relative inline-flex h-12 w-[190px] shrink-0 items-center justify-center gap-2 rounded-full bg-on-primary px-3 text-16 whitespace-nowrap text-primary transition-[background-color,color,border-color,transform] duration-300 ease-out-expo hover:bg-surface-low active:scale-[0.98]"
          >
            <span>${a.cta.label}</span>
            <span class="transition-transform duration-300 ease-out-expo group-hover/button:-translate-x-1">${v("arrowLeft")}</span>
          </a>
        </div>
        ${x.img(a.image,{cls:"absolute top-[322px] left-[calc(50%-119px)] h-[178px] w-[238px] max-w-none object-contain md:top-[397px] md:left-[calc(50%-226px)] md:h-[339px] md:w-[452px] lg:static lg:shrink-0"})}
      </div>
    </section>
  `,B=(a,{from:e=0,orderBase:o=0,eagerFirst:i=!1}={})=>a.map((b,l)=>r`<div style="order:${o?o+e+l:(e+l)*2}">
        ${x.productCard(b,{index:e+l,eager:i&&e+l<3})}
      </div>`),F=()=>[0,1,2].map(a=>r`<div data-loading style="order:${5e3+a}" class="${a>0?"hidden md:block":""}">${x.productCardSkeleton()}</div>`),H="size-6 shrink-0 cursor-pointer appearance-none rounded-full border border-ink-muted bg-clip-content p-1 transition-colors checked:bg-primary",U=a=>r`
    <fieldset class="p-6">
      <legend class="sr-only">مرتب سازی بر اساس</legend>
      <div class="px-4">
        ${Object.keys(E).map(e=>r`<label class="flex h-14 cursor-pointer items-center gap-3 border-b border-hairline py-2 last:border-b-0">
            <input type="radio" name="sort" value="${e}" ${a.sort===e?r`checked`:""} class="${H}" />
            <span class="${u("text-16",a.sort===e?"text-ink":"text-ink-var")}">${E[e]}</span>
          </label>`)}
      </div>
    </fieldset>
  `,K=(a,e,o)=>r`
    <div class="flex flex-col">
      <!-- In-stock switch -->
      <label class="flex cursor-pointer items-center justify-between border-b border-black-20 py-5">
        <span class="text-16 text-ink">فقط کالا‌های موجود</span>
        <input
          type="checkbox"
          role="switch"
          name="stock"
          ${e.inStock?r`checked`:""}
          class="relative h-8 w-12 shrink-0 cursor-pointer appearance-none rounded-full bg-[#b3b3b3] transition-colors duration-300 before:absolute before:start-1 before:top-1 before:size-6 before:rounded-full before:bg-white before:transition-[inset-inline-start] before:duration-300 before:ease-out-expo checked:bg-primary checked:before:start-5"
        />
      </label>
      ${a.map((i,b)=>{let l=o.has(i.key),g=e.facets[i.key]||[];return r`<section class="${u("py-5",b<a.length-1&&"border-b border-black-20")}">
          <h3>
            <button
              type="button"
              data-action="toggle-facet"
              data-key="${i.key}"
              aria-expanded="${l}"
              aria-controls="facet-${i.key}"
              class="flex w-full items-center justify-between text-16 text-ink"
            >
              ${i.label}
              <span class="flex size-12 items-center justify-center">
                ${v("chevronDown",{cls:u("transition-transform duration-300 ease-out-expo",l&&"rotate-180")})}
              </span>
            </button>
          </h3>
          <!-- grid-rows trick animates height without measuring -->
          <div id="facet-${i.key}" class="${u("grid transition-[grid-template-rows] duration-500 ease-out-expo",l?"grid-rows-[1fr]":"grid-rows-[0fr]")}">
            <ul class="overflow-hidden px-4" ${l?"":r`inert`}>
              ${i.options.map(f=>{let d=g.includes(f.value);return r`<li class="border-b border-hairline last:border-b-0">
                  <label class="flex h-12 cursor-pointer items-center gap-3 py-2">
                    <span class="relative flex size-6 shrink-0">
                      <input
                        type="checkbox"
                        name="facet"
                        data-key="${i.key}"
                        value="${f.value}"
                        ${d?r`checked`:""}
                        class="peer size-6 cursor-pointer appearance-none rounded-lg border border-ink-muted transition-colors checked:border-primary checked:bg-primary"
                      />
                      ${v("tick",{cls:"pointer-events-none absolute inset-0 text-white opacity-0 transition-opacity peer-checked:opacity-100"})}
                    </span>
                    <span class="${u("text-16",d?"text-ink":"text-ink-var")}">${f.label}</span>
                  </label>
                </li>`})}
            </ul>
          </div>
        </section>`})}
    </div>
  `;n.ready(async()=>{let a=n.$("#shop"),e=S.parse(new URLSearchParams(location.search)),o,i,b,l;try{[o,i,b,l]=await Promise.all([m.categories(),m.facets(e.category),m.promo(e.category),m.products(e)])}catch{n.render(a,r`<p class="px-6 py-24 text-center text-16 text-ink-var">بارگذاری محصولات انجام نشد. لطفا صفحه را دوباره باز کنید.</p>`);return}let g=o.find(t=>t.slug===e.category);if(e.category&&!g){location.replace("404.html");return}g&&(document.title=`${g.name} | فروشگاه | ماسو`);let f=[{label:"فروشگاه",href:"/shop"}];g&&f.push({label:g.name,href:`/shop/${g.slug}`}),n.render(a,r`
        ${x.breadcrumbs(f)}
        <!-- Category rail + desktop filter/sort pills -->
        <div class="mx-auto flex max-w-[1100px] items-center justify-between">${_(o,e.category)} ${T()}</div>
        ${O(o,e.category)}
        <div id="listing" class="transition-opacity duration-300"></div>
        ${x.jsonLd({"@context":"https://schema.org","@type":"BreadcrumbList",itemListElement:f.map((t,s)=>({"@type":"ListItem",position:s+1,name:t.label,item:new URL(h.page(t.href),location.href).href}))})}
      `);let d=n.$("#listing",a),M=()=>{};function R(t=!1){if(M(),!l.items.length){n.render(d,r`<p class="px-6 py-24 text-center text-16 text-ink-var">محصولی با این فیلترها پیدا نشد.</p>`);return}let s=b&&e.page===1&&l.items.length>2;n.render(d,r`<div id="grid" class="mx-auto grid max-w-[1148px] grid-cols-1 gap-x-4 gap-y-12 py-8 md:grid-cols-2 lg:grid-cols-3 lg:px-6">
          ${B(l.items,{eagerFirst:t})} ${s&&D(b)}
          <div id="more" style="order:9999" class="col-span-full flex justify-center">
            <a href="${h.shop()+"?"+S.toParams({...e,page:e.page+1})}" class="sr-only focus:not-sr-only">صفحه بعد</a>
          </div>
        </div>`),M=N()}function N(){let t=n.$("#grid",d),s=n.$("#more",d),c=l.page,p=0,P=!1;if(c>=l.totalPages)return s.remove(),()=>{};let z=new IntersectionObserver(async([G])=>{if(!(!G.isIntersecting||P)){P=!0,t.insertAdjacentHTML("beforeend",String(r`${F()}`));try{let y=await m.products({...e,page:c+1});n.$$("[data-loading]",t).forEach(J=>J.remove()),t.insertAdjacentHTML("beforeend",String(r`${B(y.items,{from:p,orderBase:1e3})}`)),p+=y.items.length,c=y.page,c>=y.totalPages&&(z.disconnect(),s.remove())}catch{n.$$("[data-loading]",t).forEach(y=>y.remove())}P=!1}},{rootMargin:"800px 0px"});return z.observe(s),()=>z.disconnect()}R(!0);async function j(t){e={...e,...t,page:1};let s=S.toParams(e).toString();history.replaceState(null,"",`shop.html${s?`?${s}`:""}`),d.classList.add("opacity-50"),d.setAttribute("aria-busy","true");try{l=await m.products(e),R()}finally{d.classList.remove("opacity-50"),d.removeAttribute("aria-busy")}}let A=n.$("#compact-categories",a);k.scrolledPast(n.$("#category-rail",a),80,t=>{A.toggleAttribute("data-visible",t),A.toggleAttribute("inert",!t),A.setAttribute("aria-hidden",String(!t))});let w=k.sheet({title:"مرتب سازی بر اساس",variant:"sheet"});w.body.addEventListener("change",t=>{t.target.name==="sort"&&(j({sort:t.target.value}),w.close())});let L=new Set(i.filter((t,s)=>s===i.length-1||e.facets[t.key]?.length).map(t=>t.key)),$=k.sheet({title:"فیلتر‌ها",variant:"drawer"}),Q=()=>n.render($.body,K(i,e,L));$.body.addEventListener("change",t=>{let s=t.target;if(s.name==="stock"&&j({inStock:s.checked}),s.name==="facet"){let c=s.dataset.key,p=new Set(e.facets[c]||[]);s.checked?p.add(s.value):p.delete(s.value),j({facets:{...e.facets,[c]:[...p].sort()}}),s.closest("label").lastElementChild.className=u("text-16",s.checked?"text-ink":"text-ink-var")}}),n.actions($.body,{"toggle-facet"(t){let s=t.dataset.key,c=!L.has(s);c?L.add(s):L.delete(s),t.setAttribute("aria-expanded",String(c)),n.$("svg",t).classList.toggle("rotate-180",c);let p=n.$(`#facet-${s}`,$.body);p.classList.toggle("grid-rows-[1fr]",c),p.classList.toggle("grid-rows-[0fr]",!c),p.firstElementChild.toggleAttribute("inert",!c)}}),n.actions(a,{panel(t){t.dataset.panel==="sort"?(n.render(w.body,U(e)),w.open()):(Q(),$.open())}})})})();})();
//# sourceMappingURL=shop.js.map?v=2fb5b00b68
