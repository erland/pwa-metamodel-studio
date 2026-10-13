# DEV-004 – Schema- och semantisk validering

Status: **implementerad, npm-verifiering uppskjuten på användarens begäran**.

- Ursprungliga nio JSON Schema-filer (åtta dokument + delade definitioner) från Metamodel Builder v1.1.0 har lagts under `src/lib/schemas/`.
- JSON Schema 2020-12 körs med Ajv i webbläsaren, en separat rapport per kanonisk fil och JSON-pointer sökväg.
- Semantiska kontroller: duplicerade ID per entitetstyp, olösta grafreferenser och omvända kardinalitetsintervall.
- Diagnostik: allvarlighetsgrad, kod, kanonisk fil, sökväg, feltext och eventuellt entitetsnyckel.
- Naturliga språkregler körs **inte** automatiskt; detta meddelas som information.
- Parserns befintliga hårda fel (saknad fil, YAML-syntax, schemaversion) kastas fortsatt före validering. Återhämtningsbar fil-för-fil-parsning är ett separat framtida arbete.
- Gränssnittets visning av diagnostiken tillhör DEV-005 och har inte implementerats.
- Testfall har skrivits men **inte körts**. Ingen uppgift om fullständig schema-/referenstäckning eller produktionsberedskap görs.
