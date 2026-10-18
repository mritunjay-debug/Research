import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { spawnSync } from 'node:child_process';

const root = process.cwd();
const htmlFiles = ['index.html', 'citation-verification.html', 'literature.html', 'workspace.html', 'manuscript-audit.html', 'thesis-manuscript-studio.html', 'research-tools.html', 'research-planning.html', 'research-library.html', 'pillar-simulator.html', 'pillar-validation.html', 'pillar-case-history.html', 'pillar-layout-editor.html'];
const standaloneScripts = ['research-tools-cloud-sync.js', 'literature-cloud-sync.js', 'journal-finder.js', 'supabase-auth.js', 'workspace-cloud-sync.js', 'data-analysis-core.js', 'data-analysis-stats.js', 'data-analysis-figure.js', 'pillar-strength-core.js', 'scripts/pillar-strength-core-test.mjs', 'scripts/data-analysis-figure-test.mjs', 'scripts/live-smoke-test.mjs', 'scripts/data-analysis-core-test.mjs', 'scripts/data-analysis-stats-test.mjs'];
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
      new vm.Script(scripts[i], { filename: `${file} inline script ${i + 1}` });
    } catch (error) {
      errors.push(`${file}: inline script ${i + 1} has a syntax error: ${error.stack || error.message}`);
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
const pillarSimulator = fs.existsSync(path.join(root, 'pillar-simulator.html'))
  ? fs.readFileSync(path.join(root, 'pillar-simulator.html'), 'utf8')
  : '';
for (const required of ['id="mine"', 'id="material"', 'id="method"', 'id="width"', 'id="length"', 'id="height"', 'id="roomX"', 'id="roomY"', 'id="geometryView"', 'value="plan"', 'view===\'plan\'', 'roomX:val(\'roomX\')', 'roomY:val(\'roomY\')', 'window.PillarStrengthCore.estimate(p)', 'function draw()', 'function chart()', 'function json()', 'function csv()', 'stepX=p.width+p.roomX', 'stepY=p.length+p.roomY', 'extentX=n*stepX', 'extentY=n*stepY', 'p.width*p.length', 'width_x_m', 'length_y_m', 'room_opening_x_m', 'room_opening_y_m', 'id="rows"', 'Strength / stress ratio', 'not universal FoS', 'const raw=(x,y,z)', 'poly([q.b[0],q.b[1],q.t[1],q.t[0]]', 'poly([q.b[1],q.b[2],q.t[2],q.t[1]]', 'poly([q.b[2],q.b[3],q.t[3],q.t[2]]', 'poly([q.b[3],q.b[0],q.t[0],q.t[3]]', 'Fit the complete excavation', 'Complete rectangular prism', 'layoutSummaryPanel', 'id="exportLayout"', 'function updateLayoutSummary()', 'function exportLayout()', 'position_class', 'geometryChecks', 'layoutFootprint']) {
  if (!pillarSimulator.includes(required)) errors.push(`Pillar Stability Lab is missing required feature or limitation marker: ${required}`);
}

const workspace = fs.existsSync(path.join(root, 'workspace.html'))
  ? fs.readFileSync(path.join(root, 'workspace.html'), 'utf8')
  : '';
for (const required of ['const TOOL_REGISTRY=', 'id="availableToolCount"', 'id="projectCount"', 'id="openCount"', 'id="doneCount"']) {
  if (!workspace.includes(required)) errors.push(`Workspace is missing required dashboard element: ${required}`);
}

const responsiveCss = fs.existsSync(path.join(root, 'responsive-mobile.css'))
  ? fs.readFileSync(path.join(root, 'responsive-mobile.css'), 'utf8')
  : '';
for (const required of ['@media (max-width: 720px)', '@media (max-width: 480px)', 'prefers-reduced-motion', 'overflow-x: clip', 'min-height: 44px']) {
  if (!responsiveCss.includes(required)) errors.push(`Shared responsive stylesheet is missing mobile/accessibility behavior: ${required}`);
}
for (const file of htmlFiles.filter(file => file !== 'index.html')) {
  const html = fs.existsSync(path.join(root, file)) ? fs.readFileSync(path.join(root, file), 'utf8') : '';
  if (!html.includes('href="responsive-mobile.css"')) errors.push(`${file} is missing shared responsive stylesheet`);
}
const validation = fs.existsSync(path.join(root, 'pillar-validation.html'))
  ? fs.readFileSync(path.join(root, 'pillar-validation.html'), 'utf8')
  : '';
for (const required of ['id="csvFile"', 'id="observed"', 'id="predicted"', 'id="validate"', 'id="rmse"', 'id="mae"', 'id="bias"', 'id="r2"', 'id="mape"', 'id="plot"', 'id="downloadMetrics"', 'id="downloadPairs"', 'id="downloadJson"', 'id="residSd"', 'id="loaLow"', 'id="loaHigh"', 'observedRaw:r[oh]', 'independent observations']) {
  if (!validation.includes(required)) errors.push(`Pillar Model Validation Bench is missing required validation feature: ${required}`);
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
const statsCore = fs.existsSync(path.join(root, 'data-analysis-stats.js')) ? fs.readFileSync(path.join(root, 'data-analysis-stats.js'), 'utf8') : '';
for (const required of ['summariseNumeric', 'normalQuantile', 'welchTTest', 'studentTCritical', 'pearsonCorrelation', 'linearRegression', 'oneSampleTTest', 'pairedTTest', 'mannWhitneyU', 'oneWayAnova', 'holmAdjust', 'pairwiseWelchPostHoc', 'chiSquareIndependence', 'fisherExact2x2']) {
  if (!statsCore.includes(required)) errors.push(`Data analysis statistics module is missing required function: ${required}`);
}
const utilities = fs.existsSync(path.join(root, 'research-tools.html'))
  ? fs.readFileSync(path.join(root, 'research-tools.html'), 'utf8')
  : '';
for (const required of ['data-tab="analysis"', 'data-analysis-core.js', 'data-analysis-stats.js', 'data-analysis-figure.js', 'plotly-2.35.2.min.js', 'id="analysisChart"', 'id="downloadChartSvg"', 'Export high-resolution PNG', 'Export vector SVG', 'id="analysisDataPreview"', 'id="analysisPreviewTable"', 'id="analysisPreviewStatus"', 'id="analysisPreviewSearch"', 'id="analysisPreviewPageSize"', 'id="analysisPreviewColumns"', 'id="analysisPreviewPrevious"', 'id="analysisPreviewNext"', 'id="analysisPreviewSelectAll"', 'id="loadSampleDataset"', 'id="derivedSourceColumn"', 'id="derivedColumnName"', 'id="previewDerivedColumn"', 'id="applyDerivedColumn"', 'id="undoTransformation"', 'id="redoTransformation"', 'id="derivedColumnHistory"', 'id="rangeCheckColumn"', 'id="runRangeCheck"', 'id="exportRangeCheck"', 'id="rangeCheckResult"', 'id="runOneSampleTest"', 'id="oneSampleMean"', 'id="pairedBefore"', 'id="pairedAfter"', 'id="runPairedTest"', 'id="runMannWhitney"', 'id="runAnovaPostHoc"', 'id="frequencyColumn"', 'id="runFrequencyTable"', 'id="exportFrequencyTable"', 'id="crossTabRow"', 'id="crossTabColumn"', 'id="runCrossTabulation"', 'id="exportCrossTabulation"', 'id="frequencyTableResult"', 'id="crossTabulationResult"', 'value="ecdf"', 'value="qq"', 'value="residuals"', 'value="residual-qq"', 'value="density"', 'value="box"', 'value="violin"', 'value="pairs"', 'id="chartPairVariables"', 'Dataset (.csv, .tsv, .json, .xlsx, .xls)', 'data-tab="journal-finder"', 'id="jfTitle"', 'id="jfAbstract"', 'id="findJournals"', 'id="jfExport"', 'journal-finder.js', 'data-tab="manuscript"', 'restoreWorkspace();', 'persistWorkspace()', 'xlsx.full.min.js', 'sheetPicker', 'saveAnalysisCloud']) {
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


const caseHistory = fs.existsSync(path.join(root, 'pillar-case-history.html'))
  ? fs.readFileSync(path.join(root, 'pillar-case-history.html'), 'utf8')
  : '';
for (const required of [
  'id="downloadClean"', 'id="downloadReport"', 'id="downloadFlags"',
  'id="runQC"', 'id="nComplete"', 'id="nDup"', 'id="f_ucs"',
  'id="unitUcs"', 'id="unitLength"', 'id="runSensitivity"',
  'id="exportSensitivity"', 'pillar-case-history-qc/v1',
  'independent validation cases', 'not a pillar factor of safety'
]) {
  if (!caseHistory.includes(required)) errors.push(`Pillar Case-History Workbench is missing required feature or research-integrity hook: ${required}`);
}

const customPillarEditor = fs.readFileSync(path.join(root, 'pillar-layout-editor.html'), 'utf8');
for (const required of ['id="plan"', 'function validate()', 'function parseCsv(', 'function exportCsv()', 'function exportJson()', 'Plan footprints overlap', 'unit_weight_mn_m3', 'local Cartesian']) { if (!customPillarEditor.includes(required)) errors.push('Custom Pillar Layout Editor is missing required feature marker: ' + required); }

if (errors.length) {
  console.error('Static site checks failed:');
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}
console.log(`Static site checks passed: ${htmlFiles.length} pages and ${standaloneScripts.length} standalone script(s) inspected; inline JavaScript syntax and required dashboard/tool hooks are valid.`);

