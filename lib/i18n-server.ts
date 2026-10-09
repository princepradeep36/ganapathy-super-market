import { cookies } from 'next/headers';
import { DEFAULT_LANG, LANG_COOKIE, isLang, translator, type Lang } from './i18n';

/** The visitor's chosen shop language (from the language cookie), English by default. */
export async function getLang(): Promise<Lang> {
  const v = (await cookies()).get(LANG_COOKIE)?.value;
  return isLang(v) ? v : DEFAULT_LANG;
}

export async function getT() {
  const lang = await getLang();
  return { lang, t: translator(lang) };
}
