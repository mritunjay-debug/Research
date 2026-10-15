import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const root = process.cwd();
const htmlFiles = ['index.html', 'citation-verification.html', 'literature.html', 'workspace.html', 'manuscript-audit.html', 'thesis-manuscript-studio.html', 'research-tools.html', 'research-planning.html', 'research-library.html'];
const standaloneScripts = ['research-tools-cloud-sync.js', 'literature-cloud-sync.js', 'journal-finder.js', 'supabase-auth.js', 'workspace-cloud-sync.js', 'data-analysis-core.js', 'data-analysis-stats.js', 'scripts/live-smoke-test.mjs', 'scripts/data-analysis-core-test.mjs', 'scripts/data-analysis-stats-test.mjs'];
const errors = [];
for (const file of htmlFiles) {
  const fullPath = path.join(root, file);
  if (!fs.existsSync(fullPath)) {
    errors.push(`Missing required page: ${file}`);
    continue;
  }
  const html = fs.readFileSync(fullPath, 'utf8');
  const scripts = [...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/gi)]
    .map(match => match[1])
    .filter(source => source.trim());
  for (let i = 0; i < scripts.length; i++) {
    try {
      new Function(scripts[i]);
    } catch (error) {
      errors.push(`${file}: inline script ${i + 1} has a syntax error: ${error.message}`);
    }
  }
}
for (const file of standaloneScripts) {
  const fullPath = path.join(root, file);
  if (!fs.existsSync(fullPath)) {
    errors.push(`Missing required script: ${file}`);
    continue;
  }
  const check = spawnSync(process.execPath, ['--check', fullPath], { encoding: 'utf8' });
  if (check.error || check.status !== 0) {
    const detail = check.error?.message || check.stderr?.trim() || `Node exited with status ${check.status}`;
    errors.push(`${file}: JavaScript syntax error: ${detail}`);
  }
}
const workspace = fs.existsSync(path.join(root, 'workspace.html'))
  ? fs.readFileSync(path.join(root, 'workspace.html'), 'utf8')
  : '';
for (const required of ['const TOOL_REGISTRY=', 'id="availableToolCount"', 'id="projectCount"', 'id="openCount"', 'id="doneCount"']) {
  if (!workspace.includes(required)) errors.push(`Workspace is missing required dashboard element: ${required}`);
}
const accountUi = fs.existsSync(path.join(root, 'supabase-auth.js'))
  ? fs.readFileSync(path.join(root, 'supabase-auth.js'), 'utf8')
  : '';
for (const required of [
  'id="rt-profile-trigger"',
  'id="rt-profile-menu"',
  'aria-haspopup="menu"',
  'role="menuitem"',
  'function openProfileMenu()',
  'function closeProfileMenu(focusTrigger)',
  'supabase.auth.signOut()',
  'id="rt-cloud-state"'
]) {
  if (!accountUi.includes(required)) errors.push(`Shared account header is missing required accessibility/authentication hook: ${required}`);
}
for (const forbidden of ['id="rt-signout" type="button" style="display:none"', 'Research Toolkit · Cloud account']) {
  if (accountUi.includes(forbidden)) errors.push(`Shared account header still contains outdated UI: ${forbidden}`);
}
const cloudSync = fs.existsSync(path.join(root, 'workspace-cloud-sync.js'))
  ? fs.readFileSync(path.join(root, 'workspace-cloud-sync.js'), 'utf8')
  : '';
for (const required of ["setSyncState('Synced just now','synced')", "setSyncState('Changes not synced','unknown')", 'Cloud sync failed:', 'if(syncState)syncState.hidden=false']) {
  if (!cloudSync.includes(required)) errors.push(`Workspace cloud sync is missing truthful status behavior: ${required}`);
}

const studio = fs.existsSync(path.join(root, 'thesis-manuscript-studio.html'))
  ? fs.readFileSync(path.join(root, 'thesis-manuscript-studio.html'), 'utf8')
  : '';
for (const required of [
  'id="createProject"',
  'id="addSection"',
  'id="saveDraft"',
  'id="snapshotDraft"',
  'id="draftRecord"',
  'id="newDraft"',
  'id="deleteDraft"',
  'id="versionList"',
  'id="saveChecks"',
  'id="exportJson"',
  'id="exportMarkdown"',
  'id="exportHtml"',
  'id="importJson"',
  'function renderAll()',
  'function renderVersions()',
  'function renderChecks()',
  'localStorage.setItem(STORE'
]) {
  if (!studio.includes(required)) errors.push(`Thesis & Manuscript Studio is missing required functionality: ${required}`);
}
const dataCore = fs.existsSync(path.join(root, 'data-analysis-core.js'))
  ? fs.readFileSync(path.join(root, 'data-analysis-core.js'), 'utf8')
  : '';
for (const required of ['parseDelimited', 'parseJSON', 'normaliseRows', 'profileRows', 'previewRows', 'deriveNumericColumn', 'validateNumericRange', 'frequencyTable', 'crossTabulate']) {
  if (!dataCore.includes(required)) errors.push(`Data analysis ingestion core is missing required function: ${required}`);
}
const utilities = fs.existsSync(path.join(root, 'research-tools.html'))
  ? fs.readFileSync(path.join(root, 'research-tools.html'), 'utf8')
  : '';
for (const required of ['data-tab="analysis"', 'data-analysis-core.js', 'data-analysis-stats.js', 'id="analysisDataPreview"', 'id="analysisPreviewTable"', 'id="analysisPreviewStatus"', 'id="analysisPreviewSearch"', 'id="analysisPreviewPageSize"', 'id="analysisPreviewColumns"', 'id="analysisPreviewPrevious"', 'id="analysisPreviewNext"', 'id="analysisPreviewSelectAll"', 'id="loadSampleDataset"', 'id="derivedSourceColumn"', 'id="derivedColumnName"', 'id="previewDerivedColumn"', 'id="applyDerivedColumn"', 'id="undoTransformation"', 'id="redoTransformation"', 'id="derivedColumnHistory"', 'id="rangeCheckColumn"', 'id="runRangeCheck"', 'id="exportRangeCheck"', 'id="rangeCheckResult"', 'id="frequencyColumn"', 'id="runFrequencyTable"', 'id="exportFrequencyTable"', 'id="crossTabRow"', 'id="crossTabColumn"', 'id="runCrossTabulation"', 'id="exportCrossTabulation"', 'id="frequencyTableResult"', 'id="crossTabulationResult"', 'Dataset (.csv, .tsv, .json, .xlsx, .xls)', 'data-tab="journal-finder"', 'id="jfTitle"', 'id="jfAbstract"', 'id="findJournals"', 'id="jfExport"', 'journal-finder.js', 'data-tab="manuscript"', 'restoreWorkspace();', 'persistWorkspace()', 'xlsx.full.min.js', 'sheetPicker', 'saveAnalysisCloud']) {
  if (!utilities.includes(required)) errors.push(`Research utilities are missing required functionality: ${required}`);
}
const literature = fs.existsSync(path.join(root, 'literature.html'))
  ? fs.readFileSync(path.join(root, 'literature.html'), 'utf8')
  : '';
for (const required of ['rtLiteratureCloudBridge', 'literature-cloud-sync.js']) {
  if (!literature.includes(required)) errors.push(`Literature workspace is missing cloud-sync integration: ${required}`);
}
const citation = fs.existsSync(path.join(root, 'citation-verification.html'))
  ? fs.readFileSync(path.join(root, 'citation-verification.html'), 'utf8')
  : '';
for (const required of [
  'id="duplicateAuditPanel"',
  'id="runDuplicateAudit"',
  'id="exportDuplicateAudit"',
  'id="exportCleanReferences"',
  'id="resetCleanReferences"',
  'id="duplicateStatus"',
  'id="duplicateResults"',
  'id="cleanedExports"',
  'id="downloadCleanTxt"',
  'id="downloadCleanCsv"',
  'id="downloadExcludedCsv"',
  'id="downloadDecisionCsv"',
  'function findDuplicateCandidates(list)',
  'function buildDedupGroups(a)',
  'no record is excluded unless you explicitly confirm'
]) {
  if (!citation.includes(required)) errors.push(`Reference-cleaning workflow is missing required safety/UI hook: ${required}`);
}

const planning = fs.existsSync(path.join(root, 'research-planning.html'))
  ? fs.readFileSync(path.join(root, 'research-planning.html'), 'utf8')
  : '';
for (const required of [
  'id="methodForm"',
  'id="datasetForm"',
  'id="integrityList"',
  'id="exportJson"',
  'fieldnotes-research-planning/v1',
  'Export full JSON backup',
  'no AI API configuration'
]) {
  if (!planning.includes(required)) errors.push(`Research Planning Workbench is missing required feature or data-safety hook: ${required}`);
}


const library = fs.existsSync(path.join(root, 'research-library.html'))
  ? fs.readFileSync(path.join(root, 'research-library.html'), 'utf8')
  : '';
for (const required of [
  'id="noteForm"',
  'id="outputForm"',
  'id="addQuestion"',
  'id="statsList"',
  'fieldnotes-research-library/v1',
  'api.crossref.org/works/',
  'Export JSON backup'
]) {
  if (!library.includes(required)) errors.push(`Research Library & Methods is missing required feature or provenance hook: ${required}`);
}

if (errors.length) {
  console.error('Static site checks failed:');
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}
console.log(`Static site checks passed: ${htmlFiles.length} pages and ${standaloneScripts.length} standalone script(s) inspected; inline JavaScript syntax and required dashboard/tool hooks are valid.`);
