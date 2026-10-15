import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';

const html = fs.readFileSync(new URL('../citation-verification.html', import.meta.url), 'utf8');
const start = html.indexOf('function normaliseTitle(s)');
const end = html.indexOf('function renderDedupWorkflow()', start);
assert(start >= 0 && end > start, 'Could not locate live deduplication functions in citation-verification.html');
const liveFunctions = html.slice(start, end);
const context = {
  parseRef(ref) {
    const m = String(ref || '').match(/\b(?:18|19|20|21)\d{2}[a-z]?\b/);
    return {title: '', year: m ? m[0] : ''};
  },
  originalAuthorText(ref) {
    const s = String(ref || '');
    const year = s.search(/\b(?:18|19|20|21)\d{2}\b/);
    return year >= 0 ? s.slice(0, year) : '';
  }
};
vm.createContext(context);
vm.runInContext(liveFunctions + '\nglobalThis.api={findDuplicateCandidates,buildDedupGroups};', context);
const {findDuplicateCandidates, buildDedupGroups} = context.api;
const doiA = 'Smith, J. (2020). A robust study of rock mechanics. Journal. doi:10.1234/example.1';
const doiB = 'Smith, J. (2020). A robust study of rock mechanics. Journal. https://doi.org/10.1234/example.1';
const punctuationA = 'Brown, K. (2021). Rock-mass behaviour under stress. Mining Journal.';
const punctuationB = 'Brown, K. (2021). Rock mass behaviour under stress! Mining Journal.';
const conflictingA = 'Lee, A. (2022). A unique paper title for a test. doi:10.1111/first';
const conflictingB = 'Lee, A. (2022). A unique paper title for a test. doi:10.2222/second';
const yearA = 'Kumar, R. (2020). Identical title for testing reference matching. Journal.';
const yearB = 'Kumar, R. (2022). Identical title for testing reference matching. Journal.';
const similarA = 'Author, A. (2021). Slope stability assessment in open pit mines. Journal.';
const similarB = 'Author, A. (2021). Slope stability monitoring in underground tunnels. Journal.';

function candidates(list) { return findDuplicateCandidates(list).candidates; }
function hasPair(list, i, j) { return candidates(list).some(c => c.a.index === i && c.b.index === j); }
let passed = 0;
function check(name, fn) { fn(); passed++; console.log('PASS ' + name); }

check('identical DOI references are candidates', () => assert(hasPair([doiA, doiB], 1, 2)));
check('punctuation-normalised titles are candidates', () => assert(hasPair([punctuationA, punctuationB], 1, 2)));
check('conflicting non-empty DOI values suppress a pair', () => assert.equal(hasPair([conflictingA, conflictingB], 1, 2), false));
check('same title with different years remains reviewable and exposes year difference', () => {
  const pair = candidates([yearA, yearB])[0];
  assert(pair);
  assert.match(pair.evidence, /DIFFERS \(2020 vs 2022\)/);
});
check('distinct similar titles are not automatically treated as duplicates', () => {
  const list = [similarA, similarB];
  assert.equal(hasPair(list, 1, 2), false);
});
check('references without DOI can be compared by title', () => assert(hasPair([punctuationA, punctuationB], 1, 2)));
check('empty input produces no candidates', () => assert.equal(candidates([]).length, 0));
check('single reference produces no candidates', () => assert.equal(candidates([doiA]).length, 0));
check('multiple duplicates are grouped by connected record membership', () => {
  const list = [doiA, doiB, yearA, yearB, 'Unique author (2019). Unrelated work with distinct title.'];
  const audit = findDuplicateCandidates(list);
  const groups = buildDedupGroups(audit);
  assert.equal(groups.length, 2);
  assert.deepEqual(groups.map(g => g.records.length).sort(), [2, 2]);
});
check('candidate decisions start unresolved', () => {
  const audit = findDuplicateCandidates([doiA, doiB]);
  const groups = buildDedupGroups(audit);
  assert.equal(groups[0].decision, 'Needs review');
  assert.equal(groups[0].records.length, 2);
});
console.log('Reference deduplication regression tests passed: ' + passed + ' checks.');
