# Research Scholar Workspace

A GitHub Pages research toolkit. Start at the [Research Scholar Workspace dashboard](https://mritunjay-debug.github.io/Research/workspace.html).

## Available tools
- **Workspace dashboard** ([workspace.html](workspace.html)): browser-local project records, task/milestone planner, JSON export/import.
- **Citation Verification Agent** ([index.html](index.html)): reference metadata checking against Crossref, manual candidate review, Word/Excel reports.
- **Literature Search & PRISMA** ([literature.html](literature.html)): literature record import and screening workflows.

## Hosting and data storage
The static website is deployed through GitHub Pages. Workspace project and task data are saved in the current browser's local storage; they are not synced across devices, are not server-backed, and can be lost if browser data is cleared. Export JSON regularly if you need a separate copy. Do not use browser-local storage for confidential research data.

The repository also contains a Python/Streamlit citation verification app at `citation-verification-agent/app.py`. GitHub Pages cannot run Streamlit; follow [its deployment README](citation-verification-agent/README.md) to run it locally or deploy it to a compatible host.

## Current limitations
The dashboard is a first-stage foundation, not the complete research platform. Thesis/manuscript auditing, statistical analysis, journal discovery, reviewer response workflows, multi-user accounts, cloud persistence, and a unified export of files from every module are not implemented here. Existing literature and citation tools remain separate pages and do not yet share a project database.

## Development approach
Extend the application in tested vertical slices. Preserve source files, distinguish retrieved evidence from suggestions, and report actual test and deployment status. See the master build brief for intended scope.
