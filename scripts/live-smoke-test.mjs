import assert from 'node:assert/strict';

const configuredBase = process.env.PAGES_URL;
if (!configuredBase) {
  console.error('Live smoke test requires PAGES_URL from the GitHub Pages deployment output.');
  process.exit(1);
}

const base = configuredBase.endsWith('/') ? configuredBase : configuredBase + '/';
const requiredPages = [
  ['workspace.html', 'Research Scholar Workspace'],
  ['literature.html', 'Literature'],
  ['citation-verification.html', 'Citation Verification'],
  ['research-tools.html', 'Research Utilities'],
  ['manuscript-audit.html', 'Manuscript'],
  ['thesis-manuscript-studio.html', 'Thesis'],
  ['research-planning.html', 'Research Planning'],
  ['research-library.html', 'Research Library']
];

async function fetchWithRetry(url, attempts = 8) {
  let lastError;
  for (let attempt = 1; attempt <= attempts; attempt++) {
    try {
      const response = await fetch(url, { redirect: 'follow', signal: AbortSignal.timeout(15000) });
      if (response.ok) return response;
      lastError = new Error(`HTTP ${response.status}`);
    } catch (error) {
      lastError = error;
    }
    if (attempt < attempts) await new Promise(resolve => setTimeout(resolve, 5000));
  }
  throw new Error(`Unable to fetch ${url} after ${attempts} attempts: ${lastError?.message ?? 'unknown error'}`);
}

const failures = [];
for (const [path, expectedTitle] of requiredPages) {
  const url = new URL(path, base).toString();
  try {
    const response = await fetchWithRetry(url);
    const contentType = response.headers.get('content-type') ?? '';
    const html = await response.text();
    assert.match(contentType, /text\/html/i, `Unexpected content type for ${path}: ${contentType}`);
    assert.match(html, /<!doctype html|<html\b/i, `${path} did not return an HTML document`);
    assert.match(html, /<title\b[^>]*>[\s\S]*?<\/title>/i, `${path} has no title element`);
    if (path === 'workspace.html') {
      assert.match(html, /id="availableToolCount"/, 'Dashboard tool-count element is missing');
      assert.match(html, /id="projectCount"/, 'Dashboard project-count element is missing');
    }
    console.log(`PASS ${path} — HTTP ${response.status}; title and HTML verified; expected page marker: ${expectedTitle}`);
  } catch (error) {
    failures.push(`${path}: ${error.message}`);
    console.error(`FAIL ${path}: ${error.message}`);
  }
}

if (failures.length) {
  console.error(`Live deployment smoke test failed for ${failures.length} page(s).`);
  process.exit(1);
}
console.log(`Live deployment smoke test passed for all ${requiredPages.length} critical pages at ${base}`);
