# DEV-008 – implementation (v0.1.10)

Utökar den lokala JSON-editorn för `viewpoints`, `styles` (notation), `sources` och `mappings` (provenance), samt `guide`, `patterns`, `anti_patterns`, elements/relationships/viewpoints-vägledning och FAQ (guidance).

- Namngivna poster har samma CRUD och beroendekontroller som DEV-006/007.
- Poster utan stabilt id hanteras via index i aktuell dokumentversion; efter varje operation byggs vyn och referensgrafen om.
- Nya schema- och semantikfel avvisas genom befintligt validerings-API. Ursprungligt ZIP bevaras; bara ändrade YAML-poster skrivs om.
- Lokal ångra och ZIP-export återanvänds. Schemas och referensgrafens existerande täckning sätter gränser för referenskontroller; genererade MDG-filer uppdateras inte.
- JSON-format används tills specifika formulär tillkommer. Guide-objektet kan ändras men inte tas bort.

**Verifiering:** npm, TypeScript, ESLint, Vitest och build har inte körts enligt uttrycklig instruktion. DEV-009 har inte påbörjats.
