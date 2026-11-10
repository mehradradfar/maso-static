/**
 * Home page — best sellers (Figma "Frame 1000004338").
 *
 * The section's shell and skeleton are in index.html; this fills in the
 * category cards and the row of product cards. A category card filters the
 * row (like the shop's category rail); tapping it again shows every category.
 */
(function () {
  "use strict";
  const { html, dom, api, ui } = Maso;

  dom.ready(async () => {
    const root = document.getElementById("bestsellers");
    if (!root) return;
    const rail = root.querySelector('[data-slot="categories"]');
    const row = root.querySelector('[data-slot="products"]');
    let active = "";
    let ticket = 0;

    // The rails only re-measure on scroll/resize; new content changes their width
    const remeasure = (el) => el.dispatchEvent(new Event("scroll"));

    const paintProducts = (items) => {
      dom.render(
        row,
        items.length
          ? html`${items.map((p, i) => ui.productCard(p, { index: i, variant: "rail" }))}`
          : html`<p class="flex min-h-[390px] w-full items-center justify-center text-16 text-ink-var md:min-h-[579px]">هنوز محصولی در این دسته‌بندی نیست.</p>`,
      );
      row.scrollLeft = 0;
      row.removeAttribute("aria-busy");
      remeasure(row);
    };

    try {
      const [categories, items] = await Promise.all([api.categories(), api.bestsellers()]);
      dom.render(
        rail,
        html`${categories.map((c) => html`<li class="shrink-0 snap-start">${ui.categoryChip(c, { button: true })}</li>`)}`,
      );
      remeasure(rail);
      paintProducts(items);
    } catch (error) {
      console.error(error);
      root.hidden = true;
      return;
    }

    rail.addEventListener("click", async (e) => {
      const chip = e.target.closest("[data-category]");
      if (!chip) return;
      active = chip.dataset.category === active ? "" : chip.dataset.category;
      for (const c of rail.querySelectorAll("[data-category]")) {
        const on = c.dataset.category === active;
        c.setAttribute("aria-pressed", String(on));
        c.classList.toggle("bg-surface-low", on);
        c.classList.toggle("hover:bg-surface-low", !on);
      }
      const mine = ++ticket;
      row.setAttribute("aria-busy", "true");
      row.style.opacity = "0.4";
      try {
        const items = await api.bestsellers(active);
        if (mine === ticket) paintProducts(items);
      } catch (error) {
        console.error(error);
        if (mine === ticket) row.removeAttribute("aria-busy");
      } finally {
        if (mine === ticket) row.style.opacity = "";
      }
    });
  });
})();
