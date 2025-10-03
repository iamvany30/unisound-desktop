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
import adminCN from './locales/cn/admin.json';
import artistPageCN from './locales/cn/artistPage.json';
import authCN from './locales/cn/auth.json';
import commonCN from './locales/cn/common.json';
import homeCN from './locales/cn/home.json';
import playerCN from './locales/cn/player.json';
import profileCN from './locales/cn/profile.json';
import settingsCN from './locales/cn/settings.json';
import trackCN from './locales/cn/track.json';
import adminEN from './locales/en/admin.json';
import artistPageEN from './locales/en/artistPage.json';
import authEN from './locales/en/auth.json';
import commonEN from './locales/en/common.json';
import homeEN from './locales/en/home.json';
import playerEN from './locales/en/player.json';
import profileEN from './locales/en/profile.json';
import settingsEN from './locales/en/settings.json';
import trackEN from './locales/en/track.json';
import adminFR from './locales/fr/admin.json';
import artistPageFR from './locales/fr/artistPage.json';
import authFR from './locales/fr/auth.json';
import commonFR from './locales/fr/common.json';
import homeFR from './locales/fr/home.json';
import playerFR from './locales/fr/player.json';
import profileFR from './locales/fr/profile.json';
import settingsFR from './locales/fr/settings.json';
import trackFR from './locales/fr/track.json';
import adminRUSLANG from './locales/RUSLANG/admin.json';
import artistPageRUSLANG from './locales/RUSLANG/artistPage.json';
import authRUSLANG from './locales/RUSLANG/auth.json';
import commonRUSLANG from './locales/RUSLANG/common.json';
import homeRUSLANG from './locales/RUSLANG/home.json';
import playerRUSLANG from './locales/RUSLANG/player.json';
import profileRUSLANG from './locales/RUSLANG/profile.json';
import settingsRUSLANG from './locales/RUSLANG/settings.json';
import trackRUSLANG from './locales/RUSLANG/track.json';

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
  cn: {
    admin: adminCN,
    artistPage: artistPageCN,
    auth: authCN,
    common: commonCN,
    home: homeCN,
    player: playerCN,
    profile: profileCN,
    settings: settingsCN,
    track: trackCN
  },
  en: {
    admin: adminEN,
    artistPage: artistPageEN,
    auth: authEN,
    common: commonEN,
    home: homeEN,
    player: playerEN,
    profile: profileEN,
    settings: settingsEN,
    track: trackEN
  },
  fr: {
    admin: adminFR,
    artistPage: artistPageFR,
    auth: authFR,
    common: commonFR,
    home: homeFR,
    player: playerFR,
    profile: profileFR,
    settings: settingsFR,
    track: trackFR
  },
  RUSLANG: {
    admin: adminRUSLANG,
    artistPage: artistPageRUSLANG,
    auth: authRUSLANG,
    common: commonRUSLANG,
    home: homeRUSLANG,
    player: playerRUSLANG,
    profile: profileRUSLANG,
    settings: settingsRUSLANG,
    track: trackRUSLANG
  },};

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