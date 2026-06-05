/**
 * 国际化配置
 */

import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import translationZH from './zh';
import translationEN from './en';

// 初始化 i18n
export function initI18n(lang: 'en' | 'zh' = 'zh') {
  i18n.use(initReactI18next).init({
    resources: {
      en: {
        translation: translationEN,
      },
      zh: {
        translation: translationZH,
      },
    },
    lng: lang,
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false,
    },
  });

  return i18n;
}

export default i18n;
