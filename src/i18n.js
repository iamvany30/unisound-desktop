import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';


import commonRU from './locales/ru/common.json';
import authRU from './locales/ru/auth.json';
import homeRU from './locales/ru/home.json';
import settingsRU from './locales/ru/settings.json';
import adminRU from './locales/ru/admin.json';
import profileRU from './locales/ru/profile.json';
import trackRU from './locales/ru/track.json'; 

const resources = {
  ru: {
    
    common: commonRU,
    auth: authRU,
    home: homeRU,
    settings: settingsRU,
    admin: adminRU,
    profile: profileRU,
    track: trackRU, 
  }
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    
    lng: 'ru', 
    fallbackLng: 'ru',

    debug: process.env.NODE_ENV === 'development',

    
    ns: ['common', 'auth', 'home', 'settings', 'admin', 'profile', 'track'],
    
    defaultNS: 'common',

    interpolation: {
      escapeValue: false
    }
  });

export default i18n;