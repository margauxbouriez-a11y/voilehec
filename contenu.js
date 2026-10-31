// Chargement du contenu du site (partagé entre le site public et l'espace privé)
(function () {
  const C = window.VOILE_CONFIG;
  const TYPES = ["reglages", "chiffre", "palmares", "entrainement", "competition", "photo", "partenaire", "offre"];

  // "media:12" → photo stockée dans n8n ; sinon chemin ou adresse web classique
  function img(src) {
    if (!src) return "";
    const m = String(src).match(/^media:(\d+)(?:@(\w+))?$/);
    return m ? C.apiBase + "/voile-media?id=" + m[1] + (m[2] ? "&v=" + m[2] : "") : src;
  }

  function depuisLignes(lignes) {
    const contenu = {};
    TYPES.forEach((t) => (contenu[t] = []));
    lignes.forEach((l) => {
      let data = {};
      try { data = JSON.parse(l.data || "{}"); } catch (e) { /* ligne ignorée */ }
      (contenu[l.kind] ||= []).push({ ...data, _id: l.id, _position: Number(l.position) || 0 });
    });
    Object.values(contenu).forEach((liste) => liste.sort((a, b) => a._position - b._position || a._id - b._id));
    return contenu;
  }

  function secours() {
    const contenu = {};
    TYPES.forEach((t) => {
      const v = C.contenu[t];
      contenu[t] = t === "reglages" ? [{ ...v }] : (v || []).map((x, i) => ({ ...x, _position: i + 1 }));
    });
    return contenu;
  }

  async function charger(options = {}) {
    try {
      const r = await fetch(C.apiBase + "/voile-contenu", { cache: "no-store" });
      if (!r.ok) throw new Error("http " + r.status);
      const json = await r.json();
      const lignes = (json && json.items) || [];
      if (!lignes.length && !options.vraiesDonnees) return { contenu: secours(), source: "secours" };
      return { contenu: depuisLignes(lignes), source: "serveur" };
    } catch (e) {
      if (options.vraiesDonnees) throw e;
      return { contenu: secours(), source: "secours" };
    }
  }

  // Réglages : valeurs par défaut complétées par celles enregistrées
  function reglages(contenu) {
    return { ...C.contenu.reglages, ...((contenu.reglages && contenu.reglages[0]) || {}) };
  }

  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  window.VOILE = { charger, img, reglages, esc, TYPES };
})();
