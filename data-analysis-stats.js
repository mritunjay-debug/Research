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
  function logGamma(z){
    const p=[676.5203681218851,-1259.1392167224028,771.3234287776531,-176.6150291621406,12.507343278686905,-0.13857109526572012,9.984369578019572e-6,1.5056327351493116e-7];
    if(z<.5)return Math.log(Math.PI)-Math.log(Math.sin(Math.PI*z))-logGamma(1-z);
    z-=1;let x=.9999999999998099;for(let i=0;i<p.length;i++)x+=p[i]/(z+i+1);const t=z+p.length-.5;
    return .5*Math.log(2*Math.PI)+(z+.5)*Math.log(t)-t+Math.log(x);
  }
  function betaContinuedFraction(a,b,x){
    const max=200,eps=3e-12,floor=1e-30;let qab=a+b,qap=a+1,qam=a-1,c=1,d=1-qab*x/qap;
    if(Math.abs(d)<floor)d=floor;d=1/d;let h=d;
    for(let m=1;m<=max;m++){
      const m2=2*m;let aa=m*(b-m)*x/((qam+m2)*(a+m2));d=1+aa*d;if(Math.abs(d)<floor)d=floor;c=1+aa/c;if(Math.abs(c)<floor)c=floor;d=1/d;h*=d*c;
      aa=-(a+m)*(qab+m)*x/((a+m2)*(qap+m2));d=1+aa*d;if(Math.abs(d)<floor)d=floor;c=1+aa/c;if(Math.abs(c)<floor)c=floor;d=1/d;const delta=d*c;h*=delta;if(Math.abs(delta-1)<eps)break;
    }
    return h;
  }
  function regularizedBeta(x,a,b){
    if(x<=0)return 0;if(x>=1)return 1;
    const bt=Math.exp(logGamma(a+b)-logGamma(a)-logGamma(b)+a*Math.log(x)+b*Math.log(1-x));
    return x<(a+1)/(a+b+2)?bt*betaContinuedFraction(a,b,x)/a:1-bt*betaContinuedFraction(b,a,1-x)/b;
  }
  function studentTwoSidedP(t,df){
    if(!(df>0)||!Number.isFinite(t))return null;
    const x=df/(df+t*t);return Math.max(0,Math.min(1,regularizedBeta(x,df/2,.5)));
  }
  function studentTCritical(alpha,df){
    if(!(alpha>0&&alpha<1)||!(df>0))throw new RangeError('A valid alpha and positive degrees of freedom are required.');
    let low=0,high=100;
    for(let i=0;i<80;i++){const mid=(low+high)/2;if(studentTwoSidedP(mid,df)>alpha)low=mid;else high=mid}
    return (low+high)/2;
  }
  function welchTTest(groupA,groupB,alpha=.05){
    if(!Array.isArray(groupA)||!Array.isArray(groupB))throw new TypeError('Welch test expects two arrays of parsed numeric values.');
    const a=groupA.filter(Number.isFinite),b=groupB.filter(Number.isFinite),nA=a.length,nB=b.length;
    if(nA<2||nB<2)throw new Error('Each group requires at least two valid numeric observations.');
    const mean=values=>values.reduce((sum,value)=>sum+value,0)/values.length;
    const variance=values=>{const m=mean(values);return values.reduce((sum,value)=>sum+(value-m)**2,0)/(values.length-1)};
    const meanA=mean(a),meanB=mean(b),varianceA=variance(a),varianceB=variance(b),sdA=Math.sqrt(varianceA),sdB=Math.sqrt(varianceB);
    const componentA=varianceA/nA,componentB=varianceB/nB,se=Math.sqrt(componentA+componentB);
    if(!(se>0))throw new Error('Both groups have zero within-group variance; the test statistic is undefined.');
    const difference=meanA-meanB,t=difference/se,denominator=componentA**2/(nA-1)+componentB**2/(nB-1);
    if(!(denominator>0))throw new Error('Welch degrees of freedom are not estimable for these data.');
    const df=(componentA+componentB)**2/denominator,pValue=studentTwoSidedP(t,df),critical=studentTCritical(alpha,df);
    const pooledSD=Math.sqrt(((nA-1)*varianceA+(nB-1)*varianceB)/(nA+nB-2)),cohensD=pooledSD>0?difference/pooledSD:null,hedgesG=cohensD===null?null:cohensD*(1-3/(4*(nA+nB)-9));
    return {nA,nB,missingA:groupA.length-nA,missingB:groupB.length-nB,meanA,meanB,sdA,sdB,difference,se,t,df,pValue,alpha,ciLow:difference-critical*se,ciHigh:difference+critical*se,cohensD,hedgesG};
  }
  const api={quantile,summariseNumeric,normalQuantile,studentTwoSidedP,studentTCritical,welchTTest};
  root.RTDataAnalysisStats=api;
  if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(typeof globalThis!=='undefined'?globalThis:this);
