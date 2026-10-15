/* Manuscript-based journal discovery using OpenAlex works metadata.
 * Rankings are evidence-based shortlist signals, not acceptance predictions.
 */
(function(){
 'use strict';
 const $=id=>document.getElementById(id);
 const title=$('jfTitle'),abstract=$('jfAbstract'),field=$('jfField'),limit=$('jfLimit'),run=$('findJournals'),status=$('jfStatus'),results=$('jfResults'),exportBtn=$('jfExport');
 if(!run||!title||!abstract)return;
 let latest=[];
 const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const safeUrl=s=>{try{const u=new URL(s);return ['https:','http:'].includes(u.protocol)?u.href:''}catch(_){return ''}};
 const year=w=>w.publication_year||'Year n/a';
 const sourceOf=w=>w.primary_location&&w.primary_location.source?w.primary_location.source:null;
 const articleUrl=w=>safeUrl((w.doi||'').replace(/^https?:\/\/doi.org\//i,'').startsWith('10.')?'https://doi.org/'+(w.doi||'').replace(/^https?:\/\/doi.org\//i,''):w.id||'');
 async function fetchWorks(q){const url='https://api.openalex.org/works?search='+encodeURIComponent(q)+'&per-page=75&sort=relevance_score:desc&select=id,doi,title,publication_year,type,cited_by_count,primary_location,authorships';const r=await fetch(url,{headers:{Accept:'application/json'}});if(!r.ok)throw new Error('OpenAlex returned HTTP '+r.status);const d=await r.json();return d.results||[]}
 function render(rows,queryLabel){
  latest=rows;exportBtn.disabled=!rows.length;
  if(!rows.length){results.innerHTML='<p>No journal candidates could be derived from the returned records. Try a more specific title or a shorter abstract.</p>';return}
  const link=(url,label)=>url?'<a class="jf-link" href="'+esc(url)+'" target="_blank" rel="noopener">'+label+' ↗</a>':'';
  results.innerHTML='<div class="jf-summary"><strong>'+rows.reduce((s,r)=>s+r.paperCount,0)+' related paper records</strong><span>'+rows.length+' candidate journals</span><span>Sorted by manuscript-topic evidence</span></div>'+
   '<p class="small-note">These are journal venues where similar papers were published—not a guarantee of acceptance or journal quality. Each card shows why it matched and gives direct journal/article routes where available. Indexing and quartile must be checked independently.</p>'+
   '<div class="jf-candidates">'+rows.map((r,i)=>{
    const journalSearch='https://www.google.com/search?q='+encodeURIComponent('"'+r.name+'" official journal website');
    const scopusSearch='https://www.scopus.com/sources';
    const wosSearch='https://mjl.clarivate.com/home';
    const doajSearch='https://doaj.org/search/journals?ref=homepage&q='+encodeURIComponent(r.name);
    const paperList=r.examples.map(p=>'<li><a href="'+esc(p.url)+'" target="_blank" rel="noopener">'+esc(p.title)+'</a><span class="small-note">'+esc(p.year)+' · cited by '+p.cited+'</span></li>').join('');
    const fit=r.paperCount>=3?'Multiple related papers found':r.paperCount===2?'Two related papers found':'One related paper found';
    return '<article class="jf-card"><div class="jf-card-top"><div><div class="jf-rank">CANDIDATE '+(i+1)+'</div><h3>'+esc(r.name)+'</h3><div class="jf-meta">'+esc(r.publisher||'Publisher not identified')+' · ISSN '+esc((r.issn||[]).join(', ')||'not listed')+'</div></div><div class="jf-score"><strong>'+r.score.toFixed(0)+'</strong><span>evidence score / 100</span></div></div>'+
    '<div class="jf-chips"><span>'+r.paperCount+' related paper(s)</span><span>'+r.recentCount+' published since 2022</span><span>'+esc(fit)+'</span></div>'+
    '<p class="jf-why"><strong>Why it appears:</strong> '+r.paperCount+' retrieved paper(s) from this journal matched your title/abstract search'+(r.recentCount?' and '+r.recentCount+' are dated 2022 or later':'')+'. Use the example papers below to judge scope fit directly.</p>'+
    '<div class="jf-links">'+link(r.homepage||journalSearch,r.homepage?'Visit journal website':'Find official journal website')+link(scopusSearch,'Check Scopus Sources')+link(wosSearch,'Check Web of Science')+link(doajSearch,'Check DOAJ')+'</div>'+
    '<div class="jf-papers"><strong>Related published papers</strong><ul>'+paperList+'</ul></div>'+
    '<details class="jf-details"><summary>What to verify before submission</summary><ul><li>Read the journal aims and scope and confirm that your article type is accepted.</li><li>Check current Scopus coverage in Scopus Sources and Web of Science coverage in the Master Journal List.</li><li>Confirm current quartile, APC/page charges, peer-review model and average timelines on authoritative pages.</li><li>Check for any special issue invitation or suspicious publication promises before paying fees.</li></ul></details>'+
    '<div class="jf-footer">'+link(r.openalex,'View source metadata')+'<span class="small-note">OpenAlex source metadata is supporting evidence only, not the journal website.</span></div></article>'
   }).join('')+'</div><p class="small-note">Search basis: '+esc(queryLabel)+'. OpenAlex provides related-publication metadata. Official journal URLs are used when supplied; otherwise the website link opens a targeted search rather than incorrectly presenting OpenAlex as the journal homepage.</p>';
 }
 run.addEventListener('click',async()=>{
  const t=title.value.trim(),a=abstract.value.trim();if(!t&&!a){status.textContent='Paste a title or abstract to search.';title.focus();return}
  if(a.length<80&&!t){status.textContent='Add a title or a longer abstract (at least 80 characters).';return}
  run.disabled=true;run.textContent='Finding journals…';status.textContent='Searching published research and grouping related papers by journal…';results.innerHTML='';latest=[];
  try{
   const qs=[];if(t)qs.push({q:t.slice(0,350),weight:2});if(a)qs.push({q:([field.value.trim(),a].filter(Boolean).join(' ')).slice(0,900),weight:1});
   const settled=await Promise.all(qs.map(async x=>({weight:x.weight,works:await fetchWorks(x.q)})));
   const seen=new Map();for(const batch of settled){for(const w of batch.works){if(!w.id)continue;const old=seen.get(w.id);if(!old||old.weight<batch.weight)seen.set(w.id,{...w,weight:batch.weight})}}
   const candidates=new Map();for(const w of seen.values()){const s=sourceOf(w);if(!s||!s.id||!s.display_name)continue;let c=candidates.get(s.id);if(!c){c={id:s.id,name:s.display_name,publisher:s.host_organization_name||'',issn:s.issn||[],homepage:s.homepage_url||'',openalex:s.id,papers:[],weightSum:0,recentCount:0};candidates.set(s.id,c)}c.papers.push(w);c.weightSum+=w.weight;if((w.publication_year||0)>=2022)c.recentCount++}
   const max=Math.max(1,...Array.from(candidates.values()).map(c=>c.papers.length));
   latest=Array.from(candidates.values()).map(c=>{c.papers.sort((x,y)=>(y.weight-x.weight)||((y.relevance_score||0)-(x.relevance_score||0))||((y.publication_year||0)-(x.publication_year||0)));const count=c.papers.length;const weighted=c.weightSum;const score=Math.min(100,100*(0.65*count/max+0.35*weighted/Math.max(1,max*2)));return {...c,paperCount:count,score,fitLabel:count>=Math.max(3,Math.ceil(max*.45))?'Repeated matches':count>=2?'Several matches':'Initial match',examples:c.papers.slice(0,3).map(w=>({title:w.title||'Untitled work',year:year(w),cited:w.cited_by_count||0,url:articleUrl(w)})).filter(p=>p.url)}}).sort((x,y)=>y.score-x.score||y.paperCount-x.paperCount||y.recentCount-x.recentCount).slice(0,Number(limit.value)||15);
   if(!latest.length){results.innerHTML='<p>Search returned works, but no journal source was listed for them. Try another title or abstract.</p>';status.textContent='No journal sources found.'}else{render(latest,qs.map(x=>x.weight===2?'title':'abstract').join(' + '));status.textContent='Found '+latest.length+' candidate journals from matching publication records. Review scope and eligibility before deciding.'}
  }catch(e){status.textContent='Search failed: '+e.message+'. Check your connection and try again.';results.innerHTML='<p>Journal discovery uses the public OpenAlex API. If it is temporarily unavailable, retry later.</p>'}
  finally{run.disabled=false;run.textContent='Find relevant journals'}
 });
 exportBtn.addEventListener('click',()=>{if(!latest.length)return;const rows=[['Rank','Journal','Publisher','ISSN','Related paper count','Evidence score (heuristic)','Recent papers since 2022','Homepage','OpenAlex source','Example paper titles']];latest.forEach((r,i)=>rows.push([i+1,r.name,r.publisher,r.issn.join('; '),r.paperCount,r.score.toFixed(1),r.recentCount,r.homepage,r.openalex,r.examples.map(p=>p.title+' ('+p.year+')').join(' | ')]));const csv=rows.map(row=>row.map(v=>{const s=String(v??'');return /[",\r\n]/.test(s)?'"'+s.replace(/"/g,'""')+'"':s}).join(',')).join('\r\n');const blob=new Blob([csv],{type:'text/csv;charset=utf-8'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='journal-finder-shortlist.csv';a.click();setTimeout(()=>URL.revokeObjectURL(url),500)});
})();