// Customer information pages: delivery, terms of purchase, privacy and FAQ.
// Written in plain language from the store settings, in English and Swedish.
import { sek } from './money';
import { store } from './config';
import type { Lang } from './i18n';
import type { Schedule } from './slots';

export type InfoBlock = string | string[];
export type InfoPage = { title: string; intro: string; sections: { h: string; body: InfoBlock[] }[] };
export const INFO_PAGES = ['delivery', 'terms', 'privacy', 'faq'] as const;
export type InfoSlug = (typeof INFO_PAGES)[number];
export const isInfoSlug = (s: string): s is InfoSlug => (INFO_PAGES as readonly string[]).includes(s);

export const INFO_TITLES: Record<InfoSlug, Record<Lang, string>> = {
  delivery: { en: 'Delivery & pickup', sv: 'Leverans & hämtning' },
  terms: { en: 'Terms of purchase', sv: 'Köpvillkor' },
  privacy: { en: 'Privacy policy', sv: 'Integritetspolicy' },
  faq: { en: 'Questions & answers', sv: 'Frågor & svar' },
};

const DAYS = { en: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'], sv: ['söndag', 'måndag', 'tisdag', 'onsdag', 'torsdag', 'fredag', 'lördag'] };

function dayList(days: number[], lang: Lang) {
  if (days.length === 7) return lang === 'sv' ? 'alla dagar' : 'every day';
  const names = [1, 2, 3, 4, 5, 6, 0].filter((d) => days.includes(d)).map((d) => DAYS[lang][d]);
  const and = lang === 'sv' ? ' och ' : ' and ';
  return names.length > 1 ? names.slice(0, -1).join(', ') + and + names[names.length - 1] : names[0] || '';
}

function hours(minutes: number, lang: Lang) {
  if (minutes % 60) return `${minutes} ${lang === 'sv' ? 'minuter' : 'minutes'}`;
  const h = minutes / 60;
  return lang === 'sv' ? `${h} ${h === 1 ? 'timme' : 'timmar'}` : `${h} ${h === 1 ? 'hour' : 'hours'}`;
}

export function infoPage(slug: InfoSlug, lang: Lang, s: Schedule): InfoPage {
  const contact = [store.phone, store.email].filter(Boolean).join(lang === 'sv' ? ' eller ' : ' or ');
  const fee = sek(store.deliveryFee), free = sek(store.freeDeliveryMin), min = sek(store.minDeliveryOrder);
  const swish = store.swish;
  const company = `${store.legalName} (${lang === 'sv' ? 'org.nr' : 'reg. no.'} ${store.orgNumber}), ${store.address}`;
  const sv = lang === 'sv';

  if (slug === 'delivery') return sv ? {
    title: INFO_TITLES.delivery.sv,
    intro: `Hämta gratis i butiken eller få varorna hemkörda i ${store.deliveryArea}. Du väljer dag och tid i kassan.`,
    sections: [
      { h: 'Hemleverans', body: [[
        `Vi kör ut inom ${store.deliveryArea} (postnummer som börjar på ${store.deliveryPrefixes.join(', ')}).`,
        `Fri leverans när du handlar för minst ${free}. Under det kostar leveransen ${fee}.`,
        `Minsta order för hemleverans är ${min}.`,
        `Leveransdagar: ${dayList(s.days, 'sv')}. Tider: ${s.slots.join(', ')}.`,
        `Beställ minst ${hours(s.cutoffMinutes, 'sv')} innan tiden börjar. Du kan boka upp till ${s.daysAhead} dagar framåt.`,
      ]] },
      { h: 'Hämta i butiken', body: [[
        `Alltid gratis, utan minsta order.`,
        `Adress: ${store.address}. ${store.hours}.`,
        `Vi ringer eller mejlar när din order är packad och klar att hämta.`,
      ]] },
      { h: 'Bor du utanför området?', body: [`Välj hämtning i butiken, eller ring oss på ${store.phone} så ser vi vad vi kan göra för större beställningar.`] },
    ],
  } : {
    title: INFO_TITLES.delivery.en,
    intro: `Pick up free in the store, or have your groceries delivered in ${store.deliveryArea}. You choose the day and time at checkout.`,
    sections: [
      { h: 'Home delivery', body: [[
        `We deliver within ${store.deliveryArea} (postcodes starting ${store.deliveryPrefixes.join(', ')}).`,
        `Free delivery on orders of ${free} or more. Below that, delivery costs ${fee}.`,
        `The minimum order for home delivery is ${min}.`,
        `Delivery days: ${dayList(s.days, 'en')}. Time slots: ${s.slots.join(', ')}.`,
        `Order at least ${hours(s.cutoffMinutes, 'en')} before a slot starts. You can book up to ${s.daysAhead} days ahead.`,
      ]] },
      { h: 'Store pickup', body: [[
        `Always free, with no minimum order.`,
        `Address: ${store.address}. ${store.hours}.`,
        `We call or e-mail you when your order is packed and ready.`,
      ]] },
      { h: 'Outside the delivery area?', body: [`Choose store pickup, or call us on ${store.phone} and we'll see what we can do for larger orders.`] },
    ],
  };

  if (slug === 'terms') return sv ? {
    title: INFO_TITLES.terms.sv,
    intro: `Dessa villkor gäller när du handlar på ${store.name}. Säljare är ${company}.`,
    sections: [
      { h: 'Priser och betalning', body: [[
        'Alla priser är i svenska kronor inklusive moms.',
        'Erbjudanden gäller så länge de visas i butiken och så långt lagret räcker.',
        `Du betalar när du får varorna: med kort, kontant eller Swish vid hämtning eller leverans${swish ? `, eller med Swish i förväg till ${swish}` : ''}. Vi tar aldrig betalt online på webbplatsen.`,
      ]] },
      { h: 'Din beställning', body: [[
        'Du får en orderbekräftelse med ordernummer direkt efter beställningen.',
        'Om en vara tagit slut kontaktar vi dig och tar bort eller byter den bara om du godkänner det. Du betalar bara för det du får.',
        'Färskvaror som säljs per vikt (t.ex. grönsaker) kan väga lite mer eller mindre än angivet.',
      ]] },
      { h: 'Ändra eller avbryta', body: [`Ring eller mejla oss (${contact}) så snart som möjligt. Du kan ändra eller avbryta kostnadsfritt tills ordern har packats.`] },
      { h: 'Ångerrätt', body: [
        'Enligt distansavtalslagen har du 14 dagars ångerrätt från att du fått varorna. Ångerrätten gäller inte för livsmedel och andra varor som snabbt blir dåliga (t.ex. färskt, kylt och fryst), och inte för förseglade varor som öppnats av hälso- eller hygienskäl.',
        'Vill du ångra ett köp av oöppnade, hållbara varor: kontakta oss och lämna tillbaka varan i butiken. Vi betalar tillbaka inom 14 dagar.',
      ] },
      { h: 'Fel på en vara', body: [
        `Är något skadat, fel eller saknas? Hör av dig så snart du upptäcker det, gärna inom två dagar för färskvaror, med ordernummer och gärna en bild. Vi ersätter varan eller betalar tillbaka. Du har alltid reklamationsrätt enligt konsumentköplagen.`,
      ] },
      { h: 'Tvister', body: [`Kontakta oss först så löser vi det tillsammans. Om vi inte blir överens kan du vända dig till Allmänna reklamationsnämnden (arn.se).`] },
    ],
  } : {
    title: INFO_TITLES.terms.en,
    intro: `These terms apply when you shop at ${store.name}. The seller is ${company}.`,
    sections: [
      { h: 'Prices and payment', body: [[
        'All prices are in Swedish kronor and include VAT (moms).',
        'Offers apply while they are shown in the shop and while stock lasts.',
        `You pay when you receive your groceries: card, cash or Swish at pickup or on delivery${swish ? `, or Swish in advance to ${swish}` : ''}. We never take payment online on the website.`,
      ]] },
      { h: 'Your order', body: [[
        'You get an order confirmation with an order number right after ordering.',
        'If an item has run out, we contact you and only remove or replace it with your OK. You only pay for what you get.',
        'Fresh items sold by weight (such as vegetables) may weigh slightly more or less than stated.',
      ]] },
      { h: 'Changing or cancelling', body: [`Call or e-mail us (${contact}) as soon as possible. You can change or cancel free of charge until the order has been packed.`] },
      { h: 'Right of withdrawal', body: [
        'Under Swedish distance-selling law you have 14 days to change your mind after receiving your goods. This does not apply to food and other goods that spoil quickly (fresh, chilled and frozen), or to sealed goods that have been opened, for health or hygiene reasons.',
        'To return unopened, long-life goods, contact us and bring the item back to the store. We refund you within 14 days.',
      ] },
      { h: 'Something wrong?', body: [
        'If an item is damaged, wrong or missing, tell us as soon as you notice, preferably within two days for fresh items, with your order number and a photo if you can. We replace the item or refund you. Your statutory right to complain under the Swedish Consumer Sales Act always applies.',
      ] },
      { h: 'Disputes', body: ['Please contact us first and we will sort it out together. If we cannot agree, you can turn to the National Board for Consumer Disputes (arn.se).'] },
    ],
  };

  if (slug === 'privacy') return sv ? {
    title: INFO_TITLES.privacy.sv,
    intro: `${company} är personuppgiftsansvarig för de uppgifter du lämnar i butiken.`,
    sections: [
      { h: 'Vad vi sparar och varför', body: [
        'När du beställer sparar vi namn, telefon, e-post, adress (vid leverans) och vad du köpt. Vi använder uppgifterna för att packa, leverera och kontakta dig om din order. Om du önskar en produkt sparar vi det du skriver i formuläret så att vi kan svara dig.',
        'Vi säljer aldrig dina uppgifter och skickar ingen reklam utan att du bett om det.',
      ] },
      { h: 'Hur länge', body: ['Orderuppgifter sparas så länge bokföringslagen kräver (sju år). Produktönskemål raderas när de är besvarade och inte längre behövs.'] },
      { h: 'Var uppgifterna finns', body: ['Webbplatsen och databasen ligger på servrar inom EU (Hetzner, Finland). E-post skickas via Google (Gmail).'] },
      { h: 'Cookies och lagring i webbläsaren', body: ['Vi använder ingen spårning och inga annonscookies. Webbläsaren sparar bara det som behövs: din varukorg, ditt språkval och dina kontaktuppgifter från förra beställningen så att du slipper skriva dem igen. Du kan rensa det när du vill i webbläsarens inställningar.'] },
      { h: 'Dina rättigheter', body: [`Du kan be att få se, rätta eller radera dina uppgifter. Kontakta oss på ${contact}. Du kan också klaga hos Integritetsskyddsmyndigheten (imy.se).`] },
    ],
  } : {
    title: INFO_TITLES.privacy.en,
    intro: `${company} is responsible for the personal details you give us in the shop.`,
    sections: [
      { h: 'What we keep and why', body: [
        'When you order we keep your name, phone, e-mail, address (for delivery) and what you bought. We use them to pack and deliver your order and to contact you about it. If you request a product, we keep what you write in the form so we can reply.',
        'We never sell your details and never send marketing you did not ask for.',
      ] },
      { h: 'How long', body: ['Order records are kept as long as Swedish bookkeeping law requires (seven years). Product requests are deleted once answered and no longer needed.'] },
      { h: 'Where it is stored', body: ['The website and database run on servers in the EU (Hetzner, Finland). E-mail is sent through Google (Gmail).'] },
      { h: 'Cookies and browser storage', body: ['We use no tracking and no advertising cookies. Your browser only keeps what the shop needs: your basket, your language choice and your contact details from your last order so you do not have to type them again. You can clear these at any time in your browser settings.'] },
      { h: 'Your rights', body: [`You can ask to see, correct or delete your details. Contact us on ${contact}. You can also complain to the Swedish Authority for Privacy Protection (imy.se).`] },
    ],
  };

  return sv ? {
    title: INFO_TITLES.faq.sv,
    intro: `Hittar du inte svaret? Ring ${store.phone} eller skriv i vår WhatsApp-grupp.`,
    sections: [
      { h: 'Behöver jag ett konto?', body: ['Nej. Lägg varorna i varukorgen och fyll i namn och telefon i kassan. Det är allt.'] },
      { h: 'Var levererar ni?', body: [`I ${store.deliveryArea}. Fri leverans från ${free}, annars ${fee}. Minsta order för leverans är ${min}. Hämtning i butiken är alltid gratis.`] },
      { h: 'Hur betalar jag?', body: [`När du får varorna: kort, kontant eller Swish${swish ? `, eller Swish i förväg till ${swish}` : ''}.`] },
      { h: 'Kan jag ändra min beställning?', body: [`Ja, ring oss på ${store.phone} innan ordern är packad.`] },
      { h: 'Var ser jag min beställning?', body: ['Under "Mina beställningar" högst upp på sidan. Du kan också söka med ditt 8-siffriga ordernummer.'] },
      { h: 'Ni har inte varan jag letar efter', body: ['Använd "Önska en produkt" längst ner på sidan. Vi kan ofta beställa hem den.'] },
      { h: 'Hur får jag veta om nya erbjudanden?', body: ['Gå med i vår WhatsApp-grupp. Där delar vi veckans erbjudanden och nyheter.'] },
    ],
  } : {
    title: INFO_TITLES.faq.en,
    intro: `Can't find the answer? Call ${store.phone} or write in our WhatsApp group.`,
    sections: [
      { h: 'Do I need an account?', body: ['No. Add items to your basket and fill in your name and phone at checkout. That is all.'] },
      { h: 'Where do you deliver?', body: [`Within ${store.deliveryArea}. Free delivery from ${free}, otherwise ${fee}. The minimum order for delivery is ${min}. Store pickup is always free.`] },
      { h: 'How do I pay?', body: [`When you receive your groceries: card, cash or Swish${swish ? `, or Swish in advance to ${swish}` : ''}.`] },
      { h: 'Can I change my order?', body: [`Yes, call us on ${store.phone} before the order is packed.`] },
      { h: 'Where can I see my order?', body: ['Under "My orders" at the top of the page. You can also look it up with your 8-digit order number.'] },
      { h: 'You don\'t have the item I want', body: ['Use "Request a product" at the bottom of the page. We can often order it in.'] },
      { h: 'How do I hear about new offers?', body: ['Join our WhatsApp group. We share the week\'s offers and new arrivals there.'] },
    ],
  };
}
