import type { CommonNs } from '../types';

const zh: CommonNs = {
  appName: '区域地图',
  nav: {
    home: '首页',
    projects: '项目',
    contact: '联系我们',
    billing: '账单',
    about: '关于',
    login: '登录',
    editProfile: '编辑资料',
    logout: '退出登录',
    deleteAccount: '删除账户',
    cancel: '取消',
    logoutError: '退出登录失败，请重试。',
  },
  deleteAccountModal: {
    title: '删除账户',
    content: '确定要删除账户吗？您的所有数据（包括项目）将被永久删除，且无法恢复。',
    ok: '删除账户',
    error: '删除账户失败',
  },
  home: {
    title: '首页',
    welcome: '欢迎使用区域地图应用。',
  },
  about: {
    title: '关于',
    description: '了解更多关于本应用的信息。',
  },
  contact: {
    title: '联系我们',
    subtitle: '有问题？我们随时为您提供帮助。',
    success: '消息已发送！我们会尽快与您联系。',
    error: '发送失败',
    firstName: '名',
    lastName: '姓',
    email: '电子邮箱',
    message: '留言',
    firstNameRequired: '请输入您的名',
    lastNameRequired: '请输入您的姓',
    emailRequired: '请输入电子邮箱',
    messageRequired: '请输入留言内容',
    submit: '发送',
  },
  projects: {
    title: '我的项目',
    searchPlaceholder: '搜索项目...',
    newProject: '新建项目',
    empty: '还没有项目。创建您的第一张地图吧！',
    emptyFiltered: '没有找到匹配的项目。',
  },
  common: {
    loading: '加载中...',
    save: '保存',
    cancel: '取消',
    delete: '删除',
    error: '出错了',
    language: '语言',
  },
};

export default zh;
