/**
 * "افزودن آدرس جدید" (Figma: full screen on phones, 440×800 card with a 32px
 * radius on tablet/desktop). Two steps (Figma comments #4–#8, edits 14–15):
 *   1. form — personal details and address
 *   2. map  — only for the cities Maso serves itself (Tehran, Karaj; see
 *             assets/js/data/service-areas.js): the shopper drags the map
 *             under the Maso pin. The map is limited to that city — it stops
 *             at the city's box, everything outside the outline is covered,
 *             and a point outside can't be saved.
 *
 *   const dialog = Maso.addressDialog({ provinces, onSaved(address), verify? })
 *   dialog.open()          // every opening starts a clean flow
 *   dialog.open(address)   // "ویرایش آدرس": prefilled; keeps the id
 *
 * `verify(address)` (optional) runs before saving and may return a promise;
 * false keeps the dialog open — checkout uses it to confirm a signed-out
 * shopper's number with a one-time code (edit 16).
 *
 * The map is MapTiler (SDK from their CDN, style "positron"), downloaded the
 * first time the map is shown. It needs MASO_CONFIG.MAPTILER_KEY; without a
 * key — or if the map can't load — the address is saved without a position.
 */
(function () {
  "use strict";

  const Maso = window.Maso;
  const { html, icon, cx, dom, api, text, fields, co } = Maso;
  const CONFIG = window.MASO_CONFIG || {};
  const AREAS = window.MASO_SERVICE_AREAS || [];

  /** The 60×91 pin is centred on the map, so its needle tip sits this many px below the centre */
  const TIP = 45;

  /* ------------------------------------------------------------------ */
  /* MapTiler SDK on demand                                              */
  /* ------------------------------------------------------------------ */

  const SDK = "https://cdn.maptiler.com/maptiler-sdk-js/v4.1.0/maptiler-sdk";
  let sdkPromise = null;
  function loadMapTiler() {
    if (window.maptilersdk) return Promise.resolve(window.maptilersdk);
    sdkPromise ??= new Promise((resolve, reject) => {
      const css = document.createElement("link");
      css.rel = "stylesheet";
      css.href = `${SDK}.css`;
      document.head.append(css);
      const script = document.createElement("script");
      script.src = `${SDK}.umd.min.js`;
      script.onload = () => (window.maptilersdk ? resolve(window.maptilersdk) : reject(new Error("maptilersdk missing")));
      script.onerror = () => {
        sdkPromise = null; // try again next time
        reject(new Error("MapTiler SDK did not load"));
      };
      document.head.append(script);
    });
    return sdkPromise;
  }

  /* ------------------------------------------------------------------ */
  /* Service areas                                                       */
  /* ------------------------------------------------------------------ */

  /** The service area of a province/city pair (by name), or undefined */
  function serviceArea(provinceName, cityName) {
    if (!provinceName || !cityName) return undefined;
    const p = text.matchKey(provinceName);
    const c = text.matchKey(cityName);
    return AREAS.find((a) => text.matchKey(a.province) === p && text.matchKey(a.city) === c);
  }

  /** Ray casting: is [lng, lat] inside the ring? */
  function inside(ring, lng, lat) {
    let hit = false;
    for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
      const [xi, yi] = ring[i];
      const [xj, yj] = ring[j];
      if (yi > lat !== yj > lat && lng < ((xj - xi) * (lat - yi)) / (yj - yi) + xi) hit = !hit;
    }
    return hit;
  }

  /** Twice the signed area (> 0 = counter-clockwise) */
  const winding = (ring) => ring.reduce((sum, [x1, y1], i) => {
    const [x2, y2] = ring[(i + 1) % ring.length];
    return sum + (x1 * y2 - x2 * y1);
  }, 0);

  /** The whole world with the city cut out — painted over everything else on the map */
  function outsideOf(area) {
    const world = [[-180, -85], [180, -85], [180, 85], [-180, 85], [-180, -85]];
    const hole = winding(area.ring) > 0 ? [...area.ring].reverse() : area.ring;
    return { type: "Feature", properties: {}, geometry: { type: "Polygon", coordinates: [world, hole] } };
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

  Maso.addressDialog = function addressDialog({ provinces, onSaved, verify }) {
    const dialog = dom.create(html`<dialog aria-label="افزودن آدرس جدید" class="${DIALOG_CLASSES}"></dialog>`);
    document.body.append(dialog);
    dom.onBackdropClick(dialog, () => dialog.close());

    const provinceSheet = optionSheet("انتخاب استان");
    const citySheet = optionSheet("انتخاب شهر");

    /* --- Flow state (reset on every opening) --- */
    let step = "form";
    /** Position under the needle ({ lat, lng }) */
    let center = null;
    /** id of the address being edited (null = new address) */
    let editingId = null;
    const title = () => (editingId ? "ویرایش آدرس" : "افزودن آدرس جدید");
    /** Reverse-geocoded place for `center`: { key, label } */
    let place = null;
    let values = { ...EMPTY };
    let errors = {};
    /** The checked address waiting for its map position */
    let pending = null;
    let map = null;
    /** "loading" → "ready" (map shown) or "none" (no key / didn't load: saved without a position) */
    let mapState = "loading";
    let busy = false;

    const keyOf = (p) => (p ? `${p.lat.toFixed(5)},${p.lng.toFixed(5)}` : "");
    const province = () => provinces.find((p) => p.id === values.provinceId);
    const city = () => province()?.cities.find((c) => c.id === values.cityId);
    const area = () => serviceArea(province()?.name, city()?.name);
    const inArea = (a, p) => Boolean(a && p && inside(a.ring, p.lng, p.lat));

    /** Back (right) · title · close (left, tablet/desktop) */
    const header = () => html`
      <header class="grid h-[88px] shrink-0 grid-cols-[48px_1fr_48px] items-center px-6 md:px-12">
        <button
          type="button"
          data-action="back"
          aria-label="${step === "map" ? "بازگشت به فرم آدرس" : "بستن"}"
          class="${cx("-m-3 flex size-12 items-center justify-center justify-self-start text-on-surface", step === "form" && "md:invisible")}"
        >
          ${icon("chevronLeft", { cls: "-scale-x-100" })}
        </button>
        <h2 class="text-center text-13 text-on-surface-var">
          ${step === "map"
            ? html`<span class="md:hidden">انتخاب لوکیشن</span><span class="hidden md:inline">${title()}</span>`
            : title()}
        </h2>
        <button type="button" data-action="close" aria-label="بستن" class="-m-3 hidden size-12 items-center justify-center justify-self-end text-on-surface md:flex">
          ${icon("close")}
        </button>
      </header>
    `;

    /* ---------------- Step 1: form ---------------- */

    const section = (title, body) => html`<section class="flex flex-col gap-4 p-6">${co.blockTitle(title)}${body}</section>`;
    /** "ادامه" when a map step follows, otherwise "ذخیره" */
    const submitLabel = () => (area() ? "ادامه" : "ذخیره");

    function showForm() {
      step = "form";
      stopMap();
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
          <!-- Pinned button over a white fade -->
          <div class="shrink-0 bg-gradient-to-b from-white/0 to-white p-4 backdrop-blur-[2px] md:px-5 md:py-6">
            <button type="submit" data-submit class="${cx(co.CTA, "mx-auto flex w-full max-w-[400px]")}">${submitLabel()}</button>
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
        submitForm();
      });
    }

    /** Province / city fields (redrawn when either changes), and the button label that depends on them */
    function paintSelects() {
      const box = dom.$("[data-selects]", dialog);
      if (!box) return;
      dom.render(
        box,
        html`${fields.select({ name: "provinceId", label: "استان", value: province()?.name, error: errors.provinceId })}
        ${fields.select({ name: "cityId", label: "شهر", value: city()?.name, error: errors.cityId, disabled: !province() })}`,
      );
      const submit = dom.$("[data-submit]", dialog);
      if (submit) submit.textContent = submitLabel();
    }

    /** Checks the form; Tehran/Karaj go on to the map, everything else is saved */
    function submitForm() {
      const found = validateAddress({ ...values, provinceName: province()?.name ?? "", cityName: city()?.name ?? "" });
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
      pending = found.address;
      const a = area();
      if (a) {
        // A position from another city (or from before the city changed) doesn't count
        if (!inArea(a, center)) center = null;
        showMap(a);
      } else {
        finish(pending);
      }
    }

    /** verify (e.g. one-time code) → onSaved → close */
    async function finish(address) {
      if (busy) return;
      busy = true;
      try {
        if (verify && !(await verify(address))) return;
        onSaved({ id: editingId || (crypto.randomUUID ? crypto.randomUUID() : String(Date.now())), ...address });
        dialog.close();
      } finally {
        busy = false;
      }
    }

    /* ---------------- Step 2: map (Tehran & Karaj) ---------------- */

    function showMap(a) {
      step = "map";
      place = null;
      mapState = "loading";
      dom.render(
        dialog,
        html`<div class="animate-fade-up flex h-full flex-col">
          ${header()}
          <div class="flex min-h-0 flex-1 flex-col">
            <!-- Place search (64px band), limited to the city -->
            <div class="relative z-[1000] shrink-0 p-4">
              ${fields.searchBox({ placeholder: `جستجو در ${a.city}…`, label: `جستجوی مکان در ${a.city}` })}
              <ul data-places hidden class="absolute inset-x-4 top-full -mt-2 max-h-64 overflow-y-auto rounded-[16px] bg-surface py-2 shadow-[0_8px_24px_rgba(0,0,0,0.12)]"></ul>
            </div>
            <!-- Map + centre pin + "my location" -->
            <div class="relative min-h-0 flex-1 overflow-hidden bg-surface-low">
              <!-- inline position: the map library's own CSS sets .maplibregl-map to relative -->
              <div data-map style="position: absolute; inset: 0" aria-label="${`نقشه ${a.city}`}" role="application"></div>
              <p data-map-note hidden class="absolute inset-x-6 top-1/2 z-[1] -translate-y-1/2 text-center text-13 text-on-surface-var"></p>
              <div
                data-pin
                aria-hidden="true"
                class="pointer-events-none absolute top-1/2 left-1/2 z-[2] flex -translate-1/2 flex-col items-center drop-shadow-[0_0_8px_rgba(0,0,0,0.25)] transition-transform duration-300 ease-out-expo"
              >
                <span class="flex size-[60px] items-center justify-center rounded-full border-4 border-primary bg-white text-primary">${icon("logo", { size: 44 })}</span>
                <span class="h-[31px] w-1 rounded-b-full bg-primary"></span>
              </div>
              <button
                type="button"
                data-action="locate"
                aria-label="موقعیت فعلی من"
                class="absolute right-4 bottom-4 z-[2] flex size-12 items-center justify-center rounded-full bg-surface-low text-on-surface shadow-[0_1px_3px_rgba(0,0,0,0.15),0_1px_2px_rgba(0,0,0,0.3)] transition-transform hover:scale-105"
              >
                ${icon("gps")}
              </button>
            </div>
          </div>
          <div class="flex shrink-0 flex-col gap-4 p-4 md:p-6">
            <p data-place aria-live="polite" class="min-h-5 text-center text-13 text-on-surface-var">در حال بارگذاری نقشه…</p>
            <hr class="border-dashed border-on-surface-var" />
            <button type="button" data-action="confirm" disabled class="${cx(co.CTA, "w-full")}">ذخیره</button>
          </div>
        </div>`,
      );
      startMap(a);
      wirePlaceSearch(a);
    }

    /** Status line + save button for the position under the needle */
    function paintPlace() {
      const el = dom.$("[data-place]", dialog);
      const confirm = dom.$('[data-action="confirm"]', dialog);
      if (!el || !confirm) return;
      const a = area();
      if (mapState !== "ready") {
        // Still loading → wait; no map at all → the address is saved without a position
        confirm.disabled = mapState === "loading";
        return;
      }
      const ok = inArea(a, center);
      confirm.disabled = !ok;
      el.classList.toggle("text-error", Boolean(center) && !ok);
      el.textContent = !center
        ? "در حال یافتن آدرس…"
        : !ok
          ? `این نقطه خارج از محدوده ${a.city} است. پین را داخل ${a.city} قرار دهید.`
          : place && place.key === keyOf(center)
            ? place.label || "موقعیت روی نقشه"
            : "در حال یافتن آدرس…";
    }

    /** Address under the pin, debounced; answers for old positions are dropped */
    const lookup = dom.debounce(async (point) => {
      const key = keyOf(point);
      const result = await api.reverseGeocode(point);
      if (key !== keyOf(center)) return;
      place = { key, label: result.label };
      paintPlace();
    }, 300);

    function setCenter(point) {
      center = point;
      paintPlace();
      if (inArea(area(), point)) lookup(point);
    }

    /** No map: say so and let the address be saved without a position */
    function mapUnavailable(message) {
      stopMap();
      mapState = "none";
      const note = dom.$("[data-map-note]", dialog);
      if (!note) return;
      dom.$("[data-map]", dialog)?.classList.remove("animate-pulse");
      dom.$("[data-pin]", dialog)?.setAttribute("hidden", "");
      dom.$('[data-action="locate"]', dialog)?.setAttribute("hidden", "");
      note.hidden = false;
      note.textContent = message;
      const status = dom.$("[data-place]", dialog);
      if (status) status.textContent = "آدرس بدون موقعیت روی نقشه ذخیره می‌شود.";
      paintPlace();
    }

    function stopMap() {
      map?.remove();
      map = null;
    }

    async function startMap(a) {
      const el = dom.$("[data-map]", dialog);
      if (!CONFIG.MAPTILER_KEY) {
        mapUnavailable("نقشه هنوز راه‌اندازی نشده است (کلید MapTiler در تنظیمات سایت).");
        return;
      }
      el.classList.add("animate-pulse");
      const sdk = await loadMapTiler().catch(() => null);
      if (!el.isConnected || step !== "map") return;
      if (!sdk) {
        mapUnavailable("نقشه بارگذاری نشد. اتصال اینترنت را بررسی کنید.");
        return;
      }
      stopMap();
      sdk.config.apiKey = CONFIG.MAPTILER_KEY;

      const [w, s, e, n] = a.bbox;
      // Room around the city so the whole outline fits on a tall phone screen too;
      // what lies beyond the outline is covered by the mask anyway
      const padX = (e - w) * 0.25;
      const padY = (e - w) * 0.6;
      const start = center || { lng: a.center[0], lat: a.center[1] };
      const instance = new sdk.Map({
        container: el,
        style: CONFIG.MAP_STYLE || "positron",
        language: "fa",
        center: [start.lng, start.lat],
        zoom: center ? 17 : 11,
        minZoom: 8,
        maxZoom: 19,
        // Panning stops at the city's box; the outline mask hides the rest of the box
        maxBounds: [
          [w - padX, s - padY],
          [e + padX, n + padY],
        ],
        dragRotate: false,
        pitchWithRotate: false,
        touchPitch: false,
        navigationControl: false,
        geolocateControl: false,
        scaleControl: false,
        fullscreenControl: false,
        terrainControl: false,
        projectionControl: false,
        space: false,
        halo: false,
        attributionControl: { compact: true },
      });
      map = instance;
      instance.touchZoomRotate?.disableRotation();

      let loaded = false;
      const fail = () => !loaded && map === instance && mapUnavailable("نقشه بارگذاری نشد.");
      // A bad key or a blocked style (tile errors carry a source and don't count)
      instance.on("error", (e) => !e.sourceId && !e.tile && fail());
      const giveUp = setTimeout(fail, 20000);
      instance.on("load", () => {
        loaded = true;
        clearTimeout(giveUp);
        mapState = "ready";
        el.classList.remove("animate-pulse");
        // Everything outside the city: covered, with the city's outline on top
        instance.addSource("maso-outside", { type: "geojson", data: outsideOf(a) });
        instance.addLayer({ id: "maso-outside", type: "fill", source: "maso-outside", paint: { "fill-color": "#ffffff", "fill-opacity": 0.94 } });
        instance.addLayer({
          id: "maso-outline",
          type: "line",
          source: "maso-outside",
          paint: { "line-color": "#001026", "line-width": 1.5, "line-opacity": 0.6, "line-dasharray": [3, 2] },
        });
        // Zooming out stops at the whole city
        const whole = instance.cameraForBounds([[w, s], [e, n]], { padding: 16 });
        if (whole) instance.setMinZoom(Math.max(8, whole.zoom - 0.25));
        if (!center) instance.fitBounds([[w, s], [e, n]], { padding: 16, duration: 0 });
        // Keep the target under the needle tip, not the map centre
        instance.panBy([0, -TIP], { duration: 0 });
        setCenter(tipPosition());
      });

      const pin = dom.$("[data-pin]", dialog);
      instance.on("movestart", () => pin.classList.add("-translate-y-[calc(50%+10px)]"));
      instance.on("moveend", () => {
        pin.classList.remove("-translate-y-[calc(50%+10px)]");
        if (loaded) setCenter(tipPosition());
      });
    }

    /** Map position under the needle tip */
    function tipPosition() {
      const el = map.getContainer();
      const p = map.unproject([el.clientWidth / 2, el.clientHeight / 2 + TIP]);
      return { lat: p.lat, lng: p.lng };
    }

    /** Fly so that `p` ends up under the needle tip */
    function flyTo(p, zoom = 17) {
      map?.flyTo({ center: [p.lng, p.lat], zoom, offset: [0, TIP], duration: 800 });
    }

    /** Place search above the map: limited to the city's box, results outside its outline dropped */
    function wirePlaceSearch(a) {
      const input = dom.$("input[type=search]", dialog);
      const list = dom.$("[data-places]", dialog);
      let results = [];
      const run = dom.debounce(async (q) => {
        const near = center || { lng: a.center[0], lat: a.center[1] };
        const found = (await api.searchPlaces(q, near, a.bbox)).filter((r) => inside(a.ring, r.location.lng, r.location.lat));
        if (input.value.trim() !== q) return;
        results = found;
        list.hidden = false;
        dom.render(
          list,
          found.length
            ? found.map(
                (r, i) => html`<li>
                  <button type="button" data-place-index="${i}" class="flex w-full flex-col items-start gap-0.5 px-4 py-2 text-start hover:bg-surface-low">
                    <span class="text-16 text-on-surface">${r.title}</span>
                    <span class="line-clamp-1 text-13 text-on-surface-var">${r.address}</span>
                  </button>
                </li>`,
              )
            : html`<li class="px-4 py-2 text-13 text-on-surface-var">${`موردی در ${a.city} پیدا نشد.`}</li>`,
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

    /** Map → save, with the position when there is a map */
    function confirmLocation() {
      if (!pending) return showForm();
      if (mapState === "loading" || (mapState === "ready" && !inArea(area(), center))) return;
      const address = { ...pending };
      if (mapState === "ready") address.location = { lat: center.lat, lng: center.lng };
      finish(address);
    }

    /* ---------------- Clicks ---------------- */

    dom.actions(dialog, {
      back: () => (step === "map" ? showForm() : dialog.close()),
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
      stopMap();
    });

    return {
      open(existing) {
        editingId = existing?.id ?? null;
        step = "form";
        center = existing?.location ?? null;
        place = null;
        pending = null;
        values = { ...EMPTY };
        if (existing) for (const key of Object.keys(EMPTY)) values[key] = existing[key] ?? "";
        errors = {};
        dialog.setAttribute("aria-label", title());
        dialog.showModal();
        showForm();
      },
    };
  };
})();
