"""Tests d'affichage d'Aypona OS 2 (Playwright, Chromium).
Lancement : python3 -m http.server 8765 (à la racine du dépôt), puis python3 os2/tests/e2e.py
Chaque scénario affiche ✓ ou ✗ ; le code de sortie vaut le nombre d'échecs."""
import asyncio, json, os, sys, tempfile
from playwright.async_api import async_playwright, expect

BASE = os.environ.get('OS2_URL', 'http://localhost:8765/os2/index.html')
SHOTS = os.environ.get('OS2_SHOTS', '')
resultats = []

def note(nom, ok, detail=''):
    resultats.append((nom, ok, detail)); print(('✓ ' if ok else '✗ ') + nom + ((' — ' + detail) if detail else ''), flush=True)

async def page(b, w=390, h=780, **kw):
    ctx = await b.new_context(viewport={'width': w, 'height': h}, device_scale_factor=2, has_touch=kw.pop('touch', True), accept_downloads=True, **kw)
    pg = await ctx.new_page(); pg.erreurs = []
    pg.on('console', lambda m: pg.erreurs.append(m.text) if m.type == 'error' else None)
    pg.on('pageerror', lambda e: pg.erreurs.append('pageerror: ' + str(e)))
    return ctx, pg

async def demarrer(pg, url=BASE):
    await pg.goto(url); await pg.wait_for_function('window.__aypona_tests', timeout=20000)
    return await pg.evaluate('window.__aypona_tests')

async def capture(pg, nom):
    if SHOTS: await pg.screenshot(path=os.path.join(SHOTS, nom + '.png'))

async def scenario(nom, fn):
    try: await fn()
    except Exception as e: note(nom, False, str(e).splitlines()[0][:200])

async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch()

        # 1. Téléphone 390 × 780 : démarrage, tests internes, console propre
        async def s1():
            ctx, pg = await page(b)
            r = await demarrer(pg)
            note('390 × 780 : tests internes ' + str(r['ok']) + '/' + str(r['total']), r['ok'] == r['total'] and r['total'] >= 60, '; '.join(r['echecs']))
            pret = await pg.evaluate('window.Aypona && performance.now()')
            sw = await pg.evaluate('document.documentElement.scrollWidth')
            note('390 × 780 : pas de défilement horizontal', sw <= 390, str(sw))
            note('390 × 780 : console sans erreur', not pg.erreurs, ' | '.join(pg.erreurs[:3]))
            await capture(pg, 'tel-accueil'); await ctx.close()
        await scenario('téléphone', s1)

        # 2. Réglages, affichage, taille du texte, retour
        async def s2():
            ctx, pg = await page(b); await demarrer(pg)
            await pg.click('#dock .tuile[data-id="reglages"]')
            await pg.click('text=Affichage et accessibilité')
            await pg.locator('input[type=range]').first.fill('130'); await pg.locator('input[type=range]').first.dispatch_event('change')
            fs = await pg.evaluate('document.documentElement.style.fontSize')
            await capture(pg, 'tel-reglages-affichage')
            await pg.click('.retour')
            ok = await pg.locator('.titre-vue', has_text='Réglages').count() == 1
            sw = await pg.evaluate('document.documentElement.scrollWidth')
            note('Réglages : texte à 130 %, navigation et retour', fs == '130%' and ok and sw <= 390, fs + ' / ' + str(sw))
            await ctx.close()
        await scenario('réglages', s2)

        # 3. Recherche globale au clavier
        async def s3():
            ctx, pg = await page(b, touch=False); await demarrer(pg)
            await pg.keyboard.press('Control+k'); await pg.keyboard.type('diag')
            await pg.wait_for_selector('#rechRes .res'); await capture(pg, 'tel-recherche')
            await pg.keyboard.press('Enter')
            await pg.wait_for_selector('.volet[data-app="moniteur"]:not([hidden])')
            note('Recherche : Ctrl K, « diag », Entrée ouvre Diagnostic', True)
            await ctx.close()
        await scenario('recherche', s3)

        # 4. Centre de contrôle : contraste et Ne pas déranger
        async def s4():
            ctx, pg = await page(b, touch=False); await demarrer(pg)
            await pg.keyboard.press('Alt+c'); await pg.wait_for_selector('#fCtrl:not([hidden])')
            await pg.click('#ctrlTuiles .tuile-ctrl:has-text("Contraste élevé")')
            await pg.click('#ctrlTuiles .tuile-ctrl:has-text("Ne pas déranger")')
            await capture(pg, 'tel-centre')
            c = await pg.evaluate('document.documentElement.classList.contains("contraste")')
            lune = await pg.is_visible('#luneBarre')
            await pg.keyboard.press('Escape')
            ferme = await pg.is_hidden('#fCtrl')
            note('Centre de contrôle : contraste, Ne pas déranger, Échap', c and lune and ferme)
            await ctx.close()
        await scenario('centre', s4)

        # 5. Fichiers : créer une note, la retrouver par son contenu
        async def s5():
            ctx, pg = await page(b, touch=False); await demarrer(pg)
            await pg.click('#grille .tuile[data-id="fichiers"]'); await pg.click('text=Nouveau')
            await pg.fill('.volet:not([hidden]) textarea', 'Rendez-vous au siège avec Polaris')
            await pg.click('.volet:not([hidden]) button:has-text("Enregistrer")')
            await pg.wait_for_selector('#ile.on'); await pg.keyboard.press('Alt+h')
            await pg.keyboard.press('Control+k'); await pg.keyboard.type('polaris')
            await pg.wait_for_selector('#rechRes .groupe-res:has-text("Fichiers")')
            note('Fichiers : note créée, retrouvée par son contenu', True)
            await ctx.close()
        await scenario('fichiers', s5)

        # 6. Sauvegarde : export puis import (fusion)
        async def s6():
            ctx, pg = await page(b, touch=False); await demarrer(pg)
            await pg.evaluate("Aypona.sys.reglages.set('fond','emeraude')")
            async with pg.expect_download() as dl:
                await pg.click('.widget button:has-text("Exporter")')
            d = await dl.value; chemin = os.path.join(tempfile.mkdtemp(), d.suggested_filename); await d.save_as(chemin)
            data = json.load(open(chemin))
            ok1 = data['format'] == 'aypona-os2-sauvegarde' and len(data['somme']) == 64 and data['kv']['reglages']['fond'] == 'emeraude'
            await pg.evaluate("Aypona.sys.reglages.set('fond','or')")
            async with pg.expect_file_chooser() as fc:
                await pg.evaluate("document.querySelector('#bCtrl').click()"); await pg.click('#ctrlTuiles button:has-text("Importer")')
            await (await fc.value).set_files(chemin)
            await pg.click('.dlg-carte button:has-text("Fusionner")')
            await pg.wait_for_selector('#ile.on:has-text("importée")')
            fond = await pg.evaluate("Aypona.sys.reglages.get('fond')")
            note('Sauvegarde : export signé, import par fusion', ok1 and fond == 'emeraude', d.suggested_filename + ' fond=' + fond)
            await ctx.close()
        await scenario('sauvegarde', s6)

        # 7. Kit : app d'exemple dans le cadre isolé, permission demandée à l'usage
        async def s7():
            ctx, pg = await page(b, touch=False); await demarrer(pg)
            await pg.evaluate("Aypona.ouvrir('reglages', { page: 'dev' })")
            await pg.click('button:has-text("Essayer l’app d’exemple")')
            fr = pg.frame_locator('.volet[data-app="exemple-kit"] iframe')
            await expect(fr.locator('#etat')).to_contain_text('Aypona OS 2.0.0', timeout=10000)
            await fr.locator('#notif').click()
            await pg.wait_for_selector('.dlg-carte[role=alertdialog]')
            await capture(pg, 'tel-permission')
            await pg.click('.dlg-carte button:has-text("Toujours autoriser")')
            await expect(fr.locator('#log')).to_contain_text('✓', timeout=5000)
            await fr.locator('#ecrire').click(); await pg.wait_for_selector('.dlg-carte[role=alertdialog]'); await pg.click('.dlg-carte button:has-text("Autoriser cette fois")')
            await expect(fr.locator('#log')).to_contain_text('note.txt', timeout=5000)
            await fr.locator('#compteur').click(); await expect(fr.locator('#nb')).to_have_text('1', timeout=5000)
            sandbox = await pg.get_attribute('.volet[data-app="exemple-kit"] iframe', 'sandbox')
            perm = await pg.evaluate("Aypona.sys.permissions.table()['exemple-kit']")
            n = await pg.evaluate("Aypona.sys.notifs.liste().filter(n => n.app === 'exemple-kit').length")
            f = await pg.evaluate("(async () => (await Aypona.sys.fichiers.liste('exemple-kit')).map(f => f.nom))()")
            await capture(pg, 'tel-kit')
            note('Kit : canal privé, permissions à l’usage, fichiers et stockage', 'allow-same-origin' not in sandbox and perm == {'notifications': 'toujours'} and n == 1 and f == ['note.txt'], json.dumps([perm, n, f]))
            await ctx.close()
        await scenario('kit', s7)

        # 8. Tablette 820 × 1180 : deux apps côte à côte, séparateur au clavier
        async def s8():
            ctx, pg = await page(b, 820, 1180, touch=False); await demarrer(pg)
            await pg.click('#dock .tuile[data-id="reglages"]')
            await pg.click('.volet[data-app="reglages"] .vb-cote')
            await pg.click('#selCorps button:has-text("Fichiers")')
            vis = await pg.evaluate("[...document.querySelectorAll('.volet')].filter(v => !v.hidden).map(v => v.dataset.app)")
            await pg.focus('.separateur'); await pg.keyboard.press('ArrowRight')
            val = await pg.get_attribute('.separateur', 'aria-valuenow')
            await capture(pg, 'tablette-cote')
            await pg.keyboard.press('Alt+ArrowLeft')
            note('Tablette : côte à côte, séparateur à 67 %', vis == ['reglages', 'fichiers'] and val == '67', json.dumps(vis) + ' ' + str(val))
            note('Tablette : console sans erreur', not pg.erreurs, ' | '.join(pg.erreurs[:3]))
            await ctx.close()
        await scenario('tablette', s8)

        # 9. Clavier seul : flèches dans la grille, Entrée, Alt H, aide
        async def s9():
            ctx, pg = await page(b, touch=False); await demarrer(pg)
            await pg.focus('#grille .tuile[tabindex="0"]'); await pg.keyboard.press('ArrowRight')
            id1 = await pg.evaluate('document.activeElement.dataset.id')
            await pg.keyboard.press('Enter'); await pg.wait_for_selector('.volet[data-app="' + id1 + '"]:not([hidden])')
            await pg.keyboard.press('Alt+h'); await pg.wait_for_selector('#scene', state='hidden')
            await pg.keyboard.press('?'); vis = await pg.is_visible('#fAide')
            await pg.keyboard.press('Escape'); cache = await pg.is_hidden('#fAide')
            note('Clavier : flèches, Entrée, Alt H, ? et Échap', id1 == 'moniteur' and vis and cache, id1)
            await ctx.close()
        await scenario('clavier', s9)

        # 10. Hors ligne : rechargement servi par le service worker
        async def s10():
            ctx, pg = await page(b); await demarrer(pg)
            await pg.wait_for_function('navigator.serviceWorker.controller || navigator.serviceWorker.ready.then(() => true)', timeout=10000)
            await pg.reload(); await pg.wait_for_function('window.__aypona_tests', timeout=20000)
            await pg.evaluate('navigator.serviceWorker.ready')
            await ctx.set_offline(True)
            await pg.reload(); r = await pg.wait_for_function('window.__aypona_tests', timeout=20000)
            r = await pg.evaluate('window.__aypona_tests'); hors = await pg.is_visible('#hors')
            await capture(pg, 'tel-hors-ligne')
            note('Hors ligne : la coquille se recharge, tests ' + str(r['ok']) + '/' + str(r['total']), r['total'] >= 60 and hors, '; '.join(r['echecs'][:2]))
            await ctx.close()
        await scenario('hors ligne', s10)

        # 11. Reprise des données de la v0.2
        async def s11():
            ctx, pg = await page(b)
            m = {'id': 'mes-notes', 'nom': 'Mes notes', 'studio': 'Nativus', 'version': '1.0.0', 'domicile': 'public', 'entree': 'https://exemple.github.io/notes/', 'icone': {'couleur': '#ffd60a', 'glyphe': 'N'}, 'permissions': ['fichiers'], 'description': ''}
            seed = {'schema': 2, 'settings': {'wallpaper': 'aube', 'lang': 'fr', 'reduceMotion': False, 'widgets': ['horloge'], 'notifApps': {}}, 'installed': [m], 'files': [{'id': 'f1', 'nom': 'souvenir.txt', 'contenu': 'écrit en v0.2', 'app': 'fichiers', 'cree': 1, 'modifie': 2}], 'layout': {'grid': ['fichiers', 'mes-notes'], 'dock': ['store', 'reglages']}}
            js = ';'.join("localStorage.setItem('aypona-os:%s', %s)" % (k, json.dumps(json.dumps(v))) for k, v in seed.items())
            await pg.add_init_script("if (!sessionStorage.getItem('graine')) { %s; sessionStorage.setItem('graine','1'); }" % js)
            await demarrer(pg)
            inst = await pg.evaluate("Aypona.sys.apps.installees().map(a => a.id)")
            fs = await pg.evaluate("(async () => (await Aypona.sys.fichiers.liste()).map(f => f.nom))()")
            fond = await pg.evaluate("document.documentElement.dataset.fond")
            garde = await pg.evaluate("!!localStorage.getItem('aypona-os:files')")
            await capture(pg, 'tel-reprise')
            note('Reprise v0.2 : apps, fichiers, fond ; la v0.2 garde ses données', inst == ['mes-notes'] and fs == ['souvenir.txt'] and fond == 'aube' and garde, json.dumps([inst, fs, fond]))
            await ctx.close()
        await scenario('reprise', s11)

        # 12. Anglais, texte à 150 % au format téléphone
        async def s12():
            ctx, pg = await page(b); await demarrer(pg)
            await pg.evaluate("Aypona.sys.reglages.set('langue','en'); Aypona.sys.reglages.set('texte',150)")
            await pg.click('#dock .tuile[data-id="reglages"]')
            lang = await pg.evaluate('document.documentElement.lang'); titre = await pg.inner_text('.volet:not([hidden]) .titre-vue')
            sw = await pg.evaluate('document.documentElement.scrollWidth')
            await capture(pg, 'tel-anglais-150')
            note('Anglais et texte à 150 % : traduit, sans débordement', lang == 'en' and titre == 'Settings' and sw <= 390, lang + ' ' + titre + ' ' + str(sw))
            await ctx.close()
        await scenario('anglais', s12)

        await b.close()
    echecs = [r for r in resultats if not r[1]]
    print('\n%d / %d scénarios réussis' % (len(resultats) - len(echecs), len(resultats)))
    sys.exit(len(echecs))

asyncio.run(main())
