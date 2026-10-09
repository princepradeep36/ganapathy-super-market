'use client';
import { Children, useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { useT } from './I18n';

/** Home page banner that fades between its slides, with dots, arrows and swipe. */
export default function HeroCarousel({ children, labels, interval = 3000 }: { children: ReactNode; labels: string[]; interval?: number }) {
  const t = useT();
  const slides = Children.toArray(children);
  const count = slides.length;
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const touchX = useRef<number | null>(null);

  const go = useCallback((i: number) => setIndex(((i % count) + count) % count), [count]);

  useEffect(() => {
    if (paused || count < 2) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const t = setTimeout(() => go(index + 1), interval);
    return () => clearTimeout(t);
  }, [index, paused, count, interval, go]);

  return (
    <div
      className="carousel"
      role="region"
      aria-roledescription="carousel"
      aria-label={t('Highlights')}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
      onTouchStart={(e) => { touchX.current = e.touches[0].clientX; setPaused(true); }}
      onTouchEnd={(e) => {
        const start = touchX.current;
        touchX.current = null;
        setPaused(false);
        if (start == null) return;
        const dx = e.changedTouches[0].clientX - start;
        if (Math.abs(dx) > 40) go(index + (dx < 0 ? 1 : -1));
      }}
    >
      <div className="carouselTrack">
        {slides.map((s, i) => (
          <div className={`carouselSlide${i === index ? ' on' : ''}`} key={i} role="group" aria-roledescription="slide" aria-label={t('{i} of {n}: {name}', { i: i + 1, n: count, name: labels[i] ?? '' })} aria-hidden={i !== index} inert={i !== index}>
            {s}
          </div>
        ))}
      </div>
      {count > 1 && (
        <>
          <button type="button" className="carouselArrow prev" aria-label={t('Previous slide')} onClick={() => go(index - 1)}>‹</button>
          <button type="button" className="carouselArrow next" aria-label={t('Next slide')} onClick={() => go(index + 1)}>›</button>
          <div className="carouselDots">
            {slides.map((_, i) => (
              <button key={i} type="button" className={i === index ? 'on' : ''} aria-label={t('Show {name}', { name: labels[i] ?? String(i + 1) })} aria-current={i === index} onClick={() => go(i)} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
