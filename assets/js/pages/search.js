/** search.html — the search panel as a page, starting from ?q= */
(function () {
  "use strict";

  const { api, url, dom } = window.Maso;

  dom.ready(async () => {
    const root = dom.$("#search-page-panel");
    const popular = await api
      .settings()
      .then((s) => s.popularSearches)
      .catch(() => []);
    window.Maso.searchPanel(root, { popular, initialQuery: url.param("q") || "" });
  });
})();
