# Källinventering (2026-10-13)

## Originalfiler
- Metamodel Builder Chat v1.1.0: `metamodel-builder-chat-1.1.0 2.zip`, SHA-256 `a84f9e64c7da87b7aa6ac3ca7e74285dce8a0467ba3488137d0b34aadc742848`, 93 ZIP-poster. Innehåller `schemas/*.schema.json`, `scripts/validate_canonical_schema.py`, `scripts/validate_semantics.py`, `scripts/validate_sparx_mapping.py`, diff-, dokumentations- och MDG-skript samt referensmanualer.
- Application Architecture Metamodel v0.7.0: `application-architecture-metamodel-0.7.0.zip`, SHA-256 `0ac3b1c7a7add0440e4d3ae2b13167d24abf1eaf11faaa39bdb9a517eb33eec1`, 45 ZIP-poster, rot `application-architecture-metamodel-0.7.0/`.

## Källformat
Canonical: `metamodel.yaml`, `properties.yaml`, `constraints.yaml`, `viewpoints.yaml`, `notation.yaml`, `provenance.yaml`, `version.yaml` samt `guidance.yaml` (stöds av separat schema). Andra poster: `project-status.yaml`, `development-plan.md`, `sparx/`, `platforms/sparx-ea/`, `generated/`, `workspace/state/`, `tests/`, `docs/`.

## Verifierade data i referensmodellen
{"elements": 8, "relationships": 19, "property_definitions": 15, "constraints": 13, "viewpoints": 3, "styles": 27, "mappings": 30}. `guidance.yaml` finns. Schema-filerna har obligatoriska fält och varierande begränsningar för extra fält; strategin får därför inte okritiskt injicera studio-metadata i canonical.

## Källornas användning
Använd käll-ZIP vid DEV-001 för test-fixture (enligt användarens avsikt). Källfiler har inte byggts in i detta planeringspaket. MDG:s import i riktig Sparx Enterprise Architect är ännu inte manuellt verifierad enligt `project-status.yaml` i referensprojektet.
