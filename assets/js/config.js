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

  /** Map tiles for the address picker (CARTO's light basemap matches the design) */
  MAP_TILES: "https://{s}.basemaps.cartocdn.com/rastertiles/voyager_nolabels/{z}/{x}/{y}{r}.png",
  MAP_ATTRIBUTION: '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; CARTO',

  /**
   * Geocoding (address under the map pin, place search). A Neshan *web* key
   * gives accurate Persian street names; without one, OpenStreetMap's
   * Nominatim is used.
   */
  NESHAN_WEB_KEY: "",
};
