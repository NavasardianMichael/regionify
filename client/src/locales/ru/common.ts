import type { CommonNs } from '../types';

const ru: CommonNs = {
  appName: 'Карта регионов',
  nav: {
    home: 'Главная',
    projects: 'Проекты',
    contact: 'Контакты',
    billing: 'Оплата',
    about: 'О приложении',
    login: 'Войти',
    editProfile: 'Редактировать профиль',
    logout: 'Выйти',
    deleteAccount: 'Удалить аккаунт',
    cancel: 'Отмена',
    logoutError: 'Не удалось выйти. Попробуйте ещё раз.',
  },
  deleteAccountModal: {
    title: 'Удалить аккаунт',
    content:
      'Вы уверены, что хотите удалить аккаунт? Все данные, включая проекты, будут удалены безвозвратно. Это действие нельзя отменить.',
    ok: 'Удалить аккаунт',
    error: 'Не удалось удалить аккаунт',
  },
  home: {
    title: 'Главная',
    welcome: 'Добро пожаловать в приложение «Карта регионов».',
  },
  about: {
    title: 'О приложении',
    description: 'Подробнее об этом приложении.',
  },
  contact: {
    title: 'Связаться с нами',
    subtitle: 'Остались вопросы? Мы здесь, чтобы помочь.',
    success: 'Сообщение отправлено! Мы скоро с вами свяжемся.',
    error: 'Не удалось отправить сообщение',
    firstName: 'Имя',
    lastName: 'Фамилия',
    email: 'Эл. почта',
    message: 'Сообщение',
    firstNameRequired: 'Введите имя',
    lastNameRequired: 'Введите фамилию',
    emailRequired: 'Введите адрес эл. почты',
    messageRequired: 'Введите сообщение',
    submit: 'Отправить',
  },
  projects: {
    title: 'Мои проекты',
    searchPlaceholder: 'Поиск проектов...',
    newProject: 'Новый проект',
    empty: 'Пока нет проектов. Создайте первую карту!',
    emptyFiltered: 'По вашему запросу ничего не найдено.',
  },
  common: {
    loading: 'Загрузка...',
    save: 'Сохранить',
    cancel: 'Отмена',
    delete: 'Удалить',
    error: 'Что-то пошло не так',
    language: 'Язык',
  },
};

export default ru;
