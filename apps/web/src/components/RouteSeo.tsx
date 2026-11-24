import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

interface RouteMeta {
  title: string;
  description: string;
  robots: string;
  jsonLd?: Record<string, unknown>;
}

const ORIGIN = 'https://patra.media';

function breadcrumb(items: { name: string; path: string }[]): Record<string, unknown> {
  return {
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, idx) => ({
      '@type': 'ListItem',
      position: idx + 1,
      name: item.name,
      item: `${ORIGIN}${item.path}`,
    })),
  };
}

const PUBLIC_ROUTE_META: Record<string, RouteMeta> = {
  '/': {
    title: 'Patra | 3D Folding Video Invitations & 1-Page Invitation Cards',
    description:
      'Design unforgettable 3D folding wedding, birthday, and event video invitations guests walk through and unseal in 4K, plus 24 printable & WhatsApp 1-page cards. Customize live for free.',
    robots: 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1',
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: [
        {
          '@type': 'Question',
          name: 'How many rooms and corners can I include in one invitation?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'You can configure 2, 3, or 4 folding corners and add multiple rooms to tell the full story of your event from welcome drinks to the main ceremony.',
          },
        },
        {
          '@type': 'Question',
          name: 'Can I customize the architecture and unfolding motion?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Yes. Switch between folding architectural structures including Book Stage, Palace Dome, Garden Pergola, Modern Gallery, and Gable House, each with its own opening animation.',
          },
        },
        {
          '@type': 'Question',
          name: 'Can I place custom text anywhere on the wall?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Yes. In the Text tab, enter any custom line, adjust size or color, and drag it into place directly on the invitation wall.',
          },
        },
        {
          '@type': 'Question',
          name: 'Can I also create 1-page printable or WhatsApp invitation cards?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Yes. Choose from 24 single-page Indian, Western, and East Asian stationery styles, upload and crop up to two photos, and download high-resolution PNG or JPG cards.',
          },
        },
        {
          '@type': 'Question',
          name: 'Do my drafts and downloads stay synced across devices?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Yes. Sign in with the same account on desktop or mobile to continue editing your saved invitations from anywhere.',
          },
        },
      ],
    },
  },
  '/templates': {
    title: '30+ 3D Wedding, Birthday & Event Invitation Templates | Patra',
    description:
      'Explore Royal Haveli, European Villa, Kyoto Sakura, and Birthday Bash 3D video invitation templates plus 24 matching 1-page cards. Customize typography, music, and photos free.',
    robots: 'index, follow, max-image-preview:large',
    jsonLd: {
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'CollectionPage',
          name: 'Patra 3D Invitation Templates Collection',
          url: `${ORIGIN}/templates`,
          description:
            'Handcrafted 3D folding invitation templates across Indian Heritage, Western, East Asian, Wedding, Haldi, Birthday, Reception, and Festival themes.',
        },
        breadcrumb([
          { name: 'Home', path: '/' },
          { name: 'Templates', path: '/templates' },
        ]),
      ],
    },
  },
  '/features': {
    title: '3D Structures, Floral Wax Seals & 1-Page Card Studio Features | Patra',
    description:
      'Discover Patra capabilities: 8 folding 3D pavilions, estate garden sweeps, embossed wax seals, twilight lighting, dual photo standees, looping music, and HD 1-page cards.',
    robots: 'index, follow, max-image-preview:large',
    jsonLd: {
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'WebPage',
          name: 'Patra Studio Features',
          url: `${ORIGIN}/features`,
        },
        breadcrumb([
          { name: 'Home', path: '/' },
          { name: 'Features', path: '/features' },
        ]),
      ],
    },
  },
  '/pricing': {
    title: 'Patra Pricing | Design Free, 4K Video & HD Card Downloads from $3',
    description:
      'Build and preview every 3D invitation and 1-page card live for free. Unlock watermark-free 4K downloads from a $3 (INR 49) Single Download Pass, Monthly Creator, or Yearly All-Access.',
    robots: 'index, follow, max-image-preview:large',
    jsonLd: {
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'Product',
          name: 'Patra 3D Invitation & Card Studio Passes',
          image: `${ORIGIN}/patra-logo.png`,
          description:
            'Watermark-free 4K 3D invitation videos and HD PNG/JPG 1-page invitation card downloads.',
          brand: { '@type': 'Brand', name: 'Patra' },
          offers: [
            {
              '@type': 'Offer',
              name: 'Single Download Pass',
              price: '3.00',
              priceCurrency: 'USD',
              availability: 'https://schema.org/InStock',
              url: `${ORIGIN}/pricing`,
            },
            {
              '@type': 'Offer',
              name: 'Monthly Creator',
              price: '9.99',
              priceCurrency: 'USD',
              availability: 'https://schema.org/InStock',
              url: `${ORIGIN}/pricing`,
            },
            {
              '@type': 'Offer',
              name: 'Yearly All-Access',
              price: '49.99',
              priceCurrency: 'USD',
              availability: 'https://schema.org/InStock',
              url: `${ORIGIN}/pricing`,
            },
          ],
        },
        breadcrumb([
          { name: 'Home', path: '/' },
          { name: 'Pricing', path: '/pricing' },
        ]),
      ],
    },
  },
  '/about': {
    title: 'About Patra | Architectural Digital Invitations & Fine Stationery',
    description:
      'Patra reimagines handmade pop-up wedding cards and tactile stationery as living 3D cinema and crisp single-page invitations synced across web and mobile.',
    robots: 'index, follow',
    jsonLd: {
      '@context': 'https://schema.org',
      ...breadcrumb([
        { name: 'Home', path: '/' },
        { name: 'About', path: '/about' },
      ]),
    },
  },
  '/contact': {
    title: 'Contact Patra | Support, Event Planners & Studio Inquiries',
    description:
      'Reach Patra support for bespoke wedding suites, agency high-volume licenses, 4K download questions, or billing help.',
    robots: 'index, follow',
    jsonLd: {
      '@context': 'https://schema.org',
      ...breadcrumb([
        { name: 'Home', path: '/' },
        { name: 'Contact', path: '/contact' },
      ]),
    },
  },
  '/careers': {
    title: 'Careers at Patra | 3D Graphics, Design & Creative Engineering',
    description:
      'Join Patra to build interactive WebGL storytelling, architectural 3D invitations, and tactile digital stationery tools.',
    robots: 'index, follow',
    jsonLd: {
      '@context': 'https://schema.org',
      ...breadcrumb([
        { name: 'Home', path: '/' },
        { name: 'Careers', path: '/careers' },
      ]),
    },
  },
  '/privacy': {
    title: 'Privacy Policy | Patra',
    description:
      'How Patra protects your account details, saved 3D invitation drafts, uploaded photos, and private event downloads.',
    robots: 'index, follow',
    jsonLd: {
      '@context': 'https://schema.org',
      ...breadcrumb([
        { name: 'Home', path: '/' },
        { name: 'Privacy Policy', path: '/privacy' },
      ]),
    },
  },
  '/terms': {
    title: 'Terms of Service | Patra',
    description:
      'Read Patra terms for invitation sharing rights, Single Download Passes, monthly/yearly subscriptions, and auto-renewal cancellation.',
    robots: 'index, follow',
    jsonLd: {
      '@context': 'https://schema.org',
      ...breadcrumb([
        { name: 'Home', path: '/' },
        { name: 'Terms of Service', path: '/terms' },
      ]),
    },
  },
  '/login': {
    title: 'Sign In to Patra | 3D Invitation Studio',
    description:
      'Sign in to Patra to continue crafting your 3D folding invitations, floral wax seals, and 1-page cards synced across desktop and mobile.',
    robots: 'index, follow',
  },
  '/register': {
    title: 'Create Free Account | Patra 3D Invitation & Card Studio',
    description:
      'Start designing your 3D wedding, birthday, or celebration invitation free in minutes. Live preview every structure, garden, and card before downloading in 4K.',
    robots: 'index, follow',
  },
  '/forgot-password': {
    title: 'Reset Password | Patra',
    description: 'Verify your email with a 6-digit code to recover access to your Patra account.',
    robots: 'noindex, nofollow',
  },
};

function upsertMeta(attrName: 'name' | 'property', key: string, content: string) {
  let el = document.querySelector<HTMLMetaElement>(`meta[${attrName}="${key}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attrName, key);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

function upsertCanonical(url: string) {
  let link = document.querySelector<HTMLLinkElement>('link[rel="canonical"]');
  if (!link) {
    link = document.createElement('link');
    link.setAttribute('rel', 'canonical');
    document.head.appendChild(link);
  }
  link.setAttribute('href', url);
}

export function RouteSeo() {
  const { pathname } = useLocation();

  useEffect(() => {
    const cleanPath = pathname !== '/' && pathname.endsWith('/') ? pathname.slice(0, -1) : pathname;
    const isAppRoute = cleanPath.startsWith('/app');

    const meta: RouteMeta = isAppRoute
      ? {
          title: 'Patra Studio | Design 3D Invitations & 1-Page Cards',
          description:
            'Customize 3D architectural invitations, estate gardens, floral wax seals, and single-page cards in your private Patra workspace.',
          robots: 'noindex, nofollow',
        }
      : PUBLIC_ROUTE_META[cleanPath] ?? PUBLIC_ROUTE_META['/'];

    const canonicalUrl = `${ORIGIN}${isAppRoute ? cleanPath : cleanPath in PUBLIC_ROUTE_META ? cleanPath : '/'}`;

    document.title = meta.title;
    upsertMeta('name', 'description', meta.description);
    upsertMeta('name', 'robots', meta.robots);
    upsertCanonical(canonicalUrl);

    upsertMeta('property', 'og:title', meta.title);
    upsertMeta('property', 'og:description', meta.description);
    upsertMeta('property', 'og:url', canonicalUrl);

    upsertMeta('name', 'twitter:title', meta.title);
    upsertMeta('name', 'twitter:description', meta.description);

    const existingScript = document.getElementById('patra-route-jsonld');
    if (meta.jsonLd) {
      const script = existingScript ?? document.createElement('script');
      script.id = 'patra-route-jsonld';
      script.setAttribute('type', 'application/ld+json');
      script.textContent = JSON.stringify(meta.jsonLd);
      if (!existingScript) {
        document.head.appendChild(script);
      }
    } else if (existingScript) {
      existingScript.remove();
    }
  }, [pathname]);

  return null;
}
