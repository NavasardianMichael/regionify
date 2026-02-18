import type { CommonNs } from '../types';

const fr: CommonNs = {
  appName: 'Carte des régions',
  nav: {
    home: 'Accueil',
    projects: 'Projets',
    contact: 'Contact',
    billing: 'Facturation',
    about: 'À propos',
    login: 'Connexion',
    editProfile: 'Modifier le profil',
    logout: 'Déconnexion',
    deleteAccount: 'Supprimer le compte',
    cancel: 'Annuler',
    logoutError: 'Échec de la déconnexion. Veuillez réessayer.',
  },
  deleteAccountModal: {
    title: 'Supprimer le compte',
    content:
      'Êtes-vous sûr de vouloir supprimer votre compte ? Toutes vos données, y compris les projets, seront définitivement effacées. Cette action est irréversible.',
    ok: 'Supprimer le compte',
    error: 'Échec de la suppression du compte',
  },
  home: {
    title: 'Accueil',
    welcome: "Bienvenue sur l'application Carte des régions.",
  },
  about: {
    title: 'À propos',
    description: 'En savoir plus sur cette application.',
  },
  contact: {
    title: 'Nous contacter',
    subtitle: 'Une question ? Nous sommes là pour vous aider.',
    success: 'Message envoyé ! Nous vous recontacterons bientôt.',
    error: "Échec de l'envoi du message",
    firstName: 'Prénom',
    lastName: 'Nom',
    email: 'E-mail',
    message: 'Message',
    firstNameRequired: 'Veuillez indiquer votre prénom',
    lastNameRequired: 'Veuillez indiquer votre nom',
    emailRequired: 'Veuillez indiquer votre e-mail',
    messageRequired: 'Veuillez indiquer votre message',
    submit: 'Envoyer le message',
  },
  projects: {
    title: 'Mes projets',
    searchPlaceholder: 'Rechercher des projets...',
    newProject: 'Nouveau projet',
    empty: "Aucun projet pour l'instant. Créez votre première carte !",
    emptyFiltered: 'Aucun projet ne correspond à votre recherche.',
  },
  common: {
    loading: 'Chargement...',
    save: 'Enregistrer',
    cancel: 'Annuler',
    delete: 'Supprimer',
    error: "Une erreur s'est produite",
    language: 'Langue',
  },
};

export default fr;
