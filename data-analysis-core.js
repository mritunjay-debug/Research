/* Deterministic dataset ingestion and schema profiling for the Research Toolkit.
 * Browser-first, no network calls and no mutation of source file values.
 * CommonJS export is provided only so the same pure functions can be tested in Node.
 */
(function(root){
  'use strict';
  const DEFAULT_LIMITS={maxBytes:25*1024*1024,maxRows:250000,maxColumns:500,maxCellChars:1000000};
  function detectDelimiter(text){
    const sample=String(text||'').replace(/^\uFEFF/,'').split(/\r?\n/,20).filter(x=>x.trim());
    const candidates=[',','\t',';','|'];
    const score=d=>{const counts=sample.slice(0,10).map(line=>{let q=false,n=0;for(let i=0;i<line.length;i++){if(line[i]==='"'&&q&&line[i+1]==='"'){i++;continue}if(line[i]==='"')q=!q;else if(line[i]===d&&!q)n++}return n});const nonzero=counts.filter(n=>n>0);if(!nonzero.length)return 0;const mean=nonzero.reduce((a,b)=>a+b,0)/nonzero.length;const variance=nonzero.reduce((a,b)=>a+(b-mean)**2,0)/nonzero.length;return mean-variance*2+(nonzero.length/sample.length)*2};
    return candidates.map((delimiter,index)=>({delimiter,score:score(delimiter),index})).sort((a,b)=>b.score-a.score||a.index-b.index)[0].delimiter;
  }
  function parseDelimited(text,delimiter){
    let source=String(text??'').replace(/^\uFEFF/,'');delimiter=delimiter||detectDelimiter(source);
    if(![',','\t',';','|'].includes(delimiter))throw new Error('Unsupported delimiter.');
    const rows=[];let row=[],cell='',quoted=false;
    for(let i=0;i<source.length;i++){
      const ch=source[i];
      if(ch==='"'&&quoted&&source[i+1]==='"'){cell+='"';i++}
      else if(ch==='"'){quoted=!quoted}
      else if(ch===delimiter&&!quoted){row.push(cell);cell=''}
      else if((ch==='\n'||ch==='\r')&&!quoted){if(ch==='\r'&&source[i+1]==='\n')i++;row.push(cell);if(row.some(v=>v.trim()!==''))rows.push(row);row=[];cell=''}
      else cell+=ch;
    }
    if(quoted)throw new Error('The file contains an unclosed quoted field. Check the source file before importing.');
    row.push(cell);if(row.some(v=>v.trim()!==''))rows.push(row);
    return {rows,delimiter};
  }
  function parseJSON(text){
    let value;try{value=JSON.parse(String(text??''))}catch(e){throw new Error('Invalid JSON: '+e.message)}
    if(!Array.isArray(value))throw new Error('JSON import expects an array of objects, for example [{"site":"A","value":12}].');
    if(!value.length)throw new Error('The JSON array is empty.');
    if(value.some(x=>!x||typeof x!=='object'||Array.isArray(x)))throw new Error('Every JSON array item must be an object; nested arrays and primitive items are not supported in this import mode.');
    const headers=[];for(const item of value)for(const key of Object.keys(item))if(!headers.includes(key))headers.push(key);
    if(!headers.length)throw new Error('No object keys were found in the JSON records.');
    return [headers,...value.map(item=>headers.map(key=>item[key]===null||item[key]===undefined?'':(typeof item[key]==='object'?JSON.stringify(item[key]):String(item[key]))) )];
  }
  function normaliseRows(input,limits){
    limits={...DEFAULT_LIMITS,...(limits||{})};
    if(!Array.isArray(input)||input.length<2)throw new Error('The dataset must contain a header row and at least one observation.');
    if(input.length-1>limits.maxRows)throw new Error('Dataset exceeds the current limit of '+limits.maxRows.toLocaleString()+' rows. Split the file or use a smaller sample.');
    const rows=input.map((r,i)=>{if(!Array.isArray(r))throw new Error('Row '+(i+1)+' is not a tabular row.');return r.map(v=>v===null||v===undefined?'':String(v))});
    const width=Math.max(...rows.map(r=>r.length));
    if(width>limits.maxColumns)throw new Error('Dataset exceeds the current limit of '+limits.maxColumns+' columns.');
    const warnings=[];
    if(rows.some(r=>r.length!==width))warnings.push('Rows with different field counts were padded with empty cells; inspect the source before inferential analysis.');
    rows.forEach((r,i)=>{if(r.some(v=>v.length>limits.maxCellChars))throw new Error('A cell in row '+(i+1)+' exceeds the supported text length.')});
    const rawHeaders=Array.from({length:width},(_,i)=>String(rows[0][i]??'').trim()||('Column '+(i+1))),seen=new Map();
    const headers=rawHeaders.map((h,i)=>{const count=(seen.get(h)||0)+1;seen.set(h,count);if(count>1){warnings.push('Duplicate header "'+h+'" renamed to "'+h+' ('+count+')".');return h+' ('+count+')'}return h});
    rows.forEach(r=>{while(r.length<width)r.push('')});
    rows[0]=headers;
    return {rows,headers,warnings,rowCount:rows.length-1,columnCount:width};
  }
  function inferType(values){
    const present=values.map(v=>String(v??'').trim()).filter(Boolean);
    if(!present.length)return 'empty';
    if(present.every(v=>/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?$/.test(v)&&Number.isFinite(Number(v))))return 'numeric';
    if(present.every(v=>/^(true|false|yes|no)$/i.test(v)))return 'boolean-like';
    if(present.every(v=>/^\d{4}-\d{1,2}-\d{1,2}(?:[T ]\d{2}:\d{2}(?::\d{2}(?:\.\d+)?)?(?:Z|[+-]\d{2}:?\d{2})?)?$/.test(v)&&Number.isFinite(Date.parse(v))))return 'date-like';
    return 'text/category';
  }
  function profileRows(rows){
    const clean=normaliseRows(rows),data=clean.rows.slice(1),n=data.length;
    const variables=clean.headers.map((name,index)=>{const values=data.map(r=>r[index]??''),present=values.filter(v=>String(v).trim()!==''),uniq=new Set(present).size;return {index,name,type:inferType(values),missing:n-present.length,missingPercent:n?100*(n-present.length)/n:0,unique:uniq,examples:present.slice(0,3),range:inferType(values)==='numeric'&&present.length?present.reduce((range,value)=>{const number=Number(value);range.min=Math.min(range.min,number);range.max=Math.max(range.max,number);return range},{min:Infinity,max:-Infinity}):null}});
    const seen=new Set();let duplicateRows=0;
    for(const row of data){const key=JSON.stringify(row);if(seen.has(key))duplicateRows++;else seen.add(key)}
    return {rowCount:n,columnCount:clean.columnCount,missingCells:variables.reduce((s,v)=>s+v.missing,0),duplicateRows,variables,warnings:clean.warnings};
  }
  function previewRows(rows,limit){return rows.slice(0,Math.max(1,Math.min(100,Number(limit)||20))).map(row=>row.slice())}
  const api={DEFAULT_LIMITS,detectDelimiter,parseDelimited,parseJSON,normaliseRows,inferType,profileRows,previewRows};
  root.RTDataAnalysisCore=api;
  if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(typeof globalThis!=='undefined'?globalThis:this);
