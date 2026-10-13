# DEV-009 – IndexedDB-utkast och revisionshistorik (v0.1.11)

## Genomfört
- Lagringsadapter `src/lib/draftStore.ts` med versionerad IndexedDB (`metamodel-studio-drafts`, version 1).
- Automatiskt sparade revisioner för öppnad och redigerad modell, upp till 25 revisioner per utkast.
- Listning/återöppning och borttagning av lokala utkast.
- Återställning av revision via samma säkra `openZip` och `parseMetamodel` som vid import, med förnyad diagnostik.
- Återställd revision läggs till befintlig ångra-historik och sparas som ny revision.
- Oförändrad ZIP-export och tidigare ångra-funktion.
- Synlig status och felhantering för lagringsfel, exempelvis kvotgräns eller blockerad IndexedDB.

## Design och begränsningar
- Lagringen är per webbläsare/origin och delas inte med andra enheter. Borttagna webbplatsdata innebär förlust av lokala utkast.
- Utkast bygger på ZIP-snapshots, inte fältdifferenser. Ingen server, molnsynkronisering eller historik över enheter.
- Återställning återanvänder arkivsäkerhetskontroller och kan misslyckas om lagrade bytes är trasiga.
- De 25 senaste revisionerna per utkast behålls. Äldre revisioner gallras automatiskt.
- En modell får ett nytt lokalt utkast-ID vid ny ZIP-import. Spara/exportera en ZIP som separat säkerhetskopia.
- Fel vid IndexedDB-lagring visas utan att omedelbart förstöra modellen i minnet.

## Verifiering
- ZIP-struktur kontrollerad lokalt.
- npm, typkontroll, lint, Vitest och produktionsbygge har **inte** körts, enligt användarens uttryckliga önskemål.
- DEV-010 har inte påbörjats.
