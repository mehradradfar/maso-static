/**
 * profile.html — the customer's account (Figma "Profile").
 *
 * One page, several views chosen by the query string (see the comment at
 * the top of profile.html). Moving between views uses history.pushState, so
 * the account is loaded once and Back/Forward work as expected.
 *
 * Desktop (≥1024px): sidebar (current order + menu) beside the view.
 * Phones/tablets: the menu is its own screen; every view starts with "بازگشت".
 * Dialogs are bottom sheets on phones and centred cards from tablets up
 * (Maso.sheet); the pre-invoice is a side drawer (full screen on phones).
 */
(function () {
  "use strict";

  const Maso = window.Maso;
  const { html, icon, fmt, cx, dom, api, ui, text, fields } = Maso;

  const DESKTOP = matchMedia("(width >= 64rem)");
  const TABS = [
    { key: "pre", label: "پیش‌فاکتور" },
    { key: "current", label: "جاری" },
    { key: "delivered", label: "تحویل‌شده" },
    { key: "returned", label: "مرجوعی" },
  ];
  const CTA =
    "inline-flex h-14 w-full shrink-0 items-center justify-center gap-2 rounded-full bg-primary px-6 text-16 text-on-primary " +
    "transition-[background-color,transform,opacity] duration-300 ease-out-expo hover:bg-primary/90 active:scale-[0.98] " +
    "disabled:pointer-events-none disabled:opacity-40";

  /* ------------------------------------------------------------------ */
  /* Small pieces                                                        */
  /* ------------------------------------------------------------------ */

  const link = (params) => `profile.html${params ? `?${new URLSearchParams(params)}` : ""}`;

  /** Orange status pill: "تحویل محصول / ۱۰ کاری روز دیگر" or a single line */
  const badge = (b) =>
    b
      ? html`<span class="inline-flex shrink-0 flex-col items-center rounded-full bg-warning-container px-2 py-1 text-center text-warning-text">
          ${b.caption && html`<span class="text-10">${b.caption}</span>`}
          <span class="text-13">${b.label}</span>
        </span>`
      : "";

  const thumb = (image, cls = "h-20 w-[116px] rounded-[16px]") =>
    html`<span class="${cx("block shrink-0 overflow-hidden bg-surface-low", cls)}">${ui.img(image, { cls: "size-full object-cover", alt: "" })}</span>`;

  /** Label on the right, value on the left (receipt rows, order rows) */
  const row = (label, value) => html`
    <div class="flex items-center justify-between gap-4 text-16">
      <dt class="text-outline">${label}</dt>
      <dd class="text-on-surface">${value}</dd>
    </div>
  `;

  const priceText = (amount) => html`<span class="inline-flex items-center gap-2.5">${fmt.price(amount)} ${icon("toman")}</span>`;

  /** "‹ بازگشت" row at the top of every view on phones/tablets */
  const backRow = (href = link()) => html`
    <div class="flex h-14 items-center px-6 md:px-12 lg:hidden">
      <a href="${href}" data-nav class="flex items-center gap-2 text-13 text-on-surface-var transition-opacity hover:opacity-70">
        ${icon("chevronRight")} بازگشت
      </a>
    </div>
  `;

  /** Read-only "field" (label 10px over value 16px) as drawn in address cards */
  const filled = (label, value) => html`
    <div class="flex min-h-14 flex-col justify-center rounded-[16px] px-4 py-2">
      <span class="text-10 text-on-surface-var">${label}</span>
      <span class="text-16 text-on-surface">${value}</span>
    </div>
  `;

  const emptyState = (message) => html`<p class="animate-fade-up py-16 text-center text-16 text-on-surface-var">${message}</p>`;

  const errorState = () =>
    html`<p class="m-6 rounded-[16px] bg-error-container p-4 text-center text-13 text-on-error-container">بارگذاری اطلاعات انجام نشد. لطفا صفحه را دوباره باز کنید.</p>`;

  /* ------------------------------------------------------------------ */
  /* Menu (sidebar on desktop, own screen on phones)                     */
  /* ------------------------------------------------------------------ */

  const MENU = [
    { key: "info", label: "اطلاعات فردی", icon: "user", href: link({ view: "info" }) },
    { key: "addresses", label: "آدرس‌ها", icon: "mapPinHouse", href: link({ view: "addresses" }) },
    { key: "orders", label: "سفارش‌ها", icon: "truck", href: link({ view: "orders" }) },
    { key: "support", label: "پشتیبانی", icon: "lifeBuoy", href: "contact.html" },
  ];

  /** "سفارش جاری" card: picture · status · chevron */
  function currentOrderCard(order, { active = false, compact = false } = {}) {
    if (!order) return "";
    return html`
      <a
        href="${link({ view: "order", id: order.id })}"
        data-nav
        aria-label="${`سفارش جاری، ${order.badge ? [order.badge.caption, order.badge.label].filter(Boolean).join(" ") : ""}`}"
        class="${cx(
          "flex items-center justify-between gap-4 transition-colors",
          !compact && "rounded-[24px] border border-hairline p-6 hover:bg-surface-low",
          active && !compact && "bg-surface-low",
        )}"
      >
        ${thumb(order.image)} ${badge(order.badge)} ${icon("chevronLeft", { cls: "shrink-0 text-on-surface" })}
      </a>
    `;
  }

  function sidebar(state, view) {
    const { customer, currentOrder } = state.account;
    const viewingCurrent = view.name === "order" && currentOrder && view.id === currentOrder.id;
    const activeKey = view.name === "order" ? (viewingCurrent ? "" : "orders") : view.name;
    return html`
      <aside aria-label="حساب کاربری" class="hidden w-[400px] shrink-0 flex-col gap-4 p-8 lg:flex xl:w-[463px]">
        ${currentOrderCard(currentOrder, { active: viewingCurrent })}
        <nav class="flex flex-col gap-8 rounded-[32px] border border-black-10 p-6">
          ${MENU.map((item) => {
            const active = item.key === activeKey;
            return html`
              <a
                href="${item.href}"
                ${item.key !== "support" ? html`data-nav` : ""}
                ${active ? html`aria-current="page"` : ""}
                class="${cx("flex items-start gap-2 rounded-[24px] p-4 transition-colors", active ? "bg-field" : "hover:bg-surface-low")}"
              >
                ${icon(item.icon, { cls: "shrink-0 text-on-surface" })}
                <span class="flex flex-col gap-2.5">
                  <span class="text-16 text-ink">${item.label}</span>
                  ${item.key === "info" && html`<span class="text-13 text-ink-var">${fullName(customer)} - ${fmt.digits(customer.mobile)}</span>`}
                </span>
              </a>
            `;
          })}
          <button type="button" data-action="logout" class="flex items-center gap-2 rounded-[24px] p-4 text-16 text-error transition-colors hover:bg-error-container/40">
            ${icon("logOut", { cls: "shrink-0" })} خروج از حساب کاربری
          </button>
        </nav>
      </aside>
    `;
  }

  const fullName = (c) => [c.firstName, c.lastName].filter(Boolean).join(" ") || "کاربر ماسو";

  /** Phones/tablets: "حساب کاربری" screen */
  function menuScreen(state) {
    const { customer, currentOrder } = state.account;
    return html`
      <div class="animate-fade-up w-full">
        <div class="p-6 md:px-12">
          <h1 class="bg-linear-to-b from-on-surface-var to-on-surface-var/60 bg-clip-text text-20 font-bold text-transparent">حساب کاربری</h1>
        </div>
        ${currentOrder &&
        html`<section aria-label="سفارش جاری" class="flex flex-col gap-6 border-b-4 border-outline-var p-6 md:px-12">
          <h2 class="text-13 text-on-surface-var">سفارش جاری</h2>
          ${currentOrderCard(currentOrder, { compact: true })}
        </section>`}
        <nav class="flex flex-col gap-6 p-6 md:px-12">
          ${MENU.map(
            (item) => html`
              <a
                href="${item.href}"
                ${item.key !== "support" ? html`data-nav` : ""}
                class="flex items-center justify-between gap-4 border-b border-[#e8e8e8] pb-6 transition-opacity hover:opacity-70"
              >
                <span class="flex items-start gap-2">
                  ${icon(item.icon, { cls: "shrink-0 text-on-surface" })}
                  <span class="flex flex-col gap-2.5">
                    <span class="text-16 text-on-surface">${item.label}</span>
                    ${item.key === "info" && html`<span class="text-13 text-on-surface-var">${fullName(customer)} - ${fmt.digits(customer.mobile)}</span>`}
                  </span>
                </span>
                ${icon("chevronLeft", { cls: "shrink-0 text-on-surface" })}
              </a>
            `,
          )}
          <button type="button" data-action="logout" class="flex items-center gap-2 self-start text-16 text-error transition-opacity hover:opacity-70">
            ${icon("logOut", { cls: "shrink-0" })} خروج از حساب کاربری
          </button>
        </nav>
      </div>
    `;
  }

  /* ------------------------------------------------------------------ */
  /* Personal info                                                       */
  /* ------------------------------------------------------------------ */

  function infoView(state) {
    const c = state.account.customer;
    const item = (label, value, action, actionLabel, last) => html`
      <div class="${cx("flex items-center justify-between gap-4", !last && "border-b border-outline-var pb-4 lg:border-hairline")}">
        <div class="flex min-w-0 flex-col gap-2.5">
          <span class="text-13 text-on-surface-var lg:text-ink-var">${label}</span>
          <span class="text-16 break-words text-on-surface lg:text-ink">${value || "-"}</span>
        </div>
        <button
          type="button"
          data-action="${action}"
          aria-label="${actionLabel}"
          class="flex size-12 shrink-0 items-center justify-center rounded-full text-on-surface transition-colors hover:bg-surface-low"
        >
          ${icon(action === "email" && !c.email ? "plusCircle" : "pencil")}
        </button>
      </div>
    `;
    return html`
      <div class="animate-fade-up flex flex-col gap-6 p-6 md:px-12 lg:py-6">
        <h1 class="sr-only">اطلاعات فردی</h1>
        ${item("نام", c.firstName, "firstName", "تغییر نام")}
        ${item("نام خانوادگی", c.lastName, "lastName", "تغییر نام خانوادگی")}
        ${item("شماره همراه", fmt.digits(c.mobile), "mobile", "تغییر شماره همراه")}
        ${item("ایمیل", c.email, "email", c.email ? "تغییر ایمیل" : "افزودن ایمیل", true)}
      </div>
    `;
  }

  /** One-field sheet: name, last name or email */
  function editFieldSheet(state, key, rerender) {
    const c = state.account.customer;
    const META = {
      firstName: { title: "تغییر نام", label: "نام", max: 60, attrs: { autocomplete: "given-name" } },
      lastName: { title: "تغییر نام خانوادگی", label: "نام خانوادگی", max: 60, attrs: { autocomplete: "family-name" } },
      email: { title: c.email ? "تغییر ایمیل" : "افزودن ایمیل", label: "ایمیل", max: 120, attrs: { type: "email", dir: "ltr", autocomplete: "email", inputmode: "email" } },
    }[key];
    const sheet = Maso.sheet({ title: META.title, cardRadius: 32, removeOnClose: true });
    dom.render(
      sheet.body,
      html`<form novalidate class="flex flex-col gap-4 p-6">
        ${fields.text({ name: key, label: META.label, value: c[key] || "", attrs: { maxlength: META.max, ...META.attrs } })}
        <p data-form-error role="alert" hidden class="text-13 text-error"></p>
        <button type="submit" class="${CTA}">ذخیره</button>
      </form>`,
    );
    const form = dom.$("form", sheet.body);
    const input = form.elements.namedItem(key);
    input.addEventListener("input", () => fields.setError(dom.$(`[data-field="${key}"]`, form), null));
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const value = input.value.replace(/\s+/g, " ").trim().slice(0, META.max);
      let error = null;
      if (key !== "email" && value.length < 2) error = `${META.label} را وارد کنید.`;
      if (key === "email" && value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) error = "ایمیل معتبر نیست.";
      fields.setError(dom.$(`[data-field="${key}"]`, form), error);
      if (error) return input.focus();
      const button = dom.$("button[type=submit]", form);
      button.disabled = true;
      try {
        state.account.customer = await api.account.update({ [key]: value });
        sheet.close();
        rerender();
      } catch (err) {
        if (handleAuthError(err)) return;
        const line = dom.$("[data-form-error]", form);
        line.textContent = "ذخیره انجام نشد. لطفا دوباره تلاش کنید.";
        line.hidden = false;
        button.disabled = false;
      }
    });
    sheet.open();
    requestAnimationFrame(() => input.focus());
  }

  /** "تغییر شماره": new number → SMS code (sample code 12345) */
  function mobileSheet(state, rerender) {
    const sheet = Maso.sheet({ title: "تغییر شماره", cardRadius: 32, removeOnClose: true, onClose: () => clearInterval(timer) });
    let mobile = "";
    let codeLength = 4;
    let resendAt = 0;
    let timer = 0;
    let busy = false;

    const heading = (title, body) => html`
      <div class="flex flex-col gap-2">
        <h3 class="text-20 font-bold text-on-surface">${title}</h3>
        <p class="text-13 text-on-surface-var">${body}</p>
      </div>
    `;
    const errorLine = html`<p data-error role="alert" hidden class="mt-1 ps-4 text-13 text-error"></p>`;
    const showError = (message) => {
      const line = dom.$("[data-error]", sheet.body);
      line.textContent = message || "";
      line.hidden = !message;
      dom.$("[data-ring]", sheet.body)?.classList.toggle("ring-error", !!message);
    };

    async function send(raw, onSent) {
      const normalized = text.mobile(raw);
      if (!normalized) return showError("شماره همراه معتبر نیست.");
      if (normalized === state.account.customer.mobile) return showError("این شماره همین الان روی حساب شماست.");
      busy = true;
      try {
        const result = await api.account.requestMobileChange(normalized);
        mobile = normalized;
        codeLength = result.length || 4;
        resendAt = Date.now() + (result.resendIn || 120) * 1000;
        onSent();
      } catch (err) {
        if (handleAuthError(err)) return;
        showError(err?.status === 409 ? "این شماره روی حساب دیگری ثبت شده است." : "ارسال کد انجام نشد. کمی بعد دوباره تلاش کنید.");
      } finally {
        busy = false;
      }
    }

    function numberStep() {
      clearInterval(timer);
      dom.render(
        sheet.body,
        html`<form novalidate class="flex min-h-[300px] flex-col justify-between gap-6 p-6">
          <div class="flex flex-col gap-4">
            ${heading("شماره همراه جدید", "شماره همراهی که می‌خواهید حسابتان به آن تغییر کند را وارد کنید.")}
            <div>
              <input
                data-ring
                type="tel"
                inputmode="tel"
                autocomplete="tel-national"
                dir="ltr"
                value="${mobile}"
                placeholder="شماره همراه"
                aria-label="شماره همراه جدید"
                class="h-14 w-full rounded-[16px] bg-field px-4 text-right text-16 text-on-surface ring-1 ring-transparent outline-none transition-shadow placeholder:text-outline focus:ring-primary/30"
              />
              ${errorLine}
            </div>
          </div>
          <button type="submit" class="${CTA}">ادامه</button>
        </form>`,
      );
      const input = dom.$("input", sheet.body);
      input.addEventListener("input", () => showError(null));
      dom.$("form", sheet.body).addEventListener("submit", (e) => {
        e.preventDefault();
        if (!busy) send(input.value, codeStep);
      });
      requestAnimationFrame(() => input.focus());
    }

    function codeStep() {
      dom.render(
        sheet.body,
        html`<form novalidate class="flex flex-col gap-6 p-6">
          <button type="button" data-step-back class="flex items-center gap-1 self-start text-13 text-on-surface transition-opacity hover:opacity-70">
            ${icon("chevronRight", { size: 18 })} بازگشت
          </button>
          ${heading("کد یکبارمصرف", html`کد یکبار مصرف ارسال شده به شماره <span class="text-on-surface">${fmt.digits(mobile)}</span>`)}
          <div>
            <label data-ring class="relative flex h-14 w-full cursor-text items-center justify-center rounded-[16px] bg-field ring-1 ring-transparent transition-shadow">
              <input inputmode="numeric" autocomplete="one-time-code" maxlength="${codeLength}" aria-label="کد یکبار مصرف" class="absolute inset-0 size-full bg-transparent text-transparent caret-transparent outline-none" />
              <span data-slots dir="ltr" aria-hidden="true" class="pointer-events-none flex w-[190px] justify-between text-16"></span>
            </label>
            ${errorLine}
          </div>
          <button type="button" data-resend class="mx-auto flex h-12 items-center justify-center rounded-[12px] px-4 text-13 text-ink transition-opacity"></button>
          <button type="submit" class="${CTA}">ادامه</button>
        </form>`,
      );
      const form = dom.$("form", sheet.body);
      const input = dom.$("input", form);
      const slots = dom.$("[data-slots]", form);
      const resend = dom.$("[data-resend]", form);

      const paintSlots = () => {
        const focused = document.activeElement === input;
        dom.render(
          slots,
          Array.from({ length: codeLength }, (_, i) => {
            const digit = input.value[i];
            return html`<span class="${cx("w-2.5 text-center", digit ? "text-on-surface" : "text-ink-muted", focused && i === input.value.length && "animate-pulse text-primary")}"
              >${digit ? fmt.digits(digit) : "-"}</span
            >`;
          }),
        );
      };
      const paintResend = () => {
        const left = Math.max(0, Math.ceil((resendAt - Date.now()) / 1000));
        resend.disabled = left > 0;
        resend.classList.toggle("opacity-30", left > 0);
        resend.classList.toggle("text-secondary", !left);
        resend.textContent = left > 0 ? `ارسال مجدد در ${fmt.digits(`${Math.floor(left / 60)}:${String(left % 60).padStart(2, "0")}`)}` : "ارسال مجدد کد";
        if (!left) clearInterval(timer);
      };

      async function verify() {
        if (busy) return;
        const code = text.latinDigits(input.value).replace(/\D/g, "");
        if (code.length < codeLength) return showError("کد را کامل وارد کنید.");
        busy = true;
        try {
          const customer = await api.account.confirmMobileChange(mobile, code);
          if (!customer) {
            input.value = "";
            paintSlots();
            return showError("کد وارد شده صحیح نیست.");
          }
          state.account.customer = customer;
          sheet.close();
          rerender();
        } catch (err) {
          if (!handleAuthError(err)) showError("تغییر شماره انجام نشد. لطفا دوباره تلاش کنید.");
        } finally {
          busy = false;
        }
      }

      input.addEventListener("input", () => {
        input.value = input.value.replace(/[^\d۰-۹]/g, "").slice(0, codeLength);
        showError(null);
        paintSlots();
        if (input.value.length === codeLength) verify();
      });
      input.addEventListener("focus", paintSlots);
      input.addEventListener("blur", paintSlots);
      form.addEventListener("submit", (e) => {
        e.preventDefault();
        verify();
      });
      dom.$("[data-step-back]", form).addEventListener("click", numberStep);
      resend.addEventListener("click", () =>
        send(mobile, () => {
          input.value = "";
          showError(null);
          paintSlots();
          clearInterval(timer);
          timer = setInterval(paintResend, 1000);
          paintResend();
        }),
      );
      clearInterval(timer);
      timer = setInterval(paintResend, 1000);
      paintResend();
      paintSlots();
      requestAnimationFrame(() => input.focus());
    }

    numberStep();
    sheet.open();
  }

  /* ------------------------------------------------------------------ */
  /* Addresses                                                           */
  /* ------------------------------------------------------------------ */

  const NEW_ADDRESS_BUTTON =
    "inline-flex h-14 w-full max-w-[354px] items-center justify-center gap-1 rounded-full bg-[#cce3ff] px-3 text-16 text-[#003a80] " +
    "transition-[background-color,transform] duration-300 ease-out-expo hover:bg-[#b8d8ff] active:scale-[0.98]";

  function addressCard(a, i) {
    return html`
      <li data-reveal style="--reveal-index:${i % 4}" class="flex items-center gap-4 rounded-[26px] bg-surface-low p-4">
        <div class="flex min-w-0 flex-1 flex-col gap-2">
          ${filled("آدرس", Maso.formatAddress(a))} ${filled("کد پستی", fmt.digits(a.postalCode))}
        </div>
        <div class="flex shrink-0 flex-col">
          <button type="button" data-action="edit-address" data-id="${a.id}" aria-label="ویرایش آدرس" class="flex size-12 items-center justify-center rounded-full text-on-surface transition-colors hover:bg-surf-container">
            ${icon("pencil")}
          </button>
          <button type="button" data-action="delete-address" data-id="${a.id}" aria-label="حذف آدرس" class="flex size-12 items-center justify-center rounded-full text-error transition-colors hover:bg-error-container/50">
            ${icon("trash")}
          </button>
        </div>
      </li>
    `;
  }

  function addressesView(state) {
    const list = state.addresses;
    if (!list) return html`<div class="flex flex-col gap-4 p-6 lg:px-0">${[0, 1, 2].map(() => html`<div class="h-[152px] animate-pulse rounded-[26px] bg-skeleton"></div>`)}</div>`;
    return html`
      <div class="flex flex-col gap-8 p-6 pb-28 md:px-12 lg:px-0 lg:pb-6">
        <h1 class="sr-only">آدرس‌ها</h1>
        ${list.length
          ? html`<ul class="flex flex-col gap-4">${list.map(addressCard)}</ul>`
          : html`<div class="flex flex-col items-center gap-4 py-8 text-center">
              ${icon("locationEmpty", { size: 200 })}
              <p class="text-16 text-on-surface-var">هنوز آدرسی ثبت نکرده‌اید.</p>
            </div>`}
        <!-- Phones: pinned to the bottom of the screen; desktop: under the list -->
        <div class="fixed inset-x-0 bottom-0 z-30 flex justify-center bg-linear-to-t from-white via-white/90 to-white/0 p-6 pt-10 lg:static lg:bg-none lg:p-0">
          <button type="button" data-action="new-address" class="${NEW_ADDRESS_BUTTON}">${icon("plusCircle", { size: 18 })} آدرس جدید</button>
        </div>
      </div>
    `;
  }

  function deleteAddressSheet(state, address, rerender) {
    const sheet = Maso.sheet({ title: "حذف آدرس", cardRadius: 32, removeOnClose: true });
    dom.render(
      sheet.body,
      html`<div class="flex flex-col gap-4 p-6">
        <p class="text-16 font-semibold text-on-surface">آیا از حذف آدرس زیر مطمعنید؟</p>
        <div class="flex flex-col gap-2 rounded-[24px] border border-black-10 py-2">${filled("آدرس", Maso.formatAddress(address))} ${filled("کد پستی", fmt.digits(address.postalCode))}</div>
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
      </div>`,
    );
    dom.$("[data-cancel]", sheet.body).addEventListener("click", sheet.close);
    dom.$("[data-confirm]", sheet.body).addEventListener("click", async (e) => {
      e.currentTarget.disabled = true;
      try {
        await api.account.removeAddress(address.id);
        state.addresses = state.addresses.filter((a) => a.id !== address.id);
        sheet.close();
        rerender();
      } catch (err) {
        if (handleAuthError(err)) return;
        const line = dom.$("[data-form-error]", sheet.body);
        line.textContent = "حذف آدرس انجام نشد. لطفا دوباره تلاش کنید.";
        line.hidden = false;
        e.currentTarget.disabled = false;
      }
    });
    sheet.open();
  }

  /* ------------------------------------------------------------------ */
  /* Orders                                                              */
  /* ------------------------------------------------------------------ */

  function orderRow(order, i) {
    const isPre = order.status === "pre";
    return html`
      <li data-reveal style="--reveal-index:${i % 4}">
        <a
          href="${link({ view: "order", id: order.id })}"
          ${isPre ? html`data-action="pre-invoice" data-id="${order.id}"` : html`data-nav`}
          class="group flex flex-col gap-6 border-b border-outline-var pb-4"
        >
          <span class="flex items-center justify-between">
            ${thumb(order.image)} ${icon("chevronLeft", { cls: "text-on-surface transition-transform duration-300 group-hover:-translate-x-1" })}
          </span>
          <dl class="flex flex-col gap-3">
            ${row("شماره سفارش", fmt.digits(order.number))} ${row("پرداختی", priceText(order.total))}
            ${order.badge && html`<div class="flex items-center justify-between gap-4 text-16"><dt class="text-outline">وضعیت</dt><dd>${badge(order.badge)}</dd></div>`}
          </dl>
        </a>
      </li>
    `;
  }

  function ordersView(state, view) {
    const tab = view.tab;
    const list = state.orders[tab];
    const TAB_EMPTY = {
      pre: "پیش‌فاکتوری برای تایید ندارید.",
      current: "سفارش در حال انجامی ندارید.",
      delivered: "هنوز سفارشی تحویل نگرفته‌اید.",
      returned: "سفارش مرجوعی ندارید.",
    };
    return html`
      <div class="flex flex-col gap-4 lg:pt-0">
        <h1 class="sr-only">سفارش‌ها</h1>
        <div role="tablist" aria-label="وضعیت سفارش" class="no-scrollbar flex overflow-x-auto border-b border-outline-var md:px-12 lg:px-12">
          ${TABS.map(
            (t) => html`<a
              role="tab"
              href="${link({ view: "orders", tab: t.key })}"
              data-nav
              data-replace
              aria-selected="${t.key === tab}"
              class="${cx(
                "flex h-10 min-w-[25%] flex-1 shrink-0 items-center justify-center border-b-2 px-3 text-16 whitespace-nowrap transition-colors lg:w-[169px] lg:min-w-0 lg:flex-none",
                t.key === tab ? "border-on-surface text-on-surface" : "border-transparent text-on-surface-var hover:text-on-surface",
              )}"
              >${t.label}</a
            >`,
          )}
        </div>
        <div role="tabpanel" class="p-6 md:px-12">
          ${!list
            ? html`<div class="flex flex-col gap-4">${[0, 1].map(() => html`<div class="h-60 animate-pulse rounded-[16px] bg-skeleton"></div>`)}</div>`
            : list.length
              ? html`<ul class="flex flex-col gap-4">${list.map(orderRow)}</ul>`
              : emptyState(TAB_EMPTY[tab])}
        </div>
      </div>
    `;
  }

  /** Pre-invoice drawer (desktop: from the left, as drawn; phones: full screen) */
  async function openPreInvoice(id) {
    const sheet = Maso.sheet({ title: "پیش فاکتور شما", variant: "drawer", removeOnClose: true });
    sheet.body.classList.add("flex", "flex-1", "flex-col", "gap-6");
    dom.render(sheet.body, html`<div class="aspect-[354/198] animate-pulse rounded-[32px] bg-skeleton"></div>`);
    sheet.open();
    let order;
    try {
      order = await api.account.order(id);
    } catch (err) {
      if (handleAuthError(err)) return;
    }
    const p = order?.preInvoice;
    if (!p) {
      dom.render(sheet.body, html`<p class="rounded-[16px] bg-error-container p-4 text-center text-13 text-on-error-container">پیش فاکتور پیدا نشد.</p>`);
      return;
    }
    dom.render(
      sheet.body,
      html`
        <div class="animate-fade-up flex flex-col gap-4">
          ${ui.img(p.image, { cls: "aspect-[354/198] w-full rounded-[32px] object-cover", alt: p.image.alt || "" })}
          <p class="line-clamp-6 text-center text-13 text-on-surface">${p.description}</p>
        </div>
        <hr class="-mx-6 border-0 border-t-2 border-outline-var" />
        <div class="flex flex-col gap-6">
          <h3 class="text-13 text-on-surface-var">رسید پرداخت</h3>
          <dl class="flex flex-col gap-2">
            ${row("نام و نام خانوادگی", p.customerName)} ${row("شماره پیگیری", fmt.digits(p.trackingCode))} ${row("شماره همراه", fmt.digits(p.mobile))}
            ${row("تاریخ", fmt.dateNumeric(p.date))}
          </dl>
        </div>
        <div class="mt-auto pt-2">
          ${p.downloadUrl
            ? html`<a href="${p.downloadUrl}" download="${`pre-invoice-${order.number}`}" target="_blank" rel="noopener" class="${CTA}">دانلود پیش فاکتور</a>`
            : html`<button type="button" disabled class="${CTA}">دانلود پیش فاکتور</button>`}
        </div>
      `,
    );
  }

  /* ------------------------------------------------------------------ */
  /* One order                                                           */
  /* ------------------------------------------------------------------ */

  const STEPS = [
    { label: "محصول در حال آماده سازی", icon: "package" },
    { label: "محصول ارسال شده", icon: "truck" },
    { label: "تحویل گرفته شده", icon: "circleCheck" },
  ];

  const dashes = html`<svg width="32" height="3" viewBox="0 0 32 3" aria-hidden="true" class="mt-2.5 shrink-0 text-on-surface-var"><path d="M0 1.5h32" stroke="currentColor" stroke-width="3" stroke-dasharray="8 4" /></svg>`;

  function orderItem(item, hidden) {
    return html`
      <li ${hidden ? html`hidden data-more-item` : ""} class="flex items-center gap-4 border-b border-outline-var pb-4 last:border-b-0">
        ${thumb(item.image, "size-[113px] rounded-[32px]")}
        <div class="flex min-w-0 flex-1 flex-col gap-4">
          <h3 class="text-20 text-on-surface">
            ${item.slug ? html`<a href="${Maso.url.product(item.slug)}" class="hover:underline">${item.name}</a>` : item.name}
            ${item.qty > 1 && html`<span class="text-13 text-on-surface-var">× ${fmt.digits(item.qty)}</span>`}
          </h3>
          ${ui.price({ price: item.price, regularPrice: item.regularPrice, size: "sm" })}
        </div>
      </li>
    `;
  }

  function orderView(state, view) {
    const order = state.orderCache[view.id];
    if (order === undefined) {
      return html`<div class="flex flex-col gap-6 p-6 md:px-12">
        <div class="h-[60px] animate-pulse rounded-[16px] bg-skeleton"></div>
        <div class="h-[110px] animate-pulse rounded-[26px] bg-skeleton"></div>
        <div class="h-[260px] animate-pulse rounded-[16px] bg-skeleton"></div>
      </div>`;
    }
    if (!order) return emptyState("این سفارش پیدا نشد.");
    const step = Math.max(1, Math.min(3, order.step || 1));
    const SHOWN = 2;
    const section = "flex flex-col gap-6 border-b-2 border-outline-var p-6 md:px-12";
    return html`
      <div class="animate-fade-up">
        <h1 class="sr-only">${`سفارش ${fmt.digits(order.number)}`}</h1>
        <section aria-label="وضعیت سفارش" class="${section}">
          <ol class="flex items-start justify-center gap-3 md:gap-6">
            ${STEPS.map(
              (s, i) => html`${i > 0 ? dashes : ""}
                <li ${i + 1 === step ? html`aria-current="step"` : ""} class="${cx("flex max-w-[172px] flex-1 flex-col items-center gap-4 text-center", i + 1 > step && "opacity-50")}">
                  ${icon(s.icon, { cls: i + 1 === step ? "text-secondary" : "text-on-surface" })}
                  <span class="text-13 text-on-surface">${s.label}</span>
                </li>`,
            )}
          </ol>
          ${order.address &&
          html`<div class="rounded-[26px] border border-black-10 px-4 py-6">${filled("ارسال به آدرس", order.address)}</div>`}
        </section>

        <section aria-labelledby="order-items" class="${section}">
          <h2 id="order-items" class="text-13 text-on-surface-var">محصولات</h2>
          <ul class="flex flex-col gap-6">${order.items.map((item, i) => orderItem(item, i >= SHOWN))}</ul>
          ${order.items.length > SHOWN &&
          html`<button type="button" data-action="more-items" class="mx-auto flex h-12 items-center gap-1 rounded-[16px] px-3 text-16 text-primary transition-opacity hover:opacity-70">
            ${icon("chevronDown", { size: 18 })} بیشتر
          </button>`}
        </section>

        ${order.receipt &&
        html`<section aria-labelledby="order-receipt" class="flex flex-col gap-6 p-6 md:px-12">
          <div class="flex items-center justify-between gap-4">
            <h2 id="order-receipt" class="text-13 text-on-surface-var">رسید پرداخت</h2>
            <a
              href="${Maso.url.page(order.receiptUrl || `/checkout/result?order=${order.id}`)}"
              class="inline-flex h-12 items-center justify-center rounded-full border border-secondary px-3 text-16 text-secondary transition-colors hover:bg-secondary/5"
              >مشاهده رسید پرداخت</a
            >
          </div>
          <dl class="flex flex-col gap-2">
            ${row("شماره سفارش", fmt.digits(order.receipt.orderNumber))} ${row("شماره پیگیری", fmt.digits(order.receipt.trackingCode))}
            ${order.receipt.transactionId && row("شماره تراکنش", html`<span dir="ltr">${fmt.digits(order.receipt.transactionId)}</span>`)}
            ${row("تاریخ", fmt.dateNumeric(order.receipt.date))} ${row("زمان", fmt.time(order.receipt.date))}
          </dl>
        </section>`}
      </div>
    `;
  }

  /* ------------------------------------------------------------------ */
  /* Session                                                             */
  /* ------------------------------------------------------------------ */

  function toLogin() {
    location.replace(`login.html?next=${encodeURIComponent(`profile.html${location.search}`)}`);
  }

  /** 401 from WordPress → the token expired: sign in again */
  function handleAuthError(err) {
    if (err?.status !== 401) return false;
    Maso.session.clear();
    toLogin();
    return true;
  }

  async function logout() {
    await api.account.logout();
    Maso.session.clear();
    location.href = "index.html";
  }

  /* ------------------------------------------------------------------ */
  /* Router                                                              */
  /* ------------------------------------------------------------------ */

  function readView() {
    const p = new URLSearchParams(location.search);
    let name = p.get("view") || "";
    if (!["info", "addresses", "orders", "order"].includes(name)) name = "";
    if (name === "order" && !p.get("id")) name = "orders";
    if (!name && DESKTOP.matches) name = "info";
    const tab = TABS.some((t) => t.key === p.get("tab")) ? p.get("tab") : "current";
    return { name: name || "menu", tab, id: p.get("id") || "" };
  }

  const TITLES = { menu: "حساب کاربری", info: "اطلاعات فردی", addresses: "آدرس‌ها", orders: "سفارش‌ها", order: "جزئیات سفارش" };

  dom.ready(async () => {
    if (!Maso.session.get()) return toLogin();
    const root = dom.$("#profile");
    const state = { account: null, addresses: null, orders: {}, orderCache: {}, provinces: null };
    let addressDialog = null;

    try {
      state.account = await api.account.get();
    } catch (err) {
      if (handleAuthError(err)) return;
      dom.render(root, errorState());
      root.removeAttribute("aria-busy");
      return;
    }

    /** Loads what the view needs, then draws it */
    function load(view) {
      if (view.name === "addresses" && !state.addresses) {
        api.account
          .addresses()
          .then((list) => (state.addresses = list))
          .catch((err) => (handleAuthError(err) ? null : (state.addresses = [])))
          .then(render);
      }
      if (view.name === "orders" && !state.orders[view.tab]) {
        const tab = view.tab;
        api.account
          .orders(tab)
          .then((list) => (state.orders[tab] = list))
          .catch((err) => (handleAuthError(err) ? null : (state.orders[tab] = [])))
          .then(render);
      }
      if (view.name === "order" && !(view.id in state.orderCache)) {
        const id = view.id;
        api.account
          .order(id)
          .then((order) => (state.orderCache[id] = order))
          .catch((err) => (handleAuthError(err) ? null : (state.orderCache[id] = null)))
          .then(render);
      }
    }

    function render() {
      const view = readView();
      document.title = `${TITLES[view.name]} | ماسو`;
      const content =
        view.name === "menu"
          ? menuScreen(state)
          : view.name === "info"
            ? infoView(state)
            : view.name === "addresses"
              ? addressesView(state)
              : view.name === "orders"
                ? ordersView(state, view)
                : orderView(state, view);
      // Info and order detail draw the hairline between the sidebar and the view
      const divider = view.name === "info" || view.name === "order";
      const back = view.name === "order" ? link({ view: "orders", tab: state.orderCache[view.id]?.status || "current" }) : link();
      dom.render(
        root,
        html`
          ${sidebar(state, view)}
          <div class="${cx("min-w-0 flex-1 lg:py-8 lg:pe-8", divider && "lg:border-s lg:border-outline-var")}">
            ${view.name !== "menu" ? backRow(back) : ""}
            <div class="lg:ps-0">${content}</div>
          </div>
        `,
      );
      root.removeAttribute("aria-busy");
    }

    function route() {
      render();
      load(readView());
    }

    /** The map + form dialog of the checkout, created on first use (needs the province list) */
    async function getAddressDialog(btn) {
      if (addressDialog) return addressDialog;
      btn.disabled = true;
      state.provinces ??= await api.locations().catch(() => null);
      btn.disabled = false;
      if (!state.provinces) return null;
      addressDialog = Maso.addressDialog({
        provinces: state.provinces,
        async onSaved(address) {
          try {
            const saved = await api.account.saveAddress(address);
            const list = state.addresses || [];
            // An edited address keeps its place; a new one goes first
            state.addresses = list.some((a) => a.id === address.id) ? list.map((a) => (a.id === address.id ? saved : a)) : [saved, ...list];
            render();
          } catch (err) {
            handleAuthError(err);
          }
        },
      });
      return addressDialog;
    }

    /* In-page navigation */
    root.addEventListener("click", (e) => {
      const a = e.target.closest("a[data-nav]");
      if (!a || e.ctrlKey || e.metaKey || e.shiftKey || e.button !== 0) return;
      e.preventDefault();
      const target = a.getAttribute("href");
      if (target !== `profile.html${location.search}`) history[a.hasAttribute("data-replace") ? "replaceState" : "pushState"](null, "", target);
      route();
      if (!a.hasAttribute("data-replace")) window.scrollTo({ top: 0 });
    });
    addEventListener("popstate", route);
    DESKTOP.addEventListener("change", route);

    /* Buttons */
    dom.actions(root, {
      logout,
      firstName: () => editFieldSheet(state, "firstName", render),
      lastName: () => editFieldSheet(state, "lastName", render),
      email: () => editFieldSheet(state, "email", render),
      mobile: () => mobileSheet(state, render),
      async "new-address"(btn) {
        (await getAddressDialog(btn))?.open();
      },
      async "edit-address"(btn) {
        const address = state.addresses?.find((a) => a.id === btn.dataset.id);
        if (address) (await getAddressDialog(btn))?.open(address);
      },
      "delete-address"(btn) {
        const address = state.addresses?.find((a) => a.id === btn.dataset.id);
        if (address) deleteAddressSheet(state, address, render);
      },
      "pre-invoice"(el, e) {
        e.preventDefault();
        openPreInvoice(el.dataset.id);
      },
      "more-items"(btn) {
        dom.$$("[data-more-item]", root).forEach((li) => {
          li.hidden = false;
          li.classList.add("animate-fade-up");
        });
        btn.remove();
      },
    });

    route();
  });
})();
