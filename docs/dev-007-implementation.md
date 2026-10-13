# DEV-007 – Properties editor (v0.1.9)

Implemented local JSON CRUD for `property_definitions`, `property_sets`, `data_types`, and `enumerations` in `canonical/properties.yaml`.

- Uses the same immutable ZIP workspace, undo and export flow as DEV-006.
- Prevents deletion when an inbound edge in the reference graph exists (properties used by sets, types/enumerations used by properties).
- Rejects new schema and semantic diagnostic errors using current canonical validators. ID changes are rejected; deletion does not cascade.
- Preserves untouched archive entry payloads; changed YAML is serialized by the existing `yaml` document editor.
- Provides starter JSON objects for all four kinds and buttons for create, edit, delete.
- Adds four Vitest regression cases, **not executed**, per user request.

**Limitations:** JSON text editing remains the UI (not field-specific forms). Enumeration value IDs are internal to enumeration objects and are managed by editing the parent enumeration. The reference graph covers modeled references only, not embedded generated assets or undocumented extensions. Constraint editing is outside the explicitly requested DEV-007 scope and is not implemented. Schema warnings and validity of any exported ZIP require later verification. DEV-008 has not started.
