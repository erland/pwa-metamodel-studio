# Beslut och risker

## Fastställda planeringsbeslut
D-001: Generisk metamodelleditor, inte applikationsarkitekturspecifik. D-002: ZIP-first utan GitHub-krav. D-003: Helt lokal klient för MVP. D-004: Kanoniska YAML-filer prioriteras, alla andra ZIP-entries bevaras. D-005: Originalets Python-kod exekveras inte i webbläsaren. D-006: Genererade artefakter blir stale vid kanonisk förändring. D-007: Planering utan att påbörja DEV-001.

## Riskregister
| Risk | Effekt | Motåtgärd | Steg |
|---|---|---|---|
| R-01 YAML kommentarer/ordning förloras | Medel/hög | CST-parser, diff och trohetstester; varning vid omskrivning | DEV-002 |
| R-02 Semantisk validering ej i paritet | Hög | Goldens och Python-jämförelser, aldrig felaktig PASS | DEV-004 |
| R-03 MDG/PDF felaktigt uppfattade aktuella | Hög | stale-markering, ingen release-ready | DEV-010 |
| R-04 ZIP-angrepp | Hög | Guardrails och skadliga fixtures | DEV-002/012 |
| R-05 iPad minne/filhämtning | Medel | Storleksgränser, progress, fallback | DEV-012 |
| R-06 Schemautveckling 1.1.x+ | Medel | Versionerade adapters, read-only på okänt | DEV-003 |
| R-07 Lokal cache eller kvotförlust | Medel | Explicit export och återhämtning, clear local state | DEV-009 |
