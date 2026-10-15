/* Small, deterministic descriptive-statistics layer.
 * Numeric inputs must already be parsed; invalid/missing values are excluded and counted.
 * Quantiles use Hyndman–Fan type 7 interpolation (the default in R).
 */
(function(root){
  'use strict';
  function quantile(sorted,p){
    if(!sorted.length)return null;
    if(sorted.length===1)return sorted[0];
    const h=(sorted.length-1)*p,lo=Math.floor(h),hi=Math.ceil(h);
    return sorted[lo]+(h-lo)*(sorted[hi]-sorted[lo]);
  }
  function summariseNumeric(values){
    if(!Array.isArray(values))throw new TypeError('summariseNumeric expects an array of parsed numeric values.');
    const sorted=values.filter(Number.isFinite).slice().sort((a,b)=>a-b),n=sorted.length,missing=values.length-n;
    if(!n)return {n:0,missing,mean:null,median:null,sd:null,min:null,q1:null,q3:null,iqr:null,max:null};
    const mean=sorted.reduce((sum,value)=>sum+value,0)/n;
    const median=quantile(sorted,.5),q1=quantile(sorted,.25),q3=quantile(sorted,.75);
    const sd=n>1?Math.sqrt(sorted.reduce((sum,value)=>sum+(value-mean)**2,0)/(n-1)):null;
    return {n,missing,mean,median,sd,min:sorted[0],q1,q3,iqr:q3-q1,max:sorted[n-1]};
  }
  const api={quantile,summariseNumeric};
  root.RTDataAnalysisStats=api;
  if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(typeof globalThis!=='undefined'?globalThis:this);
