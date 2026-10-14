/**
 * Browser-side state kept in localStorage: cart, saved addresses, checkout
 * choices, recent searches and the login session. Each store is read lazily,
 * written on every change, and synced across tabs (`storage` event).
 *
 *   Maso.cart.add(line) / setQty(id, n) / remove(id) / clear() / lines()
 *   Maso.cart.subscribe(fn)  → fn() after every change (also from other tabs)
 *
 * Prices kept here are what the shopper saw; the checkout quote from
 * WordPress is always the authoritative total.
 */
(function () {
  "use strict";

  const Maso = window.Maso;

  /** Tiny localStorage-backed store with change listeners */
  function createStore(key, fallback, parse) {
    let value = fallback;
    let loaded = false;
    const listeners = new Set();

    function load() {
      if (loaded) return;
      loaded = true;
      try {
        const raw = localStorage.getItem(key);
        value = raw ? parse(JSON.parse(raw)) : fallback;
      } catch {
        value = fallback;
      }
    }

    function get() {
      load();
      return value;
    }

    function set(next) {
      value = next;
      loaded = true;
      try {
        localStorage.setItem(key, JSON.stringify(next));
      } catch {
        /* private mode / quota — keep working in memory */
      }
      listeners.forEach((l) => l(value));
    }

    // Another tab changed it: re-read and notify
    window.addEventListener("storage", (e) => {
      if (e.key !== key) return;
      loaded = false;
      listeners.forEach((l) => l(get()));
    });

    return {
      get,
      set,
      update: (fn) => set(fn(get())),
      subscribe(fn) {
        listeners.add(fn);
        return () => listeners.delete(fn);
      },
    };
  }

  /* ------------------------------------------------------------------ */
  /* Cart                                                                */
  /* ------------------------------------------------------------------ */

  /**
   * CartLine:
   *   id          kind + slug + chosen option ids (identical configurations merge)
   *   kind        "product" | "test" (a 30×30 sample)
   *   slug, name, image
   *   optionIds   chosen option ids in option-group order (sent to WordPress for pricing)
   *   options     [{ label, value, swatch? }] — human-readable choices
   *   price       unit price in Toman as shown on the product page
   *   regularPrice?  price before discount
   *   qty
   */
  const cartStore = createStore("maso-cart-v1", [], (raw) =>
    Array.isArray(raw) ? raw.filter((l) => l && typeof l.id === "string").map((l) => ({ ...l, optionIds: l.optionIds || [] })) : [],
  );

  Maso.cart = {
    lines: cartStore.get,
    subscribe: cartStore.subscribe,
    add(line, qty = 1) {
      cartStore.update((lines) =>
        lines.some((l) => l.id === line.id)
          ? lines.map((l) => (l.id === line.id ? { ...l, qty: l.qty + qty } : l))
          : [...lines, { ...line, qty }],
      );
    },
    setQty(id, qty) {
      cartStore.update((lines) => (qty <= 0 ? lines.filter((l) => l.id !== id) : lines.map((l) => (l.id === id ? { ...l, qty } : l))));
    },
    remove(id) {
      cartStore.update((lines) => lines.filter((l) => l.id !== id));
    },
    clear() {
      cartStore.set([]);
    },
    lineId(slug, kind, optionIds) {
      return [kind, slug, ...optionIds].join(":");
    },
    /** The part of the cart WordPress needs for pricing and ordering */
    toInputs(lines) {
      return lines.map(({ slug, kind, optionIds, qty }) => ({ slug, kind, optionIds, qty }));
    },
    /** Total number of pieces (header badge) */
    count() {
      return cartStore.get().reduce((n, l) => n + l.qty, 0);
    },
  };

  /* ------------------------------------------------------------------ */
  /* Checkout: chosen address / coupon / payment method + saved addresses */
  /* ------------------------------------------------------------------ */

  const choices = createStore("maso-checkout-v1", {}, (raw) => (raw && typeof raw === "object" ? raw : {}));
  const addresses = createStore("maso-addresses-v1", [], (raw) =>
    Array.isArray(raw) ? raw.filter((a) => a && typeof a.id === "string") : [],
  );

  Maso.checkout = {
    choices: choices.get,
    addresses: addresses.get,
    subscribe(fn) {
      const a = choices.subscribe(fn);
      const b = addresses.subscribe(fn);
      return () => (a(), b());
    },
    choose: (patch) => choices.update((c) => ({ ...c, ...patch })),
    /** After a completed order: forget the coupon, keep address & payment preference */
    reset: () => choices.update(({ addressId, paymentMethodId }) => ({ addressId, paymentMethodId })),
    saveAddress(address) {
      addresses.update((list) => [address, ...list.filter((a) => a.id !== address.id)]);
      choices.update((c) => ({ ...c, addressId: address.id }));
    },
    removeAddress(id) {
      addresses.update((list) => list.filter((a) => a.id !== id));
    },
    /** The chosen address, or the newest one */
    currentAddress() {
      const list = addresses.get();
      return list.find((a) => a.id === choices.get().addressId) || list[0];
    },
  };

  /* ------------------------------------------------------------------ */
  /* Recent searches ("جستجوهای اخیر"): last five terms, newest first     */
  /* ------------------------------------------------------------------ */

  const recent = createStore("maso-recent-searches", [], (raw) =>
    Array.isArray(raw) ? raw.filter((t) => typeof t === "string").slice(0, 5) : [],
  );

  Maso.recentSearches = {
    list: recent.get,
    subscribe: recent.subscribe,
    add(term) {
      const t = Maso.text.normalize(term);
      if (t) recent.update((terms) => [t, ...terms.filter((x) => x !== t)].slice(0, 5));
    },
    remove(term) {
      recent.update((terms) => terms.filter((x) => x !== term));
    },
  };

  /* ------------------------------------------------------------------ */
  /* Login session                                                       */
  /* ------------------------------------------------------------------ */

  /**
   * Token issued by WordPress after the SMS code is verified. Sent as a
   * Bearer token on account requests. (If the site runs on the same domain
   * as WordPress, WordPress can use its own httpOnly cookie instead.)
   */
  const session = createStore("maso-session-v1", null, (raw) => (raw && typeof raw.token === "string" ? raw : null));

  Maso.session = {
    get: session.get,
    set: (value) => session.set(value),
    clear: () => session.set(null),
  };
})();
