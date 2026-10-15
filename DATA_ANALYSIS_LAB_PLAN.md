# Data Analysis Lab — Implementation Plan and Acceptance Checklist

## Repository inspection (2026-10-15)

### Current deployment and architecture
- Repository: `mritunjay-debug/Research`.
- Hosting: static site deployed by GitHub Pages through `.github/workflows/pages.yml`; no `package.json`, Next.js configuration, TypeScript configuration, or Vercel configuration exists at the repository root.
- UI entry point: `research-tools.html`, with a large inline browser script and shared `design.css`.
- Existing browser dependencies: Chart.js 4.4.8, SheetJS/XLSX 0.18.5, Mammoth 1.8.0, and the shared Supabase browser client/auth UI.
- Existing analysis code is client-side. Current dataset state is an in-memory matrix of strings; filtering and cleaning notes are kept in page state. Raw dataset values are not sent by the research-tools cloud-sync module.
- Existing cloud persistence: `research_artifacts` stores user-owned journal, reviewer-response and analysis-summary payloads under Supabase RLS. It is not a raw-dataset file store.
- Current ingestion: CSV/TSV/JSON parsing and XLS/XLSX worksheet selection are present. The pure core detects common delimiters, strips a UTF-8 BOM, supports quoted delimiters and escaped quotes, normalizes duplicate/blank headers, enforces row/column/cell limits, infers heuristic types, and profiles missingness, unique values, numeric ranges and duplicate rows. The analysis UI has a bounded read-only preview with search across rows, sortable columns, visible-column selection, and pagination. A synthetic teaching dataset is available and explicitly labelled as non-empirical. Multiple simultaneous datasets and a full multi-dataset project model are not implemented.
- Current analysis: descriptive numeric summaries, Pearson correlations/heatmap with pair counts, simple linear regression, basic regression diagnostics, Welch two-group test, group comparison, data-quality checks, Chart.js figures, CSV and HTML reports, and a reproducibility JSON record. Method selection is a guide for several unimplemented tests; it must not be described as implemented inference.
- Existing limits: regression intervals use a normal critical-value approximation, and diagnostics are limited to a simple one-predictor model. No validated multi-predictor regression, logistic regression, ANOVA suite, nonparametric suite, ML pipeline, or time-series forecasting engine was found in the current Data Analysis Lab.

### Dependency map
```
research-tools.html
  ├── data-analysis-core.js (new, deterministic ingestion/schema/profile layer)
  ├── Chart.js (existing charts)
  ├── SheetJS/XLSX (existing spreadsheet import/export library)
  ├── research-tools-cloud-sync.js (metadata/summary sync only; no raw data)
  ├── supabase-auth.js (existing sign-in UI)
  └── design.css (shared toolkit styling)

scripts/data-analysis-core-test.mjs
  └── loads data-analysis-core.js in Node VM and checks deterministic results

.github/workflows/pages.yml
  ├── scripts/smoke-test.mjs
  ├── scripts/reference-dedup-regression-test.mjs
  └── scripts/data-analysis-core-test.mjs (new)
```

## Implementation phases

### Phase 0 — Inventory and guardrails
- [x] Inspect repository tree, deployment workflow, Data Analysis Lab, shared styling, auth/cloud-sync code and current migration.
- [x] Record architecture mismatch: this repository is a static GitHub Pages app, not a Next.js/Vercel application. Do not introduce Next.js merely to satisfy a generic architecture suggestion.
- [x] Preserve the current non-AI, free-to-use product commitment.
- [x] Document implemented versus unimplemented methods.
- [ ] Verify every release on GitHub Actions and then against the live site.

### Phase 1 — Dataset ingestion and schema foundation (current)
- [x] Maintain a separately testable, deterministic browser/Node-compatible ingestion module in `data-analysis-core.js`.
- [x] Support CSV, TSV and JSON, retaining existing XLS/XLSX worksheet support in the UI.
- [x] Validate headers, empty files, ragged rows, duplicate headers and resource limits; ragged rows are padded to a rectangular matrix and extra source columns receive generated headers.
- [x] Detect common delimiters and UTF-8 BOM; report malformed quoting and heuristic type assumptions.
- [x] Show a bounded read-only row preview and schema/profile summary in the existing UI.
- [x] Keep imported data in browser memory; do not silently upload raw values.
- [x] Add known-fixture and edge-case tests and wire them into deployment validation.
- [x] Regression fix (2026-10-15): corrected a mismatch where ragged-row warnings claimed padding but rows remained short; numeric range profiling no longer spreads a potentially large column into function arguments.
- [ ] Verify worksheet import, browser preview, and export round-trip in a real browser; Node tests do not substitute for browser integration testing.

### Phase 2 — Cleaning and data-quality controls
- [x] Add non-destructive preview search, sortable columns, visible-column selection, and pagination; source row numbers remain visible and source data is not changed by preview controls.
- [x] Add a clearly labelled synthetic sample dataset for first-run exploration; mark its provenance in analysis records and reports.
- Missingness and duplicate-row reports with row identifiers.
- Range checks, suspicious-value flags and explicit unit conversions.
- [x] Add a reversible, parameterized numeric derived-column operation with preview/confirm, undo/redo, unit labels, reason, valid/missing counts, and exportable provenance. The original imported matrix is retained in memory; the operation creates a new column and never imputes or deletes rows.
- [ ] Expand to additional explicit recoding/unit-conversion operations and test transformations against browser UI workflows.
- Clear original/current dataset distinction and undo/redo.
- No automatic deletion or imputation.

### Phase 3 — Exploratory analysis and figure studio
- [x] Add a separately tested descriptive-statistics module with valid/missing counts, mean, median, sample SD, min/max, type-7 quartiles and IQR; show missingness rather than silently dropping it from the report.
- [ ] Independently validate existing Pearson and Welch test implementations before expanding inferential methods.
- Frequency tables, cross-tabulations, ECDF, Q-Q and supported distribution plots.
- Grouping, variable selection, source-row identification and accessible plot configuration.
- Save figure settings and source-data/run identifiers; verify export formats individually.

### Phase 4 — Validated core statistics
- Independent reference tests for descriptive summaries, correlation, t-tests and supported comparisons.
- Add methods only with correct test statistics, degrees of freedom, p-values, confidence intervals and assumption/design checks.
- Separate method-guide recommendations from executed methods.
- Replace normal-approximation intervals with validated distributions where appropriate.

### Phase 5 — Regression and diagnostics
- Multiple regression, coefficient uncertainty, residual diagnostics, VIF, influence and heteroscedasticity checks.
- Explicit complete-case/missing-data policy and included/excluded row accounting.
- Do not expose a method as available until reference fixtures and edge cases pass.

### Phase 6 — Machine learning and time series
- Baselines, leakage-safe cross-validation, appropriate splits, metrics, seeds and model manifests.
- Time-aware validation and backtesting for temporal data.
- Warn on sample-size, class-balance, grouping and complexity limitations.
- Evaluate browser-side libraries and separate compute workers only after requirements and workload are measured.

### Phase 7 — Reproducibility and reports
- Versioned analysis configurations, dataset fingerprints, provenance, stale-output detection and rerun comparison.
- CSV/XLSX/JSON/HTML exports, then DOCX/PDF only with tested rendering paths.
- Reports populated exclusively from computed result objects; no fabricated outputs.

### Phase 8 — Optional AI assistance
- Keep external AI off by default and optional.
- Convert prompts into validated structured configurations; never execute arbitrary supplied code.
- Disclose when data leaves the browser and cite actual result IDs.
- This phase must respect the current repository's non-AI product commitment unless that product decision is explicitly revised.

## Acceptance-test checklist

### Ingestion and schema
- [ ] CSV quoted commas, escaped quotes, CRLF, LF, UTF-8 BOM and empty cells.
- [ ] TSV with quoted tabs/newlines.
- [ ] JSON array of objects, stable key union and missing values.
- [ ] Empty/invalid JSON, inconsistent rows, duplicate/blank headers and unsupported types.
- [ ] File-size/row/column limits prevent unbounded work.
- [ ] Numeric/date-like inference is explicitly heuristic and never silently converts source values.
- [ ] Preview counts and sampled values match the retained dataset.

### Statistical correctness
- [ ] Known independent fixtures for every implemented statistic.
- [ ] Missing values, constants, zero variance, tiny samples, and singular/invalid inputs.
- [ ] Degrees of freedom, confidence intervals and p-values independently verified.
- [ ] No unsupported test presented as executed.

### Reproducibility and privacy
- [ ] Imported raw values remain in browser memory unless the user explicitly chooses an implemented persistence feature.
- [ ] Summary cloud sync contains no raw dataset values.
- [ ] Dataset changes invalidate or mark derived outputs stale.
- [ ] Exported records match visible results and include method/settings/limitations.

### Release and UX
- [ ] Node test suite and site smoke checks pass.
- [ ] GitHub Pages deploy job completes.
- [ ] Live critical-page smoke test confirms deployment.
- [ ] Mobile layout, keyboard access, empty/error/loading states and browser-console errors checked.
- [ ] Report incomplete capabilities and limitations honestly.

## Explicit non-goals for the first vertical slice
Do not add a Next.js/Vercel backend, a paid service, arbitrary code execution, cloud raw-data storage, AI APIs, or new database migrations. The first slice improves the actual static application with a testable ingestion layer.
