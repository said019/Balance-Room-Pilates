import assert from 'node:assert/strict';
import { preview } from 'vite';
import { chromium } from '@playwright/test';

// Exercise the actual production bundle with public-image requests fulfilled locally.
// All non-local traffic is intercepted: no sessions, production API, or Drive calls.
const ids = ['e01241c1-f0a2-42d5-b62a-63afd232eada', '04e2fae7-9d55-40ad-9cf3-75c3d758a66e', '6fe991b2-a20e-4eb8-a899-30269a7b8e05'];
const webp = {
  640: Buffer.from('UklGRjAAAABXRUJQVlA4TCQAAAAvf8J3EAdQsqKUtoABAUnS//9hRP8z/vOf//znP//5z3/+fwA=', 'base64'),
  1280: Buffer.from('UklGRlgAAABXRUJQVlA4TEsAAAAv/8TvEAdQsqKUtoABAUnS//9kRP8z/vOf//znP//5z3/+85///Oc///nPf/7zn//85z//+c9//vOf//znP//5z3/+85///Of/IwAA', 'base64'),
};
const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAEAAAAAwCAIAAAAuKetIAAAACXBIWXMAAAPoAAAD6AG1e1JrAAAAfUlEQVRoge2SAQkAURSDFsdgF9GAF2M8/sAAOhY+T5O6AQuwviK7kHdJ3YAFWF+RXci7pG7AAqyvyC7kXVI3YAHWV2QX8i6pG7AA6yuyC3mX1A1YgPUV2YW8S+oGLMD6iuxC3iV1AxZgfUV2Ie+SugELsL4iu5B3Sd2AxwN+e88A4qDRDSsAAAAASUVORK5CYII=', 'base64');
const server = await preview({ logLevel: 'silent', preview: { host: '127.0.0.1', port: 0 } });
const origin = `http://127.0.0.1:${server.httpServer.address().port}`;
let browser;
const results = [];
try {
  browser = await chromium.launch();
  for (const scenario of [
    { name: 'mobile', width: 390, height: 844, dpr: 1, expectedWidth: 640 },
    { name: 'desktop-retina', width: 1440, height: 1000, dpr: 2, expectedWidth: 1280 },
    { name: 'failed-variant-falls-back', width: 1440, height: 1000, dpr: 2, expectedWidth: 1280, failFirst: true },
  ]) {
    const context = await browser.newContext({ viewport: { width: scenario.width, height: scenario.height }, deviceScaleFactor: scenario.dpr, serviceWorkers: 'block' });
    const requests = [], unexpectedExternal = [];
    await context.route('**/*', async route => {
      const url = new URL(route.request().url());
      const media = /^\/api\/media\/public\/([0-9a-f-]+)(?:\/variants\/(640|1280)\.webp)?$/.exec(url.pathname);
      if (url.origin === 'https://api.2707altitud.com.mx' && media && ids.includes(media[1])) {
        const width = media[2] ? Number(media[2]) : null;
        requests.push({ id: media[1], width, url: url.href });
        if (scenario.failFirst && media[1] === ids[0] && width) return route.fulfill({ status: 404, body: 'synthetic missing derivative' });
        return route.fulfill({ status: 200, contentType: width ? 'image/webp' : 'image/png', body: width ? webp[width] : png });
      }
      if (url.origin === origin) {
        if (url.pathname.startsWith('/api/')) {
          const publicFixtures = {
            '/api/schedules/public': { timezone: 'America/Mexico_City', slots: [] },
            '/api/operational-settings/public': { cancellation_hours: 2, version: 1 },
            '/api/plans/opening-promotion': { active: false, introductory_offers: [] },
          };
          return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(publicFixtures[url.pathname] ?? []) });
        }
        return route.continue();
      }
      unexpectedExternal.push(url.hostname);
      return route.abort();
    });
    const page = await context.newPage();
    const pageErrors = []; page.on('pageerror', error => pageErrors.push(error.message));
    await page.goto(origin, { waitUntil: 'domcontentloaded' });
    const images = page.locator('.alt-program-photo img');
    try { await images.first().waitFor({ timeout: 10000 }); }
    catch (error) { throw Error(JSON.stringify({ error: error.message, pageErrors,
      body: (await page.locator('body').innerText()).slice(0, 500), requests, unexpectedExternal })); }
    assert.equal(await images.count(), 3);
    const current = [];
    for (let i = 0; i < ids.length; i++) {
      const image = images.nth(i); await image.scrollIntoViewIfNeeded();
      try { await image.evaluate(img => new Promise((resolve, reject) => {
        const deadline = Date.now() + 5000;
        const check = () => { if (img.complete && img.naturalWidth > 0) resolve();
          else if (Date.now() > deadline) reject(Error('Image never loaded')); else setTimeout(check, 20); };
        check();
      })); } catch (error) { throw Error(JSON.stringify({ error: error.message, scenario: scenario.name, i,
        image: await image.evaluate(img => ({ complete: img.complete, naturalWidth: img.naturalWidth, currentSrc: img.currentSrc, html: img.parentElement.outerHTML })), requests, pageErrors })); }
      const state = await image.evaluate(img => ({ currentSrc: img.currentSrc, originalSrc: img.getAttribute('src'),
        renderedWidth: img.getBoundingClientRect().width, naturalWidth: img.naturalWidth,
        sourceCount: img.parentElement.querySelectorAll('source').length }));
      const original = `https://api.2707altitud.com.mx/api/media/public/${ids[i]}`;
      const fallback = scenario.failFirst && i === 0;
      assert.equal(state.originalSrc, original);
      assert.equal(state.currentSrc, fallback ? original : `${original}/variants/${scenario.expectedWidth}.webp`);
      assert.equal(state.sourceCount, fallback ? 0 : 1); current.push(state);
    }
    assert.equal(requests.filter(request => request.width === null).length, scenario.failFirst ? 1 : 0, 'No duplicate original download in the normal path');
    if (scenario.failFirst) assert.equal(requests.filter(request => request.id === ids[0]).length, 2, 'One failed variant then one original; no retry loop');
    results.push({ ...scenario, current, requests, blockedExternalHosts: [...new Set(unexpectedExternal)] });
    await context.close();
  }
  console.log(JSON.stringify({ passed: true, browser: browser.version(), cases: results.length,
    productionNetworkRequests: 0, imageFixtures: 'synthetic WebP and PNG bytes', results }));
} finally {
  if (browser) await browser.close();
  await new Promise(resolve => server.httpServer.close(resolve));
}
