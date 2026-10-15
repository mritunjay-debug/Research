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
  function deriveNumericColumn(rows,sourceIndex,newName,multiplier,offset){
    const checked=normaliseRows(rows),index=Number(sourceIndex),name=String(newName??'').trim(),scale=Number(multiplier),shift=Number(offset);
    if(!Number.isInteger(index)||index<0||index>=checked.columnCount)throw new Error('Choose a valid source column.');
    if(!name)throw new Error('Enter a name for the derived column.');
    if(checked.headers.some(header=>header.toLocaleLowerCase()===name.toLocaleLowerCase()))throw new Error('A column with this name already exists.');
    if(!Number.isFinite(scale)||!Number.isFinite(shift))throw new Error('Multiplier and offset must be finite numbers.');
    let validCount=0,missingCount=0;
    const output=checked.rows.map((row,rowIndex)=>{
      if(rowIndex===0)return [...row,name];
      const raw=String(row[index]??'').trim(),value=raw===''?null:Number(raw);
      if(value===null||!Number.isFinite(value)){missingCount++;return [...row,'']}
      const result=value*scale+shift;
      if(!Number.isFinite(result))throw new Error('The transformation produced a non-finite value at source row '+rowIndex+'. Check multiplier and offset.');
      validCount++;return [...row,String(result)];
    });
    if(!validCount)throw new Error('The selected source column contains no valid numeric values.');
    return {rows:output,validCount,missingCount,sourceIndex:index,newColumnIndex:checked.columnCount,newColumnName:name,multiplier:scale,offset:shift};
  }
  function validateNumericRange(rows,columnIndex,minValue,maxValue){
    const checked=normaliseRows(rows),index=Number(columnIndex),min=minValue===null||minValue===undefined||minValue===''?null:Number(minValue),max=maxValue===null||maxValue===undefined||maxValue===''?null:Number(maxValue);
    if(!Number.isInteger(index)||index<0||index>=checked.columnCount)throw new Error('Choose a valid variable for range validation.');
    if(min===null&&max===null)throw new Error('Enter a minimum, a maximum, or both.');
    if(min!==null&&!Number.isFinite(min)||max!==null&&!Number.isFinite(max))throw new Error('Range bounds must be finite numbers.');
    if(min!==null&&max!==null&&min>max)throw new Error('Minimum cannot be greater than maximum.');
    const outOfRange=[];let missingCount=0,validCount=0;
    checked.rows.slice(1).forEach((row,i)=>{const raw=String(row[index]??'').trim(),value=raw===''?null:Number(raw);if(value===null||!Number.isFinite(value)){missingCount++;return}validCount++;if(min!==null&&value<min)outOfRange.push({sourceRow:i+1,value,direction:'below minimum'});else if(max!==null&&value>max)outOfRange.push({sourceRow:i+1,value,direction:'above maximum'})});
    return {variable:checked.headers[index],columnIndex:index,min,max,rowsChecked:checked.rowCount,validCount,missingCount,outOfRange};
  }
  function frequencyTable(rows,columnIndex){
    const checked=normaliseRows(rows),index=Number(columnIndex);
    if(!Number.isInteger(index)||index<0||index>=checked.columnCount)throw new Error('Choose a valid variable for the frequency table.');
    const counts=new Map();let missingCount=0;
    checked.rows.slice(1).forEach(row=>{const raw=String(row[index]??'').trim(),key=raw===''?'(Missing)':raw;counts.set(key,(counts.get(key)||0)+1);if(raw==='')missingCount++});
    const total=checked.rowCount,valid=total-missingCount;
    const categories=[...counts.entries()].map(([value,count])=>({value,count,percentOfAll:total?100*count/total:0,percentOfValid:valid&&value!=='(Missing)'?100*count/valid:null})).sort((a,b)=>b.count-a.count||a.value.localeCompare(b.value,undefined,{numeric:true,sensitivity:'base'}));
    return {variable:checked.headers[index],total,validCount:valid,missingCount,categories};
  }
  function crossTabulate(rows,rowColumnIndex,columnColumnIndex,maxLevels){
    const checked=normaliseRows(rows),ri=Number(rowColumnIndex),ci=Number(columnColumnIndex),limit=Number(maxLevels)||30;
    if(!Number.isInteger(ri)||ri<0||ri>=checked.columnCount||!Number.isInteger(ci)||ci<0||ci>=checked.columnCount)throw new Error('Choose valid row and column variables.');
    if(ri===ci)throw new Error('Choose two different variables for a cross-tabulation.');
    const records=checked.rows.slice(1).map(row=>({row:String(row[ri]??'').trim()||'(Missing)',column:String(row[ci]??'').trim()||'(Missing)'}));
    const rowCounts=new Map(),columnCounts=new Map(),cellCounts=new Map();
    records.forEach(item=>{rowCounts.set(item.row,(rowCounts.get(item.row)||0)+1);columnCounts.set(item.column,(columnCounts.get(item.column)||0)+1);const key=JSON.stringify([item.row,item.column]);cellCounts.set(key,(cellCounts.get(key)||0)+1)});
    if(rowCounts.size>limit||columnCounts.size>limit)throw new Error('Cross-tabulation is limited to '+limit+' levels per variable to avoid an unreadable table. Use a frequency table or group categories first.');
    const sortLevels=map=>[...map.entries()].sort((a,b)=>b[1]-a[1]||a[0].localeCompare(b[0],undefined,{numeric:true,sensitivity:'base'})).map(item=>item[0]);
    const rowLevels=sortLevels(rowCounts),columnLevels=sortLevels(columnCounts),cells=rowLevels.map(row=>columnLevels.map(column=>cellCounts.get(JSON.stringify([row,column]))||0));
    const rowTotals=cells.map(values=>values.reduce((sum,value)=>sum+value,0)),columnTotals=columnLevels.map((_,index)=>cells.reduce((sum,row)=>sum+row[index],0));
    return {rowVariable:checked.headers[ri],columnVariable:checked.headers[ci],rowLevels,columnLevels,cells,rowTotals,columnTotals,total:checked.rowCount};
  }
  const api={DEFAULT_LIMITS,detectDelimiter,parseDelimited,parseJSON,normaliseRows,inferType,profileRows,previewRows,deriveNumericColumn,validateNumericRange,frequencyTable,crossTabulate};
  root.RTDataAnalysisCore=api;
  if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(typeof globalThis!=='undefined'?globalThis:this);
