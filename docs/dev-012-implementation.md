# DEV-012 – PWA, offline och säkerhet

Status: implementerad i källkod; fullständig npm- och webbläsarverifiering uppskjuten på användarens begäran. DEV-013 ej påbörjad.

## Leverans

- Installerbart webbmanifest, 192-/512-pixelikoner, iOS-ikoner och standalone-start.
- Buildgenererad, innehållsversionshanterad service worker: precachar den färdiga statiska produktionen samt den bundlade exempelmodellen.
- Begränsad, strikt allowlist på samma origin; användarens importerade ZIP-filer eller IndexedDB-innehåll cachas aldrig av service worker.
- Gamla appcacher rensas vid aktivering. Offlineläge fungerar först **efter en fullständig onlineinstallation och laddning**; service worker kräver HTTPS eller localhost.
- CSP i HTML för standarddistributionen. För robust skydd ska hosting dessutom skicka CSP som HTTP-header, HSTS, X-Content-Type-Options och Referrer-Policy.
- Befintliga ZIP-säkerhetsgränser i `src/lib/archive.ts` återanvänds oförändrade. IndexedDB-utkast hålls lokala.

## Återstående manuella acceptanskontroller (DEV-013 eller separat)

1. `npm install && npm run verify` – inte kört.
2. Kontrollera manifest/ikoner och installering i Chrome desktop/Android och Safari iPad/iPhone.
3. Med HTTPS, besök online, slå av nätet, ladda om, öppna referensmodell, redigera och återställ IndexedDB-utkast, exportera ZIP.
4. Kontrollera på annan baspath, t.ex. `/studio/`, inklusive asset- och sw-scope.
5. Kontrollera CSP-varningar i browser console och test med fientliga ZIP-arkiv.
6. Kontrollera att ingen importerad modell laddas upp eller begärs över nätet.

## Begränsningar

Ingen runtime-verifiering utförd. Service worker använder cache-first för versionsbundna statiska filer; en ny release aktiveras vid en efterföljande laddning. CSP via meta fungerar inte som ersättning för hostingens säkerhetsheaders. Inga ändringar av DEV-013.
