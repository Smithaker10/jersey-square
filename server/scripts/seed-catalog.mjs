/**
 * Seeds Supabase from the local catalog. Run: node scripts/seed-catalog.mjs
 * Requires SUPABASE_URL + SUPABASE_ANON_KEY or SUPABASE_SERVICE_ROLE_KEY in server/.env
 */
import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const catalog = [
  { name: 'Real Madrid 2025/2026 3rd Set (Fan Version)', sport: 'football', category: 'fan-version', team: 'Real Madrid', player: null, price: 799, oldPrice: 1598, image: '/jerseys/fan-1.jpg', tags: ['laliga', 'football', 'fan'], popular: 98 },
  { name: 'Italy Away 2026 Set (Fan Version)', sport: 'football', category: 'fan-version', team: 'Italy', player: null, price: 799, oldPrice: 1598, image: '/jerseys/fan-2.jpg', tags: ['national', 'football'], popular: 85 },
  { name: 'Japan Away 2026 Set (Fan Version)', sport: 'football', category: 'fan-version', team: 'Japan', player: null, price: 799, oldPrice: 1598, image: '/jerseys/fan-3.jpg', tags: ['national', 'football'], popular: 72 },
  { name: 'France Away 2006 Retro Set (Fan Version)', sport: 'football', category: 'fan-version', team: 'France', player: 'Zidane', price: 999, oldPrice: 1998, image: '/jerseys/fan-4.jpg', tags: ['retro', 'football', 'world-cup'], popular: 91 },
  { name: 'Spain 2026 World Cup Away Jersey (Player Version)', sport: 'football', category: 'player-version', team: 'Spain', player: null, price: 999, oldPrice: 1998, image: '/jerseys/player-1.jpg', tags: ['player', 'football'], popular: 88 },
  { name: 'Argentina 2026 World Cup Away Jersey (Player Version)', sport: 'football', category: 'player-version', team: 'Argentina', player: 'Messi', price: 899, oldPrice: 1798, image: '/jerseys/player-2.jpg', tags: ['player', 'football', 'messi'], popular: 99 },
  { name: 'Japan 2026 World Cup Away Jersey (Player Version)', sport: 'football', category: 'player-version', team: 'Japan', player: null, price: 899, oldPrice: 1798, image: '/jerseys/player-3.jpg', tags: ['player', 'football'], popular: 76 },
  { name: 'Portugal 2026 World Cup Away Jersey (Player Version)', sport: 'football', category: 'player-version', team: 'Portugal', player: 'Ronaldo', price: 899, oldPrice: 1798, image: '/jerseys/player-4.jpg', tags: ['player', 'football', 'ronaldo'], popular: 94 },
  { name: 'France Home 1998 Retro Jersey (Master Version)', sport: 'football', category: 'master-version', team: 'France', player: 'Zidane', price: 999, oldPrice: 1998, image: '/jerseys/master-1.jpg', tags: ['retro', 'master', 'football'], popular: 92 },
  { name: 'Barcelona Home Jersey 24/25 (Master Version)', sport: 'football', category: 'master-version', team: 'Barcelona', player: 'Messi', price: 799, oldPrice: 1598, image: '/jerseys/master-2.jpg', tags: ['barcelona', 'laliga', 'messi'], popular: 97 },
  { name: 'Manchester United Home 2007/08 (Master Version)', sport: 'football', category: 'master-version', team: 'Manchester United', player: 'Ronaldo', price: 1199, oldPrice: 2398, image: '/jerseys/master-3.jpg', tags: ['premier-league', 'ronaldo'], popular: 90 },
  { name: 'Barcelona 3rd 2025/2026 Full Sleeve (Master Version)', sport: 'football', category: 'master-version', team: 'Barcelona', player: null, price: 899, oldPrice: 1798, image: '/jerseys/master-4.jpg', tags: ['barcelona', 'laliga'], popular: 84 },
  { name: 'Barcelona 125th Anniversary (Indian Embroidery)', sport: 'football', category: 'indian-embroidery', team: 'Barcelona', player: null, price: 499, oldPrice: 998, image: '/jerseys/indian-1.jpg', tags: ['barcelona', 'embroidery'], popular: 80 },
  { name: 'Spain Away 2026 Jersey (Indian Embroidery)', sport: 'football', category: 'indian-embroidery', team: 'Spain', player: null, price: 499, oldPrice: 998, image: '/jerseys/indian-2.jpg', tags: ['spain', 'embroidery'], popular: 70 },
  { name: 'Real Madrid 2017/18 Third Ronaldo (Indian Embroidery)', sport: 'football', category: 'indian-embroidery', team: 'Real Madrid', player: 'Ronaldo', price: 599, oldPrice: 1198, image: '/jerseys/indian-3.jpg', tags: ['real-madrid', 'ronaldo'], popular: 86 },
  { name: 'Manchester United Home 2007/08 Ronaldo (Indian Embroidery)', sport: 'football', category: 'indian-embroidery', team: 'Manchester United', player: 'Ronaldo', price: 599, oldPrice: 1198, image: '/jerseys/indian-4.jpg', tags: ['manchester-united', 'ronaldo'], popular: 83 },
  { name: 'France 2000-01 Home Zidane (Sublimation)', sport: 'football', category: 'sublimation', team: 'France', player: 'Zidane', price: 599, oldPrice: 1198, image: '/jerseys/sublimation-1.jpg', tags: ['france', 'sublimation'], popular: 75 },
  { name: 'Real Madrid 2012-13 Away Ozil (Sublimation)', sport: 'football', category: 'sublimation', team: 'Real Madrid', player: 'Ozil', price: 449, oldPrice: 898, image: '/jerseys/sublimation-2.jpg', tags: ['real-madrid', 'sublimation'], popular: 68 },
  { name: 'AC Milan Away Kaka (Sublimation)', sport: 'football', category: 'sublimation', team: 'AC Milan', player: 'Kaka', price: 599, oldPrice: 1198, image: '/jerseys/sublimation-3.jpg', tags: ['ac-milan', 'sublimation'], popular: 71 },
  { name: 'Brazil 2013 Home Kaka (Sublimation)', sport: 'football', category: 'sublimation', team: 'Brazil', player: 'Kaka', price: 499, oldPrice: 998, image: '/jerseys/sublimation-4.jpg', tags: ['brazil', 'sublimation'], popular: 69 },
  { name: 'Barcelona x Anime Special Edition Jersey', sport: 'football', category: 'anime', team: 'Barcelona', player: null, price: 1299, oldPrice: 2499, image: '/jerseys/fan-1.jpg', tags: ['anime', 'barcelona', 'limited'], popular: 95 },
  { name: 'Real Madrid Retro 2014 Anime Collab', sport: 'football', category: 'anime', team: 'Real Madrid', player: 'Ronaldo', price: 1199, oldPrice: 2299, image: '/jerseys/fan-2.jpg', tags: ['anime', 'real-madrid', 'retro'], popular: 93 },
  { name: 'AC Milan 2007 Retro Home Kit', sport: 'football', category: 'retro', team: 'AC Milan', player: 'Kaka', price: 1099, oldPrice: 2199, image: '/jerseys/master-3.jpg', tags: ['retro', 'ac-milan'], popular: 87 },
  { name: 'Inter Milan 2010 Retro Treble Jersey', sport: 'football', category: 'retro', team: 'Inter Milan', player: 'Sneijder', price: 999, oldPrice: 1999, image: '/jerseys/master-4.jpg', tags: ['retro', 'serie-a'], popular: 82 },

  { name: 'Ferrari 2025 Team Race Suit (Fan Version)', sport: 'f1', category: 'fan-version', team: 'Ferrari', player: 'Leclerc', price: 1499, oldPrice: 2999, image: '/products2/asset_1.jpg', tags: ['f1', 'ferrari', 'fan'], popular: 96 },
  { name: 'Red Bull Racing 2025 Driver Jersey (Player Version)', sport: 'f1', category: 'player-version', team: 'Red Bull', player: 'Verstappen', price: 1799, oldPrice: 3499, image: '/products2/asset_2.jpg', tags: ['f1', 'red-bull', 'player'], popular: 98 },
  { name: 'Mercedes AMG 2025 Garage Shirt (Master Version)', sport: 'f1', category: 'master-version', team: 'Mercedes', player: 'Hamilton', price: 1999, oldPrice: 3999, image: '/products2/asset_3.jpg', tags: ['f1', 'mercedes', 'master'], popular: 89 },
  { name: 'McLaren 2025 Lando Norris Edition (Fan Version)', sport: 'f1', category: 'fan-version', team: 'McLaren', player: 'Norris', price: 1399, oldPrice: 2799, image: '/products2/asset_4.jpg', tags: ['f1', 'mclaren'], popular: 91 },
  { name: 'Aston Martin F1 Team Polo (Indian Embroidery)', sport: 'f1', category: 'indian-embroidery', team: 'Aston Martin', player: 'Alonso', price: 899, oldPrice: 1798, image: '/products2/asset_5.jpg', tags: ['f1', 'aston-martin'], popular: 78 },
  { name: 'Alpine F1 2024 Sublimation Race Top', sport: 'f1', category: 'sublimation', team: 'Alpine', player: 'Ocon', price: 999, oldPrice: 1998, image: '/products2/asset_6.jpg', tags: ['f1', 'sublimation'], popular: 65 },

  { name: 'RCB Home IPL 2025 Jersey (Fan Version)', sport: 'cricket', category: 'fan-version', team: 'RCB', player: 'Kohli', price: 899, oldPrice: 1798, image: '/jerseys/indian-1.jpg', tags: ['cricket', 'ipl', 'rcb', 'kohli'], popular: 97 },
  { name: 'India World Cup 2023 Home (Player Version)', sport: 'cricket', category: 'player-version', team: 'India', player: 'Rohit Sharma', price: 999, oldPrice: 1998, image: '/jerseys/indian-2.jpg', tags: ['cricket', 'india', 'player'], popular: 95 },
  { name: 'Mumbai Indians Away IPL 2025 (Fan Version)', sport: 'cricket', category: 'fan-version', team: 'Mumbai Indians', player: null, price: 849, oldPrice: 1698, image: '/jerseys/indian-3.jpg', tags: ['cricket', 'ipl', 'mi'], popular: 88 },
  { name: 'CSK Yellow Home IPL 2025 (Master Version)', sport: 'cricket', category: 'master-version', team: 'CSK', player: 'Dhoni', price: 1199, oldPrice: 2398, image: '/jerseys/indian-4.jpg', tags: ['cricket', 'ipl', 'csk', 'dhoni'], popular: 99 },
  { name: 'Pakistan Green ODI Jersey (Player Version)', sport: 'cricket', category: 'player-version', team: 'Pakistan', player: 'Babar Azam', price: 949, oldPrice: 1898, image: '/jerseys/player-1.jpg', tags: ['cricket', 'pakistan'], popular: 81 },
  { name: 'England Test Whites Inspired (Sublimation)', sport: 'cricket', category: 'sublimation', team: 'England', player: 'Root', price: 699, oldPrice: 1398, image: '/jerseys/player-2.jpg', tags: ['cricket', 'england', 'test'], popular: 74 },
];

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_ANON_KEY,
);

const labels = {
  'fan-version': 'Fan',
  'player-version': 'Player',
  'master-version': 'Master',
  'indian-embroidery': 'Indian',
  sublimation: 'Sublimation',
  retro: 'Retro',
  anime: 'Anime',
};

const rows = catalog.map((item, index) => ({
  name: item.name,
  description: '',
  sport: item.sport,
  category: item.category,
  category_label: labels[item.category] ?? item.category,
  team: item.team,
  player: item.player,
  price: item.price,
  old_price: item.oldPrice,
  stock_status: 'in_stock',
  image_url: item.image,
  discount: item.discount ?? '-50%',
  tags: item.tags,
  popular_score: item.popular,
  is_visible: true,
  sort_order: index + 1,
}));

const { error } = await supabase.from('products').insert(rows);

if (error) {
  console.error('Seed failed:', error.message);
  process.exitCode = 1;
} else {
  console.log(`Seeded ${rows.length} products.`);
}
