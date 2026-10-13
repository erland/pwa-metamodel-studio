# DEV-005 – Skrivskyddad modellutforskare

Status: implementerad, npm-verifiering uppskjuten på användarens begäran.

## Leverans
- Lokal import av ZIP via DEV-002 och parsning av samtliga åtta kanoniska YAML-dokument via DEV-003.
- Navigering per dokument, sökning över ID, namn och definitionens strukturerade data.
- Lista och detaljvy över identifierade entiteter samt deras referenser och upplösningsstatus.
- Skrivskyddad fullständig strukturerad JSON-vy för varje YAML-dokument, även dokument utan grafentiteter.
- Dokumentvis diagnostik från DEV-004 med filtrering efter allvarlighetsgrad.
- Responsiv layout, tillgängliga filväljare, knappar och navigeringsetiketter.

## Begränsningar
- Parsern kräver samtliga åtta dokument och schema_version 1; fel visas som importfel.
- Diagnostik bygger på befintligt DEV-004-API och garanterar inte all möjlig semantisk validering.
- Varken npm-installation, TypeScript, lint, tester eller bygget har körts för denna version enligt användarens beslut.
- Inga editeringsfunktioner (DEV-006) är införda.
