/**
 * Shared UI behaviour, wired up on every page:
 *   - scroll-reveal animations ([data-reveal])
 *   - header states (transparent → solid over the home hero, frosted glass when scrolled)
 *   - desktop mega menu (کتگوری‌ها) and the mobile menu (native <dialog>)
 *   - account links (login → profile once signed in)
 *   - horizontal rows that start with their middle item centred ([data-center-scroll])
 * and two helpers pages use:
 *   - Maso.sheet(…)        bottom sheet / side drawer on the native <dialog>
 *   - Maso.scrolledPast(…) "has this element scrolled under the header?"
 */
(function () {
  "use strict";

  const Maso = window.Maso;
  const { $, $$, ready } = Maso.dom;

  /* Keyboard vs pointer: focus rings only while the keyboard is in use */
  const root = document.documentElement;
  const NAV_KEYS = new Set(["Tab", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Home", "End"]);
  addEventListener("keydown", (e) => NAV_KEYS.has(e.key) && root.setAttribute("data-keyboard", ""), true);
  addEventListener("pointerdown", () => root.removeAttribute("data-keyboard"), true);

  /* ------------------------------------------------------------------ */
  /* Scroll reveal: one IntersectionObserver for the whole site          */
  /*   <div data-reveal>              fade + rise                        */
  /*   <div data-reveal="fade">       fade only                          */
  /*   style="--reveal-index: 2"      stagger (90ms per step)            */
  /* Elements added later (rendered by JS) are picked up automatically.  */
  /* ------------------------------------------------------------------ */

  function initReveal() {
    const SELECTOR = "[data-reveal]:not([data-revealed])";
    if (!("IntersectionObserver" in window)) {
      $$(SELECTOR).forEach((el) => el.setAttribute("data-revealed", ""));
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          entry.target.setAttribute("data-revealed", "");
          io.unobserve(entry.target);
        }
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.12 },
    );
    const observeAll = () => $$(SELECTOR).forEach((el) => io.observe(el));
    observeAll();

    // Batch DOM additions into one scan per frame
    let frame = 0;
    new MutationObserver(() => {
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        observeAll();
      });
    }).observe(document.body, { childList: true, subtree: true });
  }

  /* ------------------------------------------------------------------ */
  /* "Scrolled past" — IntersectionObserver instead of scroll listeners   */
  /* ------------------------------------------------------------------ */

  /**
   * Calls `onChange(true)` once `el` has scrolled above `offset` px from the
   * top of the viewport, and `onChange(false)` when it comes back.
   */
  Maso.scrolledPast = function scrolledPast(el, offset, onChange) {
    if (!el) return () => {};
    const io = new IntersectionObserver(
      ([entry]) => onChange(!entry.isIntersecting && entry.boundingClientRect.top < offset),
      // Shrink the root from the top by `offset` so crossing that line flips the state
      { rootMargin: `-${offset}px 0px 0px 0px` },
    );
    io.observe(el);
    return () => io.disconnect();
  };

  /* ------------------------------------------------------------------ */
  /* Header                                                              */
  /* ------------------------------------------------------------------ */

  function initHeader() {
    const header = $(".site-header");
    if (!header) return;
    const flag = (name) => (on) => header.toggleAttribute(name, on);

    if (header.dataset.mode === "overlay") {
      // Solid once the page content passes under it (80px = header height)
      Maso.scrolledPast($("[data-header-sentinel]"), 80, flag("data-solid"));
    } else {
      // Frosted glass as soon as the page moves
      Maso.scrolledPast($("[data-top-sentinel]"), 0, flag("data-scrolled"));
    }
  }

  /* ------------------------------------------------------------------ */
  /* Desktop mega menu (کتگوری‌ها)                                        */
  /* ------------------------------------------------------------------ */

  function initMegaMenu() {
    const header = $(".site-header");
    const panel = $("#mega-menu");
    const toggle = $("[data-mega-toggle]");
    if (!header || !panel || !toggle) return;
    const isOpen = () => panel.hasAttribute("data-open");
    const set = (open) => {
      panel.toggleAttribute("data-open", open);
      panel.inert = !open;
      header.toggleAttribute("data-mega", open);
      toggle.setAttribute("aria-expanded", String(open));
    };

    toggle.addEventListener("click", () => set(!isOpen()));
    document.addEventListener("keydown", (e) => {
      if (e.key !== "Escape" || !isOpen()) return;
      set(false);
      toggle.focus();
    });
    // A click anywhere else (including the other header links) closes it
    document.addEventListener("click", (e) => {
      if (isOpen() && !panel.contains(e.target) && !toggle.contains(e.target)) set(false);
    });
    // Keyboard users tabbing past the last link
    panel.addEventListener("focusout", (e) => {
      if (isOpen() && e.relatedTarget && !panel.contains(e.relatedTarget) && e.relatedTarget !== toggle) set(false);
    });
    matchMedia("(width < 64rem)").addEventListener("change", (e) => e.matches && set(false));
  }

  /* ------------------------------------------------------------------ */
  /* Mobile / tablet menu: main list ⇄ categories                         */
  /* ------------------------------------------------------------------ */

  function initMobileMenu() {
    const dialog = $("#mobile-menu");
    if (!dialog) return;
    const views = $$("[data-menu-view]", dialog);
    const show = (name, focus) => {
      views.forEach((view) => (view.hidden = view.dataset.menuView !== name));
      dialog.scrollTop = 0;
      if (focus) $(`[data-menu-view="${name}"] a, [data-menu-view="${name}"] button`, dialog)?.focus();
    };

    $$("[data-open-menu]").forEach((btn) =>
      btn.addEventListener("click", () => {
        show("main");
        dialog.showModal();
      }),
    );
    $$("[data-close-menu]", dialog).forEach((btn) => btn.addEventListener("click", () => dialog.close()));
    dialog.addEventListener("click", (e) => {
      const go = e.target.closest("[data-menu-go]");
      if (go) show(go.dataset.menuGo, e.detail === 0); // move focus only for keyboard clicks
      else if (e.target === dialog) dialog.close();
    });
    matchMedia("(width >= 64rem)").addEventListener("change", (e) => e.matches && dialog.close());
  }

  /* ------------------------------------------------------------------ */
  /* Account links: login page, or the profile once signed in            */
  /* ------------------------------------------------------------------ */

  function initAccountLinks() {
    const signedIn = Boolean(Maso.session?.get());
    if (!signedIn) return;
    $$("[data-account-link]").forEach((a) => (a.href = "profile.html"));
    $$("[data-account-label]").forEach((el) => (el.textContent = "حساب کاربری"));
  }

  /**
   * Number of pieces in the cart on the header's bag icons; follows every
   * cart change (other tabs included) and pops when it grows.
   */
  function initCartBadge() {
    const links = $$("[data-cart-link]");
    if (!links.length || !Maso.cart) return;
    let last = null;
    const paint = () => {
      const n = Maso.cart.count();
      const label = n ? `سبد خرید، ${Maso.fmt.digits(n)} کالا` : "سبد خرید";
      links.forEach((a) => {
        a.setAttribute("aria-label", label);
        const badge = $("[data-cart-count]", a);
        if (!badge) return;
        badge.hidden = !n;
        badge.innerHTML = `<span>${n > 99 ? "+۹۹" : Maso.fmt.digits(n)}</span>`;
        if (last !== null && n > last) {
          badge.removeAttribute("data-bump");
          void badge.offsetWidth; // restart the animation
          badge.setAttribute("data-bump", "");
        }
      });
      last = n;
    };
    paint();
    Maso.cart.subscribe(paint);
  }

  /* ------------------------------------------------------------------ */
  /* Smooth accordions (<details data-accordion>)                        */
  /*   Browsers open <details> instantly; this animates the height of     */
  /*   [data-accordion-body] and fades/slides its content in and out.     */
  /*   Works for content drawn later (one delegated listener), copes with */
  /*   a click mid-animation, and keeps one open per                      */
  /*   data-accordion-group. Reduced motion → instant, like native.       */
  /* ------------------------------------------------------------------ */

  function initAccordions() {
    const still = matchMedia("(prefers-reduced-motion: reduce)");
    const running = new WeakMap();
    // Gentle ease-out to open (no snap at the start), ease-in-out to close
    const OPEN_EASE = "cubic-bezier(0.33, 1, 0.68, 1)";
    const CLOSE_EASE = "cubic-bezier(0.65, 0, 0.35, 1)";

    function toggle(details, open) {
      const body = details.querySelector(":scope > [data-accordion-body]");
      const inner = body?.firstElementChild;
      const busy = running.get(details);
      if (!body || !inner || still.matches || !body.animate) {
        busy?.forEach((a) => a.cancel());
        details.removeAttribute("data-closing");
        details.open = open;
        return;
      }
      // Start from wherever the current animation is (a click mid-way reverses smoothly)
      const from = busy ? body.getBoundingClientRect().height : open ? 0 : body.offsetHeight;
      busy?.forEach((a) => a.cancel());

      details.toggleAttribute("data-closing", !open);
      if (open) details.open = true;
      const to = open ? body.scrollHeight : 0;
      // Taller content takes a little longer, within limits
      const distance = Math.abs(to - from);
      const duration = open ? Math.min(850, 500 + distance * 0.25) : Math.min(550, 340 + distance * 0.15);

      body.style.overflow = "hidden";
      const height = body.animate([{ height: `${from}px` }, { height: `${to}px` }], {
        duration,
        easing: open ? OPEN_EASE : CLOSE_EASE,
        fill: "both",
      });
      const fade = inner.animate(
        open
          ? [
              { opacity: 0, transform: "translateY(-12px)" },
              { opacity: 1, transform: "none" },
            ]
          : [
              { opacity: 1, transform: "none" },
              { opacity: 0, transform: "translateY(-8px)" },
            ],
        { duration: open ? duration * 0.9 : duration * 0.6, delay: open ? 80 : 0, easing: open ? OPEN_EASE : CLOSE_EASE, fill: "both" },
      );
      running.set(details, [height, fade]);
      height.onfinish = () => {
        running.delete(details);
        body.style.overflow = "";
        height.cancel();
        fade.cancel();
        if (!open) {
          details.open = false;
          details.removeAttribute("data-closing");
        }
      };
    }

    document.addEventListener("click", (e) => {
      const summary = e.target.closest("details[data-accordion] > summary");
      if (!summary) return;
      e.preventDefault();
      const details = summary.parentElement;
      const opening = !details.open || details.hasAttribute("data-closing");
      if (opening && details.dataset.accordionGroup) {
        document
          .querySelectorAll(`details[data-accordion-group="${CSS.escape(details.dataset.accordionGroup)}"][open]`)
          .forEach((other) => other !== details && !other.hasAttribute("data-closing") && toggle(other, false));
      }
      toggle(details, opening);
    });
  }

  /** Fixed bottom bars ([data-fixed-bar]) fade away while the footer is on screen */
  function initFooterWatch() {
    const footer = document.querySelector("body > footer, footer");
    if (!footer || !("IntersectionObserver" in window)) return;
    new IntersectionObserver(([entry]) => document.documentElement.toggleAttribute("data-at-footer", entry.isIntersecting), {
      rootMargin: "0px 0px -40px 0px",
    }).observe(footer);
  }

  /* ------------------------------------------------------------------ */
  /* Background videos ([data-autoplay])                                 */
  /*   play only while on screen (and only then download, preload=none); */
  /*   reduced motion keeps the poster                                   */
  /* ------------------------------------------------------------------ */

  function initVideos() {
    const videos = $$("video[data-autoplay]");
    if (!videos.length) return;
    const still = matchMedia("(prefers-reduced-motion: reduce)");
    const play = (v) => v.play().catch(() => {}); // blocked autoplay (e.g. low-power mode) → poster stays
    if (!("IntersectionObserver" in window)) {
      if (!still.matches) videos.forEach(play);
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        for (const { target, isIntersecting } of entries) {
          if (isIntersecting && !still.matches) play(target);
          else target.pause();
        }
      },
      { rootMargin: "200px 0px" },
    );
    videos.forEach((v) => {
      if (still.matches) {
        v.removeAttribute("autoplay");
        v.pause();
      }
      io.observe(v);
    });
    still.addEventListener("change", () => videos.forEach((v) => (still.matches ? v.pause() : null)));
  }

  /* ------------------------------------------------------------------ */
  /* Rows that start with their middle item centred (journal cards)      */
  /* ------------------------------------------------------------------ */

  function initCenteredScrollers() {
    $$("[data-center-scroll]").forEach((list) => {
      if (list.scrollWidth <= list.clientWidth) return;
      const middle = list.children[Math.floor(list.children.length / 2)];
      if (!middle) return;
      const listBox = list.getBoundingClientRect();
      const itemBox = middle.getBoundingClientRect();
      // Works for both LTR and RTL scroll origins because it is a relative offset
      list.scrollLeft += itemBox.left + itemBox.width / 2 - (listBox.left + listBox.width / 2);
    });
  }

  /* ------------------------------------------------------------------ */
  /* Rails: horizontal card rows ([data-rail])                           */
  /*   - data-more-start / data-more-end tell the CSS where to fade      */
  /*   - mouse users can drag them like on a phone                       */
  /* ------------------------------------------------------------------ */

  Maso.rail = function rail(el) {
    if (!el || el._rail) return;
    el._rail = true;
    const update = () => {
      const max = el.scrollWidth - el.clientWidth;
      const pos = Math.abs(el.scrollLeft); // RTL scrolls 0 → −max; LTR 0 → max
      el.toggleAttribute("data-more-start", pos > 2);
      el.toggleAttribute("data-more-end", max - pos > 2);
    };
    el.addEventListener("scroll", update, { passive: true });
    new ResizeObserver(update).observe(el);
    update();

    let startX = 0;
    let startLeft = 0;
    let down = false;
    let moved = false;
    el.addEventListener("pointerdown", (e) => {
      if (e.pointerType !== "mouse" || e.button !== 0) return;
      down = true;
      moved = false;
      startX = e.clientX;
      startLeft = el.scrollLeft;
    });
    el.addEventListener("pointermove", (e) => {
      if (!down) return;
      const dx = e.clientX - startX;
      if (!moved && Math.abs(dx) > 5) {
        moved = true;
        el.setPointerCapture(e.pointerId);
        el.style.scrollSnapType = "none";
        el.style.cursor = "grabbing";
      }
      if (moved) el.scrollLeft = startLeft - dx;
    });
    const end = () => {
      down = false;
      el.style.scrollSnapType = "";
      el.style.cursor = "";
    };
    el.addEventListener("pointerup", end);
    el.addEventListener("pointercancel", end);
    // The click that ends a drag must not open the card under the pointer
    el.addEventListener(
      "click",
      (e) => {
        if (!moved) return;
        e.preventDefault();
        e.stopPropagation();
        moved = false;
      },
      true,
    );
    el.addEventListener("dragstart", (e) => e.preventDefault());
  };

  /* ------------------------------------------------------------------ */
  /* Sheets                                                              */
  /* ------------------------------------------------------------------ */

  const SHEET_BASE =
    "m-0 max-h-none max-w-none overflow-hidden bg-surface p-0 text-ink " +
    "transition-[translate,opacity,scale,display,overlay] transition-discrete duration-500 ease-out-expo " +
    "backdrop:bg-black-30 backdrop:backdrop-blur-[3px] backdrop:transition-[opacity,display,overlay] backdrop:transition-discrete backdrop:duration-500 " +
    "backdrop:opacity-0 open:backdrop:opacity-100 starting:open:backdrop:opacity-0";

  /* phone: full screen · md: right panel · lg: left panel (as drawn) */
  const SHEET_DRAWER =
    "inset-0 h-dvh w-full translate-x-full open:translate-x-0 md:start-0 md:end-auto md:w-[402px] lg:start-auto lg:end-0 lg:-translate-x-full lg:open:translate-x-0 starting:open:translate-x-full lg:starting:open:-translate-x-full";

  /* phone: bottom sheet · md+: centred card */
  const SHEET_CARD =
    "max-h-[90dvh] inset-x-0 top-auto bottom-0 w-full translate-y-full rounded-t-[32px] open:translate-y-0 md:inset-0 md:m-auto md:h-fit md:w-[402px] md:translate-y-0 md:scale-95 md:opacity-0 md:open:scale-100 md:open:opacity-100 starting:open:translate-y-full md:starting:open:scale-95 md:starting:open:opacity-0";

  /**
   * Modal surface on the native <dialog>: focus trap, Esc-to-close, inert
   * background and top-layer stacking come from the browser. Enter and exit
   * animations are pure CSS (`@starting-style` + `transition-behavior`).
   *
   *   const s = Maso.sheet({ title, variant: "sheet" | "drawer", cardRadius: 24 | 32, onClose })
   *   s.body / s.footer   elements to render into
   *   s.open() / s.close()
   *
   * variant "drawer": full screen on phones, side panel from tablet up (filters)
   * variant "sheet":  bottom sheet with a drag handle on phones, centred card from tablet up
   */
  Maso.sheet = function sheet({ title, variant = "sheet", cardRadius = 24, onClose, removeOnClose = false }) {
    const { html, icon, cx } = Maso;
    const drawer = variant === "drawer";
    const dialog = Maso.dom.create(html`
      <dialog
        aria-label="${title}"
        class="${cx(SHEET_BASE, drawer ? SHEET_DRAWER : cx(cardRadius === 32 ? "md:rounded-[32px]" : "md:rounded-[24px]", SHEET_CARD))}"
      >
        <div class="${cx("flex flex-col", drawer ? "h-full gap-6 overflow-y-auto p-6" : "max-h-[90dvh] pt-6 md:pt-0")}">
          ${!drawer && html`<span aria-hidden="true" class="mx-auto h-2 w-14 shrink-0 rounded-[9px] bg-surf-container-highest md:hidden"></span>`}
          <header class="${cx("flex shrink-0 items-center justify-between", !drawer && "h-20 px-6")}">
            <h2 class="text-16 font-semibold text-ink-var">${title}</h2>
            <button type="button" data-sheet-close aria-label="بستن" class="-m-3 flex size-12 items-center justify-center text-ink-var">
              ${icon("close")}
            </button>
          </header>
          <div data-sheet-body class="${drawer ? "" : "no-scrollbar min-h-0 flex-1 overflow-y-auto overscroll-contain"}"></div>
          <div data-sheet-footer class="shrink-0" hidden></div>
        </div>
      </dialog>
    `);
    document.body.append(dialog);

    const api = {
      dialog,
      body: $("[data-sheet-body]", dialog),
      footer: $("[data-sheet-footer]", dialog),
      open() {
        if (!dialog.open) dialog.showModal();
      },
      close() {
        if (dialog.open) dialog.close();
      },
      /** Shows the pinned footer with this content */
      setFooter(view) {
        api.footer.hidden = !view;
        api.footer.innerHTML = view ? String(view) : "";
      },
    };

    $("[data-sheet-close]", dialog).addEventListener("click", api.close);
    Maso.dom.onBackdropClick(dialog, api.close);
    dialog.addEventListener("close", (e) => {
      if (e.target !== dialog) return;
      onClose?.();
      // One-off sheets leave the DOM once the exit animation is over
      if (removeOnClose) setTimeout(() => dialog.remove(), 600);
    });
    return api;
  };

  /* ------------------------------------------------------------------ */

  ready(() => {
    initReveal();
    initHeader();
    initMegaMenu();
    initMobileMenu();
    initAccountLinks();
    initCartBadge();
    initFooterWatch();
    initAccordions();
    initVideos();
    initCenteredScrollers();
    $$("[data-rail]").forEach(Maso.rail);
  });
})();
