// Ambiance sonore Neo-Tokyo, générée dans le navigateur (aucun fichier audio) :
// pluie proche + pluie lointaine, gouttes sur les auvents, rumeur de la ville, bourdonnement des néons, voitures au loin.
// Coupée par défaut ; le choix du visiteur est retenu.
(() => {
  const KEY = "neotokyo-son";
  let ctx = null, master = null, on = false, timers = [];
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

  function bruit(sec, type) {
    const n = Math.floor(ctx.sampleRate * sec), b = ctx.createBuffer(2, n, ctx.sampleRate);
    for (let c = 0; c < 2; c++) {
      const d = b.getChannelData(c); let last = 0;
      for (let i = 0; i < n; i++) {
        const w = Math.random() * 2 - 1;
        if (type === "brun") { last = (last + 0.02 * w) / 1.02; d[i] = last * 3.5; } else d[i] = w;
      }
    }
    return b;
  }
  function boucle(buf, dest, filtres, gain) {
    const s = ctx.createBufferSource(); s.buffer = buf; s.loop = true;
    let n = s; for (const f of filtres) { n.connect(f); n = f; }
    const g = ctx.createGain(); g.gain.value = gain; n.connect(g); g.connect(dest); s.start(); return g;
  }
  const filtre = (type, f, q) => { const x = ctx.createBiquadFilter(); x.type = type; x.frequency.value = f; if (q) x.Q.value = q; return x; };

  function construire() {
    ctx = new (window.AudioContext || window.webkitAudioContext)();
    master = ctx.createGain(); master.gain.value = 0;
    const comp = ctx.createDynamicsCompressor(); master.connect(comp); comp.connect(ctx.destination);
    const blanc = bruit(4, "blanc"), brun = bruit(6, "brun");
    // pluie proche : souffle aigu, légèrement modulé
    const pluie = boucle(blanc, master, [filtre("highpass", 900), filtre("lowpass", 7000)], 0.07);
    const lfo = ctx.createOscillator(), lg = ctx.createGain(); lfo.frequency.value = 0.07; lg.gain.value = 0.02; lfo.connect(lg); lg.connect(pluie.gain); lfo.start();
    // pluie lointaine / rumeur de la ville
    boucle(blanc, master, [filtre("lowpass", 700)], 0.05);
    boucle(brun, master, [filtre("lowpass", 180)], 0.22);
    // bourdonnement électrique des néons (100 Hz + harmoniques), très discret, qui grésille
    const neon = ctx.createGain(); neon.gain.value = 0.0; neon.connect(master);
    [100, 200, 300, 500].forEach((f, i) => { const o = ctx.createOscillator(); o.type = "sawtooth"; o.frequency.value = f; const g = ctx.createGain(); g.gain.value = 0.004 / (i + 1); o.connect(g); g.connect(neon); o.start(); });
    const bz = filtre("bandpass", 1200, 1.2); neon.disconnect(); neon.connect(bz); bz.connect(master); neon.gain.value = 1;
    timers.push(setInterval(() => { if (!on) return; const t = ctx.currentTime; neon.gain.setValueAtTime(1, t); if (Math.random() < 0.25) { neon.gain.setValueAtTime(0.15, t + 0.02); neon.gain.setValueAtTime(1, t + 0.06 + Math.random() * 0.08); } }, 900));
    // gouttes sur les auvents et les poubelles : petits « tic » répartis en stéréo
    const goutte = () => {
      if (on) {
        const t = ctx.currentTime, s = ctx.createBufferSource(); s.buffer = blanc;
        const f = filtre("bandpass", 1800 + Math.random() * 3500, 6), g = ctx.createGain(), p = ctx.createStereoPanner ? ctx.createStereoPanner() : null;
        g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(0.05 + Math.random() * 0.08, t + 0.003); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.04 + Math.random() * 0.05);
        s.connect(f); f.connect(g); if (p) { p.pan.value = Math.random() * 1.6 - 0.8; g.connect(p); p.connect(master); } else g.connect(master);
        s.start(t, Math.random() * 3, 0.12);
      }
      timers.push(setTimeout(goutte, 25 + Math.random() * 140));
    };
    goutte();
    // voiture qui passe au loin sur le bitume mouillé, de temps en temps
    const voiture = () => {
      if (on) {
        const t = ctx.currentTime, d = 4 + Math.random() * 3, s = ctx.createBufferSource(); s.buffer = blanc; s.loop = true;
        const f = filtre("bandpass", 500, 0.8), g = ctx.createGain(), p = ctx.createStereoPanner ? ctx.createStereoPanner() : null, dir = Math.random() < 0.5 ? -1 : 1;
        f.frequency.setValueAtTime(350, t); f.frequency.linearRampToValueAtTime(900, t + d / 2); f.frequency.linearRampToValueAtTime(300, t + d);
        g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.09, t + d / 2); g.gain.exponentialRampToValueAtTime(0.0001, t + d);
        s.connect(f); f.connect(g);
        if (p) { p.pan.setValueAtTime(-0.9 * dir, t); p.pan.linearRampToValueAtTime(0.9 * dir, t + d); g.connect(p); p.connect(master); } else g.connect(master);
        s.start(t); s.stop(t + d + 0.1);
      }
      timers.push(setTimeout(voiture, 9000 + Math.random() * 16000));
    };
    timers.push(setTimeout(voiture, 5000));
    scene(blanc, brun);
  }

  /* ---------- sons de la scène, calés sur l'image Blender affichée (window.NTF, 1..1203) ---------- */
  function scene(blanc, brun) {
    const pan = (node, v) => { if (!ctx.createStereoPanner) return node; const p = ctx.createStereoPanner(); p.pan.value = v; node.connect(p); return p; };
    const vers = (n, g) => { n.connect(g); return g; };
    const lisse = (param, v, tc) => param.setTargetAtTime(v, ctx.currentTime, tc || 0.08);
    const cloche = (F, c, w) => Math.exp(-(((F - c) / w) ** 2));
    const lerpK = (F, K) => { if (F <= K[0][0]) return K[0][1]; for (let i = 1; i < K.length; i++) if (F <= K[i][0]) { const [a, va] = K[i - 1], [b, vb] = K[i]; return va + (vb - va) * (F - a) / (b - a); } return K[K.length - 1][1]; };

    // voiture volante : turbine + souffle, de droite à gauche (image 120 → 320, au plus près vers 200)
    const vG = ctx.createGain(); vG.gain.value = 0; const vP = ctx.createStereoPanner ? ctx.createStereoPanner() : null;
    const vS = ctx.createBufferSource(); vS.buffer = blanc; vS.loop = true; const vF = filtre("bandpass", 600, 0.9); vS.connect(vF); vF.connect(vG); vS.start();
    const vO = [ctx.createOscillator(), ctx.createOscillator()]; vO[0].type = "sawtooth"; vO[1].type = "sine";
    const vOf = filtre("lowpass", 900); vO.forEach((o, i) => { o.frequency.value = i ? 220 : 74; const g = ctx.createGain(); g.gain.value = i ? 0.25 : 0.35; o.connect(g); g.connect(vOf); o.start(); }); vOf.connect(vG);
    if (vP) { vG.connect(vP); vP.connect(master); } else vG.connect(master);
    // drone de reconnaissance : rotors qui sifflent, passe derrière le perso (232 → 352)
    const dG = ctx.createGain(); dG.gain.value = 0; const dP = ctx.createStereoPanner ? ctx.createStereoPanner() : null;
    const dBP = filtre("bandpass", 1400, 1.5), dAM = ctx.createGain(); dAM.gain.value = 0.5;
    const dO = [ctx.createOscillator(), ctx.createOscillator(), ctx.createOscillator()];
    dO.forEach((o, i) => { o.type = "sawtooth"; o.frequency.value = [232, 247, 466][i]; const g = ctx.createGain(); g.gain.value = [0.5, 0.4, 0.2][i]; o.connect(g); g.connect(dAM); o.start(); });
    const rot = ctx.createOscillator(), rotG = ctx.createGain(); rot.frequency.value = 88; rotG.gain.value = 0.35; rot.connect(rotG); rotG.connect(dAM.gain); rot.start();
    const dN = ctx.createBufferSource(); dN.buffer = blanc; dN.loop = true; const dNf = filtre("highpass", 3000), dNg = ctx.createGain(); dNg.gain.value = 0.25; dN.connect(dNf); dNf.connect(dNg); dNg.connect(dG); dN.start();
    dAM.connect(dBP); dBP.connect(dG); if (dP) { dG.connect(dP); dP.connect(master); } else dG.connect(master);
    // hologramme : bourdonnement cristallin pendant que la carte flotte (≈ 380 → 445)
    const hG = ctx.createGain(); hG.gain.value = 0; hG.connect(master);
    [[220, 0.5], [330, 0.35], [660, 0.12], [1320, 0.05]].forEach(([f, a]) => { const o = ctx.createOscillator(); o.frequency.value = f; const g = ctx.createGain(); g.gain.value = a; o.connect(g); g.connect(hG); o.start(); });
    const trem = ctx.createOscillator(), tremG = ctx.createGain(); trem.frequency.value = 6; tremG.gain.value = 0.25; trem.connect(tremG); tremG.connect(hG.gain); trem.start();
    const hN = ctx.createBufferSource(); hN.buffer = blanc; hN.loop = true; const hNf = filtre("bandpass", 6000, 3), hNg = ctx.createGain(); hNg.gain.value = 0.25; hN.connect(hNf); hNf.connect(hNg); hNg.connect(hG); hN.start();

    // ---- sons ponctuels ----
    function bip(f0, f1, t, d, a, type, p) {
      const o = ctx.createOscillator(), g = ctx.createGain(); o.type = type || "sine";
      o.frequency.setValueAtTime(f0, t); o.frequency.exponentialRampToValueAtTime(f1, t + d);
      g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(a, t + Math.min(0.02, d / 4)); g.gain.exponentialRampToValueAtTime(0.0001, t + d);
      o.connect(g); pan(g, p || 0).connect(master); o.start(t); o.stop(t + d + 0.05);
    }
    function souffle(t, d, fa, fb, a, q, p) {
      const s = ctx.createBufferSource(); s.buffer = blanc; const f = filtre("bandpass", fa, q || 1.2), g = ctx.createGain();
      f.frequency.setValueAtTime(fa, t); f.frequency.exponentialRampToValueAtTime(fb, t + d);
      g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(a, t + d * 0.35); g.gain.exponentialRampToValueAtTime(0.0001, t + d);
      s.connect(f); f.connect(g); pan(g, p || 0).connect(master); s.start(t, Math.random() * 2, d + 0.1);
    }
    // feu piéton japonais : « piyo-piyo » (deux gazouillis)
    const piyo = () => { const t = ctx.currentTime; bip(2900, 2100, t, 0.09, 0.05, "sine", -0.55); bip(2900, 2100, t + 0.17, 0.09, 0.045, "sine", -0.55); };
    // pas sur le bitume mouillé
    let pied = 1;
    const pas = () => { const t = ctx.currentTime; pied = -pied; bip(95, 50, t, 0.12, 0.25, "sine", 0.12 * pied); souffle(t + 0.01, 0.16, 1400, 2600, 0.09, 1.4, 0.15 * pied); };
    // activation de la carte d'identité holographique
    const holoOn = () => {
      const t = ctx.currentTime;
      bip(260, 1600, t, 0.55, 0.12, "sine"); bip(130, 800, t, 0.55, 0.05, "triangle");
      [1318, 1760, 2637, 3520].forEach((f, i) => bip(f, f * 1.002, t + 0.42 + i * 0.075, 0.22, 0.05, "sine", (i - 1.5) * 0.25));
      souffle(t + 0.35, 0.7, 3000, 9000, 0.05, 2.5);
      bip(880, 880, t + 0.8, 0.5, 0.03, "sine");
    };
    const holoOff = () => { const t = ctx.currentTime; bip(1400, 180, t, 0.4, 0.07, "sine"); souffle(t, 0.3, 6000, 1500, 0.03, 2); };
    // le chat noir
    const miaou = () => {
      const t = ctx.currentTime, d = 0.75, o = ctx.createOscillator(), g = ctx.createGain(); o.type = "sawtooth";
      o.frequency.setValueAtTime(520, t); o.frequency.linearRampToValueAtTime(820, t + 0.22); o.frequency.linearRampToValueAtTime(760, t + 0.45); o.frequency.exponentialRampToValueAtTime(430, t + d);
      const f1 = filtre("bandpass", 900, 4), f2 = filtre("bandpass", 2400, 6), m = ctx.createGain();
      f1.frequency.setValueAtTime(700, t); f1.frequency.linearRampToValueAtTime(1300, t + 0.3); f1.frequency.linearRampToValueAtTime(800, t + d);
      g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.05, t + 0.08); g.gain.setValueAtTime(0.05, t + 0.45); g.gain.exponentialRampToValueAtTime(0.0001, t + d);
      o.connect(f1); o.connect(f2); f1.connect(m); f2.connect(m); m.connect(g); pan(g, 0.35).connect(master); o.start(t); o.stop(t + d + 0.05);
    };
    // le ticket qu'on arrache : petits craquements de papier
    const dechire = () => {
      const t0 = ctx.currentTime, d = 0.42;
      for (let k = 0; k < 46; k++) {
        const t = t0 + d * Math.pow(k / 46, 0.8) + Math.random() * 0.01, s = ctx.createBufferSource(); s.buffer = blanc;
        const f = filtre("bandpass", 1500 + Math.random() * 4500, 3), g = ctx.createGain(), a = 0.05 + 0.1 * Math.sin(Math.PI * k / 46);
        g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(a, t + 0.002); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.012 + Math.random() * 0.02);
        s.connect(f); f.connect(g); pan(g, 0.2).connect(master); s.start(t, Math.random() * 3, 0.05);
      }
      souffle(t0, d + 0.1, 900, 3500, 0.05, 0.8, 0.2);
    };
    // une affiche s'ouvre : froissement doux
    const affiche = () => { const t = ctx.currentTime; souffle(t, 0.45, 500, 2400, 0.06, 0.7); bip(660, 660, t + 0.12, 0.35, 0.015, "sine"); };

    const MARCHE = [[242, 346], [466, 1100]], PAS = 16;
    const EVTS = [[368, holoOn], [446, holoOff], [318, miaou], [1162, dechire]];
    let lastF = null, lastPas = null, lastPiyo = 0, lastP = 0;
    const boucle = () => {
      requestAnimationFrame(boucle);
      if (!on) return;
      const F = typeof window.NTF === "number" ? window.NTF : null;
      const now = ctx.currentTime;
      if (F === null) { lisse(vG.gain, 0); lisse(dG.gain, 0); lisse(hG.gain, 0); lastF = null; return; }
      // continus
      lisse(vG.gain, 0.32 * cloche(F, 200, 70));
      const vx = lerpK(F, [[120, 0.95], [320, -0.95]]); if (vP) lisse(vP.pan, vx);
      lisse(vF.frequency, 380 + 900 * cloche(F, 200, 45)); vO[0].frequency.setTargetAtTime(74 * (1 + 0.08 * Math.tanh((200 - F) / 25)), now, 0.1);
      lisse(dG.gain, 0.16 * Math.max(cloche(F, 300, 40), 0.25 * cloche(F, 250, 20)) * (F > 228 && F < 360 ? 1 : 0));
      if (dP) lisse(dP.pan, Math.max(-1, Math.min(1, lerpK(F, [[232, 2.7], [258, 4.5], [272, 4.6], [288, 2.6], [312, -0.6], [352, -2.1]]) / 4)));
      dO.forEach((o, i) => o.frequency.setTargetAtTime([232, 247, 466][i] * (1 + 0.06 * Math.tanh((300 - F) / 18)), now, 0.08));
      lisse(hG.gain, F > 372 && F < 448 ? 0.035 * Math.min(1, (F - 372) / 10, (448 - F) / 8) : 0);
      // ponctuels (seulement en avançant pas à pas, pas lors d'un saut de chapitre)
      if (lastF !== null && Math.abs(F - lastF) < 60) {
        if (F > lastF) for (const [T, fn] of EVTS) if (lastF < T && F >= T) fn();
        const ip = Math.floor(F / PAS);
        if (lastPas !== null && ip !== lastPas && MARCHE.some(([a, b]) => F >= a && F <= b)) pas();
        lastPas = ip;
      } else lastPas = Math.floor(F / PAS);
      lastF = F;
      if (F >= 236 && F <= 350 && now - lastPiyo > 0.95) { piyo(); lastPiyo = now; }
      const P = window.NTP || 0; if (P > 0.5 && lastP <= 0.5) affiche(); lastP = P;
    };
    requestAnimationFrame(boucle);
  }

  function regler(v) {
    on = v; label();
    try { localStorage.setItem(KEY, on ? "1" : "0"); } catch (e) {}
    if (on && !ctx) construire();
    if (!ctx) return;
    if (on && ctx.state === "suspended") ctx.resume();
    const t = ctx.currentTime; master.gain.cancelScheduledValues(t); master.gain.setValueAtTime(master.gain.value, t);
    master.gain.linearRampToValueAtTime(on ? 0.9 : 0, t + (on ? 1.8 : 0.5));
  }
  btn.addEventListener("click", () => regler(!on));
  document.addEventListener("visibilitychange", () => { if (!ctx) return; if (document.hidden) ctx.suspend(); else if (on) ctx.resume(); });

  // si le visiteur avait activé le son, on le relance à sa première interaction (les navigateurs l'exigent)
  let voulu = false; try { voulu = localStorage.getItem(KEY) === "1"; } catch (e) {}
  if (voulu) {
    const go = e => { if (e && e.target && e.target.closest && e.target.closest("#son")) return; ["pointerdown", "keydown", "touchend"].forEach(t => removeEventListener(t, go, true)); if (!on) regler(true); };
    ["pointerdown", "keydown", "touchend"].forEach(t => addEventListener(t, go, true));
  }
  label();
  const poser = () => document.body.appendChild(btn);
  if (document.body) poser(); else addEventListener("DOMContentLoaded", poser);
})();
