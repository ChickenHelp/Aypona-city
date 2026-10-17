// Bureau 104 · Antarès : build Vite de la page unique d'Aypona City (étape 3 de TRANSITION).
// L'entrée src/ville.html ne contient qu'un repère : le plugin le remplace par les fragments de src/
// assemblés dans l'ordre de src/ordre.json, puis la page sort en dist/index.html. os/ et os2/ (bureau 102)
// sont copiés tels quels.
import { defineConfig } from 'vite';
import { cpSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { assembler, ordre, RACINE, SRC } from './scripts/assemblage.mjs';

function aypona() {
  return {
    name: 'aypona-assemblage',
    enforce: 'post',
    configureServer(server) {
      ordre().forEach(f => server.watcher.add(join(SRC, f.fichier)));
      server.watcher.on('change', p => { if (p.startsWith(SRC)) server.ws.send({ type: 'full-reload' }); });
    },
    transformIndexHtml: { order: 'pre', handler: () => assembler().toString('utf8') },
    generateBundle(_, bundle) {
      // Vite réécrit la page qu'il traite : on émet la page assemblée telle quelle, sous le nom index.html.
      for (const k of Object.keys(bundle)) delete bundle[k];
      this.emitFile({ type: 'asset', fileName: 'index.html', source: assembler() });
    },
    writeBundle(opts) {
      for (const d of ['os', 'os2']) if (existsSync(join(RACINE, d))) cpSync(join(RACINE, d), join(opts.dir, d), { recursive: true });
    },
  };
}

export default defineConfig({
  root: SRC,
  publicDir: false,
  plugins: [aypona()],
  build: {
    outDir: join(RACINE, 'dist'),
    emptyOutDir: true,
    rollupOptions: { input: join(SRC, 'ville.html') },
  },
  server: {
    // en développement, os/ est servi depuis la racine du dépôt
    fs: { allow: [RACINE] },
  },
});
