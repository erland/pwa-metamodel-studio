# Utvecklingsplan – Metamodel Studio 0.1.0

Status: **planerad, 0/13 utvecklingssteg klara**. Arbetssätt: en DEV-aktivitet per System Builder-körning; kör verifiering och uppdatera `.system-builder/work-status.yaml` innan nästa steg. Ingen kod eller DEV-001 är påbörjad.

| Steg | Mål | Beroenden |
|---|---|---|
| DEV-001 | Skapa projektgrund och importerbar golden fixture | Inget föregående utvecklingssteg |
| DEV-002 | Säker ZIP och YAML round-trip | DEV-001 |
| DEV-003 | Versionerad parser och domänmodell | DEV-002 |
| DEV-004 | Schema- och semantikvalidering | DEV-003 |
| DEV-005 | Navigering och read-only utforskare | DEV-003 |
| DEV-006 | Element och relationseditor | DEV-004,DEV-005 |
| DEV-007 | Properties och constraints editor | DEV-006 |
| DEV-008 | Viewpoints, notation, provenance och guidance | DEV-007 |
| DEV-009 | Versionshantering och utkast | DEV-006 |
| DEV-010 | Ändringsstatus och export | DEV-004,DEV-008,DEV-009 |
| DEV-011 | Graf och beroendevyer | DEV-010 |
| DEV-012 | PWA, responsivitet och säkerhet | DEV-010 |
| DEV-013 | Kvalitetsgrind och releasekandidat | DEV-011,DEV-012 |

## Stegspecifikationer

### DEV-001: Skapa projektgrund och importerbar golden fixture
- Omfattning: Vite/React/TS/PWA, katalogstruktur, konfig, Vitest och dokumenterat ZIP-fixture från användarens original.
- Förutsättningar: Inget föregående utvecklingssteg.
- Verifiering: Typkontroll/lint/unit smoke; ZIP-detektion och read-only inventering; inga editkontroller.
- Klart när: implementation, dokumentation och angivna kontroller PASS, status uppdaterad.

### DEV-002: Säker ZIP och YAML round-trip
- Omfattning: ZIP path guards, storlekslimiter, ZIP-entry bevarande, YAML CST/AST strategi, kommentarer och okända poster.
- Förutsättningar: DEV-001.
- Verifiering: Oförändrad import/export ger semantiskt identisk canonical och identiska bytes för ej modifierade entries.
- Klart när: implementation, dokumentation och angivna kontroller PASS, status uppdaterad.

### DEV-003: Versionerad parser och domänmodell
- Omfattning: Alla åtta canonical-filer, schema-version adapter, referensgraf, typning.
- Förutsättningar: DEV-002.
- Verifiering: Fixture 0.7.0 parsat utan bortfall; unknown version -> read-only och diagnostik.
- Klart när: implementation, dokumentation och angivna kontroller PASS, status uppdaterad.

### DEV-004: Schema- och semantikvalidering
- Omfattning: Bundla licensgranskade scheman och porta/korsa avstäm regler från Python-validerarna.
- Förutsättningar: DEV-003.
- Verifiering: Positiva/negativa goldens matchar Python; valideringsgrad och avvikelser dokumenterade.
- Klart när: implementation, dokumentation och angivna kontroller PASS, status uppdaterad.

### DEV-005: Navigering och read-only utforskare
- Omfattning: Modellöversikt, sök, detaljer och filinventarium.
- Förutsättningar: DEV-003.
- Verifiering: Alla 8 domäner visas i desktop och iPad; a11y-smoke.
- Klart när: implementation, dokumentation och angivna kontroller PASS, status uppdaterad.

### DEV-006: Element och relationseditor
- Omfattning: Formulär, säkra CRUD-kommandon, konsekvensanalys för referenser.
- Förutsättningar: DEV-004,DEV-005.
- Verifiering: Skapa/ändra/radera i isolerade tester; invalid relations -> fynd.
- Klart när: implementation, dokumentation och angivna kontroller PASS, status uppdaterad.

### DEV-007: Properties och constraints editor
- Omfattning: Datatyper/enums/property sets samt regler.
- Förutsättningar: DEV-006.
- Verifiering: Referenser och constraints valideras; positiv och negativ fixture.
- Klart när: implementation, dokumentation och angivna kontroller PASS, status uppdaterad.

### DEV-008: Viewpoints, notation, provenance och guidance
- Omfattning: Fullständig strukturerad CRUD för återstående domäner.
- Förutsättningar: DEV-007.
- Verifiering: Bevara exempelmodellens viewpoints, 27 notationsstilar, 30 mappings och guidance.
- Klart när: implementation, dokumentation och angivna kontroller PASS, status uppdaterad.

### DEV-009: Versionshantering och utkast
- Omfattning: IndexedDB, revisionshistorik, undo/redo om rimligt, manuell radering.
- Förutsättningar: DEV-006.
- Verifiering: Reload/återställ/lagringsfel utan datatapp; inget konto.
- Klart när: implementation, dokumentation och angivna kontroller PASS, status uppdaterad.

### DEV-010: Ändringsstatus och export
- Omfattning: Diff, stale generated, explicit version och export av giltigt utkast.
- Förutsättningar: DEV-004,DEV-008,DEV-009.
- Verifiering: round-trip + checksumma + provenance; felaktig modell aldrig release-ready.
- Klart när: implementation, dokumentation och angivna kontroller PASS, status uppdaterad.

### DEV-011: Graf och beroendevyer
- Omfattning: Read-only relationsdiagram, impact analysis och tillgänglig fallback.
- Förutsättningar: DEV-010.
- Verifiering: Vyer för typ- och relationsnät, fungerar utan mus.
- Klart när: implementation, dokumentation och angivna kontroller PASS, status uppdaterad.

### DEV-012: PWA, responsivitet och säkerhet
- Omfattning: Service worker, offline, CSP, Safari/iPad, säker ZIP regression.
- Förutsättningar: DEV-010.
- Verifiering: E2E offline + ZIP attack cases + a11y- och browser-matris.
- Klart när: implementation, dokumentation och angivna kontroller PASS, status uppdaterad.

### DEV-013: Kvalitetsgrind och releasekandidat
- Omfattning: Automatiserade referenstester, dokumentation, reproducerbar build, release- och återställningsguide.
- Förutsättningar: DEV-011,DEV-012.
- Verifiering: CI PASS och publicerbar statisk release; kända avgränsningar redovisade.
- Klart när: implementation, dokumentation och angivna kontroller PASS, status uppdaterad.

## Sekvens och stoppregler
En verifieringsbrist -> REPAIR före nästa steg. Revidera plan endast genom beslut med spårbar motivering. DEV-001 får startas först på ny begäran. GitHub krävs inte för att starta; projekt-ZIP är primärt arbetsflöde.
