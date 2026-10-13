# DEV-006 – Element- och relationstypsredigering

Status: implementerad, **inte körverifierad** (på användarens begäran).

## Leverans
- Skapa nya element- och relationstyper med JSON-baserad formuläreditor.
- Ändra befintliga definitioner utan att byta ID.
- Radera definitioner om inga identifierade referenser pekar på dem.
- Kontroll av ID-format, duplicerade ID, grundläggande fältkrav och nyintroducerade schema-/semantikfel.
- Lokal ändringshistorik med ångra, omräkning av referensgraf och diagnostik.
- Export av ändrat ZIP med övriga filer bevarade till innehåll.
- Fyra regressionstester tillagda men ej exekverade.

## Avgränsningar och kvarstående risker
- Formuläret är en JSON-baserad editor för respektive objekt, inte en fullständig fältspecifik GUI-editor.
- Byte av ID stöds inte; tidigare referenser påverkas inte automatiskt.
- Raderingsspärren bygger på referensgrafens identifierade relationer och täcker inte fri text eller externa artefakter.
- Ändringar i canonical/metamodel.yaml kan göra genererade dokument/MDG inaktuella; regeneration görs inte i DEV-006.
- Existerande modellfel tolereras om inga nya fel introduceras, enligt jämförelse av diagnostikkoder och sökvägar.
- TypeScript, ESLint, Vitest och produktionsbygge är inte körda för den här versionen.
- DEV-007 är inte påbörjad.
