(()=>{(function(){"use strict";let l=window.Maso,{html:r,dom:o,api:x,ui:i,fmt:m,url:u,cx:$}=l,s=(e,a="")=>r`<div class="${$("px-8 py-8 md:px-12",a)}"><div class="mx-auto max-w-[900px]">${e}</div></div>`,c=(e,a)=>r`<h2 id="${a}" class="bg-linear-to-b from-black to-black/30 bg-clip-text text-20 font-bold text-transparent">${e}</h2>`,d=e=>r`
    <div data-rail class="rail no-scrollbar -mx-8 snap-x snap-proximity overflow-x-auto overscroll-x-contain scroll-px-8 px-8 md:-mx-12 md:scroll-px-12 md:px-12 lg:mx-0 lg:scroll-px-0 lg:px-0">
      <ul class="flex w-max gap-8">
        ${e.map(a=>r`<li class="shrink-0 snap-start">${a}</li>`)}
      </ul>
    </div>
  `;function v(e){return e?.length?r`
      <section aria-labelledby="post-products" class="bg-field px-8 py-8 md:px-12">
        <div class="mx-auto flex max-w-[900px] flex-col gap-8">
          ${c("محصولات پیشنهادی","post-products")}
          ${d(e.map((a,t)=>r`<div class="w-[313px]">${i.productCard(a,{index:t,variant:"rounded"})}</div>`))}
        </div>
      </section>
    `:""}function f(e){return e?.length?r`
      <section aria-labelledby="post-related" class="px-8 py-8 md:px-12">
        <div class="mx-auto flex max-w-[900px] flex-col gap-8">
          ${c("مقالات دیگر","post-related")}
          ${d(e.map((a,t)=>i.postCard(a,{index:t,size:"rail"})))}
        </div>
      </section>
    `:""}o.ready(async()=>{let e=o.$("#post"),a=u.param("slug"),t=a?await x.post(a).catch(()=>{}):null;if(t===null)return location.replace("404.html");if(!t){o.render(e,s(r`<p class="rounded-[16px] bg-error-container p-4 text-center text-13 text-on-error-container">بارگذاری مقاله انجام نشد. لطفا صفحه را دوباره باز کنید.</p>`));return}document.title=`${t.title} | بلاگ | ماسو`,o.$('meta[name="description"]')?.setAttribute("content",t.excerpt.replace(/\s*\.\.\.$/,"")),o.$("[data-crumb]").textContent=t.title;let[g,p=""]=String(t.content||"").split("<!--products-->"),n=t.heroImage||t.image;o.render(e,r`
        <article>
          <div class="h-[404px] overflow-hidden [mask-image:linear-gradient(to_bottom,#000_20%,transparent)]">
            ${i.img(n,{eager:!0,alt:n.alt||"",cls:"animate-[hero-zoom_1.6s_var(--ease-out-expo)_both] size-full object-cover"})}
          </div>
          ${s(r`
            <div class="flex flex-col gap-8">
              <time datetime="${t.date}" class="text-13 text-ink-var">${m.dateNumeric(t.date)}</time>
              <div class="post-body animate-fade-up">
                <h1>${t.title}</h1>
                ${l.raw(g)}
              </div>
            </div>
          `)}
          ${v(t.products)}
          ${p.trim()?s(r`<div class="post-body">${l.raw(p)}</div>`):""}
        </article>
        ${f(t.related)}
        ${i.jsonLd({"@context":"https://schema.org","@type":"BlogPosting",headline:t.title,datePublished:t.date,image:n.src,description:t.excerpt})}
      `),e.removeAttribute("aria-busy"),o.$$("[data-rail]",e).forEach(l.rail)})})();})();
//# sourceMappingURL=blog-post.js.map?v=5515b1639c
