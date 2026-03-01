import type { ViolationType } from '@/lib/types';

export type Locale = 'zh-CN' | 'en-US';

export const defaultLocale: Locale = 'zh-CN';
export const localeStorageKey = 'violation_tracker_locale';

const messages: Record<Locale, Record<string, string>> = {
  'zh-CN': {
    'brand.name': '战雷社区记录台',
    'dock.records': '记录',
    'dock.gallery': '图库',
    'dock.newEntry': '新建',
    'dock.login': '登录',
    'dock.register': '注册',
    'dock.signOut': '退出',
    'dock.account': '账户',
    'dock.langZh': '中',
    'dock.langEn': 'EN',
    'role.admin': '管理员',
    'role.user': '用户',
    'role.member': '成员',
    'role.guest': '游客',
    'common.loading': '加载中...',
    'common.refresh': '刷新',
    'common.back': '返回',
    'common.cancel': '取消',
    'common.details': '详情',
    'common.delete': '删除条目',
    'common.confirmDelete': '确认删除此条目吗？此操作不可恢复。',
    'records.title': '违规记录',
    'records.subtitle': '未登录可查看文本记录，图片证据需登录后查看。',
    'records.playerId': '名字',
    'records.wtPlayerName': '战雷用户名',
    'records.type': '类型',
    'records.occurredAt': '发生时间',
    'records.reporter': '记录人',
    'records.createdAt': '创建时间',
    'records.note': '详情',
    'records.viewImage': '查看图片',
    'records.placeholderPlayer': '论坛用户名',
    'records.empty': '暂无记录。',
    'records.me': '我',
    'records.signInToView': '登录后查看',
    'detail.title': '记录详情',
    'detail.id': '记录 ID',
    'detail.basicInfo': '基础信息',
    'detail.message': '违规发言',
    'detail.note': '详情',
    'detail.wtPlayerName': '战雷用户名',
    'detail.evidence': '证据图片',
    'detail.needSignInEvidence': '后可查看图片证据。',
    'detail.noEvidence': '暂无证据图片。',
    'detail.signedUrlError': '图片链接生成失败',
    'detail.notFound': '未找到该记录',
    'detail.deleteSuccess': '条目已删除。',
    'gallery.title': '证据图库',
    'gallery.subtitle': '以瀑布流展示证据图片。',
    'gallery.empty': '暂无图片。',
    'gallery.urlError': '图片链接不可用',
    'gallery.goRecord': '查看对应记录',
    'login.signIn': '登录',
    'login.register': '注册',
    'login.signInTitle': '登录',
    'login.registerTitle': '创建账户',
    'login.registerAccountLink': '注册账号',
    'login.subtitle': '注册用户可查看记录与图库，仅管理员可新建或删除条目。',
    'login.wtName': '战争雷霆用户名',
    'login.wtNameHint': '玩家战争雷霆用户名',
    'login.wtNameRequired': '必须填写战争雷霆用户名。',
    'login.email': '邮箱',
    'login.password': '密码',
    'login.passwordHint': '至少 6 位',
    'login.submitSignIn': '登录',
    'login.submitRegister': '创建账户',
    'login.submitting': '提交中...',
    'login.registerSuccess': '注册成功。若启用邮箱验证，请前往邮箱完成确认。',
    'new.title': '新建违规条目',
    'new.subtitle': '仅管理员可操作。',
    'new.accessChecking': '正在校验权限...',
    'new.adminOnly': '仅管理员可以新建条目。',
    'new.playerId': '名字',
    'new.playerPlaceholder': '论坛用户名',
    'new.wtPlayerName': '战雷用户名（可选）',
    'new.wtPlaceholder': '玩家战争雷霆用户名',
    'new.message': '违规发言内容',
    'new.type': '违规类型',
    'new.occurredAt': '发生时间',
    'new.note': '详情',
    'new.notePlaceholder': '可选详情',
    'new.evidenceImages': '证据图片',
    'new.chooseImages': '选择图片',
    'new.noFiles': '未选择文件',
    'new.fileCount': '已选择 {count} 个文件',
    'new.submit': '提交',
    'new.submitting': '提交中...',
    'new.success': '条目创建成功，正在跳转详情页...',
    'new.sessionExpired': '登录状态已失效，请重新登录。',
    'new.createFailed': '创建条目失败',
    'new.uploadFailed': '上传失败：{name}，{message}',
    'new.evidenceInsertFailed': '证据写入失败：{name}，{message}'
  },
  'en-US': {
    'brand.name': 'WarThunder Community Log',
    'dock.records': 'Records',
    'dock.gallery': 'Gallery',
    'dock.newEntry': 'New',
    'dock.login': 'Login',
    'dock.register': 'Register',
    'dock.signOut': 'Sign Out',
    'dock.account': 'Account',
    'dock.langZh': '中',
    'dock.langEn': 'EN',
    'role.admin': 'Admin',
    'role.user': 'User',
    'role.member': 'Member',
    'role.guest': 'Guest',
    'common.loading': 'Loading...',
    'common.refresh': 'Refresh',
    'common.back': 'Back',
    'common.cancel': 'Cancel',
    'common.details': 'Details',
    'common.delete': 'Delete Entry',
    'common.confirmDelete': 'Delete this entry permanently?',
    'records.title': 'Violation Records',
    'records.subtitle': 'Guests can view text records. Evidence images require sign-in.',
    'records.playerId': 'Name',
    'records.wtPlayerName': 'WT Username',
    'records.type': 'Type',
    'records.occurredAt': 'Occurred At',
    'records.reporter': 'Reporter',
    'records.createdAt': 'Created At',
    'records.note': 'Details',
    'records.viewImage': 'View Images',
    'records.placeholderPlayer': 'Forum username',
    'records.empty': 'No records.',
    'records.me': 'Me',
    'records.signInToView': 'Sign in to view',
    'detail.title': 'Record Details',
    'detail.id': 'Record ID',
    'detail.basicInfo': 'Basic Info',
    'detail.message': 'Message',
    'detail.note': 'Details',
    'detail.wtPlayerName': 'WT Username',
    'detail.evidence': 'Evidence',
    'detail.needSignInEvidence': 'to view evidence images.',
    'detail.noEvidence': 'No evidence images.',
    'detail.signedUrlError': 'Failed to load image URL',
    'detail.notFound': 'Record not found',
    'detail.deleteSuccess': 'Entry deleted.',
    'gallery.title': 'Evidence Gallery',
    'gallery.subtitle': 'Waterfall view of evidence images.',
    'gallery.empty': 'No images found.',
    'gallery.urlError': 'Image URL unavailable',
    'gallery.goRecord': 'Open Record',
    'login.signIn': 'Sign In',
    'login.register': 'Register',
    'login.signInTitle': 'Sign In',
    'login.registerTitle': 'Create Account',
    'login.registerAccountLink': 'Create account',
    'login.subtitle': 'Registered users can view records and gallery. Only admin can create or delete entries.',
    'login.wtName': 'War Thunder Username',
    'login.wtNameHint': 'Player War Thunder username',
    'login.wtNameRequired': 'War Thunder username is required.',
    'login.email': 'Email',
    'login.password': 'Password',
    'login.passwordHint': 'at least 6 characters',
    'login.submitSignIn': 'Sign In',
    'login.submitRegister': 'Create Account',
    'login.submitting': 'Submitting...',
    'login.registerSuccess': 'Registration succeeded. Check email if verification is enabled.',
    'new.title': 'New Violation Entry',
    'new.subtitle': 'Admin-only action.',
    'new.accessChecking': 'Checking access...',
    'new.adminOnly': 'Only admin can create new records.',
    'new.playerId': 'Name',
    'new.playerPlaceholder': 'Forum username',
    'new.wtPlayerName': 'WT Username (optional)',
    'new.wtPlaceholder': 'Player War Thunder username',
    'new.message': 'Message',
    'new.type': 'Type',
    'new.occurredAt': 'Occurred At',
    'new.note': 'Details',
    'new.notePlaceholder': 'Optional details',
    'new.evidenceImages': 'Evidence Images',
    'new.chooseImages': 'Choose Images',
    'new.noFiles': 'No files selected',
    'new.fileCount': '{count} file(s) selected',
    'new.submit': 'Submit',
    'new.submitting': 'Submitting...',
    'new.success': 'Record created. Redirecting to details...',
    'new.sessionExpired': 'Session expired. Please sign in again.',
    'new.createFailed': 'Failed to create record',
    'new.uploadFailed': 'Upload failed: {name}, {message}',
    'new.evidenceInsertFailed': 'Evidence insert failed: {name}, {message}'
  }
};

export function t(locale: Locale, key: string, vars?: Record<string, string | number>) {
  const template = messages[locale][key] ?? messages[defaultLocale][key] ?? key;
  if (!vars) return template;
  return Object.entries(vars).reduce((acc, [name, value]) => {
    return acc.replaceAll(`{${name}}`, String(value));
  }, template);
}

export function getRoleLabel(locale: Locale, role: string) {
  if (role === 'admin') return t(locale, 'role.admin');
  if (role === 'user') return t(locale, 'role.user');
  if (role === 'member') return t(locale, 'role.member');
  return t(locale, 'role.guest');
}

export function getViolationTypeLabel(locale: Locale, type: ViolationType | 'all') {
  if (locale === 'zh-CN') {
    if (type === 'all') return '全部';
    if (type === 'tk') return 'TK';
    if (type === 'troll') return '反串';
    if (type === 'improper') return '不当言论';
    if (type === 'abuse') return '辱骂';
    if (type === 'harassment') return '骚扰';
    if (type === 'hate') return '仇恨';
    if (type === 'spam') return '刷屏';
    return '其他';
  }

  if (type === 'all') return 'All';
  if (type === 'tk') return 'TK';
  if (type === 'troll') return 'Troll';
  if (type === 'improper') return 'Improper Speech';
  if (type === 'abuse') return 'Abuse';
  if (type === 'harassment') return 'Harassment';
  if (type === 'hate') return 'Hate';
  if (type === 'spam') return 'Spam';
  return 'Other';
}

