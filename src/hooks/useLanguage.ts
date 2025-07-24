import { useTranslation } from 'react-i18next';

export const useLanguage = () => {
  const { i18n } = useTranslation();

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
    localStorage.setItem('language', lng);
  };

  const availableLanguages = [
    { code: 'en', name: 'English (US)', flag: '🇺🇸' },
    { code: 'nl', name: 'Nederlands', flag: '🇳🇱' }
  ];

  return {
    currentLanguage: i18n.language,
    changeLanguage,
    availableLanguages
  };
};