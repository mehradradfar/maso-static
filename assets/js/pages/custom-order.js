/**
 * custom-order.html — request form + before/after showcase.
 *
 * Photos: up to three, each shrunk in the browser (≤2000px JPEG) before it
 * is attached, so uploads stay small on mobile data. After a successful
 * send the form is replaced by the confirmation with the request number;
 * "درخواست جدید" starts over.
 */
(function () {
  "use strict";

  const Maso = window.Maso;
  const { html, icon, fmt, cx, dom, api, fields, ui } = Maso;

  const MAX_IMAGES = 3;
  const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
  /** Longest edge after shrinking; plenty for a reference photo, ~300–600KB as JPEG */
  const MAX_EDGE = 2000;

  /** Downscale a photo to MAX_EDGE as JPEG; returns the original if that fails or isn't smaller */
  async function shrink(file) {
    if (file.type === "image/gif" || file.type === "image/svg+xml") return file;
    try {
      const bitmap = await createImageBitmap(file);
      const scale = Math.min(1, MAX_EDGE / Math.max(bitmap.width, bitmap.height));
      if (scale === 1 && file.size < 1_500_000) return file;
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(bitmap.width * scale);
      canvas.height = Math.round(bitmap.height * scale);
      canvas.getContext("2d").drawImage(bitmap, 0, 0, canvas.width, canvas.height);
      bitmap.close();
      const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.85));
      if (!blob || blob.size >= file.size) return file;
      return new File([blob], `${file.name.replace(/\.[^.]+$/, "")}.jpg`, { type: "image/jpeg" });
    } catch {
      return file;
    }
  }

  /* ------------------------------------------------------------------ */
  /* Showcase: endless before/after strip (pure CSS marquee)             */
  /* ------------------------------------------------------------------ */

  /** Width of one card plus the 24px gap — used to fill the strip */
  const STEP = 293 + 24;

  const showcaseCard = (pair) => html`
    <figure class="relative flex h-[195px] w-[293px] overflow-hidden rounded-[29px] bg-surface-low">
      <div class="relative h-full w-1/2">${ui.img(pair.before, { cls: "absolute inset-0 size-full object-cover" })}</div>
      <div class="relative h-full w-1/2">${ui.img(pair.after, { cls: "absolute inset-0 size-full object-cover" })}</div>
      <span aria-hidden="true" class="absolute inset-y-0 left-1/2 w-[2.7px] -translate-x-1/2 bg-black"></span>
      <figcaption>
        <span class="absolute top-[151px] left-[23.5px] rounded-full bg-[rgb(163_68_0/0.8)] px-[14.5px] py-[7px] text-[14.5px] leading-[22px] text-white backdrop-blur-[11px]">طرح مشتری</span>
        <span class="absolute top-[151px] left-[161px] rounded-full bg-primary/90 px-[14.5px] py-[7px] text-[14.5px] leading-[22px] text-white backdrop-blur-[11px]">محصول نهایی</span>
      </figcaption>
    </figure>
  `;

  async function renderShowcase() {
    const root = dom.$("#showcase");
    const { showcase: items } = await api.customOrderContent().catch(() => ({ showcase: [] }));
    if (!items.length) return root.remove();
    // Repeat the set to at least ~1600px and double it, so translating by −50% loops seamlessly
    const repeat = Math.max(1, Math.ceil(1600 / (items.length * STEP)));
    const set = Array.from({ length: repeat }, () => items).flat();
    dom.render(
      root,
      html`<div class="no-scrollbar w-full motion-reduce:overflow-x-auto">
        <ul dir="ltr" class="flex w-max animate-[marquee_linear_infinite] hover:[animation-play-state:paused] motion-reduce:animate-none" style="animation-duration:${set.length * 6}s">
          ${[...set, ...set].map((pair, i) => html`<li ${i >= set.length ? html`aria-hidden="true"` : ""} class="pe-6">${showcaseCard(pair)}</li>`)}
        </ul>
      </div>`,
    );
  }

  /* ------------------------------------------------------------------ */
  /* Form                                                                */
  /* ------------------------------------------------------------------ */

  dom.ready(() => {
    renderShowcase();

    const root = dom.$("#custom-order");
    const formHtml = dom.$("form", root).outerHTML;

    /** Wires a fresh copy of the form (first load and after "درخواست جدید") */
    function setupForm(form) {
      /** @type {{file: File, url: string}[]} */
      let photos = [];
      let busy = false;
      const zone = dom.$("[data-dropzone]", form);
      const thumbs = dom.$("[data-thumbs]", form);
      const pick = dom.$("[data-pick]", form);
      const fileInput = dom.$("input[type=file]", form);
      const imagesField = dom.$('[data-field="images"]', form);
      let imagesError = null;

      function paintZone(dragging = false) {
        zone.className = cx(
          "relative flex min-h-[139px] w-full flex-col items-center justify-center gap-5 overflow-hidden rounded-[24px] border bg-surface-low px-4 py-2 transition-[border-color,background-color] duration-300",
          imagesError ? "border-error" : dragging ? "border-primary bg-surf-container" : "border-black-10",
        );
        dom.$('#f-images-err', imagesField)?.remove();
        if (imagesError) imagesField.insertAdjacentHTML("beforeend", String(html`<p id="f-images-err" role="alert" class="mt-1 ps-4 text-10 text-error">${imagesError}</p>`));
      }

      function paintPhotos() {
        const full = photos.length >= MAX_IMAGES;
        thumbs.hidden = !photos.length;
        dom.render(
          thumbs,
          photos.map(
            (p, i) => html`<li class="animate-fade-up relative size-16 overflow-hidden rounded-[16px] bg-surf-container">
              <img src="${p.url}" alt="" class="size-full object-cover" />
              <button
                type="button"
                data-remove="${i}"
                aria-label="${`حذف عکس ${fmt.digits(i + 1)}`}"
                class="absolute end-1 top-1 flex size-5 items-center justify-center rounded-full bg-black/60 text-white"
              >
                ${icon("close", { size: 12 })}
              </button>
            </li>`,
          ),
        );
        pick.className = cx(
          "flex cursor-pointer flex-col items-center gap-5 text-16 text-on-surface-var transition-opacity hover:opacity-70",
          full && "pointer-events-none opacity-40",
          photos.length > 0 && "flex-row gap-2 pb-2",
        );
        dom.$("[data-pick-label]", pick).textContent = photos.length ? "افزودن عکس دیگر" : "عکس محصول مورد نظر";
        fileInput.disabled = full;
      }

      async function add(list) {
        if (!list?.length) return;
        const icon_ = dom.$("svg", pick);
        icon_.classList.add("animate-pulse");
        const room = MAX_IMAGES - photos.length;
        const picked = Array.from(list).filter((f) => f.type.startsWith("image/")).slice(0, Math.max(0, room));
        const shrunk = await Promise.all(picked.map(shrink));
        photos = [...photos, ...shrunk.map((file) => ({ file, url: URL.createObjectURL(file) }))];
        icon_.classList.remove("animate-pulse");
        imagesError = null;
        paintZone();
        paintPhotos();
      }

      fileInput.addEventListener("change", () => {
        const files = Array.from(fileInput.files || []);
        fileInput.value = ""; // the same file can be picked again after removing it
        add(files);
      });
      thumbs.addEventListener("click", (e) => {
        const btn = e.target.closest("[data-remove]");
        if (!btn) return;
        const i = Number(btn.dataset.remove);
        URL.revokeObjectURL(photos[i].url);
        photos = photos.filter((_, j) => j !== i);
        paintPhotos();
      });
      zone.addEventListener("dragover", (e) => {
        e.preventDefault();
        paintZone(true);
      });
      zone.addEventListener("dragleave", () => paintZone());
      zone.addEventListener("drop", (e) => {
        e.preventDefault();
        paintZone();
        add(e.dataTransfer.files);
      });

      // A field's error disappears as soon as it is edited
      form.addEventListener("input", (e) => {
        if (e.target.name === "name" || e.target.name === "mobile") fields.setError(dom.$(`[data-field="${e.target.name}"]`, form), null);
      });

      form.addEventListener("submit", async (e) => {
        e.preventDefault();
        if (busy) return;
        const name = form.elements.namedItem("name").value.trim().slice(0, 80);
        const mobileRaw = form.elements.namedItem("mobile").value.trim().slice(0, 20);
        const message = form.elements.namedItem("message").value.trim().slice(0, 1500);
        const mobile = Maso.text.latinDigits(mobileRaw).replace(/[\s-]/g, "").replace(/^(\+98|0098)/, "0");
        const images = photos.map((p) => p.file);

        const errors = {};
        if (!images.length) errors.images = "یک عکس از محصول مورد نظر اضافه کنید.";
        else if (images.some((f) => f.size > MAX_IMAGE_BYTES)) errors.images = "حجم هر عکس باید کمتر از ۵ مگابایت باشد.";
        if (name.length < 3) errors.name = "نام و نام خانوادگی را وارد کنید.";
        if (!/^09\d{9}$/.test(mobile)) errors.mobile = "شماره همراه معتبر نیست.";

        imagesError = errors.images || null;
        paintZone();
        fields.setError(dom.$('[data-field="name"]', form), errors.name);
        fields.setError(dom.$('[data-field="mobile"]', form), errors.mobile);
        const formError = dom.$("[data-form-error]", form);
        formError.hidden = true;
        if (Object.keys(errors).length) return;

        const button = dom.$("button[type=submit]", form);
        busy = true;
        button.disabled = true;
        button.textContent = "در حال ارسال…";
        try {
          const { requestId } = await api.submitCustomOrder({ name, mobile, message, images });
          photos.forEach((p) => URL.revokeObjectURL(p.url));
          showSuccess(requestId);
        } catch {
          busy = false;
          button.disabled = false;
          button.textContent = "ارسال";
          formError.textContent = "ارسال درخواست انجام نشد. لطفا دوباره تلاش کنید.";
          formError.hidden = false;
        }
      });
    }

    /** Confirmation in place of the form */
    function showSuccess(requestId) {
      const form = dom.$("form", root);
      form.replaceWith(
        dom.create(html`
          <div class="animate-rise mx-auto flex w-full max-w-[448px] flex-col items-center p-6 pt-7 text-center lg:pt-[50px]">
            <div class="flex flex-col items-center gap-6">
              ${icon("resultSuccess")}
              <div class="flex flex-col gap-3">
                <h1 class="text-20 text-on-surface">درخواست شما ثبت شد</h1>
                <p class="text-13 text-ink">کارشناسان ما به زودی با شما در تماس خواهند بود</p>
              </div>
            </div>
            <div class="flex w-full flex-col gap-6 p-6">
              <hr class="border-dotted border-outline" />
              <p class="flex items-center justify-between text-16">
                <span class="text-outline">شماره درخواست</span>
                <span class="text-on-surface">${fmt.digits(requestId)}</span>
              </p>
            </div>
            <button
              type="button"
              data-new-request
              class="mt-6 inline-flex h-12 w-full shrink-0 items-center justify-center rounded-full border border-primary px-6 text-16 text-primary transition-[background-color,transform] duration-300 ease-out-expo hover:bg-surface-low active:scale-[0.98]"
            >
              درخواست جدید
            </button>
          </div>
        `),
      );
      // The showcase belongs to the form view
      dom.$("#showcase").hidden = true;
      dom.$("[data-new-request]", root).addEventListener("click", (e) => {
        const fresh = dom.create(formHtml);
        e.currentTarget.parentElement.replaceWith(fresh);
        dom.$("#showcase").hidden = false;
        setupForm(fresh);
      });
    }

    setupForm(dom.$("form", root));
  });
})();
