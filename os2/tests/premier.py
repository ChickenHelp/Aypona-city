import asyncio, json, sys
from playwright.async_api import async_playwright
URL = sys.argv[1] if len(sys.argv) > 1 else 'http://localhost:8765/os2/index.html'
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch()
        ctx = await b.new_context(viewport={'width':390,'height':780}, device_scale_factor=2, has_touch=True)
        pg = await ctx.new_page()
        errs = []
        pg.on('console', lambda m: errs.append(m.text) if m.type == 'error' else None)
        pg.on('pageerror', lambda e: errs.append('PAGEERROR ' + str(e)))
        await pg.goto(URL)
        await pg.wait_for_function('window.__aypona_tests', timeout=20000)
        r = await pg.evaluate('window.__aypona_tests')
        print('tests', r['ok'], '/', r['total']); [print('  ✗', x) for x in r['echecs']]
        print('mesures', await pg.evaluate('JSON.stringify({pret: Math.round(performance.now())})'))
        await pg.screenshot(path='/tmp/claude-0/-home-claude/0b70b96a-ab30-559d-9cbe-efcbf704ad2e/scratchpad/o2-home.png')
        print('errors', errs)
        await b.close()
asyncio.run(main())
