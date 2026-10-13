# DEV-013 – kvalitetsgranskning och releasebedömning

Datum: 2026-10-13
Version: 0.1.17

## Ändringar
- ESLint-konfiguration kompletterad med service worker-globals och precache-platshållaren.
- Ingen ny applikationsfunktion har införts.
- Projektets ordinarie `npm test` är fortsatt `vitest run`; den tillfälliga verifieringskandidaten körde ESLint före Vitest.

## Verifierad med Agent Workspace (Node.js 22)
- npm install: PASS (251 paket).
- ESLint: PASS, 0 fel.
- Vitest: PASS, 28/28.
- TypeScript `tsc -b`: PASS.
- Vite produktionsbygge: PASS.
- Vite-varning: JS-chunk 533,58 kB före komprimering (>500 kB). Icke-blockerande.

## PWA Preview
- Build-artifact publicerad: PASS.
- Browser Screenshot körd på preview URL: PASS, förhandsvisningen svarar i webbläsaren.
- Service worker är genererad av Vite-konfigurationen, statiska filer förpackade för precache.
- Browser offline-test (frånkopplat nätverk): EJ KÖRT.
- Installation från Safari på iOS/iPadOS: EJ KÖRT.
- IndexedDB-beständighet mellan sessioner: EJ E2E-VERIFIERAD.

## Releasebedömning
Teknisk bygg- och enhetstestkandidat. Fullständig releaseacceptans **inte godkänd** förrän
PWA-installation, offlineåteröppning, offlineimport/export och lokal datalagring
har testats praktiskt i relevanta webbläsare. Inga nya funktioner införda.

## Rekommenderad manuell acceptans
1. Publicera under HTTPS och ladda appen online. Bekräfta manifest och service worker.
2. Installera via Safari på iPhone och iPad och starta från hemskärmen.
3. Stäng nätverksanslutningen helt och starta om appen; öppna den medföljande referensmodellen.
4. Importera en lokal ZIP offline, skapa ett utkast, redigera, ångra och exportera ZIP.
5. Avsluta appen, starta om offline och kontrollera IndexedDB-revisioner.
6. Testa uppgradering till ett nytt appbygge och kontrollera att modellutkast bevaras.
