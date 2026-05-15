import { translations } from '../translations';
import { useLanguage } from '../contexts/LanguageContext';

export function translateProfession(profession: string, language: 'en' | 'mk' = 'en'): string {
  if (!profession || profession.trim() === '') {
    return profession;
  }

  const langTranslations = translations[language] || translations.en;

  const exactKey = `onboarding.basicInfo.professions.${profession}` as any;
  if (langTranslations[exactKey]) {
    return langTranslations[exactKey];
  }

  const lowerKey = `onboarding.basicInfo.professions.${profession.toLowerCase()}` as any;
  if (langTranslations[lowerKey]) {
    return langTranslations[lowerKey];
  }

  return profession;
}

export function useTranslateProfession() {
  const { language } = useLanguage();

  return (profession: string) => translateProfession(profession, language as 'en' | 'mk');
}






