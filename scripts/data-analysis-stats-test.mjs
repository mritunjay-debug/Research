import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
const source=fs.readFileSync(new URL('../data-analysis-stats.js',import.meta.url),'utf8');
const context={module:{exports:{}},exports:{}};
vm.createContext(context);vm.runInContext(source,context);
const stats=context.module.exports;
let passed=0;function check(name,fn){fn();passed++;console.log('PASS '+name)}
const close=(actual,expected,tol=1e-10)=>assert.ok(Math.abs(actual-expected)<=tol,actual+' differs from '+expected);
check('known five-value descriptive fixture and type-7 quartiles',()=>{const x=stats.summariseNumeric([1,2,3,4,5]);assert.equal(x.n,5);assert.equal(x.missing,0);close(x.mean,3);close(x.median,3);close(x.sd,Math.sqrt(2));assert.equal(x.min,1);assert.equal(x.q1,2);assert.equal(x.q3,4);assert.equal(x.iqr,2);assert.equal(x.max,5)});
check('counts invalid and missing observations without imputing them',()=>{const x=stats.summariseNumeric([1,null,NaN,Infinity,3]);assert.equal(x.n,2);assert.equal(x.missing,3);assert.equal(x.mean,2);assert.equal(x.sd,Math.SQRT2)});
check('single observation has undefined sample SD',()=>{const x=stats.summariseNumeric([7]);assert.equal(x.n,1);assert.equal(x.sd,null);assert.equal(x.iqr,0)});
check('constant data has zero SD and IQR',()=>{const x=stats.summariseNumeric([4,4,4,4]);assert.equal(x.sd,0);assert.equal(x.iqr,0);assert.equal(x.q1,4);assert.equal(x.q3,4)});
check('empty and entirely invalid data return explicit non-estimable statistics',()=>{const empty=stats.summariseNumeric([]),bad=stats.summariseNumeric([null,NaN]);assert.equal(empty.n,0);assert.equal(empty.mean,null);assert.equal(bad.missing,2);assert.equal(bad.median,null)});
check('does not mutate input and handles large numeric arrays',()=>{const input=[3,1,2];const copy=input.slice();stats.summariseNumeric(input);assert.deepEqual(input,copy);const large=stats.summariseNumeric(Array.from({length:50000},(_,i)=>i));assert.equal(large.n,50000);assert.equal(large.min,0);assert.equal(large.max,49999)});
check('rejects non-array input',()=>assert.throws(()=>stats.summariseNumeric(null),/expects an array/i));
console.log('Data analysis statistics tests passed: '+passed+' checks.');
