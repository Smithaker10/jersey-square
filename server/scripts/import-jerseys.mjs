/**
 * Imports jerseys from local image files into Supabase.
 * Run: node scripts/import-jerseys.mjs
 *
 * 1. Scans the jersey image files
 * 2. Parses each filename to extract team, kit type, season, version
 * 3. Deletes ALL existing products from Supabase
 * 4. Inserts new products — one per image
 */
import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_ANON_KEY,
);

// ── Image directory ──────────────────────────────────────────────────
const JERSEY_DIR = path.resolve(import.meta.dirname, '../../jersey');
const IMAGE_EXTENSIONS = ['.png', '.webp', '.jpg', '.jpeg', '.avif'];

// ── Version keyword → category mapping ───────────────────────────────
const VERSION_MAP = [
  { pattern: /anime/i,          category: 'anime',          label: 'Anime' },
  { pattern: /sublimation/i,    category: 'sublimation',    label: 'Sublimation' },
  { pattern: /retro/i,          category: 'retro',          label: 'Retro' },
  { pattern: /masterversion/i,  category: 'master-version', label: 'Master Version' },
  { pattern: /master.version/i, category: 'master-version', label: 'Master Version' },
  { pattern: /fanversion/i,     category: 'fan-version',    label: 'Fan Version' },
  { pattern: /fan.made/i,       category: 'fan-version',    label: 'Fan Version' },
  { pattern: /fan.version/i,    category: 'fan-version',    label: 'Fan Version' },
  // playerversion / playerverison (typo) — checked last as fallback for dual-version
  { pattern: /player.?version/i,  category: 'player-version', label: 'Player Version' },
  { pattern: /player.?verison/i,  category: 'player-version', label: 'Player Version' },
  // F1 Specific fallbacks
  { pattern: /oversized/i,      category: 'fan-version',    label: 'Fan Version' },
  { pattern: /performance/i,    category: 'player-version', label: 'Player Version' },
  { pattern: /track/i,          category: 'player-version', label: 'Player Version' },
  { pattern: /polo/i,           category: 'master-version', label: 'Master Version' },
  { pattern: /tshirt|tee/i,     category: 'fan-version',    label: 'Fan Version' },
];

// ── Known team names ─────────────────────────────────────────────────
const KNOWN_TEAMS = [
  { pattern: /\bac[\s-]?milan\b/i, name: 'AC Milan' },
  { pattern: /\binter[\s-]?miami\b/i, name: 'Inter Miami' },
  { pattern: /\binter[\s-]?milan\b/i, name: 'Inter Milan' },
  { pattern: /\bargentina\b/i, name: 'Argentina' },
  { pattern: /\bengland\b/i, name: 'England' },
  { pattern: /\barsenal\b/i, name: 'Arsenal' },
  { pattern: /\bbarcelona\b/i, name: 'Barcelona' },
  { pattern: /\bfc[\s-]?barcelona\b/i, name: 'FC Barcelona' },
  { pattern: /\bbayern[\s-]?munich\b/i, name: 'Bayern Munich' },
  { pattern: /\bliverpool\b/i, name: 'Liverpool' },
  { pattern: /\bmancity\b/i, name: 'Man City' },
  { pattern: /\bman[\s-]?city\b/i, name: 'Man City' },
  { pattern: /\bpsg\b/i, name: 'PSG' },
  { pattern: /\brealmadrid\b/i, name: 'Real Madrid' },
  { pattern: /\breal[\s-]?madrid\b/i, name: 'Real Madrid' },
  { pattern: /\bcsk\b/i, name: 'CSK' },
  { pattern: /\bgujrat[\s-]?titans\b|gujarat[\s-]?titans/i, name: 'Gujarat Titans' },
  { pattern: /\bindia\b/i, name: 'India' },
  { pattern: /\bkkr\b/i, name: 'KKR' },
  { pattern: /\brcb\b/i, name: 'RCB' },
  { pattern: /\brr\b/i, name: 'Rajasthan Royals' },
  { pattern: /\bpunjab[\s-]?kings\b/i, name: 'Punjab Kings' },
  // F1 teams
  { pattern: /\bapxgp\b|\bapex[\s-]?gp\b/i, name: 'Apex GP' },
  { pattern: /\baston[\s-]?martin\b/i, name: 'Aston Martin' },
  { pattern: /\baudi\b/i, name: 'Audi' },
  { pattern: /\bcadillac\b/i, name: 'Cadillac' },
  { pattern: /\bmclaren\b|\bmclarren\b/i, name: 'McLaren' },
  { pattern: /\bmercedes\b/i, name: 'Mercedes' },
  { pattern: /\bvcarb\b/i, name: 'VCARB' },
  { pattern: /\brb\b/i, name: 'Red Bull' },
  { pattern: /\bsf\b|\bferrari\b/i, name: 'Ferrari' },
  { pattern: /\bf1\b|\bformula[\s-]?1\b/i, name: 'Formula 1' },
];

/**
 * Detect the version/category from the filename.
 * For dual-version files (masterversion+playerversion), prioritize master-version.
 */
function detectVersion(filename) {
  const lower = filename.toLowerCase();

  // Check for dual-version indicators
  const hasMaster = /masterversion|master.version|master_version/i.test(lower);
  const hasPlayer = /playerversion|player.version|player.verison|playerverison/i.test(lower);

  // Dual-version: prioritize master
  if (hasMaster && hasPlayer) {
    return { category: 'master-version', label: 'Master Version' };
  }

  // Single match
  for (const v of VERSION_MAP) {
    if (v.pattern.test(lower)) {
      return { category: v.category, label: v.label };
    }
  }

  // No version keyword found → default to player-version
  return { category: 'player-version', label: 'Player Version' };
}

/** Detect team name from filename */
function detectTeam(filename) {
  // FC Barcelona should match before Barcelona
  for (const t of KNOWN_TEAMS) {
    if (t.pattern.test(filename)) {
      return t.name;
    }
  }
  // Fallback: take the first word(s) before a separator
  const cleaned = filename.replace(/[-_]/g, ' ').split(/\s+/)[0];
  return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
}

/** Extract season like "26-27" → "2026/27", "24-25" → "2024/25" */
function extractSeason(filename) {
  // Match patterns like 26-27, 25-26, 21-22
  const seasonMatch = filename.match(/\b(\d{2})-(\d{2})\b/);
  if (seasonMatch) {
    const [, start, end] = seasonMatch;
    const startYear = parseInt(start) < 50 ? `20${start}` : `19${start}`;
    return `${startYear}/${end}`;
  }
  const yearMatch = filename.match(/\b(20\d{2})\b/);
  if (yearMatch) {
    return yearMatch[1];
  }
  return null;
}

/** Extract kit type: home, away, 3rd, 4th, etc. */
function extractKitType(filename) {
  const lower = filename.toLowerCase();

  if (/homekit|home[\s-]?kit|home[\s-]?jersey|home[\s-]?set/i.test(lower)) return 'Home';
  if (/awaykit|away[\s-]?kit|away[\s-]?jersey|away[\s-]?set|awayset/i.test(lower)) return 'Away';
  if (/3rd|third/i.test(lower)) return 'Third';
  if (/4th|fourth/i.test(lower)) return 'Fourth';
  if (/alloverkit|all[\s-]?over/i.test(lower)) return 'All Over Kit';

  return null;
}

/** Extract special descriptors */
function extractSpecial(filename) {
  const specials = [];

  if (/125th[\s-]?anniversary/i.test(filename)) specials.push('125th Anniversary');
  if (/worldcup22|world[\s-]?cup[\s-]?22/i.test(filename)) specials.push('World Cup 22');
  if (/purple/i.test(filename)) specials.push('Purple');
  if (/ipl/i.test(filename)) specials.push('IPL');
  if (/t20/i.test(filename)) specials.push('T20');
  if (/front[\s-]?view/i.test(filename)) {} // skip display artifact

  return specials;
}

/** Generate a clean product title from the filename */
function generateTitle(filename) {
  const baseName = path.parse(filename).name;
  const team = detectTeam(baseName);
  const version = detectVersion(baseName);
  const season = extractSeason(baseName);
  const kitType = extractKitType(baseName);
  const specials = extractSpecial(baseName);

  // Build title parts
  const parts = [team];

  if (specials.length > 0) {
    parts.push(specials.join(' '));
  }

  if (kitType) {
    parts.push(kitType);
  }

  // Add "Kit" or "Jersey" or "Polo" or "Tee" if no kit type
  if (!kitType) {
    if (/polo/i.test(baseName)) {
      parts.push('Polo');
    } else if (/oversized[\s-]?tee|oversized[\s-]?tshirt/i.test(baseName)) {
      parts.push('Oversized Tee');
    } else if (/tee|tshirt/i.test(baseName)) {
      parts.push('Tee');
    } else if (/kit/i.test(baseName)) {
      parts.push('Kit');
    } else if (/jersey/i.test(baseName)) {
      parts.push('Jersey');
    }
  }

  if (season) {
    parts.push(season);
  }

  // Add version label
  if (version.category === 'retro') {
    parts.push('Retro Jersey');
  } else {
    parts.push(version.label);
  }

  return parts.join(' ');
}

/** Generate a URL-safe slug */
function generateSlug(title) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

// ── Main ─────────────────────────────────────────────────────────────
async function main() {
  // 1. Read all image files
  if (!fs.existsSync(JERSEY_DIR)) {
    console.error(`Jersey directory not found: ${JERSEY_DIR}`);
    process.exit(1);
  }

  const PUBLIC_IMPORTED_DIR = path.resolve(import.meta.dirname, '../../app/public/jerseys/imported');
  if (!fs.existsSync(PUBLIC_IMPORTED_DIR)) {
    fs.mkdirSync(PUBLIC_IMPORTED_DIR, { recursive: true });
  }

  const footballFiles = fs.readdirSync(JERSEY_DIR).filter((f) => {
    const ext = path.extname(f).toLowerCase();
    return IMAGE_EXTENSIONS.includes(ext);
  });

  const cricketDir = path.join(JERSEY_DIR, 'cricket');
  const cricketFiles = fs.existsSync(cricketDir)
    ? fs.readdirSync(cricketDir).filter((f) => {
        const ext = path.extname(f).toLowerCase();
        return IMAGE_EXTENSIONS.includes(ext);
      })
    : [];

  const f1Dir = path.join(JERSEY_DIR, 'f1');
  const f1Files = fs.existsSync(f1Dir)
    ? fs.readdirSync(f1Dir).filter((f) => {
        const ext = path.extname(f).toLowerCase();
        return IMAGE_EXTENSIONS.includes(ext);
      })
    : [];

  console.log(`Found ${footballFiles.length} football jerseys, ${cricketFiles.length} cricket jerseys, and ${f1Files.length} F1 jerseys.\n`);

  if (footballFiles.length === 0 && cricketFiles.length === 0 && f1Files.length === 0) {
    console.error('No image files found!');
    process.exit(1);
  }

  // 2. Parse each file into a product
  const products = [];

  function processFile(filename, sourceDir, sport, price, index) {
    const baseName = path.parse(filename).name;
    const version = detectVersion(baseName);
    const team = detectTeam(baseName);
    const title = generateTitle(filename);

    const sourcePath = path.join(sourceDir, filename);
    const destPath = path.join(PUBLIC_IMPORTED_DIR, filename);
    try {
      fs.copyFileSync(sourcePath, destPath);
    } catch (err) {
      console.warn(`Failed to copy ${filename}: ${err.message}`);
    }

    return {
      name: title,
      description: '',
      sport: sport,
      category: version.category,
      category_label: version.label,
      team,
      player: null,
      price: price,
      old_price: price + 300,
      stock_status: 'in_stock',
      image_url: `/jerseys/imported/${filename}`,
      discount: `-${Math.round((300 / (price + 300)) * 100)}%`,
      tags: [sport, version.category, team.toLowerCase().replace(/\s+/g, '-')],
      popular_score: 50 + Math.floor(Math.random() * 50),
      is_visible: true,
      sort_order: index + 1,
    };
  }

  let globalIndex = 0;
  for (const filename of footballFiles) {
    products.push(processFile(filename, JERSEY_DIR, 'football', 999, globalIndex++));
  }
  for (const filename of cricketFiles) {
    products.push(processFile(filename, cricketDir, 'cricket', 899, globalIndex++));
  }
  for (const filename of f1Files) {
    products.push(processFile(filename, f1Dir, 'f1', 1099, globalIndex++));
  }

  // Print mapping table
  console.log('Filename → Product Mapping:');
  console.log('─'.repeat(100));
  for (const p of products) {
    console.log(`  ${p.image_url.split('/').pop()}`);
    console.log(`    → ${p.name}`);
    console.log(`    → Sport: ${p.sport}`);
    console.log(`    → Category: ${p.category} (${p.category_label})`);
    console.log(`    → Team: ${p.team}`);
    console.log(`    → Price: ₹${p.price}`);
    console.log('');
  }

  // 3. Delete ALL existing products
  console.log('Deleting all existing products...');
  const { error: deleteError } = await supabase
    .from('products')
    .delete()
    .neq('id', 0); // delete everything (neq id 0 matches all rows)

  if (deleteError) {
    console.error('Delete failed:', deleteError.message);
    process.exitCode = 1;
    return;
  }
  console.log('All existing products deleted.\n');

  // 4. Insert new products
  console.log(`Inserting ${products.length} new products...`);
  const { data, error: insertError } = await supabase
    .from('products')
    .insert(products)
    .select('id, name, category');

  if (insertError) {
    console.error('Insert failed:', insertError.message);
    process.exitCode = 1;
    return;
  }

  console.log(`\n✅ Successfully imported ${data.length} products.`);

  // 5. Verify counts
  const categoryCounts = {};
  for (const p of data) {
    categoryCounts[p.category] = (categoryCounts[p.category] || 0) + 1;
  }

  console.log('\nProducts by category:');
  for (const [cat, count] of Object.entries(categoryCounts).sort()) {
    console.log(`  ${cat}: ${count}`);
  }

  // 6. Report any files that could not be imported
  const importedCount = data.length;
  const totalFiles = products.length;

  if (importedCount === totalFiles) {
    console.log(`\n✅ Verification passed: ${importedCount}/${totalFiles} files imported.`);
  } else {
    console.error(`\n❌ Mismatch: ${importedCount} products created from ${totalFiles} files.`);
    process.exitCode = 1;
    return;
  }

  // 7. Generate catalog.ts for offline support
  const CATALOG_TS_PATH = path.resolve(import.meta.dirname, '../../app/src/data/catalog.ts');
  const catalogLines = [
    "import type { JerseyProduct } from '@/types/product';",
    "import { CATEGORY_LABELS } from '@/config/sports';",
    "",
    "function p(",
    "  partial: Omit<JerseyProduct, 'categoryLabel'> & { categoryLabel?: string },",
    "): JerseyProduct {",
    "  return {",
    "    ...partial,",
    "    categoryLabel:",
    "      partial.categoryLabel ?? CATEGORY_LABELS[partial.category] ?? partial.category,",
    "  };",
    "}",
    "",
    "export const catalogProducts: JerseyProduct[] = ["
  ];

  products.forEach((p, idx) => {
    const item = {
      id: idx + 1,
      title: p.name,
      sport: p.sport,
      category: p.category,
      team: p.team,
      player: p.player,
      price: p.price,
      oldPrice: p.old_price,
      image: p.image_url,
      discount: p.discount,
      tags: p.tags,
      popular: p.popular_score,
      createdAt: '2026-07-10'
    };
    catalogLines.push(`  p(${JSON.stringify(item)}),`);
  });

  catalogLines.push("];");
  catalogLines.push("");
  catalogLines.push("export function getProductById(id: number) {");
  catalogLines.push("  return catalogProducts.find((p) => p.id === id);");
  catalogLines.push("}");
  catalogLines.push("");
  catalogLines.push("export function getTeams(sport?: string) {");
  catalogLines.push("  const products =");
  catalogLines.push("    sport && sport !== 'all'");
  catalogLines.push("      ? catalogProducts.filter((p) => p.sport === sport)");
  catalogLines.push("      : catalogProducts;");
  catalogLines.push("  return [...new Set(products.map((p) => p.team))].sort();");
  catalogLines.push("}");
  catalogLines.push("");
  catalogLines.push("export function getMaxPrice() {");
  catalogLines.push("  return Math.max(...catalogProducts.map((p) => p.price));");
  catalogLines.push("}");

  fs.writeFileSync(CATALOG_TS_PATH, catalogLines.join('\n') + '\n');
  console.log(`\n✅ Successfully generated offline catalog at ${CATALOG_TS_PATH}`);
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exitCode = 1;
});
