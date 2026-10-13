# DEV-010 – Ändringsjämförelse, versionshantering och säker ZIP-export

Status: **implementerad, npm-verifiering uppskjuten på användarens begäran**.

## Levererat
- Innehållsbaserad filjämförelse mot importerad ZIP och valfri sparad revision (added/removed/modified); kanoniska ändringar identifieras.
- Semver-baserad uppdatering av `canonical/version.yaml` med release notes, fortsatt YAML-dokumenthantering med kommentarstöd och valideringskontroll.
- Identifiering av genererade artefakter under projektrotens `generated/`, som betraktas som inaktuella om kanoniska YAML-dokument har förändrats jämfört med importoriginalet.
- Två uttryckliga exportval: **uteslut** genererade artefakter (standard), eller **behåll som inaktuella** efter aktiv bekräftelse. Båda valen skriver `metamodel-studio-export-status.json` i projektroten med ursprung, status, lista och varning. Export som behåller inaktuella genererade filer får inte representeras som nygenererad MDG/dokumentation.
- Export blockeras i UI om valideringen innehåller fel; exportfunktionen verifierar ZIP-katalogen samt att alla kanoniska filer är oförändrade genom själva exporten.
- Oförändrad ZIP exporteras byte-för-byte. Kända och okända övriga filer bevaras om de inte tillhör `generated/` och valts bort.
- Fyra nya regressionstester (ej körda).

## Avgränsningar och risker
- Jämförelsen sker på filnivå, inte fält- eller semantisk entitetsnivå.
- Versionshistorik lagras fortsatt i IndexedDB; bytebaserad jämförelse mot revision är möjlig i UI.
- `generated/` är en konservativ katalogklassning enligt medföljande referensmodell; utanför katalogen kan även andra härledda artefakter förekomma, t.ex. `platforms/sparx-ea/`. Dessa gallras inte automatiskt.
- Modellen bevarar importerad projektrots namn även om modellversionen uppdateras.
- Oförändrade exporter förblir byteidentiska även om arkivet har äldre genererade filer; systemet lovar inte nygenerering.
- Den ursprungliga ZIP:ens metadata kan normaliseras vid ompackning.
- Test, typkontroll, ESLint och produktionsbygge är inte körda för denna version.

DEV-011 har inte påbörjats.
