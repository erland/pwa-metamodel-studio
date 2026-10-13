# DEV-011 – Grafisk visualisering

Status: implementerad i källkod, npm-verifiering uppskjuten enligt användarens beslut.

## Omfattning
- Ny `src/GraphView.tsx`, en skrivskyddad SVG-graf som återanvänder DEV-003:s `ReferenceGraph`.
- Flik **Referensgraf** i modellutforskaren; element, relationer och övriga definitioner kan visas.
- Tre vyer: element/relationstyper, alla beroenden och samtliga definitioner.
- Sökning på namn, ID och typ; fokus på markerad nod och dess direkta grannar.
- Kanter för identifierade referenser; olösta kanter markeras streckat och kan filtreras bort.
- Klick/Enter/blanksteg på nod öppnar dess befintliga detaljvy, också en separat tillgänglig nodlista.
- Scrollbar SVG-vy med begränsning till 80 noder initialt, utökningsknapp för stora modeller.
- Grafen räknas om automatiskt när modellen ändras, eftersom komponenten får den aktuella referensgrafen.

## Begränsningar
- Grafen är en läs- och navigeringsvy, inte en visuell editor.
- Enkel rutnätslayout används; ingen automatisk grafoptimering, zoom, dragning eller persistent positionering.
- Referenser från anonyma guidance- och provenance-poster saknar synlig nod i källgrafen; de ingår därför inte som linjer här. De finns kvar i diagnostik/referensgrafens data.
- Långa grafer kan kräva rullning och utökning av nodgränsen.
- Inga npm-test, typecheck, lint eller produktionsbyggen har körts för DEV-011.
- DEV-012 har inte påbörjats.

## Manuella acceptanskriterier för kommande verifiering
1. Öppna exempelmodellen och växla till Referensgraf.
2. Välj Element och relationer, kontrollera att båda typerna visas och att referenslinjer syns.
3. Sök en definition och välj en nod; kontrollera att detaljvyn öppnas på korrekt YAML-dokument.
4. Aktivera fokus på vald nod och växla grafvy.
5. Simulera en olöst referens och kontrollera att röd streckad linje/diagnostik visas när relevant källa visas.
6. Lägg till eller ändra en definition och kontrollera att grafen återspeglar lokal ändring.
7. Kontrollera tangentbordsnavigering och mobil bredd.
