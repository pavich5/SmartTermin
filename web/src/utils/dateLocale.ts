import { enUS, mk } from 'date-fns/locale';
import { Locale } from 'date-fns';

export function getDateLocale(language: 'en' | 'mk'): Locale {
  return language === 'mk' ? mk : enUS;
}
