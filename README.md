# Research Scholar Workspace

A free, non-AI research workflow toolkit deployed on GitHub Pages. Start at the [Research Scholar Workspace dashboard](https://mritunjay-debug.github.io/Research/workspace.html).

## Product commitment
All toolkit features are to remain free for now. This project does not require AI/LLM APIs or paid AI credits. Prefer deterministic browser-side tools and public scholarly metadata sources. Public services may have their own availability, rate limits, or terms; the application should report failures and source provenance rather than invent results.

## Existing tools
- **Workspace dashboard** ([workspace.html](workspace.html)): project records, task/milestone planner and JSON export/import.
- **Citation Verification Agent** ([index.html](index.html), [citation-verification.html](citation-verification.html)): reference metadata checking, duplicate review and reports.
- **Literature Search & PRISMA** ([literature.html](literature.html)): literature import, deduplication, screening and review workflow.
- **Research Utilities** ([research-tools.html](research-tools.html)): data analysis, journal finder and manuscript utilities.
- **Thesis & Manuscript Studio** ([thesis-manuscript-studio.html](thesis-manuscript-studio.html)): section planning, local drafts, snapshots and exports.
- **Manuscript Quality Audit** ([manuscript-audit.html](manuscript-audit.html)): document checks and quality findings.
- **Research Planning Workbench** ([research-planning.html](research-planning.html)): methodology plans, dataset catalogue, integrity checklist and portable exports.
- **Research Library & Methods** ([research-library.html](research-library.html)): searchable notes, publication tracker, Crossref DOI lookup, survey instrument builder and statistical-method reference.
- **Underground Pillar Stability Lab** ([pillar-simulator.html](pillar-simulator.html)): interactive room-and-pillar geometry, selectable material presets (including marble), editable UCS/unit weight, tributary-area stress screening, Lunder–Pakalnis and Krauland–Soder empirical strength estimates, scenario comparison, and JSON/CSV exports. Presets are illustrative; formula applicability and site validation remain the engineer's responsibility.

## Hosting and storage
The static website is deployed through GitHub Pages. Some workflows use browser-local storage; this data stays in the current browser and is not automatically available on other devices. Cloud synchronization is available only for the records and services explicitly connected and successfully configured. A visible sync status must reflect actual synchronization, not merely a local save. Export JSON/backups regularly. Do not use browser-local storage for confidential research data.

## Scope and limitations
The toolkit is being expanded in tested stages. A tool is not considered complete just because a navigation item exists. Planned areas include deeper evidence extraction/appraisal, methodology planning, dataset catalogue, publication figure studio, research integrity checklists, knowledge base, academic output tracking, reproducibility manifests, survey builder and unified cross-module records. See ROADMAP.md for implementation stages and acceptance criteria.

## Development and verification
- GitHub Pages deployment and automated static-site regression checks are defined in .github/workflows/pages.yml.
- The master roadmap prohibits AI dependencies, paid feature gates, fabricated records, destructive defaults and unverified completion claims.
- Test and deployment status must be checked before claiming a change is live.