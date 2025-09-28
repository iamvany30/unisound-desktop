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
import artistPageRU from './locales/ru/artistPage.json';
import playerRU from './locales/ru/player.json';


import commonEN from './locales/en/common.json';
import authEN from './locales/en/auth.json';
import homeEN from './locales/en/home.json';
import settingsEN from './locales/en/settings.json';
import adminEN from './locales/en/admin.json';
import profileEN from './locales/en/profile.json';
import trackEN from './locales/en/track.json';
import artistPageEN from './locales/en/artistPage.json';
import playerEN from './locales/en/player.json';


import commonCN from './locales/cn/common.json';
import authCN from './locales/cn/auth.json';
import homeCN from './locales/cn/home.json';
import settingsCN from './locales/cn/settings.json';
import adminCN from './locales/cn/admin.json';
import profileCN from './locales/cn/profile.json';
import trackCN from './locales/cn/track.json';
import artistPageCN from './locales/cn/artistPage.json';
import playerCN from './locales/cn/player.json';


const resources = {
  ru: {
    common: commonRU,
    auth: authRU,
    home: homeRU,
    settings: settingsRU,
    admin: adminRU,
    profile: profileRU,
    track: trackRU,
    artistPage: artistPageRU,
    player: playerRU,
  },
  en: {
    common: commonEN,
    auth: authEN,
    home: homeEN,
    settings: settingsEN,
    admin: adminEN,
    profile: profileEN,
    track: trackEN,
    artistPage: artistPageEN,
    player: playerEN,
  },
  cn: {
    common: commonCN,
    auth: authCN,
    home: homeCN,
    settings: settingsCN,
    admin: adminCN,
    profile: profileCN,
    track: trackCN,
    artistPage: artistPageCN,
    player: playerCN,
  }
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'ru',
    debug: process.env.NODE_ENV === 'development',
    
    
    ns: ['common', 'auth', 'home', 'settings', 'admin', 'profile', 'track', 'artistPage', 'player'],
    
    defaultNS: 'common',

    interpolation: {
      escapeValue: false
    }
  });

export default i18n;