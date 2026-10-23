import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getLang } from '@/lib/i18n-server';
import { getSchedule } from '@/lib/schedule';
import { INFO_PAGES, INFO_TITLES, infoPage, isInfoSlug } from '@/lib/info';

type Props = { params: Promise<{ page: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { page } = await params;
  if (!isInfoSlug(page)) return {};
  return { title: INFO_TITLES[page][await getLang()] };
}

export default async function InfoPage({ params }: Props) {
  const { page } = await params;
  if (!isInfoSlug(page)) notFound();
  const lang = await getLang();
  const info = infoPage(page, lang, await getSchedule());
  return (
    <main className="wrap section narrow infoPage">
      <nav className="infoTabs" aria-label={lang === 'sv' ? 'Kundinformation' : 'Customer information'}>
        {INFO_PAGES.map((p) => <Link key={p} href={`/info/${p}`} className={`chip chip-ghost${p === page ? ' on' : ''}`} aria-current={p === page ? 'page' : undefined}>{INFO_TITLES[p][lang]}</Link>)}
      </nav>
      <h1>{info.title}</h1>
      <p className="infoIntro">{info.intro}</p>
      {info.sections.map((s) => (
        <section key={s.h}>
          <h2>{s.h}</h2>
          {s.body.map((b, i) => (Array.isArray(b) ? <ul key={i}>{b.map((x) => <li key={x}>{x}</li>)}</ul> : <p key={i}>{b}</p>))}
        </section>
      ))}
    </main>
  );
}
