// Test de fumée de l'interface (navigateur headless). Nécessite Playwright et un serveur local :
//   npm start            (dans un autre terminal)
//   npm run test:ui      (ou : node tests/ui/fumee.mjs [url] [dossier-captures])
// Il parcourt un cas d'exemple, vérifie l'absence d'erreur JavaScript, le rapport, l'export/import et l'affichage mobile.
import { mkdirSync, readFileSync } from 'node:fs';

let chromium;
try { ({ chromium } = await import('playwright')); }
catch { ({ chromium } = await import('/opt/node22/lib/node_modules/playwright/index.mjs')); }

const URL_APP = process.argv[2] ?? 'http://localhost:8080/';
const CAPTURES = process.argv[3] ?? null;
if (CAPTURES) mkdirSync(CAPTURES, { recursive: true });
const opts = process.env.CHROMIUM ? { executablePath: process.env.CHROMIUM } : {};
const navigateur = await chromium.launch(opts).catch(() => chromium.launch({ executablePath: '/opt/pw-browsers/chromium' }));

const erreurs = [];
const verifs = [];
const ok = (cond, message) => { verifs.push({ ok: Boolean(cond), message }); };
const capture = async (page, nom) => { if (CAPTURES) await page.screenshot({ path: `${CAPTURES}/${nom}.png`, fullPage: true }); };

async function page(options = {}) {
  const ctx = await navigateur.newContext({ locale: 'fr-FR', acceptDownloads: true, ...options });
  const p = await ctx.newPage();
  p.on('pageerror', (e) => erreurs.push(`pageerror : ${e.message}`));
  p.on('console', (m) => { if (m.type() === 'error') erreurs.push(`console : ${m.text()}`); });
  return p;
}

// 1. Parcours complet du cas d'exemple n° 2, mode clair, bureau
const p = await page({ viewport: { width: 1280, height: 900 }, colorScheme: 'light' });
await p.goto(URL_APP);
await p.getByRole('heading', { name: 'Bienvenue dans Boussole DM' }).waitFor();
ok(await p.getByText('Outil pédagogique, sans valeur réglementaire').first().isVisible(), 'bandeau permanent visible');
await capture(p, '01-accueil');
await p.getByRole('button', { name: /Imagerie de l'AVC/ }).click();
await p.getByRole('heading', { name: 'Destination revendiquée' }).waitFor();
await capture(p, '02-destination');
for (const [etape, nom] of [['2. Qualification', '03-qualification'], ['3. Périmètre du DM', '04-perimetre'], ['4. Classification', '05-classification'], ['5. Conséquences', '06-consequences'], ['6. Zones grises', '07-zones-grises']]) {
  await p.getByRole('navigation', { name: 'Étapes du passage' }).getByRole('button', { name: new RegExp('^' + etape.replace('.', '\\.')) }).click();
  if (nom === '04-perimetre') ok(await p.locator('main .perimetre-svg').count() === 1, 'schéma du périmètre affiché');
  await capture(p, nom);
}
ok((await p.locator('.resume__classe').first().textContent()).includes('Classe III'), 'résumé : classe III');

// 2. Modifier une réponse : la classe doit changer
await p.getByRole('navigation', { name: 'Étapes du passage' }).getByRole('button', { name: /^4\. Classification/ }).click();
await p.getByLabel(/Une détérioration grave/).first().check();
ok((await p.locator('.resume__classe').first().textContent()).includes('Classe IIb'), 'modifier R11-2 fait passer en classe IIb');
await p.getByLabel(/Le décès ou une détérioration irréversible/).first().check();
ok((await p.locator('.resume__classe').first().textContent()).includes('Classe III'), 'retour en classe III');

// 3. Rapport
await p.getByRole('navigation', { name: 'Étapes du passage' }).getByRole('button', { name: 'Rapport' }).click();
await p.getByRole('heading', { name: 'Rapport de passage' }).waitFor();
const texteRapport = await p.locator('.rapport').innerText();
ok(texteRapport.includes('Outil pédagogique, sans valeur réglementaire'), 'mention dans le rapport');
ok(texteRapport.includes('Étapes suivies et sources') && texteRapport.includes('R11-2'), 'étapes suivies avec leurs règles');
ok(texteRapport.includes('health.ec.europa.eu') || (await p.locator('.rapport a[href*="health.ec.europa.eu"]').count()) > 0, 'liens vers les sources officielles');
await capture(p, '08-rapport');
if (CAPTURES) await p.pdf({ path: `${CAPTURES}/rapport.pdf`, format: 'A4', margin: { top: '15mm', bottom: '15mm', left: '12mm', right: '12mm' } });

// 4. Export puis import
const [telechargement] = await Promise.all([p.waitForEvent('download'), p.getByRole('button', { name: 'Exporter le passage (JSON)' }).click()]);
const chemin = await telechargement.path();
const exporte = JSON.parse(readFileSync(chemin, 'utf8'));
ok(exporte.format === 'boussole-dm/saisie/export' && exporte.passage.saisie.modules.length === 3, 'export JSON complet');
await p.getByRole('button', { name: 'Passages' }).click();
const avant = await p.locator('.passages li').count();
await p.setInputFiles('#import-json', chemin);
await p.getByRole('heading', { name: 'Destination revendiquée' }).waitFor();
await p.getByRole('button', { name: 'Passages' }).click();
ok(await p.locator('.passages li').count() === avant + 1, 'import : un passage de plus');

// 5. Reprise après rechargement (stockage local)
await p.reload();
ok(await p.locator('.passages li').count() === avant + 1, 'passages conservés après rechargement');

// 6. Clavier : le premier Tab atteint le lien d'évitement
await p.keyboard.press('Tab');
ok(await p.evaluate(() => document.activeElement?.className) === 'evitement', 'lien « Aller au contenu » au clavier');

// 7. Mode sombre et mobile
const sombre = await page({ viewport: { width: 1280, height: 900 }, colorScheme: 'dark' });
await sombre.goto(URL_APP);
await sombre.getByRole('button', { name: /Fertilité/ }).click();
await sombre.getByRole('navigation', { name: 'Étapes du passage' }).getByRole('button', { name: /^4\. Classification/ }).click();
ok(await sombre.locator('.logo--sombre').isVisible(), 'logo sombre affiché en mode sombre');
await capture(sombre, '09-sombre-classification');

const mobile = await page({ viewport: { width: 375, height: 800 }, colorScheme: 'light', isMobile: true });
await mobile.goto(URL_APP);
await mobile.getByRole('button', { name: /Imagerie de l'AVC/ }).click();
await mobile.getByRole('navigation', { name: 'Étapes du passage' }).getByRole('button', { name: /^2\. Qualification/ }).click();
const debord = await mobile.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
ok(debord <= 0, `pas de défilement horizontal sur mobile (débord ${debord}px)`);
await capture(mobile, '10-mobile-qualification');

await navigateur.close();
for (const v of verifs) console.log(`${v.ok ? '  ✓' : '  ✗'} ${v.message}`);
for (const e of erreurs) console.log(`  ✗ ${e}`);
const echecs = verifs.filter((v) => !v.ok).length + erreurs.length;
console.log(echecs ? `${echecs} problème(s)` : 'Interface : aucun problème détecté');
process.exitCode = echecs ? 1 : 0;
