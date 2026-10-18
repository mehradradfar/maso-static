/**
 * blog.html — post cards from WordPress, nine at a time.
 * "مقالات بیشتر" appends the next page (the URL keeps ?page=N so a reload
 * or a shared link shows the same posts).
 */
(function () {
  "use strict";

  const Maso = window.Maso;
  const { dom, api, ui } = Maso;

  dom.ready(async () => {
    const list = dom.$("#blog-list");
    const more = dom.$("[data-more]");
    const moreButton = dom.$("button", more);
    const error = dom.$("[data-error]");
    let page = 0;
    let totalPages = 1;
    let count = 0;

    const skeletons = (n) => Array.from({ length: n }, () => ui.postCardSkeleton());

    async function load(next) {
      moreButton.disabled = true;
      const placeholders = dom.create(`<div class="contents">${skeletons(next === 1 ? 6 : 3).join("")}</div>`);
      list.append(placeholders);
      try {
        const result = await api.posts({ page: next });
        placeholders.remove();
        list.insertAdjacentHTML("beforeend", result.items.map((post, i) => ui.postCard(post, { index: i, eager: next === 1 && i < 3 })).join(""));
        page = result.page;
        totalPages = result.totalPages;
        count += result.items.length;
        more.hidden = page >= totalPages;
        if (page > 1) history.replaceState(null, "", `?page=${page}`);
      } catch {
        placeholders.remove();
        error.hidden = false;
      } finally {
        moreButton.disabled = false;
      }
    }

    moreButton.addEventListener("click", () => load(page + 1));

    // ?page=N: load pages 1…N so the list reads the same after a reload
    const wanted = Math.max(1, Math.min(20, Number(Maso.url.param("page")) || 1));
    for (let p = 1; p <= wanted && p <= totalPages; p++) await load(p);
    if (!count && error.hidden) list.innerHTML = `<p class="col-span-full py-16 text-center text-16 text-ink-var">هنوز مقاله‌ای منتشر نشده است.</p>`;
  });
})();
