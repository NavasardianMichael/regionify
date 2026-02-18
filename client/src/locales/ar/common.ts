import type { CommonNs } from '../types';

const ar: CommonNs = {
  appName: 'خريطة المناطق',
  nav: {
    home: 'الرئيسية',
    projects: 'المشاريع',
    contact: 'اتصل بنا',
    billing: 'الفوترة',
    about: 'عن التطبيق',
    login: 'تسجيل الدخول',
    editProfile: 'تعديل الملف الشخصي',
    logout: 'تسجيل الخروج',
    deleteAccount: 'حذف الحساب',
    cancel: 'إلغاء',
    logoutError: 'فشل تسجيل الخروج. يرجى المحاولة مرة أخرى.',
  },
  deleteAccountModal: {
    title: 'حذف الحساب',
    content:
      'هل أنت متأكد من حذف حسابك؟ سيتم حذف جميع بياناتك بما فيها المشاريع نهائياً. لا يمكن التراجع عن هذا الإجراء.',
    ok: 'حذف الحساب',
    error: 'فشل في حذف الحساب',
  },
  home: {
    title: 'الرئيسية',
    welcome: 'مرحباً بك في تطبيق خريطة المناطق.',
  },
  about: {
    title: 'عن التطبيق',
    description: 'اعرف المزيد عن هذا التطبيق.',
  },
  contact: {
    title: 'اتصل بنا',
    subtitle: 'لديك سؤال؟ نحن هنا لمساعدتك.',
    success: 'تم إرسال رسالتك بنجاح! سنتواصل معك قريباً.',
    error: 'فشل إرسال الرسالة',
    firstName: 'الاسم الأول',
    lastName: 'اسم العائلة',
    email: 'البريد الإلكتروني',
    message: 'الرسالة',
    firstNameRequired: 'الرجاء إدخال اسمك الأول',
    lastNameRequired: 'الرجاء إدخال اسم العائلة',
    emailRequired: 'الرجاء إدخال بريدك الإلكتروني',
    messageRequired: 'الرجاء إدخال رسالتك',
    submit: 'إرسال الرسالة',
  },
  projects: {
    title: 'مشاريعي',
    searchPlaceholder: 'البحث في المشاريع...',
    newProject: 'مشروع جديد',
    empty: 'لا توجد مشاريع بعد. أنشئ أول خريطة لك!',
    emptyFiltered: 'لا توجد مشاريع تطابق البحث.',
  },
  common: {
    loading: 'جاري التحميل...',
    save: 'حفظ',
    cancel: 'إلغاء',
    delete: 'حذف',
    error: 'حدث خطأ ما',
    language: 'اللغة',
  },
};

export default ar;
