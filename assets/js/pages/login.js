/**
 * login.html — phone-number login (SMS one-time code).
 *   step 1: mobile number → POST /maso/v1/auth/otp
 *   step 2: 4-digit code (submits itself on the last digit), resend countdown
 *           → POST /maso/v1/auth/verify → session token, then back to ?next=
 * Sample data: any valid number, code 12345.
 */
(function () {
  "use strict";

  const Maso = window.Maso;
  const { html, icon, fmt, cx, dom, api, text } = Maso;

  const CTA =
    "inline-flex h-12 w-full shrink-0 items-center justify-center gap-2 rounded-full bg-primary px-6 text-16 text-on-primary " +
    "transition-[background-color,transform,opacity] duration-300 ease-out-expo hover:bg-primary/90 active:scale-[0.98] " +
    "disabled:pointer-events-none disabled:opacity-40";

  const card = (body) => html`
    <form novalidate class="animate-rise flex min-h-[350px] w-full max-w-[354px] flex-col justify-between gap-4 rounded-[32px] bg-white/60 p-6 backdrop-blur-[11px]">${body}</form>
  `;

  /** "‹ خانه" / "‹ بازگشت" — 16px with an 18px chevron pointing back (right) */
  const backLink = (label, href) => {
    const cls = "group flex items-center gap-1 self-start text-16 text-on-surface transition-opacity hover:opacity-70";
    const chevron = icon("chevronLeft", { size: 18, cls: "-scale-x-100 transition-transform duration-300 group-hover:translate-x-0.5" });
    return href
      ? html`<a href="${href}" class="${cls}">${chevron}${label}</a>`
      : html`<button type="button" data-action="back" class="${cls}">${chevron}${label}</button>`;
  };

  const heading = (title, body) => html`
    <div class="flex flex-col gap-2">
      <h1 class="text-20 font-bold text-on-surface">${title}</h1>
      <p class="text-13 text-on-surface-var">${body}</p>
    </div>
  `;

  const errorLine = () => html`<p id="login-error" role="alert" class="mt-1 ps-4 text-13 text-error" hidden></p>`;

  const termsNote = () => html`
    <p class="text-13 text-ink-var">
      با ادامه شما با <a href="terms.html" class="text-secondary underline underline-offset-2">شرایط و قوانین</a> ماسو موافقت می‌کنید.
    </p>
  `;

  dom.ready(() => {
    const root = dom.$("#login");
    let mobile = "";
    let codeLength = 4;
    let resendAt = 0;
    let busy = false;
    let timer = 0;

    /** Back to where the shopper came from (same-site pages only) */
    function finish() {
      const next = Maso.url.param("next");
      location.replace(next && /^[\w-]+\.html([?#].*)?$/.test(next) ? next : "index.html");
    }

    function showError(message) {
      const line = dom.$("#login-error", root);
      line.textContent = message || "";
      line.hidden = !message;
      const field = dom.$("[data-ring]", root);
      field?.classList.toggle("ring-error", !!message);
      field?.classList.toggle("ring-transparent", !message);
      if (message) field?.classList.remove("ring-primary/30");
    }

    function setBusy(on, label) {
      busy = on;
      const btn = dom.$("button[type=submit]", root);
      btn.disabled = on;
      btn.textContent = on ? label : "ادامه";
    }

    /* ---------------- Step 1: mobile number ---------------- */

    function phoneStep() {
      clearInterval(timer);
      dom.render(
        root,
        card(html`
          ${backLink("خانه", "index.html")} ${heading("ثبت نام / ورود", "برای ثبت نام یا ورود شماره همراه خود را وارد کنید.")}
          <div class="flex flex-col gap-4">
            <div>
              <input
                data-ring
                type="tel"
                inputmode="tel"
                autocomplete="tel-national"
                dir="ltr"
                value="${mobile}"
                placeholder="شماره همراه"
                aria-label="شماره همراه"
                aria-describedby="login-error"
                class="h-14 w-full rounded-[16px] bg-field px-4 text-right text-16 text-on-surface ring-1 ring-transparent outline-none transition-shadow placeholder:text-outline focus:ring-primary/30"
              />
              ${errorLine()}
            </div>
            <button type="submit" class="${CTA}">ادامه</button>
          </div>
          ${termsNote()}
        `),
      );
      const input = dom.$("input", root);
      input.focus();
      input.addEventListener("input", () => showError(null));
      dom.$("form", root).addEventListener("submit", (e) => {
        e.preventDefault();
        if (!busy) send(input.value, codeStep);
      });
    }

    /** Asks WordPress to text a code to the number */
    async function send(raw, onSent) {
      const normalized = text.mobile(raw);
      if (!normalized) return showError("شماره همراه معتبر نیست.");
      setBusy(true, "در حال ارسال…");
      try {
        const result = await api.requestOtp(normalized);
        mobile = normalized;
        codeLength = result.length;
        resendAt = Date.now() + result.resendIn * 1000;
        busy = false;
        onSent();
      } catch {
        setBusy(false);
        showError("ارسال کد انجام نشد. کمی بعد دوباره تلاش کنید.");
      }
    }

    /* ---------------- Step 2: one-time code ---------------- */

    /**
     * One real input (numeric keyboard, SMS autofill via `one-time-code`,
     * paste works) drawn as one "-" slot per digit spread over 190px, left to right.
     */
    function codeStep() {
      dom.render(
        root,
        card(html`
          <div class="flex flex-col gap-4">
            ${backLink("بازگشت")}
            ${heading("کد یکبارمصرف", html`کد یکبار مصرف ارسال شده به شماره <span class="text-on-surface">${fmt.digits(mobile)}</span>`)}
            <div class="flex flex-col items-center gap-4">
              <div class="w-full">
                <label data-ring class="relative flex h-14 w-full cursor-text items-center justify-center rounded-[16px] bg-field ring-1 ring-transparent transition-shadow">
                  <input
                    inputmode="numeric"
                    autocomplete="one-time-code"
                    maxlength="${codeLength}"
                    aria-label="کد یکبار مصرف"
                    aria-describedby="login-error"
                    class="absolute inset-0 size-full bg-transparent text-transparent caret-transparent outline-none"
                  />
                  <span data-slots dir="ltr" aria-hidden="true" class="pointer-events-none flex w-[190px] justify-between text-16"></span>
                </label>
                ${errorLine()}
              </div>
              <button type="button" data-action="resend" class="flex h-12 items-center justify-center rounded-[12px] px-4 text-13 text-ink transition-opacity"></button>
            </div>
          </div>
          <button type="submit" class="${CTA}">ادامه</button>
        `),
      );

      const input = dom.$("input", root);
      const label = dom.$("[data-ring]", root);
      const slots = dom.$("[data-slots]", root);

      function paintSlots() {
        const value = input.value;
        const focused = document.activeElement === input;
        // Error colour wins over the focus colour
        label.classList.toggle("ring-primary/30", focused && !label.classList.contains("ring-error"));
        dom.render(
          slots,
          Array.from({ length: codeLength }, (_, i) => {
            const digit = value[i];
            const active = focused && i === value.length;
            return html`<span class="${cx("w-2.5 text-center transition-colors", digit ? "animate-fade-up text-on-surface" : "text-ink-muted", active && "animate-pulse text-primary")}"
              >${digit ? fmt.digits(digit) : "-"}</span
            >`;
          }),
        );
      }

      input.addEventListener("input", () => {
        input.value = input.value.replace(/[^\d۰-۹]/g, "").slice(0, codeLength);
        showError(null);
        paintSlots();
        if (input.value.length === codeLength) verify(); // submit as soon as the last digit lands
      });
      input.addEventListener("focus", paintSlots);
      input.addEventListener("blur", paintSlots);
      dom.$("form", root).addEventListener("submit", (e) => {
        e.preventDefault();
        verify();
      });

      /** "ارسال مجدد در ۲:۰۰" (30% while counting down) → "ارسال مجدد کد" */
      const resend = dom.$('[data-action="resend"]', root);
      function paintResend() {
        const left = Math.max(0, Math.ceil((resendAt - Date.now()) / 1000));
        const clock = `${Math.floor(left / 60)}:${String(left % 60).padStart(2, "0")}`;
        resend.disabled = left > 0 || busy;
        resend.className = cx(
          "flex h-12 items-center justify-center rounded-[12px] px-4 text-13 text-ink transition-opacity",
          left > 0 ? "opacity-30" : "text-secondary hover:opacity-80",
        );
        resend.textContent = left > 0 ? `ارسال مجدد در ${fmt.digits(clock)}` : "ارسال مجدد کد";
        if (!left) clearInterval(timer);
      }
      clearInterval(timer);
      timer = setInterval(paintResend, 1000);
      paintResend();

      input.focus();
      paintSlots();

      async function verify() {
        if (busy) return;
        const code = text.latinDigits(input.value).replace(/\D/g, "");
        if (code.length < codeLength) return showError("کد را کامل وارد کنید.");
        setBusy(true, "در حال بررسی…");
        try {
          const result = await api.verifyOtp(mobile, code);
          if (!result) {
            setBusy(false);
            input.value = "";
            paintSlots();
            return showError("کد وارد شده صحیح نیست.");
          }
          Maso.session.set({ token: result.token, customer: result.customer });
          finish();
        } catch {
          setBusy(false);
          showError("ورود انجام نشد. لطفا دوباره تلاش کنید.");
        }
      }

      dom.actions(dom.$("form", root), {
        back() {
          clearInterval(timer);
          phoneStep();
        },
        resend() {
          send(mobile, () => {
            input.value = "";
            setBusy(false);
            showError(null);
            resendAt = Math.max(resendAt, Date.now());
            paintSlots();
            paintResend();
            clearInterval(timer);
            timer = setInterval(paintResend, 1000);
          });
        },
      });
    }

    phoneStep();
  });
})();
