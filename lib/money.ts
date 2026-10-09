const fmt = new Intl.NumberFormat('sv-SE', { style: 'currency', currency: 'SEK' });
/** Format an amount stored in öre (1/100 SEK). */
export const sek = (ore: number) => fmt.format((ore || 0) / 100);
