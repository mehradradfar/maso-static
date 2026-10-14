/**
 * "افزودن آدرس جدید" (Figma: full screen on phones, 440×800 card with a 32px
 * radius on tablet/desktop). Two steps:
 *   1. map  — the shopper drags the map under the Maso pin; the address
 *             under the pin's needle is looked up (reverse geocoding)
 *   2. form — personal details and address, prefilled from step 1
 *
 *   const dialog = Maso.addressDialog({ provinces, onSaved(address) })
 *   dialog.open()   // every opening starts a clean flow
 *
 * Leaflet (assets/vendor/leaflet) is only downloaded the first time the map
 * is shown, so no other page pays for it.
 */
(function () {
  "use strict";

  const Maso = window.Maso;
  const { html, icon, cx, dom, api, text, fields, co } = Maso;
  const CONFIG = window.MASO_CONFIG || {};

  /** Tehran, used when the shopper has no saved position */
  const DEFAULT_CENTER = { lat: 35.6997, lng: 51.338 };
  /** The 60×91 pin is centred on the map, so its needle tip sits this many px below the centre */
  const TIP = 45;

  /* ------------------------------------------------------------------ */
  /* Leaflet on demand                                                   */
  /* ------------------------------------------------------------------ */

  let leafletPromise = null;
  function loadLeaflet() {
    if (window.L) return Promise.resolve(window.L);
    leafletPromise ??= new Promise((resolve, reject) => {
      const css = document.createElement("link");
      css.rel = "stylesheet";
      css.href = "assets/vendor/leaflet/leaflet.css";
      document.head.append(css);
      const script = document.createElement("script");
      script.src = "assets/vendor/leaflet/leaflet.js";
      script.onload = () => resolve(window.L);
      script.onerror = reject;
      document.head.append(script);
    });
    return leafletPromise;
  }

  /* ------------------------------------------------------------------ */
  /* Address rules (shared with what WordPress checks again)             */
  /* ------------------------------------------------------------------ */

  const clean = (v, max) => (typeof v === "string" ? v.replace(/\s+/g, " ").trim().slice(0, max) : "");

  /** Normalises and checks an address → { address, errors } */
  function validateAddress(input) {
    const address = {
      firstName: clean(input.firstName, 60),
      lastName: clean(input.lastName, 60),
      mobile: text.latinDigits(clean(input.mobile, 20)).replace(/[\s-]/g, "").replace(/^(\+98|0098)/, "0"),
      provinceId: clean(input.provinceId, 20),
      cityId: clean(input.cityId, 40),
      provinceName: clean(input.provinceName, 60),
      cityName: clean(input.cityName, 60),
      street: clean(input.street, 250),
      plaque: text.latinDigits(clean(input.plaque, 20)),
      unit: text.latinDigits(clean(input.unit, 20)) || undefined,
      postalCode: text.latinDigits(clean(input.postalCode, 20)).replace(/[\s-]/g, ""),
    };
    const loc = input.location;
    if (loc && Number.isFinite(loc.lat) && Number.isFinite(loc.lng)) address.location = { lat: loc.lat, lng: loc.lng };

    const errors = {};
    if (!address.firstName) errors.firstName = "نام را وارد کنید.";
    if (!address.lastName) errors.lastName = "نام خانوادگی را وارد کنید.";
    if (!/^09\d{9}$/.test(address.mobile)) errors.mobile = "شماره همراه معتبر نیست.";
    if (!address.provinceId) errors.provinceId = "استان را انتخاب کنید.";
    if (!address.cityId) errors.cityId = "شهر را انتخاب کنید.";
    if (address.street.length < 5) errors.street = "آدرس را کامل وارد کنید.";
    if (!address.plaque) errors.plaque = "پلاک را وارد کنید.";
    if (!/^\d{10}$/.test(address.postalCode)) errors.postalCode = "کد پستی باید ۱۰ رقم باشد.";
    return { address, errors };
  }

  /** "گیلان، رشت، بلوار گیلان، خ ۱۲۲" */
  Maso.formatAddress = (a) => [a.provinceName, a.cityName, a.street].filter(Boolean).join("، ");

  /* ------------------------------------------------------------------ */
  /* Searchable single-choice list in a sheet (Figma "انتخاب شهر")       */
  /* ------------------------------------------------------------------ */

  /**
   * A search box, then 56px rows split by outline-var rules with a tick on
   * the chosen one. Picking a row closes the sheet.
   *   const s = optionSheet("انتخاب استان"); s.open(options, value, onSelect)
   */
  function optionSheet(title) {
    const sheet = Maso.sheet({ title, variant: "sheet", cardRadius: 32 });
    let options = [];
    let value = "";
    let onSelect = () => {};

    dom.render(
      sheet.body,
      html`
        <div class="sticky top-0 z-10 bg-surface px-6 py-4">${fields.searchBox({ placeholder: "استان، شهر، کشور و ...", label: `جستجو در ${title}` })}</div>
        <ul data-options class="p-6 pt-2"></ul>
      `,
    );
    const search = dom.$("input", sheet.body);
    const list = dom.$("[data-options]", sheet.body);

    function paint() {
      const key = text.matchKey(search.value);
      const shown = key ? options.filter((o) => text.matchKey(o.name).includes(key)) : options;
      dom.render(
        list,
        shown.length
          ? shown.map(
              (o) => html`<li>
                <button
                  type="button"
                  data-action="choose"
                  data-id="${o.id}"
                  aria-pressed="${o.id === value}"
                  class="flex h-14 w-full items-center justify-between gap-3 border-b border-outline-var py-2 text-16 text-on-surface transition-colors hover:bg-surface-low/60"
                >
                  ${o.name} ${o.id === value && icon("tick", { cls: "shrink-0 text-primary" })}
                </button>
              </li>`,
            )
          : html`<li class="py-4 text-16 text-on-surface-var">موردی پیدا نشد.</li>`,
      );
    }

    search.addEventListener("input", paint);
    dom.actions(list, {
      choose(el) {
        onSelect(el.dataset.id);
        sheet.close();
      },
    });

    return {
      open(list_, value_, onSelect_) {
        options = list_;
        value = value_;
        onSelect = onSelect_;
        search.value = "";
        paint();
        sheet.open();
      },
    };
  }

  /* ------------------------------------------------------------------ */
  /* The dialog                                                          */
  /* ------------------------------------------------------------------ */

  const DIALOG_CLASSES = cx(
    "m-0 h-dvh max-h-none w-full max-w-none overflow-hidden bg-surface p-0 text-ink",
    "md:m-auto md:h-[min(800px,90dvh)] md:w-[440px] md:rounded-[32px]",
    "translate-y-6 opacity-0 open:translate-y-0 open:opacity-100 md:translate-y-0 md:scale-95 md:open:scale-100 starting:open:translate-y-6 starting:open:opacity-0 md:starting:open:scale-95",
    "transition-[translate,scale,opacity,display,overlay] transition-discrete duration-500 ease-out-expo",
    "backdrop:bg-black-30 backdrop:opacity-0 backdrop:backdrop-blur-[3px] backdrop:transition-[opacity,display,overlay] backdrop:transition-discrete backdrop:duration-500 open:backdrop:opacity-100 starting:open:backdrop:opacity-0",
  );

  const EMPTY = { firstName: "", lastName: "", mobile: "", provinceId: "", cityId: "", street: "", plaque: "", unit: "", postalCode: "" };

  Maso.addressDialog = function addressDialog({ provinces, onSaved }) {
    const dialog = dom.create(html`<dialog aria-label="افزودن آدرس جدید" class="${DIALOG_CLASSES}"></dialog>`);
    document.body.append(dialog);
    dialog.addEventListener("click", (e) => e.target === dialog && dialog.close());

    const provinceSheet = optionSheet("انتخاب استان");
    const citySheet = optionSheet("انتخاب شهر");

    /* --- Flow state (reset on every opening) --- */
    let step = "map";
    let center = null;
    /** Reverse-geocoded place for `center`: { key, label, province?, city?, street? } */
    let place = null;
    let values = { ...EMPTY };
    let errors = {};
    let map = null;

    const keyOf = (p) => (p ? `${p.lat.toFixed(5)},${p.lng.toFixed(5)}` : "");
    const province = () => provinces.find((p) => p.id === values.provinceId);
    const city = () => province()?.cities.find((c) => c.id === values.cityId);

    /** Back (right) · title · close (left, tablet/desktop) */
    const header = () => html`
      <header class="grid h-[88px] shrink-0 grid-cols-[48px_1fr_48px] items-center px-6 md:px-12">
        <button
          type="button"
          data-action="back"
          aria-label="${step === "form" ? "بازگشت به نقشه" : "بستن"}"
          class="${cx("-m-3 flex size-12 items-center justify-center justify-self-start text-on-surface", step === "map" && "md:invisible")}"
        >
          ${icon("chevronLeft", { cls: "-scale-x-100" })}
        </button>
        <h2 class="text-center text-13 text-on-surface-var">
          ${step === "map"
            ? html`<span class="md:hidden">انتخاب لوکیشن</span><span class="hidden md:inline">افزودن آدرس جدید</span>`
            : "افزودن آدرس جدید"}
        </h2>
        <button type="button" data-action="close" aria-label="بستن" class="-m-3 hidden size-12 items-center justify-center justify-self-end text-on-surface md:flex">
          ${icon("close")}
        </button>
      </header>
    `;

    /* ---------------- Step 1: map ---------------- */

    function showMap() {
      step = "map";
      dom.render(
        dialog,
        html`<div class="flex h-full flex-col">
          ${header()}
          <div class="flex min-h-0 flex-1 flex-col">
            <!-- Place search (64px band) -->
            <div class="relative z-[1000] shrink-0 p-4">
              ${fields.searchBox({ placeholder: "استان، شهر، کشور و ...", label: "جستجوی مکان" })}
              <ul data-places hidden class="absolute inset-x-4 top-full -mt-2 max-h-64 overflow-y-auto rounded-[16px] bg-surface py-2 shadow-[0_8px_24px_rgba(0,0,0,0.12)]"></ul>
            </div>
            <!-- Map + centre pin + "my location" -->
            <div class="relative min-h-0 flex-1 bg-surface-low">
              <div data-map class="absolute inset-0" aria-label="نقشه" role="application"></div>
              <div
                data-pin
                aria-hidden="true"
                class="pointer-events-none absolute top-1/2 left-1/2 z-[500] flex -translate-1/2 flex-col items-center drop-shadow-[0_0_8px_rgba(0,0,0,0.25)] transition-transform duration-300 ease-out-expo"
              >
                <span class="flex size-[60px] items-center justify-center rounded-full border-4 border-primary bg-white text-primary">${icon("logo", { size: 44 })}</span>
                <span class="h-[31px] w-1 rounded-b-full bg-primary"></span>
              </div>
              <button
                type="button"
                data-action="locate"
                aria-label="موقعیت فعلی من"
                class="absolute right-4 bottom-4 z-[500] flex size-12 items-center justify-center rounded-full bg-surface-low text-on-surface shadow-[0_1px_3px_rgba(0,0,0,0.15),0_1px_2px_rgba(0,0,0,0.3)] transition-transform hover:scale-105"
              >
                ${icon("gps")}
              </button>
            </div>
          </div>
          <div class="flex shrink-0 flex-col gap-4 p-4 md:p-6">
            <p data-place aria-live="polite" class="min-h-5 text-center text-13 text-on-surface-var">در حال یافتن آدرس…</p>
            <hr class="border-dashed border-on-surface-var" />
            <button type="button" data-action="confirm" ${center ? "" : html`disabled`} class="${cx(co.CTA, "w-full")}">ذخیره</button>
          </div>
        </div>`,
      );
      paintPlace();
      startMap();
      wirePlaceSearch();
    }

    function paintPlace() {
      const el = dom.$("[data-place]", dialog);
      if (!el) return;
      el.textContent = place && place.key === keyOf(center) ? place.label || "موقعیت روی نقشه" : "در حال یافتن آدرس…";
      const confirm = dom.$('[data-action="confirm"]', dialog);
      if (confirm) confirm.disabled = !center;
    }

    /** Address under the pin, debounced; answers for old positions are dropped */
    const lookup = dom.debounce(async (point) => {
      const key = keyOf(point);
      const result = await api.reverseGeocode(point);
      if (key !== keyOf(center)) return;
      place = { key, ...result };
      paintPlace();
    }, 300);

    function setCenter(point) {
      center = point;
      paintPlace();
      lookup(point);
    }

    async function startMap() {
      const el = dom.$("[data-map]", dialog);
      el.classList.add("animate-pulse");
      const L = await loadLeaflet().catch(() => null);
      el.classList.remove("animate-pulse");
      if (!L || !el.isConnected) return;
      map?.remove();
      const start = center || DEFAULT_CENTER;
      const zoom = center ? 17 : 13;
      map = L.map(el, { zoomControl: false, attributionControl: true });
      // View centre = the point TIP px above the target, so the target lands under the needle
      map.setView(map.unproject(map.project([start.lat, start.lng], zoom).subtract([0, TIP]), zoom), zoom);
      map.attributionControl.setPrefix(false);
      L.tileLayer(CONFIG.MAP_TILES, { maxZoom: 19, attribution: CONFIG.MAP_ATTRIBUTION, detectRetina: true }).addTo(map);
      const pin = dom.$("[data-pin]", dialog);
      map.on("movestart", () => pin.classList.add("-translate-y-[calc(50%+10px)]"));
      map.on("moveend", () => {
        pin.classList.remove("-translate-y-[calc(50%+10px)]");
        const tip = map.containerPointToLatLng(map.getSize().divideBy(2).add([0, TIP]));
        setCenter({ lat: tip.lat, lng: tip.lng });
      });
      setCenter(start);
    }

    /** Fly so that `p` ends up under the needle tip */
    function flyTo(p, zoom = 17) {
      if (!map) return;
      map.flyTo(map.unproject(map.project([p.lat, p.lng], zoom).subtract([0, TIP]), zoom), zoom, { duration: 0.8 });
    }

    /** Place search above the map, debounced and biased to the current view */
    function wirePlaceSearch() {
      const input = dom.$("input[type=search]", dialog);
      const list = dom.$("[data-places]", dialog);
      let results = [];
      const run = dom.debounce(async (q) => {
        const c = map?.getCenter();
        const found = await api.searchPlaces(q, c ? { lat: c.lat, lng: c.lng } : undefined);
        if (input.value.trim() !== q) return;
        results = found;
        list.hidden = !found.length;
        dom.render(
          list,
          found.map(
            (r, i) => html`<li>
              <button type="button" data-place-index="${i}" class="flex w-full flex-col items-start gap-0.5 px-4 py-2 text-start hover:bg-surface-low">
                <span class="text-16 text-on-surface">${r.title}</span>
                <span class="line-clamp-1 text-13 text-on-surface-var">${r.address}</span>
              </button>
            </li>`,
          ),
        );
      }, 400);
      input.addEventListener("input", () => {
        const q = input.value.trim();
        if (q.length < 2) {
          list.hidden = true;
          return;
        }
        run(q);
      });
      list.addEventListener("click", (e) => {
        const btn = e.target.closest("[data-place-index]");
        if (!btn) return;
        flyTo(results[Number(btn.dataset.placeIndex)].location);
        input.value = "";
        list.hidden = true;
      });
    }

    /** Map → form: prefill province, city and street from the reverse lookup */
    function confirmLocation() {
      if (place && place.key === keyOf(center)) {
        const pv = place.province ? provinces.find((p) => text.matchKey(p.name) === text.matchKey(place.province)) : undefined;
        const ct = pv && place.city ? pv.cities.find((c) => text.matchKey(c.name) === text.matchKey(place.city)) : undefined;
        values = {
          ...values,
          provinceId: pv?.id ?? values.provinceId,
          cityId: ct?.id ?? (pv && pv.id !== values.provinceId ? "" : values.cityId),
          street: place.street ? [ct?.name, place.street].filter(Boolean).join("، ") : values.street,
        };
      }
      showForm();
    }

    /* ---------------- Step 2: form ---------------- */

    const section = (title, body) => html`<section class="flex flex-col gap-4 p-6">${co.blockTitle(title)}${body}</section>`;

    function showForm() {
      step = "form";
      map?.remove();
      map = null;
      const f = (name, label, attrs) => fields.text({ name, label, value: values[name], error: errors[name], attrs });
      dom.render(
        dialog,
        html`<form novalidate class="animate-fade-up flex h-full flex-col">
          ${header()}
          <div class="no-scrollbar min-h-0 flex-1 overflow-y-auto overscroll-contain">
            ${section(
              "اطلاعات فردی",
              html`<div class="flex gap-4">${f("firstName", "نام", { autocomplete: "given-name" })} ${f("lastName", "نام خانوادگی", { autocomplete: "family-name" })}</div>
                ${f("mobile", "شماره همراه", { type: "tel", inputmode: "tel", autocomplete: "tel-national", dir: "ltr" })}`,
            )}
            ${section(
              "جزئیات آدرس",
              html`<div data-selects class="flex gap-4"></div>
                ${f("street", "آدرس", { autocomplete: "street-address" })}
                <div class="flex gap-4">${f("plaque", "پلاک", { inputmode: "numeric" })} ${f("unit", "واحد", { inputmode: "numeric" })}</div>
                ${f("postalCode", "کد پستی (۱۰ رقمی)", { inputmode: "numeric", autocomplete: "postal-code", dir: "ltr", maxlength: 12 })}`,
            )}
          </div>
          <!-- Pinned save button over a white fade -->
          <div class="shrink-0 bg-gradient-to-b from-white/0 to-white p-4 backdrop-blur-[2px] md:px-5 md:py-6">
            <button type="submit" class="${cx(co.CTA, "mx-auto flex w-full max-w-[400px]")}">ذخیره</button>
          </div>
        </form>`,
      );
      paintSelects();

      const form = dom.$("form", dialog);
      form.addEventListener("input", (e) => {
        const name = e.target.name;
        if (!(name in values)) return;
        values[name] = e.target.value;
        if (errors[name]) {
          errors[name] = undefined;
          fields.setError(dom.$(`[data-field="${name}"]`, form), null);
        }
      });
      form.addEventListener("submit", (e) => {
        e.preventDefault();
        submit();
      });
    }

    /** Province / city fields (redrawn when either changes) */
    function paintSelects() {
      const box = dom.$("[data-selects]", dialog);
      if (!box) return;
      dom.render(
        box,
        html`${fields.select({ name: "provinceId", label: "استان", value: province()?.name, error: errors.provinceId })}
        ${fields.select({ name: "cityId", label: "شهر", value: city()?.name, error: errors.cityId, disabled: !province() })}`,
      );
    }

    function submit() {
      const found = validateAddress({
        ...values,
        provinceName: province()?.name ?? "",
        cityName: city()?.name ?? "",
        location: center ?? undefined,
      });
      errors = found.errors;
      if (Object.keys(errors).length) {
        // Show every message in place, then focus the first problem
        Object.keys(EMPTY).forEach((name) => {
          const wrapper = dom.$(`[data-field="${name}"]`, dialog);
          if (name !== "provinceId" && name !== "cityId") fields.setError(wrapper, errors[name]);
        });
        paintSelects();
        requestAnimationFrame(() => dom.$('[aria-describedby$="-err"]', dialog)?.focus());
        return;
      }
      const id = crypto.randomUUID ? crypto.randomUUID() : String(Date.now());
      onSaved({ id, ...found.address });
      dialog.close();
    }

    /* ---------------- Clicks ---------------- */

    dom.actions(dialog, {
      back: () => (step === "form" ? showMap() : dialog.close()),
      close: () => dialog.close(),
      confirm: confirmLocation,
      locate(btn) {
        if (!("geolocation" in navigator)) return;
        btn.classList.add("animate-pulse");
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            btn.classList.remove("animate-pulse");
            flyTo({ lat: pos.coords.latitude, lng: pos.coords.longitude });
          },
          () => btn.classList.remove("animate-pulse"),
          { enableHighAccuracy: true, timeout: 10000 },
        );
      },
      pick(btn) {
        if (btn.dataset.pick === "provinceId") {
          provinceSheet.open(provinces, values.provinceId, (id) => {
            if (values.provinceId !== id) values.cityId = "";
            values.provinceId = id;
            errors.provinceId = undefined;
            paintSelects();
          });
        } else {
          citySheet.open(province()?.cities ?? [], values.cityId, (id) => {
            values.cityId = id;
            errors.cityId = undefined;
            paintSelects();
          });
        }
      },
    });

    dialog.addEventListener("close", (e) => {
      if (e.target !== dialog) return;
      map?.remove();
      map = null;
    });

    return {
      open() {
        step = "map";
        center = null;
        place = null;
        values = { ...EMPTY };
        errors = {};
        dialog.showModal();
        showMap();
      },
    };
  };
})();
