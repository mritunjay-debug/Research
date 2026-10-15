import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const htmlFiles = ['index.html', 'citation-verification.html', 'literature.html', 'workspace.html', 'manuscript-audit.html', 'research-tools.html'];
const standaloneScripts = ['research-tools-cloud-sync.js', 'literature-cloud-sync.js', 'journal-finder.js'];
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
  try {
    new Function(fs.readFileSync(fullPath, 'utf8'));
  } catch (error) {
    errors.push(`${file}: JavaScript syntax error: ${error.message}`);
  }
}
const workspace = fs.existsSync(path.join(root, 'workspace.html'))
  ? fs.readFileSync(path.join(root, 'workspace.html'), 'utf8')
  : '';
for (const required of ['const TOOL_REGISTRY=', 'id="availableToolCount"', 'id="projectCount"', 'id="openCount"', 'id="doneCount"']) {
  if (!workspace.includes(required)) errors.push(`Workspace is missing required dashboard element: ${required}`);
}
const utilities = fs.existsSync(path.join(root, 'research-tools.html'))
  ? fs.readFileSync(path.join(root, 'research-tools.html'), 'utf8')
  : '';
for (const required of ['data-tab="analysis"', 'data-tab="journal-finder"', 'id="jfTitle"', 'id="jfAbstract"', 'id="findJournals"', 'id="jfExport"', 'journal-finder.js', 'data-tab="manuscript"', 'restoreWorkspace();', 'persistWorkspace()', 'xlsx.full.min.js', 'sheetPicker', 'saveAnalysisCloud']) {
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
  'id="downloadDuplicateAuditCsv"',
  'function findDuplicateCandidates(list)',
  'function buildDedupGroups(a)',
  'no record is excluded unless you explicitly confirm'
]) {
  if (!citation.includes(required)) errors.push(`Reference-cleaning workflow is missing required safety/UI hook: ${required}`);
}
if (errors.length) {
  console.error('Static site checks failed:');
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}
console.log(`Static site checks passed: ${htmlFiles.length} pages and ${standaloneScripts.length} standalone script(s) inspected; inline JavaScript syntax and required dashboard/tool hooks are valid.`);
