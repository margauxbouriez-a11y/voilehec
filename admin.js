(function () {
  const C = window.VOILE_CONFIG;
  const { esc, img } = window.VOILE;
  const API_EQUIPE = C.apiBase + "/voile-admin";
  const API_CONTENU = C.apiBase + "/voile-admin";
  const $ = (id) => document.getElementById(id);
  const euros = (n) => Number(n || 0).toLocaleString("fr-FR", { style: "currency", currency: "EUR" });
  const clean = (d) => (Array.isArray(d) ? d : [d]).filter((x) => x && x.id);

  let mdp = sessionStorage.getItem("voile_mdp") || "";

  // ---------- Appels serveur ----------
  async function appel(url, action, data = {}) {
    const r = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ password: mdp, action, ...data }) });
    if (r.status === 401) throw new Error("unauthorized");
    if (!r.ok) throw new Error("Le serveur a répondu " + r.status);
    const t = await r.text();
    return t ? JSON.parse(t) : [];
  }
  const api = (action, data) => appel(API_EQUIPE, action, data);
  const apiContenu = (action, data) => appel(API_CONTENU, action, data);

  function toast(texte, erreur = false) {
    const t = $("toast");
    t.textContent = texte;
    t.className = "toast visible" + (erreur ? " erreur" : "");
    clearTimeout(toast.minuteur);
    toast.minuteur = setTimeout(() => (t.className = "toast"), erreur ? 6000 : 2600);
  }
  const echec = (e) => toast(e.message === "unauthorized" ? "Session expirée : reconnectez-vous." : "L'enregistrement a échoué. Vérifiez votre connexion et réessayez.", true);

  function csv(nom, lignes, colonnes) {
    const entete = colonnes.map((c) => c.label).join(";");
    const corps = lignes.map((l) => colonnes.map((c) => '"' + String(l[c.key] ?? "").replace(/"/g, '""') + '"').join(";")).join("\n");
    const blob = new Blob(["﻿" + entete + "\n" + corps], { type: "text/csv;charset=utf-8" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = nom; a.click();
  }

  // =========================================================
  //  DESCRIPTION DU CONTENU ÉDITABLE
  // =========================================================
  const SCHEMAS = {
    reglages: {
      titre: "Textes et contact", unique: true,
      intro: "Les textes principaux du site et les coordonnées affichées aux sponsors.",
      champs: [
        { cle: "logo", label: "Logo du club", type: "image", max: 600, logo: true, aide: "PNG à fond transparent de préférence. Il remplace le logo provisoire partout sur le site." },
        { cle: "heroTitre", label: "Titre de la page d'accueil", type: "text" },
        { cle: "heroTexte", label: "Texte d'accueil", type: "textarea", lignes: 3 },
        { cle: "heroImage", label: "Photo d'accueil", type: "image", max: 2000, aide: "Une photo horizontale, le bateau de préférence à droite." },
        { cle: "presentationTitre", label: "Titre de la présentation du club", type: "text" },
        { cle: "presentation", label: "Présentation du club", type: "textarea", lignes: 6, aide: "Laissez une ligne vide entre deux paragraphes." },
        { cle: "partenariatTitre", label: "Titre de la rubrique partenariat", type: "text" },
        { cle: "partenariatTexte", label: "Texte de la rubrique partenariat", type: "textarea", lignes: 4 },
        { cle: "contactNom", label: "Qui répond aux sponsors", type: "text", aide: "Ex. : Margaux Bouriez, responsable partenariats" },
        { cle: "contactEmail", label: "Email de contact", type: "email" },
        { cle: "contactTel", label: "Téléphone", type: "text" },
        { cle: "dossierUrl", label: "Dossier de partenariat (PDF)", type: "fichier", aide: "Les sponsors pourront le télécharger depuis le site." },
        { cle: "instagram", label: "Lien Instagram", type: "url" },
        { cle: "linkedin", label: "Lien LinkedIn", type: "url" },
        { cle: "creditsPhotos", label: "Crédits photos (bas de page)", type: "textarea", lignes: 2, aide: "À garder tant que les photos d'illustration sont en ligne ; videz-le quand vous les aurez remplacées par les vôtres." }
      ]
    },
    chiffre: {
      titre: "Chiffres clés", nouveau: "Ajouter un chiffre",
      intro: "Le bandeau de chiffres sous la photo d'accueil. Quatre chiffres forts suffisent.",
      champs: [
        { cle: "valeur", label: "Chiffre", type: "text", requis: true, aide: "Ex. : 25, 2027, CCE" },
        { cle: "libelle", label: "Ce qu'il représente", type: "text", requis: true, aide: "Ex. : membres cette saison" }
      ],
      resume: (x) => `<b class="gros">${esc(x.valeur)}</b> ${esc(x.libelle)}`
    },
    palmares: {
      titre: "Palmarès", nouveau: "Ajouter un titre",
      intro: "Les résultats marquants du club, du plus récent au plus ancien.",
      champs: [
        { cle: "annee", label: "Année", type: "text", requis: true },
        { cle: "titre", label: "Titre ou résultat", type: "text", requis: true }
      ],
      resume: (x) => `<b class="gros">${esc(x.annee)}</b> ${esc(x.titre)}`
    },
    entrainement: {
      titre: "Sorties et entraînements", nouveau: "Ajouter un créneau",
      intro: "Les sorties en mer et entraînements réguliers.",
      champs: [
        { cle: "jour", label: "Jour", type: "text", requis: true },
        { cle: "horaire", label: "Horaire", type: "text", aide: "Ex. : 9h00 – 17h00" },
        { cle: "lieu", label: "Lieu", type: "text" }
      ],
      resume: (x) => `<b>${esc(x.jour)}</b> ${esc(x.horaire)} <small>${esc(x.lieu)}</small>`
    },
    competition: {
      titre: "Calendrier", nouveau: "Ajouter un rendez-vous", triDate: true,
      intro: "Les régates et grands rendez-vous de la saison, classés automatiquement par date. Ajoutez le résultat après chaque régate.",
      champs: [
        { cle: "nom", label: "Régate ou rendez-vous", type: "text", requis: true },
        { cle: "date", label: "Date de début", type: "date", requis: true },
        { cle: "dateFin", label: "Date de fin (si plusieurs jours)", type: "date" },
        { cle: "lieu", label: "Lieu", type: "text" },
        { cle: "resultat", label: "Résultat", type: "text", aide: "Ex. : 3e de sa classe, 12e au général" }
      ],
      resume: (x) => `<b>${esc(x.date ? new Date(x.date + "T12:00:00").toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" }) : "")}</b> ${esc(x.nom)} <small>${esc([x.lieu, x.resultat].filter(Boolean).join(" – "))}</small>`
    },
    photo: {
      titre: "Photos", nouveau: "Ajouter une photo", galerie: true,
      intro: "La galerie « En mer ». La première photo est mise en avant quand il y en a cinq ou plus.",
      champs: [
        { cle: "src", label: "Photo", type: "image", max: 1800, requis: true },
        { cle: "legende", label: "Légende", type: "text", aide: "Ex. : Départ de la CCE" },
        { cle: "tournoi", label: "Événement et date", type: "text", aide: "Ex. : CCE, juin 2027" }
      ],
      vignette: "src",
      resume: (x) => `${esc(x.legende || "Sans légende")} <small>${esc(x.tournoi)}</small>`
    },
    partenaire: {
      titre: "Sponsors", nouveau: "Ajouter un sponsor",
      intro: "Les logos affichés dans « Ils soutiennent le Club Voile », regroupés par niveau.",
      champs: [
        { cle: "nom", label: "Nom de l'entreprise", type: "text", requis: true },
        { cle: "logo", label: "Logo", type: "image", max: 800, logo: true, aide: "PNG à fond transparent de préférence." },
        { cle: "niveau", label: "Niveau", type: "select", options: [["principal", "Partenaire principal"], ["officiel", "Partenaire officiel"], ["fournisseur", "Fournisseur ou soutien"]] },
        { cle: "lien", label: "Site web", type: "url" },
        { cle: "description", label: "Phrase de présentation (facultatif)", type: "text" }
      ],
      vignette: "logo", vignetteLogo: true,
      resume: (x) => `<b>${esc(x.nom)}</b> <small>${esc({ principal: "Partenaire principal", officiel: "Partenaire officiel", fournisseur: "Fournisseur ou soutien" }[x.niveau] || "")}</small>`
    },
    offre: {
      titre: "Offres de partenariat", nouveau: "Ajouter une offre",
      intro: "Les formules proposées aux sponsors dans « Devenir partenaire ».",
      champs: [
        { cle: "nom", label: "Nom de l'offre", type: "text", requis: true },
        { cle: "prix", label: "Prix", type: "text", aide: "Ex. : À partir de 1 000 €, Sur devis" },
        { cle: "avantages", label: "Contreparties (une par ligne)", type: "textarea", lignes: 6 },
        { cle: "miseEnAvant", label: "Mettre cette offre en avant", type: "checkbox" }
      ],
      resume: (x) => `<b>${esc(x.nom)}</b> <small>${esc(x.prix)}${x.miseEnAvant ? " – mise en avant" : ""}</small>`
    }
  };
  const champsMedia = (kind) => SCHEMAS[kind].champs.filter((c) => c.type === "image" || c.type === "fichier").map((c) => c.cle);
  const estMedia = (v) => /^media:\d+(@\w+)?$/.test(String(v || ""));

  // =========================================================
  //  CONNEXION & NAVIGATION
  // =========================================================
  async function connexion() {
    const bouton = $("form-connexion").querySelector("button");
    bouton.disabled = true;
    try {
      await api("list_events");
      sessionStorage.setItem("voile_mdp", mdp);
      $("ecran-connexion").hidden = true;
      $("espace").hidden = false;
      construirePanneaux();
      ouvrir(location.hash.slice(1) || "reglages");
      chargerContenu();
      chargerWeios(); chargerEvenements(); chargerInscrits(); chargerBudget(); chargerTodos();
    } catch (e) {
      sessionStorage.removeItem("voile_mdp");
      $("msg-connexion").className = "message erreur";
      $("msg-connexion").textContent = e.message === "unauthorized" ? "Mot de passe incorrect." : "Le serveur ne répond pas. Vérifiez que le workflow n8n est publié, puis réessayez.";
    } finally { bouton.disabled = false; }
  }
  $("form-connexion").addEventListener("submit", (e) => { e.preventDefault(); mdp = $("mdp").value; connexion(); });
  $("deconnexion").onclick = (e) => { e.preventDefault(); sessionStorage.removeItem("voile_mdp"); location.hash = ""; location.reload(); };
  if (mdp) connexion();

  function ouvrir(id) {
    const panneau = $("panneau-" + id) || $(id);
    if (!panneau) return ouvrir("reglages");
    document.querySelectorAll(".panneau").forEach((x) => x.classList.toggle("actif", x === panneau));
    document.querySelectorAll("#onglets button").forEach((b) => {
      b.classList.toggle("actif", b.dataset.p === id);
      if (b.dataset.p === id) b.scrollIntoView({ block: "nearest", inline: "center" });
    });
    history.replaceState(null, "", "#" + id);
    document.querySelector(".travail").scrollTop = 0;
  }
  $("onglets").addEventListener("click", (e) => { const b = e.target.closest("button"); if (b) { ouvrir(b.dataset.p); window.scrollTo(0, 0); } });

  // =========================================================
  //  CONTENU DU SITE
  // =========================================================
  let contenu = {};

  function construirePanneaux() {
    $("panneaux-contenu").innerHTML = Object.entries(SCHEMAS).map(([kind, s]) => `
      <section class="panneau" id="panneau-${kind}">
        <header class="panneau-tete">
          <div><h1>${esc(s.titre)}</h1><p>${esc(s.intro)}</p></div>
          ${s.unique ? "" : `<div class="tete-actions">
            ${s.galerie ? `<label class="bouton bouton-ligne">Importer plusieurs photos<input type="file" accept="image/*" multiple hidden data-import="${kind}" /></label>` : ""}
            <button class="bouton bouton-plein" data-ajouter="${kind}">${esc(s.nouveau)}</button></div>`}
        </header>
        <div id="liste-${kind}" class="${s.unique ? "" : s.galerie ? "liste-galerie" : "liste-elements"}"><p class="vide">Chargement…</p></div>
      </section>`).join("");

    $("panneaux-contenu").addEventListener("click", (e) => {
      const b = e.target.closest("button"); if (!b) return;
      if (b.dataset.ajouter) editer(b.dataset.ajouter, null);
      if (b.dataset.modifier) editer(b.dataset.kind, trouver(b.dataset.kind, b.dataset.modifier));
      if (b.dataset.supprimer) supprimer(b.dataset.kind, trouver(b.dataset.kind, b.dataset.supprimer));
      if (b.dataset.monter) deplacer(b.dataset.kind, b.dataset.monter, -1);
      if (b.dataset.descendre) deplacer(b.dataset.kind, b.dataset.descendre, 1);
    });
    $("panneaux-contenu").addEventListener("change", (e) => { if (e.target.dataset.import) importerPhotos(e.target); });
  }
  const trouver = (kind, id) => contenu[kind].find((x) => String(x._id) === String(id));

  async function chargerContenu() {
    try {
      contenu = (await window.VOILE.charger({ vraiesDonnees: true })).contenu;
    } catch (e) {
      Object.keys(SCHEMAS).forEach((k) => ($("liste-" + k).innerHTML = '<p class="vide">Le contenu n\'a pas pu être chargé. Rechargez la page.</p>'));
      return;
    }
    Object.keys(SCHEMAS).forEach(afficher);
    const R = window.VOILE.reglages(contenu);
    if (R.logo) document.querySelectorAll(".logo-club").forEach((el) => (el.src = img(R.logo)));
  }

  function vignette(src, logo) {
    return src ? `<img class="vignette${logo ? " vignette-logo" : ""}" src="${esc(img(src))}" alt="" loading="lazy" onerror="this.style.visibility='hidden'" />` : `<span class="vignette vignette-vide"></span>`;
  }

  function afficher(kind) {
    const s = SCHEMAS[kind];
    const zone = $("liste-" + kind);
    if (s.unique) return afficherReglages();
    let liste = contenu[kind] || [];
    if (s.triDate) liste = liste.slice().sort((a, b) => String(a.date).localeCompare(String(b.date)));
    if (!liste.length) { zone.innerHTML = `<p class="vide">Rien pour l'instant. Utilisez « ${esc(s.nouveau)} » pour commencer.</p>`; return; }
    const boutons = (x, i) => `
      ${s.triDate ? "" : `<button class="icone" data-kind="${kind}" data-monter="${x._id}" ${i === 0 ? "disabled" : ""} aria-label="Monter">↑</button>
      <button class="icone" data-kind="${kind}" data-descendre="${x._id}" ${i === liste.length - 1 ? "disabled" : ""} aria-label="Descendre">↓</button>`}
      <button class="petit" data-kind="${kind}" data-modifier="${x._id}">Modifier</button>
      <button class="petit danger" data-kind="${kind}" data-supprimer="${x._id}">Supprimer</button>`;
    zone.innerHTML = s.galerie
      ? liste.map((x, i) => `<figure class="tuile">${vignette(x[s.vignette])}<figcaption>${s.resume(x)}</figcaption><div class="tuile-actions">${boutons(x, i)}</div></figure>`).join("")
      : liste.map((x, i) => `<div class="element">${s.vignette ? vignette(x[s.vignette], s.vignetteLogo) : ""}<div class="element-texte">${s.resume(x)}</div><div class="element-actions">${boutons(x, i)}</div></div>`).join("");
  }

  function afficherReglages() {
    const R = window.VOILE.reglages(contenu);
    const zone = $("liste-reglages");
    zone.innerHTML = `<form class="formulaire carte" id="form-reglages">${SCHEMAS.reglages.champs.map((c) => champHtml(c, R[c.cle])).join("")}
      <div class="actions"><button type="submit" class="bouton bouton-plein">Enregistrer les textes</button></div></form>`;
    brancherChamps(zone);
    $("form-reglages").addEventListener("submit", async (e) => {
      e.preventDefault();
      const bouton = e.target.querySelector("button[type=submit]");
      bouton.disabled = true;
      try {
        const existant = contenu.reglages[0];
        const data = { ...lireChamps(zone, SCHEMAS.reglages.champs) };
        if (existant && existant._id) await apiContenu("update_item", { id: existant._id, position: 0, data: JSON.stringify(data) });
        else await apiContenu("insert_item", { kind: "reglages", position: 0, data: JSON.stringify(data) });
        await nettoyerMedias(existant, data, "reglages");
        toast("Textes enregistrés. Le site est à jour.");
        await chargerContenu();
      } catch (err) { echec(err); } finally { bouton.disabled = false; }
    });
  }

  // ---------- Champs de formulaire ----------
  function champHtml(c, valeur) {
    const v = valeur ?? "";
    const aide = c.aide ? `<small class="aide">${esc(c.aide)}</small>` : "";
    const req = c.requis ? "required" : "";
    switch (c.type) {
      case "textarea": return `<label>${esc(c.label)}<textarea name="${c.cle}" rows="${c.lignes || 3}" ${req}>${esc(v)}</textarea>${aide}</label>`;
      case "select": return `<label>${esc(c.label)}<select name="${c.cle}">${c.options.map(([o, l]) => `<option value="${o}" ${o === v ? "selected" : ""}>${esc(l)}</option>`).join("")}</select>${aide}</label>`;
      case "checkbox": return `<label class="case"><input type="checkbox" name="${c.cle}" ${v ? "checked" : ""} /> ${esc(c.label)}</label>`;
      case "image":
      case "fichier": return `
        <div class="champ-media" data-cle="${c.cle}" data-type="${c.type}" data-max="${c.max || 1600}" data-logo="${c.logo ? 1 : ""}" data-requis="${c.requis ? 1 : ""}">
          <span class="champ-titre">${esc(c.label)}</span>
          <div class="media-apercu">${c.type === "image" ? vignette(v, c.logo) : `<span class="fichier-nom">${v ? "Fichier en ligne" : "Aucun fichier"}</span>`}</div>
          <div class="media-actions">
            <label class="bouton bouton-ligne petit-bouton">${v ? "Remplacer" : "Choisir un fichier"}<input type="file" accept="${c.type === "image" ? "image/*" : "application/pdf"}" hidden /></label>
            ${v ? `<button type="button" class="petit danger" data-retirer>Retirer</button>` : ""}
            <a href="${esc(img(v))}" target="_blank" rel="noopener" class="voir" ${v ? "" : "hidden"}>Voir</a>
          </div>
          <input type="hidden" name="${c.cle}" value="${esc(v)}" />
          ${aide}
          <p class="media-etat" role="status"></p>
        </div>`;
      default: return `<label>${esc(c.label)}<input type="${c.type}" name="${c.cle}" value="${esc(v)}" ${req} />${aide}</label>`;
    }
  }

  function lireChamps(zone, champs) {
    const data = {};
    champs.forEach((c) => {
      const el = zone.querySelector(`[name="${c.cle}"]`);
      data[c.cle] = c.type === "checkbox" ? el.checked : el.value.trim();
    });
    return data;
  }

  function brancherChamps(zone) {
    zone.querySelectorAll(".champ-media").forEach((bloc) => {
      const cache = bloc.querySelector("input[type=hidden]");
      const etat = bloc.querySelector(".media-etat");
      bloc.querySelector("input[type=file]").addEventListener("change", async (e) => {
        const fichier = e.target.files[0]; if (!fichier) return;
        etat.textContent = "Envoi en cours…";
        bloc.classList.add("envoi");
        try {
          const ref = await envoyerFichier(fichier, { max: Number(bloc.dataset.max), logo: !!bloc.dataset.logo, pdf: bloc.dataset.type === "fichier" });
          cache.value = ref;
          bloc.querySelector(".media-apercu").innerHTML = bloc.dataset.type === "image" ? vignette(ref, !!bloc.dataset.logo) : `<span class="fichier-nom">${esc(fichier.name)}</span>`;
          const voir = bloc.querySelector(".voir"); voir.href = img(ref); voir.hidden = false;
          etat.textContent = "Fichier prêt. Pensez à enregistrer.";
        } catch (err) {
          etat.textContent = err.message === "unauthorized" ? "Session expirée : reconnectez-vous." : err.message;
        } finally { bloc.classList.remove("envoi"); e.target.value = ""; }
      });
      const retirer = bloc.querySelector("[data-retirer]");
      if (retirer) retirer.onclick = () => {
        cache.value = "";
        bloc.querySelector(".media-apercu").innerHTML = bloc.dataset.type === "image" ? vignette("") : '<span class="fichier-nom">Aucun fichier</span>';
        bloc.querySelector(".voir").hidden = true;
        etat.textContent = "Fichier retiré. Pensez à enregistrer.";
      };
    });
  }

  // ---------- Photos : redimensionnement puis envoi ----------
  const LIMITE_PDF = 6 * 1024 * 1024;
  function lireBase64(blob) {
    return new Promise((ok, ko) => { const r = new FileReader(); r.onload = () => ok(String(r.result).split(",")[1]); r.onerror = ko; r.readAsDataURL(blob); });
  }
  async function preparerImage(fichier, max, logo) {
    const bitmap = await createImageBitmap(fichier).catch(() => { throw new Error("Ce fichier n'est pas une image lisible. Utilisez un JPG ou un PNG."); });
    const echelle = Math.min(1, max / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bitmap.width * echelle);
    canvas.height = Math.round(bitmap.height * echelle);
    const ctx = canvas.getContext("2d");
    const png = logo && /png|svg|webp/.test(fichier.type);
    if (!png) { ctx.fillStyle = "#fff"; ctx.fillRect(0, 0, canvas.width, canvas.height); }
    ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    const mime = png ? "image/png" : "image/jpeg";
    let qualite = 0.84, blob;
    do {
      blob = await new Promise((ok) => canvas.toBlob(ok, mime, qualite));
      qualite -= 0.1;
    } while (!png && blob.size > 600 * 1024 && qualite > 0.4);
    return { mime, b64: await lireBase64(blob) };
  }
  async function envoyerFichier(fichier, { max = 1600, logo = false, pdf = false } = {}) {
    let charge;
    if (pdf) {
      if (fichier.type !== "application/pdf") throw new Error("Choisissez un fichier PDF.");
      if (fichier.size > LIMITE_PDF) throw new Error("Ce PDF dépasse 6 Mo. Compressez-le (ex. ilovepdf.com) ou collez plutôt un lien.");
      charge = { mime: "application/pdf", b64: await lireBase64(fichier) };
    } else {
      charge = await preparerImage(fichier, max, logo);
    }
    const r = await apiContenu("upload_media", charge);
    if (!r || !r.id) throw new Error("Le fichier n'a pas été enregistré. Réessayez.");
    return "media:" + r.id + "@" + Date.now().toString(36);
  }

  // Supprime du serveur les photos qui ne sont plus utilisées
  async function nettoyerMedias(avant, apres, kind) {
    if (!avant) return;
    const champs = champsMedia(kind);
    const aSupprimer = champs.map((c) => avant[c]).filter((v) => estMedia(v) && !(apres && champs.some((c) => apres[c] === v)));
    for (const ref of aSupprimer) {
      try { await apiContenu("delete_media", { id: ref.match(/^media:(\d+)/)[1] }); } catch (e) { /* sans gravité */ }
    }
  }

  // ---------- Fenêtre d'édition ----------
  let edition = null;
  function editer(kind, element) {
    const s = SCHEMAS[kind];
    edition = { kind, element };
    $("editeur-titre").textContent = element ? "Modifier – " + s.titre.toLowerCase() : s.nouveau;
    $("editeur-champs").innerHTML = s.champs.map((c) => champHtml(c, element ? element[c.cle] : c.type === "select" ? c.options[1]?.[0] ?? c.options[0][0] : "")).join("");
    brancherChamps($("editeur-champs"));
    $("editeur-msg").className = "message";
    $("editeur").showModal();
    const premier = $("editeur-champs").querySelector("input:not([type=hidden]):not([type=file]), textarea");
    if (premier) premier.focus();
  }
  $("editeur-annuler").onclick = () => $("editeur").close();
  $("form-editeur").addEventListener("submit", async (e) => {
    e.preventDefault();
    const { kind, element } = edition;
    const s = SCHEMAS[kind];
    const data = lireChamps($("editeur-champs"), s.champs);
    const manquant = s.champs.find((c) => c.requis && !data[c.cle]);
    if (manquant) { $("editeur-msg").className = "message erreur"; $("editeur-msg").textContent = `Renseignez « ${manquant.label} ».`; return; }
    const bouton = $("editeur-enregistrer");
    bouton.disabled = true;
    try {
      if (element) {
        await apiContenu("update_item", { id: element._id, position: element._position, data: JSON.stringify(data) });
        await nettoyerMedias(element, data, kind);
      } else {
        const fin = Math.max(0, ...(contenu[kind] || []).map((x) => x._position)) + 10;
        await apiContenu("insert_item", { kind, position: fin, data: JSON.stringify(data) });
      }
      $("editeur").close();
      toast(element ? "Modifications enregistrées." : "Ajouté au site.");
      await chargerContenu();
    } catch (err) {
      $("editeur-msg").className = "message erreur";
      $("editeur-msg").textContent = err.message === "unauthorized" ? "Session expirée : reconnectez-vous." : "L'enregistrement a échoué. Vérifiez votre connexion et réessayez.";
    } finally { bouton.disabled = false; }
  });

  async function supprimer(kind, element) {
    const nom = element.nom || element.titre || element.legende || element.libelle || "cet élément";
    if (!confirm(`Supprimer « ${nom} » du site ?`)) return;
    try {
      await apiContenu("delete_item", { id: element._id });
      await nettoyerMedias(element, null, kind);
      toast("Supprimé du site.");
      await chargerContenu();
    } catch (e) { echec(e); }
  }

  async function deplacer(kind, id, sens) {
    const liste = contenu[kind];
    const i = liste.findIndex((x) => String(x._id) === String(id));
    const j = i + sens;
    if (j < 0 || j >= liste.length) return;
    // Renumérote toute la liste pour éviter les positions identiques
    const ordre = liste.slice();
    [ordre[i], ordre[j]] = [ordre[j], ordre[i]];
    try {
      const sansMeta = (x) => Object.fromEntries(Object.entries(x).filter(([k]) => !k.startsWith("_")));
      const changements = ordre.map((x, k) => ({ x, pos: (k + 1) * 10 })).filter(({ x, pos }) => x._position !== pos);
      await Promise.all(changements.map(({ x, pos }) => apiContenu("update_item", { id: x._id, position: pos, data: JSON.stringify(sansMeta(x)) })));
      await chargerContenu();
    } catch (e) { echec(e); }
  }

  async function importerPhotos(input) {
    const fichiers = [...input.files]; input.value = "";
    if (!fichiers.length) return;
    const tournoi = prompt("Événement et date pour ces photos (facultatif) :", "") || "";
    let pos = Math.max(0, ...(contenu.photo || []).map((x) => x._position));
    let faites = 0;
    for (const f of fichiers) {
      toast(`Envoi des photos… ${faites + 1} / ${fichiers.length}`);
      try {
        const ref = await envoyerFichier(f, { max: 1800 });
        pos += 10;
        await apiContenu("insert_item", { kind: "photo", position: pos, data: JSON.stringify({ src: ref, legende: "", tournoi }) });
        faites++;
      } catch (e) { toast(`La photo « ${f.name} » n'a pas été envoyée : ${e.message}`, true); }
    }
    toast(`${faites} photo${faites > 1 ? "s" : ""} ajoutée${faites > 1 ? "s" : ""} à la galerie.`);
    await chargerContenu();
  }

  // =========================================================
  //  GESTION DU CLUB (workflow « Voile HEC – API du site »)
  // =========================================================
  // ---------- Organisation du WEIOS ----------
  let weios = [];
  const dateFr = (d) => (d ? new Date(d + "T12:00:00").toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" }) : "");
  async function chargerWeios() {
    weios = clean(await api("list_weios"));
    const faites = weios.filter((t) => t.done).length;
    $("weios-totaux").innerHTML = weios.length ? `
      <div class="total">Tâches<b>${weios.length}</b></div>
      <div class="total">Faites<b>${faites}</b></div>
      <div class="total">Reste à faire<b>${weios.length - faites}</b></div>` : "";
    if (!weios.length) { $("liste-weios").innerHTML = '<p class="vide">L\'organisation du WEIOS commence ici. Ajoutez la première tâche ci-dessus.</p>'; return; }
    const aujourdhui = new Date().toISOString().slice(0, 10);
    const groupes = {};
    weios.slice().sort((a, b) => (a.done === b.done ? String(a.echeance || "9").localeCompare(String(b.echeance || "9")) : a.done ? 1 : -1))
      .forEach((t) => (groupes[t.pole || "Sans pôle"] ||= []).push(t));
    $("liste-weios").innerHTML = Object.entries(groupes).map(([pole, liste]) => `
      <h2 class="sous-titre">${esc(pole)} <span class="compteur">${liste.filter((t) => !t.done).length}</span></h2>
      ${liste.map((t) => `
        <div class="todo tache-weios ${t.done ? "fait" : ""}">
          <input type="checkbox" data-id="${t.id}" ${t.done ? "checked" : ""} aria-label="Fait : ${esc(t.tache)}" />
          <span><b>${esc(t.tache)}</b>${t.responsable ? ` – ${esc(t.responsable)}` : ""}</span>
          ${t.echeance ? `<small class="echeance${!t.done && t.echeance < aujourdhui ? " en-retard" : ""}">${esc(dateFr(t.echeance))}</small>` : ""}
          <button class="petit danger" data-supprimer-weios="${t.id}">Supprimer</button>
        </div>`).join("")}`).join("");
    $("liste-weios").querySelectorAll("input").forEach((c) => c.onchange = async () => {
      try { await api("toggle_weios", { id: c.dataset.id, done: c.checked }); chargerWeios(); } catch (e) { echec(e); }
    });
    $("liste-weios").querySelectorAll("[data-supprimer-weios]").forEach((b) => b.onclick = async () => {
      if (!confirm("Supprimer cette tâche ?")) return;
      try { await api("delete_weios", { id: b.dataset.supprimerWeios }); toast("Tâche supprimée."); chargerWeios(); } catch (e) { echec(e); }
    });
  }
  $("form-weios").addEventListener("submit", async (e) => {
    e.preventDefault();
    try { await api("add_weios", Object.fromEntries(new FormData(e.target))); e.target.reset(); toast("Tâche ajoutée."); chargerWeios(); } catch (err) { echec(err); }
  });
  $("export-weios").onclick = () => csv("organisation-weios.csv", weios.map((t) => ({ ...t, done: t.done ? "Oui" : "Non" })), [
    { key: "pole", label: "Pôle" }, { key: "tache", label: "Tâche" }, { key: "responsable", label: "Responsable" },
    { key: "echeance", label: "Échéance" }, { key: "done", label: "Faite" }
  ]);

  let evenements = [];
  async function chargerEvenements() {
    evenements = clean(await api("list_events"));
    $("t-evenements").innerHTML = evenements.length ? evenements.map((e) => `
      <tr><td>${esc(e.event_date)}</td><td>${esc(e.event_time)}</td><td>${esc(e.title)}</td><td>${esc(e.location)}</td>
      <td><button class="petit danger" data-id="${e.id}">Supprimer</button></td></tr>`).join("")
      : '<tr><td colspan="5" class="vide">Aucun événement publié.</td></tr>';
    $("t-evenements").querySelectorAll("button").forEach((b) => b.onclick = async () => {
      if (!confirm("Supprimer cet événement ?")) return;
      try { await api("delete_event", { id: b.dataset.id }); toast("Événement supprimé."); chargerEvenements(); } catch (e) { echec(e); }
    });
  }
  $("form-evenement").addEventListener("submit", async (e) => {
    e.preventDefault();
    try { await api("add_event", Object.fromEntries(new FormData(e.target))); e.target.reset(); toast("Événement publié."); chargerEvenements(); } catch (err) { echec(err); }
  });

  let inscrits = [];
  const colsInscrits = [
    { key: "event_title", label: "Événement" }, { key: "first_name", label: "Prénom" }, { key: "last_name", label: "Nom" },
    { key: "email", label: "Email" }, { key: "phone", label: "Téléphone" }, { key: "createdAt", label: "Inscrit le" }
  ];
  async function chargerInscrits() {
    inscrits = clean(await api("list_registrations"));
    if (!inscrits.length) { $("tableaux-inscrits").innerHTML = '<p class="vide">Aucune inscription pour le moment.</p>'; return; }
    const groupes = {};
    inscrits.forEach((i) => { (groupes[i.event_title || "Sans titre"] ||= []).push(i); });
    $("tableaux-inscrits").innerHTML = Object.entries(groupes).map(([titre, liste]) => `
      <h2 class="sous-titre">${esc(titre)} <span class="compteur">${liste.length}</span></h2>
      <div class="tableau-cadre"><table><thead><tr><th>Prénom</th><th>Nom</th><th>Email</th><th>Téléphone</th><th>Inscrit le</th></tr></thead>
      <tbody>${liste.map((i) => `<tr><td>${esc(i.first_name)}</td><td>${esc(i.last_name)}</td><td>${esc(i.email)}</td><td>${esc(i.phone)}</td><td>${esc(new Date(i.createdAt).toLocaleString("fr-FR"))}</td></tr>`).join("")}</tbody></table></div>`).join("");
  }
  $("export-inscrits").onclick = () => csv("inscrits-club-voile.csv", inscrits, colsInscrits);

  let budget = [];
  async function chargerBudget() {
    budget = clean(await api("list_budget"));
    let rec = 0, dep = 0;
    budget.forEach((b) => { if (b.entry_type === "recette") rec += Number(b.amount); else dep += Number(b.amount); });
    $("tot-recettes").textContent = euros(rec);
    $("tot-depenses").textContent = euros(dep);
    $("tot-solde").textContent = euros(rec - dep);
    $("tot-solde").classList.toggle("negatif", rec - dep < 0);
    $("t-budget").innerHTML = budget.length ? budget.map((b) => `
      <tr><td>${esc(b.entry_date)}</td><td>${esc(b.label)}</td><td>${esc(b.category)}</td>
      <td>${b.entry_type === "recette" ? "Recette" : "Dépense"}</td>
      <td class="${b.entry_type === "recette" ? "plus" : "moins"}">${b.entry_type === "recette" ? "+" : "−"} ${euros(b.amount)}</td></tr>`).join("")
      : '<tr><td colspan="5" class="vide">Aucune ligne de budget.</td></tr>';
  }
  $("form-budget").addEventListener("submit", async (e) => {
    e.preventDefault();
    try { await api("add_budget", Object.fromEntries(new FormData(e.target))); e.target.reset(); toast("Ligne ajoutée au budget."); chargerBudget(); } catch (err) { echec(err); }
  });
  $("export-budget").onclick = () => csv("budget-club-voile.csv", budget, [
    { key: "entry_date", label: "Date" }, { key: "label", label: "Libellé" }, { key: "category", label: "Catégorie" },
    { key: "entry_type", label: "Type" }, { key: "amount", label: "Montant" }
  ]);

  async function chargerTodos() {
    const todos = clean(await api("list_todos"));
    todos.sort((a, b) => (a.done === b.done ? 0 : a.done ? 1 : -1));
    $("liste-todos").innerHTML = todos.length ? todos.map((t) => `
      <label class="todo ${t.done ? "fait" : ""}"><input type="checkbox" data-id="${t.id}" ${t.done ? "checked" : ""} />
      <span><b>${esc(t.sponsor)}</b> – ${esc(t.task)}</span></label>`).join("")
      : '<p class="vide">Aucune tâche. Ajoutez les contreparties promises à vos sponsors.</p>';
    $("liste-todos").querySelectorAll("input").forEach((c) => c.onchange = async () => {
      try { await api("toggle_todo", { id: c.dataset.id, done: c.checked }); chargerTodos(); } catch (e) { echec(e); }
    });
  }
  $("form-todo").addEventListener("submit", async (e) => {
    e.preventDefault();
    try { await api("add_todo", Object.fromEntries(new FormData(e.target))); e.target.reset(); toast("Tâche ajoutée."); chargerTodos(); } catch (err) { echec(err); }
  });
})();
