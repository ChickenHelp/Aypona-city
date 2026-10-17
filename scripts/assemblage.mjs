// Bureau 104 · Antarès : découpage et assemblage de la page unique d'Aypona City (étape 3 de TRANSITION).
// src/ordre.json liste les fragments dans l'ordre de la page. Chaque fragment commence à la première ligne
// qui débute par `debut` (cherchée après le fragment précédent), décalée de `decalage` lignes si besoin.
// Les fragments sont copiés octet pour octet : les assembler redonne exactement la page de départ.
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

export const RACINE = join(dirname(fileURLToPath(import.meta.url)), '..');
export const SRC = join(RACINE, 'src');

export function ordre() {
  return JSON.parse(readFileSync(join(SRC, 'ordre.json'), 'utf8'));
}

// Page assemblée à partir des fragments de src/.
export function assembler() {
  return Buffer.concat(ordre().map(f => readFileSync(join(SRC, f.fichier))));
}

// Redécoupe une page (la version en ligne importée à la racine) en fragments dans src/.
export function decouper(page) {
  const texte = page.toString('utf8');
  const lignes = texte.split('\n').map((l, i, t) => (i < t.length - 1 ? l + '\n' : l));
  const frag = ordre();
  let depuis = 0;
  const debuts = frag.map(f => {
    const k = lignes.findIndex((l, i) => i >= depuis && l.startsWith(f.debut));
    if (k < 0) throw new Error(`Début introuvable pour ${f.fichier} : « ${f.debut} »`);
    const d = k + (f.decalage || 0);
    if (d < depuis) throw new Error(`Fragments dans le désordre autour de ${f.fichier}`);
    depuis = d + 1;
    return d;
  });
  frag.forEach((f, n) => {
    const p = join(SRC, f.fichier);
    mkdirSync(dirname(p), { recursive: true });
    writeFileSync(p, lignes.slice(debuts[n], n + 1 < frag.length ? debuts[n + 1] : lignes.length).join(''));
  });
  if (!assembler().equals(page)) throw new Error('Le découpage ne redonne pas la page de départ');
  return frag.length;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const cmd = process.argv[2];
  const page = readFileSync(join(RACINE, 'index.html'));
  if (cmd === 'decouper') {
    console.log(`${decouper(page)} fragments écrits dans src/, réassemblage identique à index.html.`);
  } else if (cmd === 'verifier') {
    if (!assembler().equals(page)) { console.error('src/ ne redonne pas index.html : lancer npm run decouper ou corriger src/.'); process.exit(1); }
    console.log('src/ redonne exactement index.html.');
  } else {
    console.error('Usage : node scripts/assemblage.mjs decouper|verifier'); process.exit(2);
  }
}
