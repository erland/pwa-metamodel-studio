# DEV-002 – Säker ZIP och YAML round-trip

Status: **Implementerat, verifiering uppskjuten på uttrycklig begäran**. DEV-003 ej påbörjad.

## Leverans
- `src/lib/archive.ts`: preflight av ZIP central directory innan dekomprimering; sökvägsskydd, dubbletter, kryptering, symlänkar, komprimeringsmetoder, storleksgränser, lokalt header och ZIP64 kontrolleras.
- `openZip` skyddar användarens import och lagrar alla okända filer som binära bytes i minnet.
- `exportZip`: exakt original-ZIP om ingenting har ändrats. Vid ändring rekonstrueras ZIP med identiska *uppackade bytes* för alla orörda filer. Det betyder inte identiska komprimerade bytes/ZIP-metadata vid modifierad export.
- `editYaml`: ändrar en kanonisk YAML-fil via `yaml` Document, som normalt bevarar kommentarer och nyckelordning. Formatet i själva det redigerade YAML-dokumentet kan ändras. Det är **inte** en garanti om textuell byteidentitet.
- `inventory.ts` använder den förkontrollerade importen. Ingen redigerings-UI ingår före DEV-006.
- `archive.test.ts`: fem föreslagna regressionstester, **inte körda**.

## Säkerhetsavgränsningar
- Gränser: komprimerad ZIP 32 MiB, 512 poster, varje fil 8 MiB, totalt 64 MiB, expansionskvot 200×.
- Arkiven öppnas i webbläsaren och ingen fil skickas till backend.
- ZIP-katalogen kontrolleras före dekomprimering, men externa zip-bibliotek, minnesanvändning och webbläsargränser kräver vidare säkerhetstestning i DEV-012.
- YAML kan bära syntaktiskt giltiga men semantiskt felaktiga data; schema- och referensvalidering kommer DEV-004.
- Ej exponerat som en exportknapp i användargränssnittet ännu; exportflöde/ändringsstatus i DEV-010.

## Kvalitetsstatus
Användaren begärde att testerna skulle hoppas över och köras senare. Ingen npm install, lint, typkontroll, Vitest eller build har körts på denna version. DEV-001:s kvarstående fullständiga lintkontroll är också uppskjuten, inte godkänd.

## Föreslagna kommandon när testning återupptas
```
npm install
npm run verify
```
