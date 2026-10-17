// Bureau 104 · Antarès : capture d'une page de la ville au format téléphone (390 × 780) et relevé de la console.
// Usage : node scripts/capture-telephone.mjs <page.html> <dossier de sortie>
// Sort : intro.png (écran d'accueil), ville.png (après « Entrer dans la ville »), console.json. Code 1 si erreur.
import { chromium } from 'playwright';
import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { pathToFileURL } from 'node:url';

const [page, out] = process.argv.slice(2);
if (!page || !out) { console.error('Usage : node scripts/capture-telephone.mjs <page.html> <dossier>'); process.exit(2); }
mkdirSync(out, { recursive: true });

const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined, args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const ctx = await browser.newContext({ viewport: { width: 390, height: 780 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, locale: 'fr-FR' });
const p = await ctx.newPage();
const journal = [];
p.on('console', m => journal.push({ type: m.type(), texte: m.text() }));
p.on('pageerror', e => journal.push({ type: 'pageerror', texte: String(e) }));

await p.goto(pathToFileURL(resolve(page)).href, { waitUntil: 'load' });
await p.waitForSelector('#btnStart');
await p.waitForTimeout(2500);
await p.screenshot({ path: join(out, 'intro.png') });
await p.tap('#btnStart');
await p.waitForTimeout(3000);
await p.screenshot({ path: join(out, 'ville.png') });
await browser.close();

const erreurs = journal.filter(e => e.type === 'error' || e.type === 'pageerror');
writeFileSync(join(out, 'console.json'), JSON.stringify(journal, null, 1));
console.log(`${page} : ${journal.length} messages de console, ${erreurs.length} erreur(s).`);
erreurs.forEach(e => console.log('  ' + e.texte));
process.exit(erreurs.length ? 1 : 0);
