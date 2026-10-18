/**
 * Data layer. Every function returns a Promise with exactly the JSON shape
 * the WordPress endpoint returns (docs/WORDPRESS_API.md), so pages never
 * know whether data came from WordPress or from the sample data.
 *
 *   MASO_CONFIG.WP_URL = ""      → sample data (assets/js/data/mock.js)
 *   MASO_CONFIG.WP_URL = "https://…" → `${WP_URL}/wp-json/maso/v1/…`
 *
 * Also here: shop query ⇄ URL helpers and product pricing, shared by the
 * shop, product and checkout pages.
 */
(function () {
  "use strict";

  const Maso = window.Maso;
  const CONFIG = window.MASO_CONFIG || {};
  const WP = (CONFIG.WP_URL || "").replace(/\/+$/, "");
  const USE_MOCK = !WP;
  /** Sample data: the one-time code that works everywhere (login, number change, checkout) */
  const MOCK_OTP = "12345";
  const MOCK = window.MASO_MOCK;

  /* ------------------------------------------------------------------ */
  /* Shop query ⇄ URL                                                    */
  /*   shop.html?category=beds&sort=price-desc&stock=1&wood=walnut,oak   */
  /* ------------------------------------------------------------------ */

  const PAGE_SIZE = 12;
  const BLOG_PAGE_SIZE = 9;
  const SORT_KEYS = ["price-desc", "price-asc", "newest"];
  const DEFAULT_SORT = "newest";
  const RESERVED = new Set(["category", "sort", "stock", "page"]);

  Maso.shopQuery = {
    PAGE_SIZE,
    SORT_KEYS,
    /** URLSearchParams → { category, sort, inStock, facets, page } */
    parse(params) {
      const facets = {};
      for (const [key, raw] of params) {
        if (RESERVED.has(key)) continue;
        const values = raw.split(",").filter(Boolean);
        if (values.length) facets[key] = [...new Set([...(facets[key] || []), ...values])].sort();
      }
      const sort = params.get("sort");
      const page = Number(params.get("page"));
      return {
        category: params.get("category") || undefined,
        sort: SORT_KEYS.includes(sort) ? sort : DEFAULT_SORT,
        inStock: params.get("stock") === "1",
        facets,
        page: Number.isInteger(page) && page > 1 ? page : 1,
      };
    },
    /** Query → URLSearchParams (category first, defaults left out) */
    toParams(query) {
      const sp = new URLSearchParams();
      if (query.category) sp.set("category", query.category);
      if (query.sort !== DEFAULT_SORT) sp.set("sort", query.sort);
      if (query.inStock) sp.set("stock", "1");
      for (const key of Object.keys(query.facets).sort()) {
        if (query.facets[key].length) sp.set(key, query.facets[key].join(","));
      }
      if (query.page > 1) sp.set("page", String(query.page));
      return sp;
    },
    /** Number of active filters (badge on the filter button) */
    activeCount(query) {
      return Object.values(query.facets).reduce((n, v) => n + v.length, 0) + (query.inStock ? 1 : 0);
    },
  };

  /* ------------------------------------------------------------------ */
  /* Pricing                                                             */
  /* ------------------------------------------------------------------ */

  Maso.pricing = {
    /**
     * Price of a configuration: the chosen size's price (or the base price)
     * plus the surcharge of every chosen finish. null until every option
     * group has a choice. `selection` = { groupKey: optionId }.
     */
    priceFor(product, selection) {
      let total = product.basePrice ?? 0;
      for (const group of product.optionGroups) {
        const opt = group.options.find((o) => o.id === selection[group.key]);
        if (!opt) return null;
        if (opt.price !== undefined) total = opt.price;
      }
      for (const group of product.optionGroups) {
        const opt = group.options.find((o) => o.id === selection[group.key]);
        total += opt?.priceDelta ?? 0;
      }
      return total;
    },
    /** [cheapest, most expensive] configuration */
    priceRange(product) {
      const sizes = product.optionGroups.find((g) => g.options.some((o) => o.price !== undefined));
      const bases = sizes ? sizes.options.map((o) => o.price ?? 0) : [product.basePrice ?? 0];
      let min = Math.min(...bases);
      let max = Math.max(...bases);
      for (const group of product.optionGroups) {
        if (group === sizes) continue;
        const deltas = group.options.map((o) => o.priceDelta ?? 0);
        min += Math.min(...deltas);
        max += Math.max(...deltas);
      }
      return [min, max];
    },
    findOption(product, groupKey, id) {
      return product.optionGroups.find((g) => g.key === groupKey)?.options.find((o) => o.id === id);
    },
  };

  /* ------------------------------------------------------------------ */
  /* HTTP                                                                */
  /* ------------------------------------------------------------------ */

  class ApiError extends Error {
    constructor(message, status) {
      super(message);
      this.status = status;
    }
  }

  /** GET responses are reused for the lifetime of the page */
  const cache = new Map();

  async function request(path, { method = "GET", body, timeout = 15000 } = {}) {
    const cacheable = method === "GET" && !path.startsWith("/maso/v1/account");
    if (cacheable && cache.has(path)) return cache.get(path);
    const headers = { Accept: "application/json" };
    const token = Maso.session?.get()?.token;
    if (token) headers.Authorization = `Bearer ${token}`;
    if (body && !(body instanceof FormData)) headers["Content-Type"] = "application/json";

    const promise = fetch(`${WP}/wp-json${path}`, {
      method,
      headers,
      body: body instanceof FormData ? body : body ? JSON.stringify(body) : undefined,
      signal: AbortSignal.timeout ? AbortSignal.timeout(timeout) : undefined,
    }).then(async (res) => {
      if (!res.ok) throw new ApiError(`WordPress ${res.status} on ${path}`, res.status);
      return res.json();
    });

    if (cacheable) {
      cache.set(path, promise);
      promise.catch(() => cache.delete(path));
    }
    return promise;
  }

  /** Sample data answers after a short pause, like a real request */
  const later = (value, ms = 120) => new Promise((resolve) => setTimeout(() => resolve(value), ms));
  const qs = (params) => {
    const s = new URLSearchParams(Object.entries(params).filter(([, v]) => v !== undefined && v !== "")).toString();
    return s ? `?${s}` : "";
  };

  /* ------------------------------------------------------------------ */
  /* Sample implementations of the same contract                         */
  /* ------------------------------------------------------------------ */

  function mockProduct(slug) {
    // Every listed product (plus "hamdam-bed" and the "line-…" promo) opens the Figma PDP content
    const listed = MOCK.products.find((p) => p.slug === slug);
    if (slug !== "hamdam-bed" && !listed && !slug.startsWith("line-")) return null;
    return { ...MOCK.productDetail, slug, name: listed?.name ?? MOCK.productDetail.name };
  }

  function toSummary(p) {
    const { slug, name, capacity, shortDescription, price, regularPrice, image, swatches, inStock } = p;
    return { slug, name, capacity, shortDescription, price, regularPrice, image, swatches, inStock };
  }

  function mockQuoteRows(items, count, shippingText = "رایگان") {
    return [
      { label: `اقلام (${count.toLocaleString("fa-IR")})`, amount: items },
      { label: "مالیات", amount: Math.round((items * 0.1) / 1000) * 1000 },
      { label: "هزینه بیمه", amount: Math.round((items * 0.005) / 1000) * 1000 },
      { label: "بسته بندی", amount: count ? 1_500_000 : 0 },
      { label: "ارسال", text: shippingText },
    ];
  }

  function mockLinePrice(line) {
    const product = mockProduct(line.slug);
    if (!product) return 0;
    if (line.kind === "test") return product.test?.price ?? 0;
    const selection = {};
    product.optionGroups.forEach((g, i) => (selection[g.key] = line.optionIds[i]));
    return Maso.pricing.priceFor(product, selection) ?? 0;
  }

  /** Sample account edits survive a reload (this browser only) */
  const mockAccountStore = {
    get() {
      try {
        return JSON.parse(localStorage.getItem("maso-sample-account-v1")) || {};
      } catch {
        return {};
      }
    },
    set(value) {
      try {
        localStorage.setItem("maso-sample-account-v1", JSON.stringify(value));
      } catch {
        /* private mode: edits last until the page closes */
      }
    },
  };

  function mockCustomer() {
    const mobile = Maso.session?.get()?.customer?.mobile || "09123456789";
    return { ...MOCK.account, mobile, ...mockAccountStore.get() };
  }

  /** The sample profile shares the checkout's saved addresses; seeds two the first time */
  function mockAddresses() {
    let seeded = false;
    try {
      seeded = localStorage.getItem("maso-sample-addresses-seeded") === "1";
      localStorage.setItem("maso-sample-addresses-seeded", "1");
    } catch {
      /* ignore */
    }
    if (!seeded && !Maso.checkout.addresses().length) [...MOCK.sampleAddresses].reverse().forEach((a) => Maso.checkout.saveAddress(a));
    return Maso.checkout.addresses();
  }

  /** A small text file standing in for WordPress's PDF pre-invoice */
  function mockPreInvoiceFile(order) {
    const p = MOCK.preInvoice;
    const lines = ["پیش فاکتور ماسو (نمونه)", "", `شماره سفارش: ${order.number}`, `نام و نام خانوادگی: ${p.customerName}`, `شماره پیگیری: ${p.trackingCode}`, `شماره همراه: ${p.mobile}`, `مبلغ: ${Maso.fmt.price(order.total)} تومان`];
    return `data:text/plain;charset=utf-8,${encodeURIComponent(lines.join("\n"))}`;
  }

  /* ------------------------------------------------------------------ */
  /* Public API                                                          */
  /* ------------------------------------------------------------------ */

  Maso.api = {
    ApiError,
    usesSampleData: USE_MOCK,

    /** Header/footer settings, popular searches, login background */
    settings: () => (USE_MOCK ? later(MOCK.settings, 0) : request("/maso/v1/settings")),

    categories: () => (USE_MOCK ? later(MOCK.categories, 0) : request("/maso/v1/shop/categories")),
    facets: (category) => (USE_MOCK ? later(MOCK.facets, 0) : request(`/maso/v1/shop/facets${qs({ category })}`)),
    promo: (category) => (USE_MOCK ? later(MOCK.promo, 0) : request(`/maso/v1/shop/promo${qs({ category })}`)),

    /** One page of products for a shop query → { items, page, totalPages, total } */
    products(query) {
      if (!USE_MOCK) {
        const sp = Maso.shopQuery.toParams(query);
        sp.set("per_page", String(PAGE_SIZE));
        return request(`/maso/v1/shop/products?${sp}`);
      }
      let items = MOCK.products.filter(
        (p) =>
          (!query.category || p.categories.includes(query.category)) &&
          (!query.inStock || p.inStock) &&
          Object.entries(query.facets).every(([key, values]) => values.some((v) => p.facets[key]?.includes(v))),
      );
      items = [...items].sort((a, b) =>
        query.sort === "price-asc" ? a.price - b.price : query.sort === "price-desc" ? b.price - a.price : b.createdAt.localeCompare(a.createdAt),
      );
      const totalPages = Math.max(1, Math.ceil(items.length / PAGE_SIZE));
      const start = (query.page - 1) * PAGE_SIZE;
      return later({ items: items.slice(start, start + PAGE_SIZE).map(toSummary), page: query.page, totalPages, total: items.length }, 60);
    },

    /** Product detail, or null when there is no such product */
    async product(slug) {
      if (USE_MOCK) return later(mockProduct(slug), 0);
      try {
        return await request(`/maso/v1/shop/products/${encodeURIComponent(slug)}`);
      } catch (e) {
        if (e.status === 404) return null;
        throw e;
      }
    },

    /** Live search (up to 8 rows) */
    search(query) {
      const q = Maso.text.normalize(query);
      if (!q) return Promise.resolve([]);
      if (!USE_MOCK) return request(`/maso/v1/search?q=${encodeURIComponent(q)}&limit=8`);
      const key = Maso.text.matchKey(q);
      const bed = {
        slug: "hamdam-bed",
        name: MOCK.productDetail.name,
        price: Maso.pricing.priceRange(MOCK.productDetail)[0],
        image: MOCK.productDetail.images[0],
      };
      const hits = [bed, ...MOCK.products]
        .filter((p) => Maso.text.matchKey(p.name).includes(key))
        .slice(0, 8)
        .map(({ slug, name, price, regularPrice, image }) => ({ slug, name, price, regularPrice, image }));
      return later(hits, 150);
    },

    /* --- Checkout --- */

    locations: () => (USE_MOCK ? later(MOCK.provinces, 0) : request("/maso/v1/checkout/locations")),
    paymentMethods: () => (USE_MOCK ? later(MOCK.paymentMethods, 0) : request("/maso/v1/checkout/payment-methods")),

    /** Totals for { lines, provinceId?, cityId?, coupon? } — priced by WordPress */
    quote(input) {
      if (!USE_MOCK) return request("/maso/v1/checkout/quote", { method: "POST", body: input });
      const { lines, provinceId, cityId, coupon } = input;
      const items = lines.reduce((sum, l) => sum + mockLinePrice(l) * l.qty, 0);
      const count = lines.reduce((n, l) => n + l.qty, 0);
      const shipping = provinceId
        ? MOCK.shippingMethods[MOCK.serviceCities.includes(cityId) ? "maso" : "freight"]
        : undefined;
      const rows = mockQuoteRows(items, count, shipping?.id === "freight" ? "پس کرایه" : "رایگان");
      const code = coupon?.trim().toUpperCase();
      const percent = code ? MOCK.coupons[code] : undefined;
      const discount = percent ? { code, percent, amount: Math.round((items * percent) / 100 / 1000) * 1000 } : undefined;
      const payable = rows.reduce((sum, r) => sum + (r.amount ?? 0), 0) - (discount?.amount ?? 0);
      return later({ itemsCount: count, rows, discount, payable, shipping }, 180);
    },

    /** Checks a coupon against the cart → { ok: true } | { ok: false, error } */
    coupon(code, lines) {
      if (!USE_MOCK) return request("/maso/v1/checkout/coupon", { method: "POST", body: { code, lines } });
      if (!lines.length) return later({ ok: false, error: "سبد خرید خالی است." });
      const known = MOCK.coupons[code.trim().toUpperCase()] || code.trim().toUpperCase() === "FAIL";
      return later(known ? { ok: true } : { ok: false, error: "کد تخفیف معتبر نیست." }, 300);
    },

    /**
     * Creates the order → { orderId, redirectUrl }: the bank gateway for
     * online payment, or the result page for offline methods.
     */
    placeOrder(input) {
      if (!USE_MOCK) return request("/maso/v1/checkout/order", { method: "POST", body: input, timeout: 30000 });
      const orderId = String(Math.floor(10_000_000 + Math.random() * 89_999_999));
      // The sample "gateway" approves everything except the demo code FAIL
      const status = input.coupon?.toUpperCase() === "FAIL" ? "failed" : "paid";
      return later({ orderId, redirectUrl: `/checkout/result?order=${orderId}&status=${status}` }, 700);
    },

    /** Outcome of a payment attempt → OrderResult, or null for an unknown order */
    async orderResult(orderId, statusHint) {
      if (!USE_MOCK) {
        try {
          return await request(`/maso/v1/checkout/order/${encodeURIComponent(orderId)}?_=${Date.now()}`);
        } catch (e) {
          if (e.status === 404) return null;
          throw e;
        }
      }
      if (!/^\d{4,12}$/.test(orderId || "")) return null;
      const rows = mockQuoteRows(1_480_000_000, 2);
      return later({
        orderId,
        status: statusHint === "failed" ? "failed" : "paid",
        orderNumber: orderId,
        trackingCode: orderId.split("").reverse().join(""),
        transactionId: `190-${orderId}`,
        date: new Date().toISOString(),
        rows: [...rows.slice(0, -1), { label: "ارسال", text: "پس کرایه" }],
      }, 0);
    },

    /* --- Login (SMS one-time code; sample data: every code on the site is 12345) --- */

    requestOtp(mobile) {
      if (!USE_MOCK) return request("/maso/v1/auth/otp", { method: "POST", body: { mobile } });
      return later({ resendIn: 120, length: MOCK_OTP.length }, 400);
    },

    /** → { token, customer, isNew }, or null for a wrong/expired code */
    async verifyOtp(mobile, code) {
      if (!USE_MOCK) {
        try {
          return await request("/maso/v1/auth/verify", { method: "POST", body: { mobile, code } });
        } catch (e) {
          if (e.status === 422 || e.status === 401) return null;
          throw e;
        }
      }
      return later(code === MOCK_OTP ? { token: `mock.${mobile}`, customer: { id: "1", mobile }, isNew: false } : null, 400);
    },

    /* --- Account (needs the login token; 401 = signed out) --- */

    account: {
      /** → { customer: { firstName, lastName, mobile, email }, currentOrder: OrderSummary | null } */
      get() {
        if (!USE_MOCK) return request("/maso/v1/account");
        return later({ customer: mockCustomer(), currentOrder: MOCK.orders.find((o) => o.status === "current") || null }, 150);
      },

      /** { firstName?, lastName?, email? } → customer */
      update(patch) {
        if (!USE_MOCK) return request("/maso/v1/account", { method: "PATCH", body: patch });
        mockAccountStore.set({ ...mockAccountStore.get(), ...patch });
        return later(mockCustomer(), 300);
      },

      /** Texts a code to the new number → { resendIn, length } */
      requestMobileChange(mobile) {
        if (!USE_MOCK) return request("/maso/v1/account/mobile", { method: "POST", body: { mobile } });
        return later({ resendIn: 120, length: MOCK_OTP.length }, 400);
      },

      /** → customer with the new number, or null for a wrong code */
      async confirmMobileChange(mobile, code) {
        if (!USE_MOCK) {
          try {
            return await request("/maso/v1/account/mobile/verify", { method: "POST", body: { mobile, code } });
          } catch (e) {
            if (e.status === 422) return null;
            throw e;
          }
        }
        if (code !== MOCK_OTP) return later(null, 400);
        mockAccountStore.set({ ...mockAccountStore.get(), mobile });
        const session = Maso.session.get();
        if (session) Maso.session.set({ ...session, customer: { ...session.customer, mobile } });
        return later(mockCustomer(), 400);
      },

      /** Status "pre" | "current" | "delivered" | "returned" → OrderSummary[] */
      orders(status) {
        if (!USE_MOCK) return request(`/maso/v1/account/orders${qs({ status })}`);
        return later(MOCK.orders.filter((o) => o.status === status), 150);
      },

      /** OrderDetail, or null when it isn't this customer's order */
      async order(id) {
        if (!USE_MOCK) {
          try {
            return await request(`/maso/v1/account/orders/${encodeURIComponent(id)}`);
          } catch (e) {
            if (e.status === 404) return null;
            throw e;
          }
        }
        const summary = MOCK.orders.find((o) => o.id === id);
        if (!summary) return later(null, 0);
        const step = summary.status === "delivered" ? 3 : summary.id === "40011" ? 2 : 1;
        const detail = { ...summary, ...MOCK.orderDetail, step, receipt: { ...MOCK.orderDetail.receipt, orderNumber: summary.number } };
        if (summary.status === "pre") detail.preInvoice = { ...MOCK.preInvoice, downloadUrl: mockPreInvoiceFile(summary) };
        return later(detail, 150);
      },

      /** Saved addresses (same shape as the checkout's) */
      addresses() {
        if (!USE_MOCK) return request("/maso/v1/account/addresses");
        return later(mockAddresses(), 120);
      },

      /** Creates (no id) or updates an address → the saved address */
      saveAddress(address) {
        if (!USE_MOCK) {
          const known = /^\d+$/.test(String(address.id || ""));
          return request(`/maso/v1/account/addresses${known ? `/${address.id}` : ""}`, { method: known ? "PUT" : "POST", body: address });
        }
        mockAddresses();
        Maso.checkout.saveAddress(address);
        return later(address, 250);
      },

      removeAddress(id) {
        if (!USE_MOCK) return request(`/maso/v1/account/addresses/${encodeURIComponent(id)}`, { method: "DELETE" });
        Maso.checkout.removeAddress(id);
        return later({ ok: true }, 250);
      },

      /** Ends the session on WordPress too (best effort) */
      logout() {
        if (!USE_MOCK) return request("/maso/v1/auth/logout", { method: "POST" }).catch(() => null);
        return later(null, 0);
      },
    },

    /* --- Blog --- */

    /** One page of posts (newest first) → { items: PostSummary[], page, totalPages, total } */
    posts({ page = 1 } = {}) {
      if (!USE_MOCK) return request(`/maso/v1/blog/posts?page=${page}&per_page=${BLOG_PAGE_SIZE}`);
      const all = MOCK.posts;
      const start = (page - 1) * BLOG_PAGE_SIZE;
      return later({ items: all.slice(start, start + BLOG_PAGE_SIZE), page, totalPages: Math.max(1, Math.ceil(all.length / BLOG_PAGE_SIZE)), total: all.length }, 80);
    },

    /** Post with body, suggested products and other posts — or null when there is no such post */
    async post(slug) {
      if (!USE_MOCK) {
        try {
          return await request(`/maso/v1/blog/posts/${encodeURIComponent(slug)}`);
        } catch (e) {
          if (e.status === 404) return null;
          throw e;
        }
      }
      const summary = MOCK.posts.find((p) => p.slug === slug);
      if (!summary) return later(null, 0);
      return later(
        {
          ...summary,
          ...MOCK.postContent,
          products: MOCK.products.slice(0, 6).map(toSummary),
          related: MOCK.posts.filter((p) => p.slug !== slug).slice(0, 6),
        },
        80,
      );
    },

    /* --- Contact form (تماس با ما) --- */

    /** { name, mobile, message } → { ok: true } */
    submitContact(input) {
      if (USE_MOCK) return later({ ok: true }, 700);
      return request("/maso/v1/forms/contact", { method: "POST", body: input });
    },

    /* --- Custom order --- */

    customOrderContent: () => (USE_MOCK ? later(MOCK.customOrder, 0) : request("/maso/v1/custom-order")),

    /** multipart: name, mobile, message, images[] → { requestId } */
    submitCustomOrder({ name, mobile, message, images }) {
      if (USE_MOCK) return later({ requestId: String(Math.floor(1e9 + Math.random() * 9e9)) }, 800);
      const body = new FormData();
      body.set("name", name);
      body.set("mobile", mobile);
      body.set("message", message);
      images.forEach((file) => body.append("images[]", file, file.name));
      return request("/maso/v1/forms/custom-order", { method: "POST", body, timeout: 60000 });
    },

    /* --- Maps (called from the browser directly; no WordPress involved) --- */

    /** Address under a map position → { label, province?, city?, street? } */
    async reverseGeocode({ lat, lng }) {
      const la = lat.toFixed(4);
      const ln = lng.toFixed(4);
      const uniq = (parts) => parts.filter((p, i, all) => p && all.indexOf(p) === i);
      try {
        if (CONFIG.NESHAN_WEB_KEY) {
          const res = await fetch(`https://api.neshan.org/v5/reverse?lat=${la}&lng=${ln}`, { headers: { "Api-Key": CONFIG.NESHAN_WEB_KEY } });
          if (!res.ok) return { label: "" };
          const d = await res.json();
          const province = d.state?.replace(/^استان\s+/, "");
          const street = uniq([d.neighbourhood, d.route_name]).join("، ");
          return { label: uniq([province, d.city, street]).join("، ") || d.formatted_address || "", province, city: d.city, street };
        }
        if (CONFIG.MAPTILER_KEY) {
          const res = await fetch(`https://api.maptiler.com/geocoding/${ln},${la}.json?language=fa&limit=1&key=${encodeURIComponent(CONFIG.MAPTILER_KEY)}`);
          if (!res.ok) return { label: "" };
          const f = (await res.json()).features?.[0];
          if (!f) return { label: "" };
          const ctx = (type) => f.context?.find((c) => c.id?.startsWith(`${type}.`))?.text;
          const province = ctx("region")?.replace(/^استان\s+/, "");
          const city = ctx("municipality") ?? ctx("county");
          const street = uniq([ctx("neighbourhood") ?? ctx("municipal_district"), f.place_type?.includes("road") || f.place_type?.includes("street") ? f.text : ""]).join("، ");
          return { label: uniq([province, city, street]).join("، ") || f.place_name || "", province, city, street };
        }
        const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&addressdetails=1&accept-language=fa&lat=${la}&lon=${ln}`);
        if (!res.ok) return { label: "" };
        const data = await res.json();
        const a = data.address || {};
        const province = a.state?.replace(/^استان\s+/, "");
        const city = a.city ?? a.town ?? a.county?.replace(/^شهرستان\s+/, "");
        const street = uniq([a.suburb ?? a.neighbourhood, a.road]).join("، ");
        return { label: uniq([province, city, street]).join("، ") || data.display_name || "", province, city, street };
      } catch {
        return { label: "" };
      }
    },

    /** Place search above the map, optionally inside bbox [w, s, e, n] → [{ title, address, location }] */
    async searchPlaces(query, near, bbox) {
      const q = query.trim();
      if (q.length < 2) return [];
      try {
        if (CONFIG.NESHAN_WEB_KEY) {
          const { lat, lng } = near || { lat: 35.6997, lng: 51.338 };
          const res = await fetch(`https://api.neshan.org/v1/search?term=${encodeURIComponent(q)}&lat=${lat}&lng=${lng}`, {
            headers: { "Api-Key": CONFIG.NESHAN_WEB_KEY },
          });
          if (!res.ok) return [];
          const data = await res.json();
          return (data.items || []).slice(0, 6).map((i) => ({ title: i.title, address: i.address, location: { lat: i.location.y, lng: i.location.x } }));
        }
        if (CONFIG.MAPTILER_KEY) {
          const params = new URLSearchParams({ language: "fa", country: "ir", limit: "6", key: CONFIG.MAPTILER_KEY });
          if (near) params.set("proximity", `${near.lng},${near.lat}`);
          if (bbox) params.set("bbox", bbox.join(","));
          const res = await fetch(`https://api.maptiler.com/geocoding/${encodeURIComponent(q)}.json?${params}`);
          if (!res.ok) return [];
          const data = await res.json();
          return (data.features || []).map((f) => ({ title: f.text, address: f.place_name, location: { lat: f.center[1], lng: f.center[0] } }));
        }
        const box = bbox ? `&viewbox=${bbox.join(",")}&bounded=1` : "";
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?format=jsonv2&countrycodes=ir&accept-language=fa&limit=6${box}&q=${encodeURIComponent(q)}`,
        );
        if (!res.ok) return [];
        const data = await res.json();
        return data.map((d) => ({
          title: d.name || d.display_name.split(",")[0],
          address: d.display_name,
          location: { lat: Number(d.lat), lng: Number(d.lon) },
        }));
      } catch {
        return [];
      }
    },
  };
})();
