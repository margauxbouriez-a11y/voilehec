# Site du Club Voile HEC

Site du club de voile d'HEC Paris, construit sur le même fonctionnement que le site des FHR, en bleu marine :

- **Site public** (`index.html`) : accueil, chiffres clés, présentation du club et palmarès, calendrier de la saison et sorties, photos « En mer », partenaires par niveau, offres de partenariat avec contact et dossier PDF, événements avec inscription en ligne (CCE et WEIOS en juin).
- **Espace privé** (`admin.html`, protégé par le mot de passe du bureau) : tout le contenu du site se modifie ici, sans toucher au code.
  - *Contenu du site* : logo du club, textes et contact, chiffres clés, palmarès, sorties et entraînements, calendrier (avec résultats), photos (import de plusieurs photos d'un coup), sponsors (logo, niveau, lien), offres de partenariat.
  - *Gestion du club* : **organisation du WEIOS** (tâches par pôle, responsable, échéance, à cocher), événements, inscrits (export CSV/Excel), budget, suivi des contreparties sponsors.

Les photos envoyées depuis l'espace privé sont redimensionnées automatiquement puis stockées dans n8n : pas besoin de les déposer sur GitHub.

## Données (n8n)
Un seul workflow, qui doit rester **publié (actif)** : **« Voile HEC – API du site »**.

| Adresse | Rôle |
|---|---|
| `GET /webhook/voile-contenu` | Contenu public du site (table `voile_contenu`) |
| `GET /webhook/voile-media?id=` | Une photo (table `voile_medias`) |
| `GET /webhook/voile-events` | Événements à venir (table `voile_evenements`) |
| `POST /webhook/voile-register` | Inscription à un événement (table `voile_inscriptions`) |
| `POST /webhook/voile-admin` | Espace privé, protégé par mot de passe : contenu, photos, événements, inscrits, budget (`voile_budget`), suivi sponsors (`voile_sponsors_todo`), organisation du WEIOS (`voile_weios`) |

Les tables sont séparées de celles des FHR : les deux sites ne se mélangent pas.

**Changer le mot de passe** : dans n8n, ouvrir le workflow, nœud « Mot de passe correct ? », remplacer la valeur à droite, puis publier.

Si n8n est injoignable, le site public affiche le contenu de secours de `config.js`.

## Mise en ligne sur GitHub Pages
1. **Settings → Pages**, choisis **Deploy from a branch**, **Branch : main**, dossier **/ (root)**, puis **Save**.
2. Le site est en ligne après 1–2 minutes sur `https://margauxbouriez-a11y.github.io/voilehec/`.

## À compléter
- **Logo** : le logo actuel est provisoire. Dépose le vrai logo du club dans l'espace privé (*Textes et contact → Logo du club*).
- **Photos** : les photos d'illustration viennent de Wikimedia Commons (licences libres, auteurs crédités en bas de page). Remplace-les par celles du club dans *Photos* et *Textes et contact → Photo d'accueil*, puis vide le champ *Crédits photos*.
- **Dates** : la CCE et le WEIOS sont placés en juin 2027 avec « Date et lieu à confirmer ». Mets les vraies dates dans *Calendrier* et *Événements*.

## Fichiers
- `index.html`, `app.js` : site public
- `admin.html`, `admin.js`, `admin.css` : espace privé
- `contenu.js` : chargement du contenu (partagé)
- `styles.css` : design (couleurs en haut du fichier : `--marine`, `--nuit`, `--accent`)
- `config.js` : adresse de l'API n8n et contenu de secours
- `images/` : logo provisoire, photo d'accueil, photos de la galerie

## Crédits photos
- Accueil : *Moonsund Regatta 2020*, Liilia Moroz, [CC BY-SA 4.0](https://commons.wikimedia.org/wiki/File:Muhu_v%C3%A4ina_regatt_Moonsund_Regatta_2020.jpg)
- *Tuiga, Lulworth, Cambria – Cannes 2006*, Donan Raven, [CC BY-SA 3.0](https://commons.wikimedia.org/wiki/File:Sailing-yachts.Tuiga.Lulworth.Cambria.Cannes.2006-09-26.jpg)
- *CH Regatta*, Isles Yacht Club, CC BY 2.0 ([1](https://commons.wikimedia.org/wiki/File:CH_Regatta_(20)_(12506646345).jpg), [2](https://commons.wikimedia.org/wiki/File:CH_Regatta_(14)_(12506660815).jpg))
