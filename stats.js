// Statistiques de visite (GoatCounter : sans cookies, tableau de bord privé visible seulement après connexion).
// Pour ne pas compter ses propres visites : ouvrir une fois https://guillaume-bellecroix.fr/#toggle-goatcounter sur chaque appareil.
(() => {
  const CODE = "guiguizee";   // code du compte GoatCounter, ex. "gbellecroix" pour https://gbellecroix.goatcounter.com
  const vus = new Set();
  window.stat = (nom, titre) => {
    if (!CODE || vus.has(nom)) return; vus.add(nom);
    let n = 0; const go = () => { if (window.goatcounter && window.goatcounter.count) window.goatcounter.count({path: nom, title: titre || nom, event: true}); else if (n++ < 20) setTimeout(go, 500); };
    go();
  };
  if (!CODE) return;
  const s = document.createElement("script"); s.async = true;
  s.dataset.goatcounter = "https://" + CODE + ".goatcounter.com/count"; s.src = "https://gc.zgo.at/count.js";
  document.head.appendChild(s);
  // lectures et téléchargements des PDF
  document.addEventListener("click", e => {
    const a = e.target.closest('a[href*="cv/CV_"]'); if (!a) return;
    const f = a.getAttribute("href").split("/").pop().split("?")[0];
    window.stat((a.hasAttribute("download") ? "pdf-telecharge/" : "pdf-ouvert/") + f);
  }, true);
})();
