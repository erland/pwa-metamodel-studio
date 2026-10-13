# Metamodel Studio 0.1.0 — DEV-001

PWA-förberedd React/TypeScript/Vite-projektgrund med **skrivskyddad ZIP-inventering** och oförändrad golden fixture från Application Architecture Metamodel v0.7.0.

## Start

```bash
npm ci
npm run dev
npm run verify
```

`npm run verify` kontrollerar fixture, typer, ESLint, Vitest och produktionsbuild. `npm run preview` visar produktionsbuilden.

## DEV-001 / gräns

- Välj ZIP eller öppna den inbyggda referensmodellen, inspektera arkivets struktur och åtta canonical-filnamn.
- Ingen serveruppladdning. Läsning sker i webbläsaren.
- **Ej en säker ZIP-importer ännu.** Öppna bara betrodda ZIP-filer i denna version: storleksgränser, ZIP-slip-skydd och ZIP-bombskydd kommer i DEV-002.
- YAML-innehåll tolkas inte ännu, ingen schema-/semantikvalidering, ingen skrivning eller export.
- PWA-installation/offline-cache är planerad till DEV-012; projektet är PWA-förberett men gör inte anspråk på offlineinstallation ännu.

Planeringsdokumenten finns i `docs/`. Arbetsstatus i `.system-builder/work-status.yaml`.

## DEV-002 (v0.1.3)
Säker ZIP-förkontroll och YAML round-trip finns i `src/lib/archive.ts`. Tester är uppskjutna på användarens begäran. Se `docs/dev-002-implementation.md`.

## DEV-003: kanonisk domänmodell

`parseMetamodel(openZip(bytes))` i `src/lib/metamodel.ts` läser de åtta obligatoriska YAML-filerna i skrivskyddat läge och ger en referensgraf. Se `docs/dev-003-implementation.md`. npm-verifiering är uppskjuten.

## DEV-006 (v0.1.8)
Lokala ändringar av element-/relationstyper, ångra och ZIP-export. Verifiering är uppskjuten på användarens begäran; se `docs/dev-006-implementation.md`.

## DEV-007
Local CRUD for properties, property sets, data types and enumerations in `properties.yaml`. npm verification deferred by user. See `docs/dev-007-implementation.md`.


DEV-008 (v0.1.10): redigerbara viewpoints, notation, provenance och guidance; verifiering uppskjuten.

## DEV-009 – lokal utkastlagring

Utkast och revisioner sparas automatiskt i webbläsarens IndexedDB. Öppna ett tidigare utkast eller återställ en revision i gränssnittet. Lagringen är lokal och kan försvinna om webbplatsdata rensas. Se `docs/dev-009-implementation.md`. npm-verifieringen är uppskjuten.

## DEV-010 (v0.1.12)
Filjämförelse, revisionsjämförelse, version i canonical/version.yaml och export med skydd för inaktuella genererade artefakter. Se `docs/dev-010-implementation.md`. npm-verifieringen uppskjuten enligt beslut.
