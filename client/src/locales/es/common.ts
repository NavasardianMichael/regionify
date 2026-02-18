import type { CommonNs } from '../types';

const es: CommonNs = {
  appName: 'Mapa de regiones',
  nav: {
    home: 'Inicio',
    projects: 'Proyectos',
    contact: 'Contacto',
    billing: 'Facturación',
    about: 'Acerca de',
    login: 'Iniciar sesión',
    editProfile: 'Editar perfil',
    logout: 'Cerrar sesión',
    deleteAccount: 'Eliminar cuenta',
    cancel: 'Cancelar',
    logoutError: 'Error al cerrar sesión. Inténtalo de nuevo.',
  },
  deleteAccountModal: {
    title: 'Eliminar cuenta',
    content:
      '¿Estás seguro de que quieres eliminar tu cuenta? Todos tus datos, incluidos los proyectos, se eliminarán de forma permanente. Esta acción no se puede deshacer.',
    ok: 'Eliminar cuenta',
    error: 'No se pudo eliminar la cuenta',
  },
  home: {
    title: 'Inicio',
    welcome: 'Bienvenido a la aplicación Mapa de regiones.',
  },
  about: {
    title: 'Acerca de',
    description: 'Conoce más sobre esta aplicación.',
  },
  contact: {
    title: 'Contáctanos',
    subtitle: '¿Tienes alguna pregunta? Estamos aquí para ayudarte.',
    success: '¡Mensaje enviado! Nos pondremos en contacto contigo pronto.',
    error: 'No se pudo enviar el mensaje',
    firstName: 'Nombre',
    lastName: 'Apellido',
    email: 'Correo electrónico',
    message: 'Mensaje',
    firstNameRequired: 'Introduce tu nombre',
    lastNameRequired: 'Introduce tu apellido',
    emailRequired: 'Introduce tu correo electrónico',
    messageRequired: 'Introduce tu mensaje',
    submit: 'Enviar mensaje',
  },
  projects: {
    title: 'Mis proyectos',
    searchPlaceholder: 'Buscar proyectos...',
    newProject: 'Nuevo proyecto',
    empty: 'Aún no hay proyectos. ¡Crea tu primera visualización!',
    emptyFiltered: 'Ningún proyecto coincide con la búsqueda.',
  },
  common: {
    loading: 'Cargando...',
    save: 'Guardar',
    cancel: 'Cancelar',
    delete: 'Eliminar',
    error: 'Algo salió mal',
    language: 'Idioma',
  },
};

export default es;
