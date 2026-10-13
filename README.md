# Metamodel Studio

**Metamodel Studio v0.1.17** är en lokal, installerbar PWA för att öppna, utforska, validera, redigera och exportera metamodeller i det kanoniska ZIP/YAML-formatet från Metamodel Builder.

**[Öppna Metamodel Studio på GitHub Pages](https://erland.github.io/pwa-metamodel-studio/)**

> Webbappen publiceras från en GitHub-release efter att GitHub Pages har konfigurerats med **GitHub Actions** som källa. Länken fungerar först efter en godkänd första release-deploy.

## Funktioner

- Import av metamodell-ZIP med fil- och storlekskontroller samt stöd för åtta kanoniska YAML-filer.
- Sökbar modellutforskare och referensgraf med diagnostik.
- Redigering av element, relationer, egenskaper, vyer, notation, provenance och guidance.
- Lokal utkastlagring, revisioner och återställning i IndexedDB.
- Versionshantering, ändringsjämförelse och ZIP-export med varningar om inaktuella genererade artefakter.
- PWA-manifest, service worker och offlinecache för appens statiska filer. Inga importerade användarfiler laddas upp till en server.

## Lokal utveckling

Node.js 22 rekommenderas.

```bash
npm install
npm run dev
npm run verify
```

`npm run verify` kör referensmodellkontroll, TypeScript, ESLint, Vitest och produktionsbygge. `npm run preview` visar det byggda resultatet. Projektet innehåller för närvarande ingen `package-lock.json`, och använder därför `npm install` i CI i stället för `npm ci`.

## GitHub Actions

- **Build and test** (`.github/workflows/ci.yml`) körs vid pull requests, push till `main` och manuellt. Verifierar projektet och laddar upp byggda `dist/` som artifact.
- **Deploy GitHub Pages on release** (`.github/workflows/pages.yml`) körs när en release publiceras, eller manuellt. Bygger från release-taggen, verifierar koden och publicerar `dist/` till Pages.

### Aktivera GitHub Pages

1. Merga PR:en till `main`.
2. Gå till **Settings → Pages → Build and deployment** och välj **GitHub Actions** som Source.
3. Skapa och publicera en GitHub-release, exempelvis `v0.1.17`, från `main`.
4. Kontrollera att workflow **Deploy GitHub Pages on release** blir grönt. Appen finns då på länken ovan.

Pages-bygget använder Vites `base=/pwa-metamodel-studio/` så att skript, manifest, service worker och offline-resurser fungerar under projektets sökväg. Lokala byggen använder fortsatt `/`.

## Dokumentation och status

Projektets arkitektur, utvecklingsplan, acceptanstester, verifieringsrapport och DEV-001–013-dokumentation finns i `docs/`. Arbetsstatus finns i `.system-builder/work-status.yaml`.

**Verifieringsläge:** 28/28 befintliga enhetstester, lint, typkontroll och produktionsbygge har godkänts i Agent Workspace. PWA-installation och verklig offlineåteröppning på iPad/iPhone är ännu inte fullständigt acceptanstestade.
