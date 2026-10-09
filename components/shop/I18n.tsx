'use client';
import { createContext, useContext, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { DEFAULT_LANG, LANGS, LANG_COOKIE, LANG_LABEL, translator, type Lang } from '@/lib/i18n';

const LangContext = createContext<Lang>(DEFAULT_LANG);

export function LangProvider({ lang, children }: { lang: Lang; children: React.ReactNode }) {
  return <LangContext.Provider value={lang}>{children}</LangContext.Provider>;
}

export const useLang = () => useContext(LangContext);

/** Translate function for client components. */
export function useT() {
  const lang = useLang();
  return useMemo(() => translator(lang), [lang]);
}

/** Language dropdown in the top bar. Remembers the choice for a year. */
export function LangSwitch() {
  const lang = useLang();
  const t = useT();
  const router = useRouter();
  return (
    <label className="langSwitch">
      <span className="sr-only">{t('Language')}</span>
      <span aria-hidden>🌐</span>
      <select
        value={lang}
        onChange={(e) => {
          document.cookie = `${LANG_COOKIE}=${e.target.value}; path=/; max-age=31536000; samesite=lax`;
          router.refresh();
        }}
      >
        {LANGS.map((l) => <option key={l} value={l} title={LANG_LABEL[l]}>{l.toUpperCase()}</option>)}
      </select>
    </label>
  );
}
