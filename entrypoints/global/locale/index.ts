// import { zhCn, en } from 'element-plus/es/locales.mjs';
import { createI18n } from 'vue-i18n';
import enLocale from './en.json';
import zhCNLocale from './zh-CN.json';

const __DEV__ = import.meta.env.MODE === 'development' as const;
type Language = WritableComputedRef<"en" | "zh-CN", "en" | "zh-CN">;

export const messages = {
  en: {
    // ...en.el,
    ...enLocale
  },
  'zh-CN': {
    // ...zhCn.el,
    ...zhCNLocale
  },
};

if (__DEV__) {
  console.group("语言: " + chrome.i18n.getUILanguage());
  console.log(messages);
  console.groupEnd();
}

export const parseLanguage = (lan: string)=> {
  if(lan.includes('zh')) return 'zh-CN';
  return 'en';
};

const i18n = createI18n({
  locale: parseLanguage(chrome.i18n.getUILanguage()),
  messages,
  legacy: false,
});

export const setLanguage = (lan: Language) => {
  i18n.global.locale = lan;
};

export const getLanguage = () => i18n.global.locale;

export const t = (key: string, options: Record<string, any> = {}) => {
  if (!key) return '';
  return i18n.global.t(key, options);
};

export default i18n;
