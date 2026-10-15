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
  function normalQuantile(p){
    if(!(p>0&&p<1))throw new RangeError('normalQuantile expects a probability strictly between 0 and 1.');
    const a=[-39.69683028665376,220.9460984245205,-275.9285104469687,138.357751867269,-30.66479806614716,2.506628277459239];
    const b=[-54.47609879822406,161.5858368580409,-155.6989798598866,66.80131188771972,-13.28068155288572];
    const c=[-0.007784894002430293,-0.3223964580411365,-2.400758277161838,-2.549732539343734,4.374664141464968,2.938163982698783];
    const d=[0.007784695709041462,0.3224671290700398,2.445134137142996,3.754408661907416];
    const low=.02425,high=1-low;
    if(p<low){const q=Math.sqrt(-2*Math.log(p));return (((((c[0]*q+c[1])*q+c[2])*q+c[3])*q+c[4])*q+c[5])/((((d[0]*q+d[1])*q+d[2])*q+d[3])*q+1)}
    if(p>high){const q=Math.sqrt(-2*Math.log(1-p));return -(((((c[0]*q+c[1])*q+c[2])*q+c[3])*q+c[4])*q+c[5])/((((d[0]*q+d[1])*q+d[2])*q+d[3])*q+1)}
    const q=p-.5,r=q*q;
    return (((((a[0]*r+a[1])*r+a[2])*r+a[3])*r+a[4])*r+a[5])*q/(((((b[0]*r+b[1])*r+b[2])*r+b[3])*r+b[4])*r+1);
  }
  const api={quantile,summariseNumeric,normalQuantile};
  root.RTDataAnalysisStats=api;
  if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(typeof globalThis!=='undefined'?globalThis:this);
