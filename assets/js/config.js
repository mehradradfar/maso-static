/**
 * Site configuration — the only file to edit when going live.
 *
 * WP_URL empty  → the site runs on the bundled sample data (assets/js/data/mock.js)
 * WP_URL set    → every read/write goes to the WordPress REST API
 *                 (`${WP_URL}/wp-json/maso/v1/...`, contract in docs/WORDPRESS_API.md).
 *                 If the site and WordPress are on different domains, WordPress
 *                 must allow this origin (CORS) — see README.
 */
window.MASO_CONFIG = {
  WP_URL: "",

  /**
   * Map in the address form (Tehran & Karaj only): MapTiler, style "positron".
   * Paste the key from https://cloud.maptiler.com/account/keys/ and, in the
   * MapTiler dashboard, allow this site's domain on the key. Without a key the
   * map step says so and the address is saved without a map position.
   */
  MAPTILER_KEY: "",
  MAP_STYLE: "positron",

  /**
   * Geocoding (address under the map pin, place search). A Neshan *web* key
   * gives the best Persian street names; otherwise MapTiler's geocoding is
   * used when MAPTILER_KEY is set, and OpenStreetMap's Nominatim as a last resort.
   */
  NESHAN_WEB_KEY: "",
};
