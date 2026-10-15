# Research Toolkit — Free, Non-AI Product Roadmap

## Product rule
Every feature in this roadmap is intended to remain free for now. Do not add AI/LLM features, paid API dependencies, usage credits, subscription gates, fabricated records, or silent destructive defaults. Prefer local deterministic processing and public metadata sources. Public APIs may impose rate limits or availability constraints; clearly show the source, retrieval time, and failures.

## Operating principles
- Preserve existing pages, user data, authentication, styling, and working features.
- Implement and test one vertical slice at a time; do not replace a large page wholesale without a regression review.
- Never label a capability complete unless its real workflow and exports work.
- Clearly distinguish verified metadata, probable matches, user decisions, and unavailable sources.
- Save provenance: source URL/DOI, retrieval time, processing settings, screening decisions, and export time where relevant.
- Use least-privilege access and server-side authorization for any server-stored data. Browser-local storage must be labeled as device-local.
- Avoid new paid services. Optional external sources must degrade gracefully when unavailable.
- Every import must preview data and report row counts/errors before committing changes. Never auto-delete uncertain duplicates.
- Every export must contain the records actually shown/selected, with explicit warnings for unsupported fields.
- Use keyboard-accessible controls, responsive layouts, and the established green/off-white/orange design.

## Existing areas to preserve and complete
1. Dashboard, project/task planner, JSON backup/import, authentication and cloud-sync status.
2. Literature search/import, deduplication, screening and PRISMA reporting.
3. Citation/DOI verification, duplicate-reference review and cleaned-reference exports.
4. Data Analysis Lab: CSV/XLS/XLSX imports, data quality, statistics, charts and exports.
5. Thesis & Manuscript Studio: project outlines, sections, version snapshots and exports.
6. Manuscript Quality Audit: structure, citations, figures/tables and document checks.
7. Journal Finder: topic-relevant publication evidence and source links.
8. Reviewer response/revision tracking.

## Additional modules to build
- Research Methodology Planner: objectives, research questions, hypotheses, variables, operational definitions, sampling, study design, analysis plan and ethics checklist.
- Evidence Extraction & Appraisal: configurable extraction forms, page/section locator, units, missingness, quality appraisal and reviewer disagreements.
- Publication Figure Studio: chart style presets, labels, axis controls, figure sizing, caption and numbering checks; export PNG/SVG only where the implemented library supports it.
- Dataset Catalogue: dataset title, description, source URL, licence, variables, units, temporal/spatial coverage, retrieval date, checksum and version notes.
- Research Integrity & Compliance: data-management plan, consent/ethics tracking, funding/conflict-of-interest statements and reporting checklists.
- Research Knowledge Base: linked notes, tags, paper/project links, decision log and search.
- Academic Output Tracker: DOI/ORCID-based publication records, metadata verification and exports.
- Reproducibility & Backup: project manifest, input/output hashes, analysis settings, version metadata, export bundle and restore validation.
- Survey/Instrument Builder: questionnaire fields, response types, validation, versioned schema and CSV template export.
- Research Statistics Reference: documented formulas, assumptions, worked examples and links to authoritative references.
- Unified project files and record linking across modules, subject to safe storage limits and actual backend capabilities.

## Implementation phases and acceptance criteria

### Phase 1 — Foundation and integration
- Inventory all pages, script dependencies, current persistence and cloud-sync behavior.
- Keep one canonical project identity and clear links between literature, datasets, analyses and manuscripts.
- Provide consistent import/export status, empty states, errors and mobile navigation.
- Add regression tests for critical existing flows.
- Document which records are browser-local and which are server-synced.

### Phase 2 — Literature, screening and evidence extraction
- CSV/RIS/BibTeX import where supported; preview and validation before save.
- Deterministic DOI/title/author-year duplicate suggestions; manual decisions retained.
- Search log, eligibility criteria, independent decisions, exclusion reasons and conflict resolution.
- PRISMA counts reconcile to record states; export diagram and underlying counts.
- Extraction forms retain source locator, units, reviewer and missing-data flags.

### Phase 3 — Citation verification
- Verify metadata against public sources, preserving source and timestamp.
- Separate exact, probable, conflicting and unavailable matches.
- Match in-text citations to bibliography and detect unreferenced bibliography entries.
- Export reviewed records to CSV/XLSX/DOCX/TXT as supported.
- No reference is silently rewritten or excluded.

### Phase 4 — Data analysis
- CSV/XLS/XLSX parsing with sheet selection, preview and data-type checks.
- Missingness, duplicates, descriptive statistics, distributions and correlation.
- Validated regression and group-comparison methods with assumptions/diagnostics.
- Charts include title, units, labels, source data and reproducible settings.
- Export selected data, summary tables and plots; calculations tested on known fixtures.

### Phase 5 — Manuscript, journal and peer-review workflow
- Versioned thesis/manuscript sections, backups and real exports.
- Quality audit reports findings with exact locations where available.
- Journal candidates are evidence-based; indexing, quartiles and fees are never inferred without current sources.
- Reviewer comments are tracked through response, manuscript change, page/line and completion.

### Phase 6 — Additional research modules
- Build methodology planner, dataset catalogue, integrity checklists, knowledge base, output tracker and figure studio.
- Store structured data and provenance; export/import records without vendor lock-in.
- Integrate each module with the project and include acceptance tests.

### Phase 7 — Integration, security and release
- Test import → edit → save → reload → export for each module.
- Test local-only behavior and cloud behavior separately.
- Validate permissions, RLS policies, backup/restore, mobile layout, keyboard navigation and failure states.
- Run CI, inspect deployment status and check the live site before reporting release success.

## Definition of done for every feature
A feature is done only when the UI is connected to working logic, validation and error states exist, data persists as documented, a useful export/import path exists where relevant, tests cover critical behavior, no API secret is exposed in client code, and CI/live deployment status is accurately reported.