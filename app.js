(async function () {
  const C = window.VOILE_CONFIG;
  const { esc, img } = window.VOILE;
  const $ = (id) => document.getElementById(id);
  const paragraphes = (t) => String(t || "").split(/\n\s*\n/).filter((p) => p.trim()).map((p) => `<p>${esc(p.trim()).replace(/\n/g, "<br>")}</p>`).join("");

  // ---------- Menu mobile ----------
  $("menu-bouton").addEventListener("click", () => {
    const ouvert = $("entete").classList.toggle("menu-ouvert");
    $("menu-bouton").setAttribute("aria-expanded", ouvert);
  });
  $("menu").addEventListener("click", (e) => { if (e.target.tagName === "A") { $("entete").classList.remove("menu-ouvert"); $("menu-bouton").setAttribute("aria-expanded", false); } });

  const { contenu } = await window.VOILE.charger();
  const R = window.VOILE.reglages(contenu);

  // ---------- Logo du club ----------
  if (R.logo) {
    document.querySelectorAll(".logo-club").forEach((el) => (el.src = img(R.logo)));
    const icone = document.querySelector('link[rel="icon"]'); if (icone) icone.href = img(R.logo);
  }

  // ---------- Accueil ----------
  $("hero-titre").textContent = R.heroTitre;
  $("hero-texte").textContent = R.heroTexte;
  if (R.heroImage) $("hero-photo").style.backgroundImage = `url("${img(R.heroImage)}")`;

  // ---------- Chiffres clés ----------
  $("chiffres").innerHTML = contenu.chiffre.map((c) => `
    <div class="chiffre"><dt>${esc(c.libelle)}</dt><dd>${esc(c.valeur)}</dd></div>`).join("");
  if (!contenu.chiffre.length) $("chiffres").closest("section").hidden = true;

  // ---------- Le club ----------
  $("presentation-titre").textContent = R.presentationTitre;
  $("presentation").innerHTML = paragraphes(R.presentation);
  $("palmares").innerHTML = contenu.palmares.map((p) => `<li><span class="annee">${esc(p.annee)}</span><span>${esc(p.titre)}</span></li>`).join("");
  if (!contenu.palmares.length) $("palmares").closest("aside").hidden = true;

  // ---------- La saison ----------
  const jour = (d) => new Date(d + "T12:00:00");
  const aujourdhui = new Date().toISOString().slice(0, 10);
  const competitions = contenu.competition.filter((c) => c.date).sort((a, b) => a.date.localeCompare(b.date));
  const prochaine = competitions.find((c) => (c.dateFin || c.date) >= aujourdhui);
  $("calendrier").innerHTML = competitions.length ? competitions.map((c) => {
    const d1 = jour(c.date), d2 = c.dateFin ? jour(c.dateFin) : null;
    const memeMois = d2 && d1.getMonth() === d2.getMonth();
    const jours = d2 ? (memeMois ? `${d1.getDate()}–${d2.getDate()}` : `${d1.getDate()}/${d1.getMonth() + 1}–${d2.getDate()}/${d2.getMonth() + 1}`) : d1.getDate();
    const mois = d1.toLocaleDateString("fr-FR", { month: "short" }).replace(".", "");
    const passee = (c.dateFin || c.date) < aujourdhui;
    const etat = c.resultat ? `<span class="resultat">${esc(c.resultat)}</span>` : passee ? '<span class="etat">Terminé</span>' : c === prochaine ? '<span class="etat etat-prochain">Prochain rendez-vous</span>' : "";
    return `<li class="competition${passee ? " passee" : ""}${c === prochaine ? " prochaine" : ""}">
      <time datetime="${esc(c.date)}"><b>${esc(jours)}</b><span>${esc(mois)}</span></time>
      <div><h3>${esc(c.nom)}</h3>${c.lieu ? `<p>${esc(c.lieu)}</p>` : ""}</div>
      ${etat}
    </li>`;
  }).join("") : '<li class="vide">Le calendrier de la saison sera bientôt publié.</li>';

  $("entrainements").innerHTML = contenu.entrainement.map((e) => `
    <li><b>${esc(e.jour)}</b><span>${esc(e.horaire)}</span><small>${esc(e.lieu)}</small></li>`).join("");
  if (!contenu.entrainement.length) $("entrainements").closest("aside").hidden = true;

  // ---------- Tournois (galerie + visionneuse) ----------
  const photos = contenu.photo.filter((p) => p.src);
  $("galerie").innerHTML = photos.length ? photos.map((p, i) => `
    <button class="photo${i === 0 && photos.length >= 5 ? " photo-une" : ""}" data-i="${i}" aria-label="Agrandir : ${esc(p.legende)}">
      <img src="${esc(img(p.src))}" alt="${esc(p.legende)}" loading="lazy" />
      <span>${esc(p.legende)}${p.tournoi ? `<small>${esc(p.tournoi)}</small>` : ""}</span>
    </button>`).join("") : '<p class="vide">Les photos de nos prochaines navigations arrivent bientôt.</p>';

  let courante = 0;
  const vis = $("visionneuse");
  function montrer(i) {
    courante = (i + photos.length) % photos.length;
    const p = photos[courante];
    $("visionneuse-img").src = img(p.src);
    $("visionneuse-img").alt = p.legende || "";
    $("visionneuse-legende").textContent = [p.legende, p.tournoi].filter(Boolean).join(" – ");
  }
  $("galerie").addEventListener("click", (e) => {
    const b = e.target.closest(".photo"); if (!b) return;
    montrer(Number(b.dataset.i)); vis.showModal();
  });
  $("visionneuse-fermer").onclick = () => vis.close();
  $("visionneuse-prec").onclick = () => montrer(courante - 1);
  $("visionneuse-suiv").onclick = () => montrer(courante + 1);
  vis.addEventListener("click", (e) => { if (e.target === vis) vis.close(); });
  vis.addEventListener("keydown", (e) => { if (e.key === "ArrowLeft") montrer(courante - 1); if (e.key === "ArrowRight") montrer(courante + 1); });

  // ---------- Partenaires ----------
  const NIVEAUX = [
    { cle: "principal", titre: "Partenaire principal" },
    { cle: "officiel", titre: "Partenaires officiels" },
    { cle: "fournisseur", titre: "Fournisseurs et soutiens" }
  ];
  const carteLogo = (p) => {
    const interieur = p.logo
      ? `<img src="${esc(img(p.logo))}" alt="${esc(p.nom)}" loading="lazy" onerror="this.replaceWith(Object.assign(document.createElement('span'),{className:'logo-texte',textContent:this.alt}))" />`
      : `<span class="logo-texte">${esc(p.nom)}</span>`;
    const desc = p.description ? `<p>${esc(p.description)}</p>` : "";
    return p.lien
      ? `<a class="partenaire" href="${esc(p.lien)}" target="_blank" rel="noopener"><div class="logo">${interieur}</div>${desc}</a>`
      : `<div class="partenaire"><div class="logo">${interieur}</div>${desc}</div>`;
  };
  const groupes = NIVEAUX.map((n) => ({ ...n, liste: contenu.partenaire.filter((p) => (p.niveau || "officiel") === n.cle) })).filter((g) => g.liste.length);
  $("partenaires-liste").innerHTML = groupes.length ? groupes.map((g) => `
    <div class="niveau niveau-${g.cle}">
      <h3>${g.liste.length === 1 && g.cle === "officiel" ? "Partenaire officiel" : g.titre}</h3>
      <div class="logos">${g.liste.map(carteLogo).join("")}</div>
    </div>`).join("") : '<p class="vide">Votre logo pourrait être le premier ici.</p>';

  // ---------- Devenir partenaire ----------
  $("partenariat-titre").textContent = R.partenariatTitre;
  $("partenariat-texte").textContent = R.partenariatTexte;
  const mailto = R.contactEmail ? `mailto:${R.contactEmail}?subject=${encodeURIComponent("Partenariat Club Voile HEC")}` : "";
  $("offres").innerHTML = contenu.offre.map((o) => `
    <article class="offre${o.miseEnAvant ? " offre-phare" : ""}">
      ${o.miseEnAvant ? '<p class="offre-badge">Notre recommandation</p>' : ""}
      <h3>${esc(o.nom)}</h3>
      <p class="prix">${esc(o.prix)}</p>
      <ul>${String(o.avantages || "").split("\n").filter((l) => l.trim()).map((l) => `<li>${esc(l.trim())}</li>`).join("")}</ul>
    </article>`).join("");
  if (!contenu.offre.length) $("offres").hidden = true;

  const liensSociaux = [
    R.instagram && `<a href="${esc(R.instagram)}" target="_blank" rel="noopener">Instagram</a>`,
    R.linkedin && `<a href="${esc(R.linkedin)}" target="_blank" rel="noopener">LinkedIn</a>`
  ].filter(Boolean).join("");
  $("contact").innerHTML = `
    <div>
      <h3>Parlons de votre projet</h3>
      <p>${esc(R.contactNom)} vous répond et vous envoie le dossier de partenariat complet.</p>
    </div>
    <div class="contact-actions">
      ${mailto ? `<a class="bouton bouton-plein" href="${esc(mailto)}">Nous écrire</a>` : ""}
      ${R.dossierUrl ? `<a class="bouton bouton-ligne" href="${esc(img(R.dossierUrl))}" target="_blank" rel="noopener">Télécharger le dossier</a>` : ""}
      <div class="contact-details">
        ${R.contactEmail ? `<a href="${esc(mailto)}">${esc(R.contactEmail)}</a>` : ""}
        ${R.contactTel ? `<a href="tel:${esc(R.contactTel.replace(/\s/g, ""))}">${esc(R.contactTel)}</a>` : ""}
      </div>
    </div>`;
  if (!mailto && !R.dossierUrl && !R.contactTel) $("contact").hidden = true;

  $("pied-contact").innerHTML = `
    ${R.contactEmail ? `<a href="${esc(mailto)}">${esc(R.contactEmail)}</a>` : ""}
    ${liensSociaux ? `<div class="sociaux">${liensSociaux}</div>` : ""}`;
  $("credits").textContent = R.creditsPhotos || "";

  // ---------- Événements (inscriptions n8n) ----------
  let evenementChoisi = null;
  const modal = $("modal-inscription");
  const formatDate = (d) => { const x = new Date(d); return isNaN(x) ? d : x.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" }); };

  fetch(C.apiBase + "/voile-events")
    .then((r) => r.json())
    .then((data) => {
      const liste = (Array.isArray(data) ? data : [data]).filter((e) => e && e.id);
      if (!liste.length) { $("liste-evenements").innerHTML = '<p class="vide">Aucun événement prévu pour le moment. Revenez bientôt.</p>'; return; }
      $("liste-evenements").innerHTML = liste.map((e) => `
        <article class="evenement">
          <p class="evenement-date">${esc(formatDate(e.event_date))}${e.event_time ? " à " + esc(e.event_time) : ""}</p>
          <h3>${esc(e.title)}</h3>
          ${e.location ? `<p class="evenement-lieu">${esc(e.location)}</p>` : ""}
          ${e.description ? `<p>${esc(e.description)}</p>` : ""}
          <button class="bouton bouton-plein" data-id="${esc(e.id)}" data-titre="${esc(e.title)}">S'inscrire</button>
        </article>`).join("");
      $("liste-evenements").querySelectorAll("button").forEach((b) =>
        b.addEventListener("click", () => {
          evenementChoisi = { id: b.dataset.id, title: b.dataset.titre };
          $("modal-titre").textContent = "Inscription – " + evenementChoisi.title;
          $("msg-inscription").className = "message";
          $("form-inscription").reset();
          modal.showModal();
        }));
    })
    .catch(() => { $("liste-evenements").innerHTML = '<p class="vide">Les événements n\'ont pas pu être chargés. Rechargez la page dans quelques instants.</p>'; });

  $("fermer-modal").onclick = () => modal.close();

  $("form-inscription").addEventListener("submit", (ev) => {
    ev.preventDefault();
    const bouton = ev.target.querySelector("button[type=submit]");
    bouton.disabled = true;
    const f = Object.fromEntries(new FormData(ev.target));
    fetch(C.apiBase + "/voile-register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...f, event_id: evenementChoisi.id, event_title: evenementChoisi.title })
    })
      .then((r) => { if (!r.ok) throw new Error(); return r.json(); })
      .then(() => {
        $("msg-inscription").className = "message ok";
        $("msg-inscription").textContent = "Inscription confirmée. À bientôt !";
        setTimeout(() => modal.close(), 1800);
      })
      .catch(() => { $("msg-inscription").className = "message erreur"; $("msg-inscription").textContent = "L'inscription n'a pas été enregistrée. Vérifiez votre connexion et réessayez."; })
      .finally(() => { bouton.disabled = false; });
  });
})();
