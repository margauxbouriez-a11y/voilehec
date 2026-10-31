// =====================================================
//  CONFIGURATION DU SITE
//  Tout le contenu se modifie depuis l'espace privé
//  (admin.html). Les valeurs ci-dessous ne servent que de secours
//  si le serveur n8n est momentanément injoignable.
// =====================================================
window.VOILE_CONFIG = {
  // Adresse de l'API n8n (ne pas modifier sauf changement d'instance)
  apiBase: "https://margauxbouriez2.app.n8n.cloud/webhook",

  // Contenu de secours (même structure que dans l'espace privé)
  contenu: {
    reglages: {
      logo: "",
      heroTitre: "La voile à HEC Paris",
      heroTexte: "Régates, croisières et sorties en mer : le Club Voile HEC fait naviguer les étudiants d'HEC Paris, de la Course Croisière EDHEC au WEIOS.",
      heroImage: "images/hero.jpg",
      presentationTitre: "Un équipage, une école, le large",
      presentation: "Le Club Voile HEC réunit les étudiants d'HEC Paris qui aiment la mer, qu'ils aient déjà navigué ou qu'ils découvrent la voile sur le campus.\n\nChaque année, le club prépare un équipage pour la Course Croisière EDHEC et organise le WEIOS en juin.",
      partenariatTitre: "Devenir partenaire du Club Voile HEC",
      partenariatTexte: "Associez votre marque à un équipage étudiant et à la communauté HEC Paris : visibilité sur nos voiles et nos tenues, sur nos réseaux et pendant nos régates, et rencontres avec l'équipage.",
      contactNom: "Le bureau du Club Voile HEC",
      contactEmail: "",
      contactTel: "",
      instagram: "",
      linkedin: "",
      dossierUrl: "",
      creditsPhotos: "Photos : Liilia Moroz (CC BY-SA 4.0), Donan Raven (CC BY-SA 3.0), Isles Yacht Club (CC BY 2.0), via Wikimedia Commons."
    },
    chiffre: [
      { valeur: "CCE", libelle: "la Course Croisière EDHEC, en juin" },
      { valeur: "WEIOS", libelle: "organisé par le club, en juin" }
    ],
    palmares: [],
    entrainement: [],
    competition: [
      { nom: "CCE – Course Croisière EDHEC", date: "2027-06-05", dateFin: "", lieu: "Date et lieu à confirmer", resultat: "" },
      { nom: "WEIOS", date: "2027-06-19", dateFin: "", lieu: "Date et lieu à confirmer", resultat: "" }
    ],
    photo: [
      { src: "images/galerie/voiliers-cannes.jpg", legende: "Au large", tournoi: "" },
      { src: "images/galerie/regate-1.jpg", legende: "Régate", tournoi: "" },
      { src: "images/galerie/regate-2.jpg", legende: "Bord de près", tournoi: "" }
    ],
    partenaire: [],
    offre: [
      { nom: "Supporter", prix: "À partir de 500 €", avantages: "Logo sur le site et nos publications de saison\nMention pendant nos régates\nInvitation à une sortie en mer", miseEnAvant: false },
      { nom: "Partenaire officiel", prix: "À partir de 2 000 €", avantages: "Logo sur les tenues de l'équipage\nPublications dédiées sur nos réseaux\nPrésence de votre marque sur la CCE\nRencontre avec l'équipage", miseEnAvant: true },
      { nom: "Partenaire principal", prix: "Sur devis", avantages: "Logo sur la voile du bateau\nNaming du WEIOS ou d'un événement\nSortie en mer avec vos équipes\nBilan de visibilité en fin de saison", miseEnAvant: false }
    ]
  }
};
