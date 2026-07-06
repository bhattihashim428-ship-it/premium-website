export const translations = {
  en: {
    // Auth
    login: 'Login', register: 'Register', logout: 'Logout',
    email: 'Email', password: 'Password', fullName: 'Full Name',
    username: 'Username', phone: 'Phone Number', country: 'Country',
    forgotPassword: 'Forgot Password?', resetPassword: 'Reset Password',
    rememberMe: 'Keep me logged in', noAccount: "Don't have an account?",
    haveAccount: 'Already have an account?',
    // Nav
    dashboard: 'Dashboard', wallet: 'Wallet', deposit: 'Deposit',
    withdraw: 'Withdraw', transactions: 'Transactions', vip: 'VIP Center',
    gifts: 'Gift Center', support: 'Support', settings: 'Settings',
    profile: 'Profile', notifications: 'Notifications', contact: 'Contact',
    // Dashboard
    welcome: 'Welcome', walletBalance: 'Wallet Balance', vipLevel: 'VIP Level',
    todayReward: "Today's Reward", totalDeposits: 'Total Deposits',
    totalWithdrawals: 'Total Withdrawals', totalRewards: 'Total Rewards',
    claimReward: 'Claim Reward', depositNow: 'Deposit Now', withdrawNow: 'Withdraw Now',
    // Misc
    save: 'Save', cancel: 'Cancel', submit: 'Submit', search: 'Search',
    pending: 'Pending', approved: 'Approved', rejected: 'Rejected',
    status: 'Status', amount: 'Amount', date: 'Date', reference: 'Reference ID',
    loading: 'Loading...', noData: 'No data found',
  },
  ur: {
    login: 'لاگ ان', register: 'رجسٹر', logout: 'لاگ آؤٹ',
    email: 'ای میل', password: 'پاس ورڈ', fullName: 'پورا نام',
    username: 'یوزر نام', phone: 'فون نمبر', country: 'ملک',
    forgotPassword: 'پاس ورڈ بھول گئے؟', resetPassword: 'پاس ورڈ ری سیٹ',
    rememberMe: 'لاگ ان رکھیں', noAccount: 'اکاؤنٹ نہیں ہے؟',
    haveAccount: 'پہلے سے اکاؤنٹ ہے؟',
    dashboard: 'ڈیش بورڈ', wallet: 'والٹ', deposit: 'جمع', withdraw: 'نکلواؤ',
    transactions: 'لین دین', vip: 'VIP سینٹر', gifts: 'گفٹ سینٹر',
    support: 'سپورٹ', settings: 'سیٹنگز', profile: 'پروفائل',
    notifications: 'اطلاعات', contact: 'رابطہ',
    welcome: 'خوش آمدید', walletBalance: 'والٹ بیلنس', vipLevel: 'VIP لیول',
    todayReward: 'آج کا انعام', totalDeposits: 'کل جمع', totalWithdrawals: 'کل نکلواؤ',
    totalRewards: 'کل انعامات', claimReward: 'انعام حاصل کریں',
    depositNow: 'ابھی جمع کریں', withdrawNow: 'ابھی نکلواؤ',
    save: 'محفوظ کریں', cancel: 'منسوخ', submit: 'جمع کرائیں', search: 'تلاش',
    pending: 'زیر التواء', approved: 'منظور شدہ', rejected: 'رد شدہ',
    status: 'حالت', amount: 'رقم', date: 'تاریخ', reference: 'حوالہ آئی ڈی',
    loading: 'لوڈ ہو رہا ہے...', noData: 'کوئی ڈیٹا نہیں ملا',
  },
} as const;

export type Language = keyof typeof translations;
export type TranslationKey = keyof typeof translations.en;

export function t(lang: Language, key: TranslationKey): string {
  return translations[lang][key] ?? translations.en[key] ?? key;
}
