export const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.spicecrowd.shop';

export const site = {
  name: 'Spice Crowd',
  tagline: 'PURE INDIAN SPICES',
  description: 'Premium Indian spices and coffee sourced from authentic regional origins.',
  colors: {
    primary: '#0b3b2e', // deep forest green
    cream: '#f5efe6',
    gold: '#b98b3b'
  },
  address: {
    line1: 'No. 02/89, Solakkadu, Kolli Hills',
    city: 'Kolli Hills',
    state: 'Tamil Nadu',
    postcode: '637415',
    country: 'India'
  },
  phone: '+91 63743 34813',
  website: siteUrl,
  mapUrl: process.env.NEXT_PUBLIC_MAP_URL || 'https://www.google.com/maps/place/Spice+Crowd/@11.3105976,78.3477505,675m/data=!3m2!1e3!4b1!4m6!3m5!1s0x3babb9ca9379a381:0xf9776baf431daa9a!8m2!3d11.3105924!4d78.3503254!16s%2Fg%2F11jjzz55z_?authuser=0&entry=ttu',
};
