/**
 * contact.html — call-back request ("درخواست تماس").
 *
 * Name and mobile are required (mobile: 09xxxxxxxxx, Persian digits are
 * accepted), the message is optional. On success the fields are cleared and
 * locked and the confirmation replaces the submit button; "ارسال پیام مجدد"
 * unlocks the form for another request.
 */
(function () {
  "use strict";

  const Maso = window.Maso;
  const { dom, api, fields } = Maso;

  dom.ready(() => {
    const form = dom.$("#contact-form");
    if (!form) return;
    const fieldset = dom.$("[data-fields]", form);
    const submit = dom.$("button[type=submit]", form);
    const sent = dom.$("[data-sent]", form);
    const formError = dom.$("[data-form-error]", form);
    const field = (name) => form.elements.namedItem(name);
    let busy = false;

    // A field's error disappears as soon as it is edited
    form.addEventListener("input", (e) => {
      if (e.target.name === "name" || e.target.name === "mobile") fields.setError(dom.$(`[data-field="${e.target.name}"]`, form), null);
    });

    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      if (busy || fieldset.disabled) return;
      const name = field("name").value.trim().slice(0, 80);
      const message = field("message").value.trim().slice(0, 1500);
      const mobile = Maso.text
        .latinDigits(field("mobile").value.trim())
        .replace(/[\s-]/g, "")
        .replace(/^(\+98|0098)/, "0");

      const errors = {};
      if (name.length < 3) errors.name = "نام و نام خانوادگی را وارد کنید.";
      if (!/^09\d{9}$/.test(mobile)) errors.mobile = "شماره همراه معتبر نیست.";
      fields.setError(dom.$('[data-field="name"]', form), errors.name);
      fields.setError(dom.$('[data-field="mobile"]', form), errors.mobile);
      formError.hidden = true;
      if (errors.name || errors.mobile) {
        field(errors.name ? "name" : "mobile").focus();
        return;
      }

      busy = true;
      submit.disabled = true;
      submit.textContent = "در حال ارسال…";
      try {
        await api.submitContact({ name, mobile, message });
        form.reset();
        fieldset.disabled = true;
        submit.hidden = true;
        sent.hidden = false;
      } catch {
        formError.textContent = "ارسال درخواست انجام نشد. لطفا دوباره تلاش کنید.";
        formError.hidden = false;
      } finally {
        busy = false;
        submit.disabled = false;
        submit.textContent = "ارسال";
      }
    });

    dom.$("[data-again]", form).addEventListener("click", () => {
      fieldset.disabled = false;
      sent.hidden = true;
      submit.hidden = false;
      field("name").focus();
    });
  });
})();
