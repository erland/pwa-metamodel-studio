# DEV-003 – Versionerad parser, domänmodell och referensgraf

## Levererat
- `src/lib/metamodel.ts`: read-only parser för åtta kanoniska YAML-filer (inklusive guidance.yaml).
- Typade dokument-, entitets- och referensstrukturer med stabila `kind:id`-nycklar.
- Explicit stöd för `schema_version: 1`; okända versioner nekas, ingen tyst migrering.
- Avläsning av `version.current` från version.yaml.
- Referenser för element, relationer, egenskaper, egenskapsmängder, typer, enumerationer, vyer, notation, vägledning och proveniens.
- Olösta referenser sparas i `graph.unresolved`, utan att parsern redigerar arkivet.
- Fyra nya Vitest-fall finns i `src/lib/metamodel.test.ts`.

## Avgränsningar
- Ingen semantisk eller JSON Schema-validering; det hör till DEV-004.
- Referensgrafen är en extraherad graf, inte en fullständig semantisk validator. Några modellberoenden som är fria uttryck härleds inte automatiskt.
- Ingen UI-editor eller automatisk ändring av filer har skapats.
- npm-test, typecheck, lint och build har inte körts på användarens begäran.

## API
`parseMetamodel(openZip(bytes))` returnerar `ParsedMetamodel` med `documents`, `modelVersion` och `graph`.

## Accepterans inför DEV-004
Verifiera `npm run verify`, använd referensarkiv 0.7.0 och komplettera tester som korsar samtliga filtyper innan release.
