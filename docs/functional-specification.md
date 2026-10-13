# Funktionell specifikation – Metamodel Studio 0.1.0

## Syfte och produktgräns
En svensk, offlinekapabel PWA som lokalt öppnar, undersöker, ändrar, validerar och exporterar metamodel-projekt-ZIP i Metamodel Builder-formatet. Huvudsyftet är **redigering av metamodelldefinitioner**, inte instansmodellering eller full Sparx Enterprise Architect-ersättning.

## Roller och användningsfall
- Modellförvaltare: öppna modell; redigera semantik; säkerställa version och export.
- Modellarkitekt: hantera typer, relationer, property sets, constraints, vyer, notation och vägledning.
- Granskare: inspektera, söka, se beroenden, validera och jämföra ändringar utan att skriva tillbaka.
- Alla: hantera ZIP lokalt utan konto; inga filer överförs över nätverket.

## Omfattning och prioritering
**Måste (MVP):** import, inventering, säker projektrepresentation, läs-/redigervyer för alla åtta canonical-filer, lokalt autosparat arbetsutkast, validering, spårbara ändringar, säker ZIP-export och round-trip-test.
**Bör:** beroendegraf, skillnadsvisning, undo/redo, tydlig påverkan på genererade artefakter, bekväm tillgänglig notationsförhandsvisning.
**Senare:** avancerad grafisk editor, komplett dokumentations-/MDG-generering, molnsynk, fleranvändarstöd och importer av andra filformat.

## Funktionella krav
| ID | Krav | Prio |
|---|---|---|
| FR-001 | Öppna lokalt ZIP via filväljare och drag/släpp; stöd toppkatalog i ZIP och läs säkert även på iPad/Safari. | Måste |
| FR-002 | Identifiera projektets canonical-katalog, schemaversion och filinventarium; redovisa avvikelse utan tyst konvertering. | Måste |
| FR-003 | Visa elementtyper inklusive id, namn, kind, beskrivning, property sets och arv när de förekommer. | Måste |
| FR-004 | Skapa, redigera och radera elementtyper med konsekvensanalys för referenser innan borttagning/ID-byte. | Måste |
| FR-005 | Hantera relationstyper, riktning, endpoints, tillåtna käll-/måltyper och kardinalitet. | Måste |
| FR-006 | Hantera datatyper, enumerationer, egenskaper och property sets. | Måste |
| FR-007 | Hantera constraints inklusive severity och relevanta referenser. | Måste |
| FR-008 | Hantera viewpoints och deras element/relationer. | Måste |
| FR-009 | Hantera notation/styles utan att anta att de är Sparx ShapeScripts. | Måste |
| FR-010 | Hantera provenance, källor och spårbarhetsmappningar. | Måste |
| FR-011 | Hantera version, förändringsposter och explicit versionsförslag; ingen automatisk versionshöjning utan godkännande. | Måste |
| FR-012 | Hantera guidance.yaml: guide, element-, relations-, viewpoint-, pattern-, anti-pattern- och FAQ-avsnitt. | Måste |
| FR-013 | Visa modellens interna referenser och beroenden; sök/filter efter id, namn och beskrivning. | Måste |
| FR-014 | Kontrollera JSON Schema och semantiska regler separat; felrapporter med fil, sökväg, svårighetsgrad och åtgärdsförslag. | Måste |
| FR-015 | Behålla okända fält där det är schema-kompatibelt och bevara alla okända filer oförändrade i innehåll. | Måste |
| FR-016 | Skapa nedladdningsbar projekt-ZIP som går att återimportera; bevara kataloghierarki och icke redigerade artefakter. | Måste |
| FR-017 | Utkast lagras lokalt (IndexedDB), med tydliga funktioner för spara/återställ/ta bort; rå ZIP sparas bara lokalt. | Måste |
| FR-018 | Visa ändringar och status för genererade artefakter; markera beroende genererade filer som potentiellt inaktuella efter ändring. | Måste |
| FR-019 | Visa beroende-/relationsgraf för typer; grafen är initialt läsbar, redigering sker via formulär. | Bör |
| FR-020 | Exportera ändringsrapport och visa diff före export. | Bör |
| FR-021 | Möjliggör reversering av osparade redigeringar (undo/redo). | Bör |
| FR-022 | Ge responsiv, tangentbordsanvändbar och svensk UI med tydlig status/återkoppling. | Måste |

## Affärs- och integritetsregler
- BR-001: canonical YAML är semantisk sanningskälla; `platforms/`, `sparx/` och `generated/` är härledda eller plattformsspecifika.
- BR-002: aldrig tyst ändra identifierare eller bryta referenser. ID-ändring kräver refaktoreringsförhandsvisning och användarbeslut.
- BR-003: export av utkast med valideringsfel får ske som **utkast/ej verifierad**; får aldrig märkas som giltig release.
- BR-004: ingen ZIP-export får innehålla zip-slip-sökvägar, symlänkar, zip-bomber eller zip-entries utanför projektroten.
- BR-005: okända ZIP-poster får inte tappas; ej redigerade poster måste behålla byteinnehåll (ZIP-metadata behöver inte vara identiskt).
- BR-006: en ändring av canonical gör beroende genererade filer **stale/ej verifierade**; de får bevaras men måste tydligt märkas som inaktuella, och releaseklar export blockeras tills regenerering/verifiering skett.
- BR-007: icke-kompatibla schema-versioner öppnas i säkert läsläge eller avvisas med diagnostik, aldrig tyst nedgradering.
- BR-008: ingen serveruppladdning, inloggning eller telemetri i MVP.

## Felhantering
Korrupt ZIP, saknad canonical-katalog, saknat schema, inkonsistenta referenser, för stora filer, felaktig YAML, lagringskvot slut och avbruten import/export ger tydliga meddelanden och behåller senaste fungerande arbetsutkast. Delvis importerade dokument får inte ersätta giltigt tillstånd. Ingen exekvering av skript ur ZIP.

## Icke-funktionella krav
| ID | Kvalitetskrav | Verifiering |
|---|---|---|
| NFR-001 | Helt lokal import, bearbetning och export; offline efter första inläsning. | Nätverkstest/offline E2E |
| NFR-002 | WCAG 2.2 AA som designmål, inklusive tangentbord och skärmläsare. | a11y-test och manuell granskning |
| NFR-003 | Fungerar i moderna Chromium/Firefox, Safari macOS och iPadOS Safari; mobil minst läs-/grundredigering. | Testmatris |
| NFR-004 | Stöder referensmodellen 0.7.0 utan dataförlust; storlekstak införs för säkerhet och visas tydligt. | Golden fixture round-trip |
| NFR-005 | Ingen tyst datakorruption; deterministisk semantisk jämförelse för canonical efter export. | Property-based och regression |
| NFR-006 | Modulär, testbar TypeScript-kod; strikt typsäkerhet och CI-kontroller. | Typecheck, lint, enhetstest |
| NFR-007 | Lokal lagring krypteras inte av appen; UI ska varna för delade enheter och ge Radera lokala data. | Säkerhetsgranskning |
| NFR-008 | Inga beroenden på nätverkstjänster under normal redigering. | Offline automatiserat test |

## Informationsobjekt
ProjectArchive (originala ZIP-entries + metadata), CanonicalModel (åtta YAML-domäner), ReferenceGraph, ValidationFinding, DraftRevision, ChangeSet, ArtifactFreshness och ExportReport. Separation mellan originalbytes, parsad modell och redigerad arbetskopia är obligatorisk.

## Avgränsningar
Ingen instansmodellering, inget gemensamt serverbaserat projektbibliotek, ingen automatisk körning av Metamodel Builders Python-skript i webbläsaren, ingen utlovad full MDG-paritet före verifiering.

## Öppna beslut som inte blockerar planering
- Om generation av MDG/PDF ska lösas med portning till TypeScript, WASM eller framtida valbar server.
- Behövs senare Git/GitHub-synkning eller organisationstillhörighet?
- Behöver avancerad notation visas som SVG för alla befintliga stilar eller endast säkert stödda delmängder?
