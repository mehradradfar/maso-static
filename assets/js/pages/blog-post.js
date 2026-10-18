/**
 * blog-post.html?slug=… — one article.
 *
 * The body is HTML from the WordPress editor (trusted: it comes from the
 * site's own CMS). If it contains <!--products-->, the suggested-products
 * band is placed there, splitting the text; otherwise it follows the text.
 * Unknown slugs go to the 404 page.
 */
(function () {
  "use strict";

  const Maso = window.Maso;
  const { html, dom, api, ui, fmt, url, cx } = Maso;

  /** 900px text column with the page's side padding (32px phones, 48px from tablets) */
  const column = (inner, cls = "") => html`<div class="${cx("px-8 py-8 md:px-12", cls)}"><div class="mx-auto max-w-[900px]">${inner}</div></div>`;

  /** "محصولات پیشنهادی" / "مقالات دیگر" heading: black fading to 30% */
  const railTitle = (text, id) =>
    html`<h2 id="${id}" class="bg-linear-to-b from-black to-black/30 bg-clip-text text-20 font-bold text-transparent">${text}</h2>`;

  /** Horizontal row of cards: bleeds to the screen edge on phones/tablets, fades at the end on desktop */
  const rail = (items) => html`
    <div data-rail class="rail no-scrollbar -mx-8 snap-x snap-proximity overflow-x-auto overscroll-x-contain scroll-px-8 px-8 md:-mx-12 md:scroll-px-12 md:px-12 lg:mx-0 lg:scroll-px-0 lg:px-0">
      <ul class="flex w-max gap-8">
        ${items.map((item) => html`<li class="shrink-0 snap-start">${item}</li>`)}
      </ul>
    </div>
  `;

  function productsBand(products) {
    if (!products?.length) return "";
    return html`
      <section aria-labelledby="post-products" class="bg-field px-8 py-8 md:px-12">
        <div class="mx-auto flex max-w-[900px] flex-col gap-8">
          ${railTitle("محصولات پیشنهادی", "post-products")}
          ${rail(products.map((p, i) => html`<div class="w-[313px]">${ui.productCard(p, { index: i, variant: "rounded" })}</div>`))}
        </div>
      </section>
    `;
  }

  function relatedPosts(posts) {
    if (!posts?.length) return "";
    return html`
      <section aria-labelledby="post-related" class="px-8 py-8 md:px-12">
        <div class="mx-auto flex max-w-[900px] flex-col gap-8">
          ${railTitle("مقالات دیگر", "post-related")}
          ${rail(posts.map((p, i) => ui.postCard(p, { index: i, size: "rail" })))}
        </div>
      </section>
    `;
  }

  dom.ready(async () => {
    const root = dom.$("#post");
    const slug = url.param("slug");
    const post = slug ? await api.post(slug).catch(() => undefined) : null;
    if (post === null) return location.replace("404.html");
    if (!post) {
      dom.render(
        root,
        column(html`<p class="rounded-[16px] bg-error-container p-4 text-center text-13 text-on-error-container">بارگذاری مقاله انجام نشد. لطفا صفحه را دوباره باز کنید.</p>`),
      );
      return;
    }

    document.title = `${post.title} | بلاگ | ماسو`;
    dom.$('meta[name="description"]')?.setAttribute("content", post.excerpt.replace(/\s*\.\.\.$/, ""));
    dom.$("[data-crumb]").textContent = post.title;

    const [before, after = ""] = String(post.content || "").split("<!--products-->");
    const hero = post.heroImage || post.image;

    dom.render(
      root,
      html`
        <article>
          <div class="h-[404px] overflow-hidden [mask-image:linear-gradient(to_bottom,#000_20%,transparent)]">
            ${ui.img(hero, { eager: true, alt: hero.alt || "", cls: "animate-[hero-zoom_1.6s_var(--ease-out-expo)_both] size-full object-cover" })}
          </div>
          ${column(html`
            <div class="flex flex-col gap-8">
              <time datetime="${post.date}" class="text-13 text-ink-var">${fmt.dateNumeric(post.date)}</time>
              <div class="post-body animate-fade-up">
                <h1>${post.title}</h1>
                ${Maso.raw(before)}
              </div>
            </div>
          `)}
          ${productsBand(post.products)}
          ${after.trim() ? column(html`<div class="post-body">${Maso.raw(after)}</div>`) : ""}
        </article>
        ${relatedPosts(post.related)}
        ${ui.jsonLd({
          "@context": "https://schema.org",
          "@type": "BlogPosting",
          headline: post.title,
          datePublished: post.date,
          image: hero.src,
          description: post.excerpt,
        })}
      `,
    );
    root.removeAttribute("aria-busy");
    dom.$$("[data-rail]", root).forEach(Maso.rail);
  });
})();
