import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './locales/en.json';
import fr from './locales/fr.json';

i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    fr: { translation: fr },
  },
  lng: 'fr',
  fallbackLng: 'fr',
  interpolation: {
    escapeValue: false,
  },
  compatibilityJSON: 'v4',
});

export const changeLanguage = (lang: 'fr' | 'en') => {
  i18n.changeLanguage(lang);
};

export const getCurrentLanguage = (): 'fr' | 'en' => {
  return (i18n.language?.startsWith('fr') ? 'fr' : 'en') as 'fr' | 'en';
};

export default i18n;
