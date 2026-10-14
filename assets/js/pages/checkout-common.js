/**
 * Building blocks shared by the cart and checkout steps (Figma "Cart &
 * Checkout"): the two-column frame, step bar, totals, floating total bar,
 * and the quote loader. Loaded on cart.html and checkout-*.html only.
 */
(function () {
  "use strict";

  const Maso = window.Maso;
  const { html, icon, fmt, cx, dom, api } = Maso;

  /** Primary pill used for every checkout CTA (48px, 24px padding) */
  const CTA =
    "inline-flex h-12 shrink-0 items-center justify-center gap-2 rounded-full bg-primary px-6 text-16 text-on-primary " +
    "transition-[background-color,transform,opacity] duration-300 ease-out-expo hover:bg-primary/90 active:scale-[0.98] " +
    "disabled:pointer-events-none disabled:opacity-40";

  /** Outline pill ("افزودن آدرس" when there is no address yet) */
  const CTA_OUTLINE =
    "inline-flex h-12 shrink-0 items-center justify-center rounded-full border border-primary px-6 text-16 text-primary " +
    "transition-[background-color,transform] duration-300 ease-out-expo hover:bg-surface-low active:scale-[0.98]";

  /**
   * Two-column frame on desktop: the step on the right, the 409px summary
   * column on the left (full height, outline-var rule). Phones and tablets
   * get a single column; the summary renders inside the step instead.
   */
  const frame = (main, aside) => html`
    <div class="lg:flex lg:min-h-[calc(100dvh-97px)]">
      <div class="flex min-h-[calc(100dvh-80px)] min-w-0 flex-1 flex-col lg:min-h-0">${main}</div>
      <aside aria-label="خلاصه سفارش" class="hidden w-[409px] shrink-0 border-s border-outline-var lg:block">
        <div class="no-scrollbar sticky top-[97px] flex max-h-[calc(100dvh-97px)] flex-col gap-4 overflow-y-auto p-8">${aside}</div>
      </aside>
    </div>
  `;

  /** ● ┈┈ ○ — 16px dots joined by a dotted line; reached steps are filled */
  const stepDots = (step) => {
    const dot = (filled) => cx("size-4 rounded-full border-[1.5px] border-primary transition-colors duration-500", filled ? "bg-primary" : "bg-transparent");
    return html`<div role="img" aria-label="${`مرحله ${fmt.digits(step)} از ۲`}" class="flex items-center gap-1">
      <span class="${dot(true)}"></span>
      <span class="w-[22px] border-t border-dotted border-primary"></span>
      <span class="${dot(step === 2)}"></span>
    </div>`;
  };

  /**
   * Step bar under the header: back chevron + 13px title on the right, the
   * step dots on the left. 56px tall; 72px on desktop for the checkout steps.
   */
  const stepHeader = (title, backHref, step) => html`
    <div class="${cx("flex items-center justify-between px-12 py-4", step && "lg:py-6")}">
      <a href="${backHref}" class="group flex items-center gap-2 text-13 text-on-surface-var transition-colors hover:text-on-surface">
        <!-- chevron pointing right = "back" in RTL -->
        ${icon("chevronLeft", { cls: "-scale-x-100 text-on-surface transition-transform duration-300 group-hover:translate-x-0.5" })}
        <h1>${title}</h1>
      </a>
      ${step && stepDots(step)}
    </div>
  `;

  /** 13px grey heading above each block ("جزئیات پرداخت", "روش پرداخت", …) */
  const blockTitle = (text, cls = "") => html`<h2 class="${cx("text-13 text-on-surface-var", cls)}">${text}</h2>`;

  /** Amount + small toman sign, or a word such as "رایگان" */
  const rowValue = (row) =>
    row.amount === undefined
      ? html`<span>${row.text}</span>`
      : html`<span class="flex items-center gap-1">${icon("toman", { size: 13, cls: "shrink-0" })}<span>${fmt.price(row.amount)}</span></span>`;

  /** "جزئیات پرداخت" rows: label (outline, right) and value (left), 13px, 8px apart */
  const totalsList = (rows, discount, cls = "") => html`
    <dl class="${cx("flex flex-col gap-2 text-13", cls)}">
      ${rows.map(
        (row) => html`<div class="flex items-center justify-between">
          <dt class="text-outline">${row.label}</dt>
          <dd class="text-on-surface-var">${rowValue(row)}</dd>
        </div>`,
      )}
      ${discount &&
      discount.amount > 0 &&
      html`<div class="flex items-center justify-between">
        <dt class="text-outline">تخفیف</dt>
        <dd class="flex items-center gap-1 text-on-error-container">
          ${icon("toman", { size: 13, cls: "shrink-0" })}<span dir="ltr">${`- ${fmt.price(discount.amount)}`}</span>
        </dd>
      </div>`}
    </dl>
  `;

  /** Placeholder rows while the first quote is on its way */
  const totalsSkeleton = () => html`
    <div aria-hidden="true" class="flex flex-col gap-2">
      ${[0, 1, 2, 3, 4].map(
        () => html`<div class="flex h-5 items-center justify-between">
          <span class="h-3.5 w-16 animate-pulse rounded-[6px] bg-skeleton"></span>
          <span class="h-3.5 w-20 animate-pulse rounded-[6px] bg-skeleton"></span>
        </div>`,
      )}
    </div>
  `;

  /** Totals for a quote state: rows (dimmed while a newer quote loads) or the skeleton */
  const totals = (state, withDiscount = true) =>
    state.quote
      ? totalsList(state.quote.rows, withDiscount ? state.quote.discount : undefined, cx("transition-opacity duration-300", state.pending && "opacity-60"))
      : totalsSkeleton();

  /** Bold total with the 20px toman sign (pulse until known) */
  const payable = (amount, cls = "") => html`
    <span class="${cx("flex items-center gap-2.5 text-16 font-bold text-ink", cls)}">
      ${amount === null || amount === undefined
        ? html`<span class="h-5 w-28 animate-pulse rounded-[6px] bg-skeleton"></span>`
        : html`<span>${fmt.price(amount)}</span>`}
      ${icon("toman", { cls: "shrink-0" })}
    </span>
  `;

  /**
   * Desktop summary column (409px): "جزئیات پرداخت" rows, a rule, the
   * payable amount, the step's CTA (full width) and anything step-specific
   * below it (the coupon card on the payment step).
   * Slots: [data-slot="totals"], [data-slot="payable"], [data-slot="cta"], [data-slot="aside-extra"]
   */
  const summaryAside = () => html`
    <div class="flex flex-col gap-4">${blockTitle("جزئیات پرداخت")}<div data-slot="totals">${totalsSkeleton()}</div></div>
    <hr class="border-outline-var" />
    <div class="flex flex-col gap-6 [&_a]:w-full [&_button]:w-full">
      <div class="flex items-center justify-between">
        <span class="text-13 text-outline">قابل پرداخت</span>
        <span data-slot="payable">${payable(null)}</span>
      </div>
      <div data-slot="cta" class="contents"></div>
    </div>
    <div data-slot="aside-extra" class="contents"></div>
  `;

  /**
   * Floating total bar on phones and tablets: a white/50 glass card (32px
   * radius) over a white fade, sticky at the bottom of the step. `note` sits
   * under the card (terms line on the payment step).
   */
  const checkoutBar = (content, note = "") => html`
    <div class="sticky bottom-0 z-10 mt-auto flex flex-col items-center gap-2.5 bg-gradient-to-b from-white/0 to-white p-4 backdrop-blur-[2px] md:px-12 lg:hidden">
      <div class="flex w-full items-center justify-between rounded-[32px] border border-black-10 bg-white/50 p-4">${content}</div>
      ${note}
    </div>
  `;

  /** Orange notice box under the shipping method */
  const notice = (text) => html`<p class="rounded-[16px] bg-warning-container p-4 text-13 whitespace-pre-line text-warning-text">${text}</p>`;

  /** "با ادامه شما با شرایط و قوانین ماسو موافقت می‌کنید." */
  const termsNote = (cls = "") => html`
    <p class="${cx("text-13 text-ink-var", cls)}">
      با ادامه شما با <a href="terms.html" class="text-secondary underline underline-offset-2">شرایط و قوانین</a> ماسو موافقت می‌کنید.
    </p>
  `;

  const errorText = (text) => html`<p role="alert" class="rounded-[16px] bg-error-container p-4 text-13 text-on-error-container">${text}</p>`;

  /** Placeholder for a checkout step while the browser state is read */
  const stepSkeleton = () => html`
    <div aria-busy="true" class="flex flex-col gap-6 px-12 py-6">
      <div class="h-6 w-32 animate-pulse rounded-[6px] bg-skeleton"></div>
      <div class="h-[110px] animate-pulse rounded-[26px] bg-skeleton"></div>
      <div class="h-[90px] animate-pulse rounded-[16px] bg-skeleton"></div>
    </div>
  `;

  /**
   * Totals priced by WordPress. Call `refresh(input)` whenever the cart, the
   * destination or the coupon may have changed; identical inputs are not
   * re-requested. While a new quote is on its way the previous one stays
   * (`pending` lets the UI dim it); answers to outdated requests are dropped.
   *   const q = quoteLoader((state) => paint(state))
   *   q.refresh({ lines, provinceId, cityId, coupon })
   */
  function quoteLoader(onChange) {
    const state = { quote: null, pending: false };
    let current = "";
    return {
      state,
      refresh(input) {
        const key = input.lines.length ? JSON.stringify(input) : "";
        if (key === current) return;
        current = key;
        if (!key) {
          Object.assign(state, { quote: null, pending: false });
          onChange(state);
          return;
        }
        state.pending = true;
        onChange(state);
        api
          .quote(JSON.parse(key))
          .then((quote) => {
            if (key !== current) return;
            Object.assign(state, { quote, pending: false });
            onChange(state);
          })
          .catch(() => {
            /* keep the last quote; the next change retries */
            if (key === current) current = "";
          });
      },
    };
  }

  Maso.co = {
    CTA,
    CTA_OUTLINE,
    frame,
    stepHeader,
    stepDots,
    blockTitle,
    totalsList,
    totalsSkeleton,
    totals,
    payable,
    summaryAside,
    checkoutBar,
    notice,
    termsNote,
    errorText,
    stepSkeleton,
    quoteLoader,
    /** Fills every matching slot inside `root` */
    fill(root, name, view) {
      dom.$$(`[data-slot="${name}"]`, root).forEach((el) => dom.render(el, view));
    },
  };
})();
