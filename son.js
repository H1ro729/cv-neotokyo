// Ambiance sonore Neo-Tokyo, générée dans le navigateur (aucun fichier audio).
// En continu : la pluie, et de temps en temps un néon qui grésille.
// Calés sur la vidéo (déclenchés quand on passe le moment en scrollant) : les voitures au début,
// l'activation et la désactivation de la carte holographique, le drone, le ticket qu'on arrache.
// Coupée par défaut ; le choix du visiteur est retenu.
(() => {
  const KEY = "neotokyo-son";
  let ctx = null, master = null, on = false;
  const btn = document.createElement("button");
  btn.type = "button"; btn.id = "son";
  btn.setAttribute("aria-pressed", "false");
  btn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M11 5 6 9H2v6h4l5 4z"/><path class="w" d="M15.5 8.5a5 5 0 0 1 0 7M19 5a10 10 0 0 1 0 14"/><path class="x" d="m22 9-6 6M16 9l6 6"/></svg><span>Son</span>';
  const st = document.createElement("style");
  st.textContent = `#son{position:fixed;z-index:30;left:max(16px,env(safe-area-inset-left,0px));top:calc(14px + env(safe-area-inset-top,0px));display:inline-flex;align-items:center;gap:8px;
    font-family:"JetBrains Mono",ui-monospace,Menlo,monospace;font-size:11px;letter-spacing:.12em;text-transform:uppercase;color:#f3efe6;background:rgba(11,10,18,.7);
    border:1px solid #2a2638;padding:8px 11px;cursor:pointer;backdrop-filter:blur(6px)}
  #son:hover{border-color:#ff2e63}#son svg{width:16px;height:16px}#son .w{display:none}#son[aria-pressed="true"] .w{display:inline}#son[aria-pressed="true"] .x{display:none}
  #son[aria-pressed="true"]{border-color:#38e1ff;color:#38e1ff}@media (max-width:480px){#son span{display:none}#son{padding:8px 9px}}`;
  document.head.appendChild(st);
  const label = () => { btn.setAttribute("aria-pressed", String(on)); btn.title = on ? "Couper le son" : "Activer l'ambiance sonore"; btn.querySelector("span").textContent = on ? "Son" : "Son coupé"; };

  let blanc = null;
  function bruit(sec) {
    const n = Math.floor(ctx.sampleRate * sec), b = ctx.createBuffer(2, n, ctx.sampleRate);
    for (let c = 0; c < 2; c++) { const d = b.getChannelData(c); for (let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1; }
    return b;
  }
  const filtre = (type, f, q) => { const x = ctx.createBiquadFilter(); x.type = type; x.frequency.value = f; if (q) x.Q.value = q; return x; };
  const panneur = v => { if (!ctx.createStereoPanner) { const g = ctx.createGain(); g.connect(master); return {in:g, pan:null}; } const p = ctx.createStereoPanner(); p.pan.value = v; p.connect(master); return {in:p, pan:p.pan}; };
  function boucle(dest, filtres, gain) {
    const s = ctx.createBufferSource(); s.buffer = blanc; s.loop = true;
    let n = s; for (const f of filtres) { n.connect(f); n = f; }
    const g = ctx.createGain(); g.gain.value = gain; n.connect(g); g.connect(dest); s.start(0, Math.random() * 3); return g;
  }

  /* ---------- la pluie : nappe douce et régulière + gouttes, qui ne s'arrête jamais ---------- */
  function pluie() {
    const nappe = ctx.createGain(); nappe.gain.value = 1; nappe.connect(master);
    boucle(nappe, [filtre("highpass", 250), filtre("lowpass", 2600), filtre("peaking", 900, 0.7)], 0.16);   // le rideau de pluie
    boucle(nappe, [filtre("highpass", 3500), filtre("lowpass", 9000)], 0.025);                              // le grésillement fin
    boucle(nappe, [filtre("lowpass", 160)], 0.05);                                                           // le corps (eau qui ruisselle)
    const lfo = ctx.createOscillator(), lg = ctx.createGain(); lfo.frequency.value = 0.05; lg.gain.value = 0.12; lfo.connect(lg); lg.connect(nappe.gain); lfo.start();
    const goutte = () => {
      if (on) {
        const t = ctx.currentTime, s = ctx.createBufferSource(); s.buffer = blanc;
        const f = filtre("bandpass", 900 + Math.random() * 3200, 3 + Math.random() * 4), g = ctx.createGain(), p = panneur(Math.random() * 1.8 - 0.9);
        const a = 0.015 + Math.random() * Math.random() * 0.06;
        g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(a, t + 0.002); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.03 + Math.random() * 0.06);
        s.connect(f); f.connect(g); g.connect(p.in); s.start(t, Math.random() * 3, 0.12);
      }
      setTimeout(goutte, 10 + Math.random() * 45);
    };
    goutte();
  }

  /* ---------- néons qui grésillent de temps en temps ---------- */
  function neons() {
    const gresille = () => {
      if (on) {
        const t0 = ctx.currentTime, p = panneur(Math.random() * 1.6 - 0.8), g = ctx.createGain(); g.gain.value = 0; g.connect(p.in);
        const o = ctx.createOscillator(); o.type = "sawtooth"; o.frequency.value = 100; const bp = filtre("bandpass", 1500, 1.5); o.connect(bp); bp.connect(g);
        let t = t0; const n = 2 + Math.floor(Math.random() * 5);
        for (let i = 0; i < n; i++) { const d = 0.03 + Math.random() * 0.09; g.gain.setValueAtTime(0.012 + Math.random() * 0.02, t); g.gain.setValueAtTime(0, t + d); t += d + 0.02 + Math.random() * 0.08; }
        for (let i = 0; i < n * 2; i++) {
          const tc = t0 + Math.random() * (t - t0), s = ctx.createBufferSource(); s.buffer = blanc; const f = filtre("highpass", 2500), gc = ctx.createGain();
          gc.gain.setValueAtTime(0.04, tc); gc.gain.exponentialRampToValueAtTime(0.0001, tc + 0.008); s.connect(f); f.connect(gc); gc.connect(p.in); s.start(tc, Math.random() * 3, 0.02);
        }
        o.start(t0); o.stop(t + 0.05);
      }
      setTimeout(gresille, 7000 + Math.random() * 12000);
    };
    setTimeout(gresille, 4000);
  }

  /* ---------- sons ponctuels ---------- */
  function bip(f0, f1, t, d, a, type, pv) {
    const o = ctx.createOscillator(), g = ctx.createGain(); o.type = type || "sine";
    o.frequency.setValueAtTime(f0, t); o.frequency.exponentialRampToValueAtTime(f1, t + d);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(a, t + Math.min(0.02, d / 4)); g.gain.exponentialRampToValueAtTime(0.0001, t + d);
    o.connect(g); g.connect(panneur(pv || 0).in); o.start(t); o.stop(t + d + 0.05);
  }
  function souffle(t, d, fa, fb, a, q, pv) {
    const s = ctx.createBufferSource(); s.buffer = blanc; const f = filtre("bandpass", fa, q || 1.2), g = ctx.createGain();
    f.frequency.setValueAtTime(fa, t); f.frequency.exponentialRampToValueAtTime(fb, t + d);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(a, t + d * 0.35); g.gain.exponentialRampToValueAtTime(0.0001, t + d);
    s.connect(f); f.connect(g); g.connect(panneur(pv || 0).in); s.start(t, Math.random() * 2, d + 0.1);
  }
  // voiture qui passe sur la route mouillée : chuintement des pneus + moteur, effet Doppler
  function voiture(dir, fort, d) {
    const t = ctx.currentTime, p = panneur(-dir), g = ctx.createGain(); g.connect(p.in);
    if (p.pan) { p.pan.setValueAtTime(-0.95 * dir, t); p.pan.linearRampToValueAtTime(0.95 * dir, t + d); }
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.5 * fort, t + d * 0.45); g.gain.exponentialRampToValueAtTime(0.0001, t + d);
    const s = ctx.createBufferSource(); s.buffer = blanc; s.loop = true; const f = filtre("bandpass", 700, 0.7), sg = ctx.createGain(); sg.gain.value = 0.55;
    f.frequency.setValueAtTime(500, t); f.frequency.exponentialRampToValueAtTime(1600, t + d * 0.45); f.frequency.exponentialRampToValueAtTime(450, t + d);
    s.connect(f); f.connect(sg); sg.connect(g); s.start(t); s.stop(t + d + 0.1);
    const o = ctx.createOscillator(); o.type = "sawtooth"; const lp = filtre("lowpass", 500), og = ctx.createGain(); og.gain.value = 0.18;
    o.frequency.setValueAtTime(95, t); o.frequency.setValueAtTime(95, t + d * 0.42); o.frequency.exponentialRampToValueAtTime(70, t + d * 0.6);
    o.connect(lp); lp.connect(og); og.connect(g); o.start(t); o.stop(t + d + 0.1);
  }
  // la voiture volante : turbine qui siffle en plus
  function voitureVolante() {
    const d = 3.2, t = ctx.currentTime; voiture(-1, 1.1, d);
    const p = panneur(0.9), g = ctx.createGain(); g.connect(p.in);
    if (p.pan) { p.pan.setValueAtTime(0.9, t); p.pan.linearRampToValueAtTime(-0.9, t + d); }
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.06, t + d * 0.45); g.gain.exponentialRampToValueAtTime(0.0001, t + d);
    [[880, 1], [1320, 0.5], [180, 1.5]].forEach(([f, a]) => { const o = ctx.createOscillator(); o.type = f < 500 ? "triangle" : "sine"; const og = ctx.createGain(); og.gain.value = a;
      o.frequency.setValueAtTime(f * 1.06, t); o.frequency.setValueAtTime(f * 1.06, t + d * 0.4); o.frequency.exponentialRampToValueAtTime(f * 0.92, t + d * 0.62); o.connect(og); og.connect(g); o.start(t); o.stop(t + d + 0.1); });
  }
  // le drone qui passe au-dessus : rotors qui sifflent
  function drone() {
    const d = 3.6, t = ctx.currentTime, p = panneur(0.9), g = ctx.createGain(); g.connect(p.in);
    if (p.pan) { p.pan.setValueAtTime(0.9, t); p.pan.linearRampToValueAtTime(-0.9, t + d); }
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.14, t + d * 0.45); g.gain.exponentialRampToValueAtTime(0.0001, t + d);
    const am = ctx.createGain(); am.gain.value = 0.5; const bp = filtre("bandpass", 1400, 1.4); am.connect(bp); bp.connect(g);
    const rot = ctx.createOscillator(), rg = ctx.createGain(); rot.frequency.value = 88; rg.gain.value = 0.4; rot.connect(rg); rg.connect(am.gain); rot.start(t); rot.stop(t + d + 0.1);
    [[232, 0.5], [247, 0.4], [466, 0.2]].forEach(([f, a]) => { const o = ctx.createOscillator(); o.type = "sawtooth"; const og = ctx.createGain(); og.gain.value = a;
      o.frequency.setValueAtTime(f * 1.07, t); o.frequency.setValueAtTime(f * 1.07, t + d * 0.38); o.frequency.exponentialRampToValueAtTime(f * 0.93, t + d * 0.62); o.connect(og); og.connect(am); o.start(t); o.stop(t + d + 0.1); });
    souffle(t, d, 3000, 3000, 0.04, 0.6);
  }
  // activation de la carte d'identité holographique
  function holoOn() {
    const t = ctx.currentTime;
    bip(260, 1600, t, 0.55, 0.12, "sine"); bip(130, 800, t, 0.55, 0.05, "triangle");
    [1318, 1760, 2637, 3520].forEach((f, i) => bip(f, f * 1.002, t + 0.42 + i * 0.075, 0.22, 0.05, "sine", (i - 1.5) * 0.25));
    souffle(t + 0.35, 0.7, 3000, 9000, 0.05, 2.5);
    bip(880, 880, t + 0.8, 0.5, 0.03, "sine");
  }
  // désactivation : la carte se replie
  function holoOff() {
    const t = ctx.currentTime;
    [3520, 2637, 1760].forEach((f, i) => bip(f, f * 0.998, t + i * 0.06, 0.15, 0.035, "sine", (1 - i) * 0.25));
    bip(1500, 160, t + 0.12, 0.45, 0.09, "sine"); souffle(t + 0.1, 0.35, 7000, 1500, 0.035, 2);
  }
  // le ticket qu'on arrache : craquement du papier
  function dechire() {
    const t0 = ctx.currentTime, d = 0.42;
    for (let k = 0; k < 46; k++) {
      const t = t0 + d * Math.pow(k / 46, 0.8) + Math.random() * 0.01, s = ctx.createBufferSource(); s.buffer = blanc;
      const f = filtre("bandpass", 1500 + Math.random() * 4500, 3), g = ctx.createGain(), a = 0.06 + 0.12 * Math.sin(Math.PI * k / 46);
      g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(a, t + 0.002); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.012 + Math.random() * 0.02);
      s.connect(f); f.connect(g); g.connect(panneur(0.2).in); s.start(t, Math.random() * 3, 0.05);
    }
    souffle(t0, d + 0.1, 900, 3500, 0.06, 0.8, 0.2);
  }

  /* moments de la vidéo (images Blender, 1..1203) : déclenchés en avançant */
  const EVTS = [
    [12, () => voiture(-1, 0.9, 2.4)],    // voiture de droite à gauche
    [82, () => voiture(1, 0.9, 2.0)],     // voiture rapide de gauche à droite
    [130, () => voiture(-1, 1.0, 2.6)],   // berline sombre de droite à gauche
    [184, () => voiture(1, 0.8, 2.4)],    // voiture claire, au premier plan
    [204, voitureVolante],                 // la voiture volante
    [278, drone],                          // le drone passe au-dessus
    [366, holoOn], [444, holoOff],         // carte d'identité holographique
    [1160, dechire]                        // le ticket
  ];
  function suivi() {
    let lastF = null;
    const tick = () => {
      requestAnimationFrame(tick);
      const F = typeof window.NTF === "number" ? window.NTF : null;
      if (F !== null && lastF !== null && on && F > lastF && F - lastF < 60)
        for (const [T, fn] of EVTS) if (lastF < T && F >= T) fn();
      lastF = F;
    };
    requestAnimationFrame(tick);
  }

  function construire() {
    ctx = new (window.AudioContext || window.webkitAudioContext)();
    master = ctx.createGain(); master.gain.value = 0;
    const comp = ctx.createDynamicsCompressor(); master.connect(comp); comp.connect(ctx.destination);
    blanc = bruit(4);
    pluie(); neons(); suivi();
  }
  function regler(v) {
    on = v; label();
    try { localStorage.setItem(KEY, on ? "1" : "0"); } catch (e) {}
    if (on && !ctx) construire();
    if (!ctx) return;
    if (on && ctx.state === "suspended") ctx.resume();
    const t = ctx.currentTime; master.gain.cancelScheduledValues(t); master.gain.setValueAtTime(master.gain.value, t);
    master.gain.linearRampToValueAtTime(on ? 1 : 0, t + (on ? 1.8 : 0.5));
  }
  btn.addEventListener("click", () => regler(!on));
  document.addEventListener("visibilitychange", () => { if (!ctx) return; if (document.hidden) ctx.suspend(); else if (on) ctx.resume(); });

  let voulu = false; try { voulu = localStorage.getItem(KEY) === "1"; } catch (e) {}
  if (voulu) {
    const go = e => { if (e && e.target && e.target.closest && e.target.closest("#son")) return; ["pointerdown", "keydown", "touchend"].forEach(t => removeEventListener(t, go, true)); if (!on) regler(true); };
    ["pointerdown", "keydown", "touchend"].forEach(t => addEventListener(t, go, true));
  }
  label();
  const poser = () => document.body.appendChild(btn);
  if (document.body) poser(); else addEventListener("DOMContentLoaded", poser);
})();
