// Petite vidéo explicative avant d'entrer dans la rue (animée en HTML/CSS, aucun fichier vidéo) :
// 1. écran noir, la souris (ou le doigt sur téléphone) montre qu'on scrolle pour avancer et pour reculer ;
// 2. l'icône du son, qu'on peut couper ou activer (c'est le vrai bouton) ;
// 3. fondu vers la rue, et le bouton son file se ranger en haut à gauche.
(() => {
  const tactile = matchMedia("(hover: none) and (pointer: coarse)").matches;
  const css = document.createElement("style");
  css.textContent = `
#intro{position:fixed;inset:0;z-index:40;background:#05040a;color:#f3efe6;display:grid;place-items:center;transition:background .9s ease;
  font-family:"JetBrains Mono",ui-monospace,Menlo,monospace;padding:24px}
#intro.fin{background:rgba(5,4,10,0)}
#intro .sc{position:absolute;inset:0;display:grid;place-items:center;align-content:center;gap:26px;opacity:0;transition:opacity .45s ease;pointer-events:none;padding:24px;text-align:center}
#intro .sc.on{opacity:1;pointer-events:auto}
#intro .cap{font-size:13px;letter-spacing:.16em;text-transform:uppercase;min-height:1.4em;transition:opacity .3s}
#intro .cap b{color:#ff2e63;font-weight:500}
#intro .sous{font-size:11px;letter-spacing:.12em;text-transform:uppercase;color:#a49fb3;margin-top:-14px}
/* souris */
#intro .souris{width:74px;height:116px;border:3px solid #f3efe6;border-radius:37px;position:relative}
#intro .souris::before{content:"";position:absolute;left:50%;top:0;width:3px;height:34px;background:#f3efe6;transform:translateX(-50%);opacity:.5}
#intro .roue{position:absolute;left:50%;top:18px;width:10px;height:22px;border-radius:5px;background:#ff2e63;transform:translateX(-50%);box-shadow:0 0 14px #ff2e63}
#intro .fl{position:absolute;left:50%;width:0;height:0;border-left:9px solid transparent;border-right:9px solid transparent;transform:translateX(-50%);opacity:0}
#intro .fl.bas{bottom:-30px;border-top:12px solid #ff2e63}
#intro .fl.haut{top:-30px;border-bottom:12px solid #38e1ff}
/* téléphone + doigt */
#intro .tel{width:78px;height:136px;border:3px solid #f3efe6;border-radius:14px;position:relative}
#intro .doigt{position:absolute;left:50%;top:84px;width:22px;height:22px;margin-left:-11px;border-radius:50%;background:rgba(255,46,99,.85);box-shadow:0 0 16px #ff2e63}
/* pellicule qui avance / recule */
#intro .film{width:min(360px,80vw);height:6px;background:#2a2638;position:relative;overflow:hidden}
#intro .film i{position:absolute;left:0;top:0;bottom:0;width:0;background:#ff2e63}
/* son */
#intro .gros{width:118px;height:118px;border-radius:50%;border:2px solid #2a2638;background:rgba(20,18,30,.9);color:#f3efe6;display:grid;place-items:center;cursor:pointer;
  transition:border-color .3s,color .3s,box-shadow .3s}
#intro .gros svg{width:54px;height:54px}
#intro .gros .w{display:none}#intro .gros.actif .w{display:inline}#intro .gros.actif .x{display:none}
#intro .gros.actif{border-color:#38e1ff;color:#38e1ff;box-shadow:0 0 30px rgba(56,225,255,.35)}
#intro .vole{position:fixed;z-index:41;transition:all .9s cubic-bezier(.6,.05,.25,1)}
#intro .passer{position:absolute;right:max(16px,env(safe-area-inset-right,0px));bottom:calc(18px + env(safe-area-inset-bottom,0px));font:500 11px "JetBrains Mono",monospace;letter-spacing:.12em;
  text-transform:uppercase;color:#a49fb3;background:none;border:1px solid #2a2638;padding:9px 12px;cursor:pointer;z-index:2;transition:opacity .4s}
#intro .passer:hover{color:#f3efe6;border-color:#ff2e63}
#intro.fin .passer{opacity:0}
@keyframes roueBas{0%{top:14px;opacity:0}15%{opacity:1}70%{top:48px;opacity:1}100%{top:52px;opacity:0}}
@keyframes roueHaut{0%{top:52px;opacity:0}15%{opacity:1}70%{top:18px;opacity:1}100%{top:14px;opacity:0}}
@keyframes flBas{0%,100%{opacity:0;transform:translate(-50%,-6px)}40%,70%{opacity:1;transform:translate(-50%,4px)}}
@keyframes flHaut{0%,100%{opacity:0;transform:translate(-50%,6px)}40%,70%{opacity:1;transform:translate(-50%,-4px)}}
@keyframes doigtHaut{0%{top:96px;opacity:0}15%{opacity:1}80%{top:22px;opacity:1}100%{top:18px;opacity:0}}
@keyframes doigtBas{0%{top:22px;opacity:0}15%{opacity:1}80%{top:96px;opacity:1}100%{top:100px;opacity:0}}
@media (prefers-reduced-motion:reduce){#intro *{animation-duration:0s!important;transition:none!important}}`;
  document.head.appendChild(css);

  const ICON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M11 5 6 9H2v6h4l5 4z"/><path class="w" d="M15.5 8.5a5 5 0 0 1 0 7M19 5a10 10 0 0 1 0 14"/><path class="x" d="m22 9-6 6M16 9l6 6"/></svg>';
  const attendre = ms => new Promise(r => setTimeout(r, ms));

  window.lancerIntro = function (fini) {
    const son = document.getElementById("son");
    const el = document.createElement("div"); el.id = "intro"; el.setAttribute("role", "dialog"); el.setAttribute("aria-label", "Comment utiliser le CV immersif");
    const geste = tactile
      ? '<div class="tel"><div class="doigt"></div></div>'
      : '<div class="souris"><div class="roue"></div><div class="fl bas"></div><div class="fl haut"></div></div>';
    el.innerHTML = `
      <div class="sc s1">${geste}<div class="film"><i></i></div><div class="cap"></div></div>
      <div class="sc s2"><button type="button" class="gros" aria-label="Activer ou couper le son">${ICON}</button><div class="cap"></div><div class="sous">Vous pourrez changer à tout moment, en haut à gauche</div></div>
      <button type="button" class="passer">Passer →</button>`;
    document.body.appendChild(el);
    const html = document.documentElement, ovAvant = html.style.overflow; html.style.overflow = "hidden";
    if (son) son.style.visibility = "hidden";
    const s1 = el.querySelector(".s1"), s2 = el.querySelector(".s2"), cap = s1.querySelector(".cap"), film = s1.querySelector(".film i");
    const gros = el.querySelector(".gros"), cap2 = s2.querySelector(".cap");
    const majGros = () => { const a = son && son.getAttribute("aria-pressed") === "true"; gros.classList.toggle("actif", a); cap2.innerHTML = a ? "Son <b>activé</b> · touchez l'icône pour le couper" : "Son <b>coupé</b> · touchez l'icône pour l'activer"; };
    gros.addEventListener("click", () => { if (son) son.click(); majGros(); });
    let fin = false, annule = false;
    const roue = el.querySelector(".roue, .doigt"), flB = el.querySelector(".fl.bas"), flH = el.querySelector(".fl.haut");
    const filmVers = (w, ms) => { film.style.transition = "width " + ms + "ms ease-in-out"; film.style.width = w + "%"; };
    async function terminer() {
      if (fin) return; fin = true;
      s1.classList.remove("on");
      // le bouton son quitte le centre et va se ranger en haut à gauche
      if (son) {
        if (!s2.classList.contains("on")) { s2.classList.add("on"); majGros(); await attendre(250); }
        const a = gros.getBoundingClientRect(); son.style.visibility = "hidden";
        const b = son.getBoundingClientRect();
        const v = gros.cloneNode(true); v.classList.add("vole"); Object.assign(v.style, {left:a.left + "px", top:a.top + "px", width:a.width + "px", height:a.height + "px", margin:0});
        el.appendChild(v); gros.style.visibility = "hidden";
        s2.querySelectorAll(".cap,.sous").forEach(x => x.style.opacity = 0);
        el.classList.add("fin");
        requestAnimationFrame(() => requestAnimationFrame(() => Object.assign(v.style, {left:b.left + "px", top:b.top + "px", width:b.width + "px", height:b.height + "px", borderRadius:"0"})));
        await attendre(950);
        son.style.visibility = ""; v.remove();
      } else { el.classList.add("fin"); await attendre(900); }
      el.remove(); html.style.overflow = ovAvant;
      removeEventListener("keydown", clavier);
      if (fini) fini();
    }
    const clavier = e => { if (e.key === "Escape" || e.key === "Enter") terminer(); };
    addEventListener("keydown", clavier);
    el.querySelector(".passer").addEventListener("click", terminer);

    (async () => {
      await attendre(350); if (fin) return;
      s1.classList.add("on");
      // avancer
      cap.innerHTML = tactile ? "Glissez vers le haut pour <b>avancer</b>" : "Faites défiler vers le bas pour <b>avancer</b>";
      roue.style.animation = (tactile ? "doigtHaut" : "roueBas") + " .9s ease-in-out 3";
      if (flB) flB.style.animation = "flBas .9s ease-in-out 3";
      filmVers(70, 2700);
      await attendre(2800); if (fin) return;
      // reculer
      roue.style.animation = "none"; if (flB) flB.style.animation = "none"; void roue.offsetWidth;
      cap.innerHTML = tactile ? "Glissez vers le bas pour <b>revenir en arrière</b>" : "Remontez pour <b>revenir en arrière</b>";
      roue.style.animation = (tactile ? "doigtBas" : "roueHaut") + " .9s ease-in-out 2";
      if (flH) flH.style.animation = "flHaut .9s ease-in-out 2";
      filmVers(30, 1800);
      await attendre(2000); if (fin) return;
      // le son
      s1.classList.remove("on"); await attendre(300); if (fin) return;
      majGros(); s2.classList.add("on");
      await attendre(900); if (fin) return;
      // petite démonstration : l'icône bascule coupé → activé → coupé, sans toucher au vrai réglage
      const vrai = gros.classList.contains("actif");
      gros.classList.toggle("actif", !vrai); await attendre(650); if (fin) return;
      gros.classList.toggle("actif", vrai); await attendre(2600); if (fin) return;
      terminer();
    })();
  };
})();
