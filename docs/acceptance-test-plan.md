# Acceptans- och verifieringsplan

## Referensacceptanser
| ID | Krav | Acceptans |
|---|---|---|
| AC-001 | FR-001/002 | Import av `application-architecture-metamodel-0.7.0.zip` med rotmapp fungerar. |
| AC-002 | FR-003–012 | Alla åtta canonical-filer är läsbara, navigerbara och redigerbara efter respektive plansteg. |
| AC-003 | FR-015/016 | Omodifierad ZIP -> export -> import: semantiken identisk; alla ej redigerade entries har samma SHA-256. |
| AC-004 | FR-004/005/013 | ID-ändring/borttagning ger referens-impact; inga dangling references smyger igenom. |
| AC-005 | FR-014 | Strukturella schemafel och semantiska fel upptäcks med fil och plats. |
| AC-006 | FR-014 | Test-fixtures med positiva/negativa fall jämförs mot Metamodel Builders Python-validatorer där motsvarighet finns. |
| AC-007 | FR-017 | Lokal utkastshantering över omladdning och återställning utan serveranrop. |
| AC-008 | FR-018 | Ändrad canonical flaggar befintliga `generated/` och Sparx-härledningar som stale; kan ej kallas release-ready. |
| AC-009 | FR-016 | Exporterad ZIP återöppnas och ändringarna återfinns, utan skador på ShapeScripts/PDF/MDG. |
| AC-010 | NFR-001/003 | PWA fungerar offline, på macOS Safari och iPadOS Safari; mobil fallback dokumenteras. |
| AC-011 | Säkerhet | Traversal/symlänk, ZIP-bomb, YAML aliases och XSS avvisas/neutraliseras. |
| AC-012 | FR-011 | Version/changes hanteras explicit och schema_version ändras inte tyst. |

## Mätpunkter från bilagans canonical
8 element, 19 relationer, 15 property definitions, 13 constraints, 3 viewpoints, 27 notation styles, 30 provenance mappings. Guidance finns som åttonde fil. Siffrorna är golden expectations för denna fixture, inte generell maxgräns.

## Automationsupplägg
TypeScript unit + component + zip-integration + browser E2E, fixtures för positiva och felaktiga fall, semantisk canonical-normalisering, hashing av okända entries. Enhetstester ska kunna köras utan internet. Dokumentera att automatisk MDG-validering **inte** ersätter manuell EA-import.
