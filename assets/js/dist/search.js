(()=>{(function(){"use strict";let{api:o,url:t,dom:a}=window.Maso;a.ready(async()=>{let n=a.$("#search-page-panel"),s=await o.settings().then(e=>e.popularSearches).catch(()=>[]);window.Maso.searchPanel(n,{popular:s,initialQuery:t.param("q")||""})})})();})();
//# sourceMappingURL=search.js.map?v=9e392003e2
