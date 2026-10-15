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
  function pearsonCorrelation(xValues,yValues,alpha=.05){
    if(!Array.isArray(xValues)||!Array.isArray(yValues)||xValues.length!==yValues.length)throw new TypeError('Pearson correlation expects two arrays of equal length.');
    if(!(alpha>0&&alpha<1))throw new RangeError('Alpha must be strictly between 0 and 1.');
    const pairs=xValues.map((x,index)=>[x,yValues[index]]).filter(pair=>Number.isFinite(pair[0])&&Number.isFinite(pair[1])),n=pairs.length,missingPairs=xValues.length-n;
    if(n<2)return {n,missingPairs,r:null,t:null,df:n-2,pValue:null,alpha,ciLow:null,ciHigh:null};
    const meanX=pairs.reduce((sum,p)=>sum+p[0],0)/n,meanY=pairs.reduce((sum,p)=>sum+p[1],0)/n;
    const ssX=pairs.reduce((sum,p)=>sum+(p[0]-meanX)**2,0),ssY=pairs.reduce((sum,p)=>sum+(p[1]-meanY)**2,0);
    if(!(ssX>0&&ssY>0))return {n,missingPairs,r:null,t:null,df:n-2,pValue:null,alpha,ciLow:null,ciHigh:null};
    const cross=pairs.reduce((sum,p)=>sum+(p[0]-meanX)*(p[1]-meanY),0),r=Math.max(-1,Math.min(1,cross/Math.sqrt(ssX*ssY)));
    if(n<3)return {n,missingPairs,r,t:null,df:n-2,pValue:null,alpha,ciLow:null,ciHigh:null};
    const t=Math.abs(r)===1?Math.sign(r)*Infinity:r*Math.sqrt((n-2)/(1-r*r)),pValue=Math.abs(r)===1?0:studentTwoSidedP(t,n-2);
    let ciLow=null,ciHigh=null;
    if(n>3&&Math.abs(r)<1){const z=Math.atanh(r),critical=normalQuantile(1-alpha/2),se=1/Math.sqrt(n-3);ciLow=Math.tanh(z-critical*se);ciHigh=Math.tanh(z+critical*se)}
    return {n,missingPairs,r,t,df:n-2,pValue,alpha,ciLow,ciHigh};
  }
  function linearRegression(xValues,yValues,alpha=.05){
    if(!Array.isArray(xValues)||!Array.isArray(yValues)||xValues.length!==yValues.length)throw new TypeError('Linear regression expects two arrays of equal length.');
    if(!(alpha>0&&alpha<1))throw new RangeError('Alpha must be strictly between 0 and 1.');
    const pairs=xValues.map((x,index)=>({x,y:yValues[index],index})).filter(pair=>Number.isFinite(pair.x)&&Number.isFinite(pair.y)),n=pairs.length,excluded=xValues.length-n;
    if(n<3)throw new Error('At least three complete numeric pairs are required for simple linear regression.');
    const mean=values=>values.reduce((sum,value)=>sum+value,0)/values.length,meanX=mean(pairs.map(p=>p.x)),meanY=mean(pairs.map(p=>p.y));
    const sxx=pairs.reduce((sum,p)=>sum+(p.x-meanX)**2,0),sxy=pairs.reduce((sum,p)=>sum+(p.x-meanX)*(p.y-meanY),0);
    if(!(sxx>0))throw new Error('The predictor has no variation; slope is not estimable.');
    const slope=sxy/sxx,intercept=meanY-slope*meanX,residuals=pairs.map(p=>p.y-(intercept+slope*p.x)),sse=residuals.reduce((sum,value)=>sum+value*value,0),sst=pairs.reduce((sum,p)=>sum+(p.y-meanY)**2,0),df=n-2,mse=sse/df,rmse=Math.sqrt(sse/n),mae=residuals.reduce((sum,value)=>sum+Math.abs(value),0)/n;
    const seSlope=mse>0?Math.sqrt(mse/sxx):0,seIntercept=mse>0?Math.sqrt(mse*(1/n+meanX*meanX/sxx)):0,critical=studentTCritical(alpha,df);
    return {n,excluded,meanX,meanY,slope,intercept,rSquared:sst>0?1-sse/sst:null,sse,rmse,mae,df,residualSE:Math.sqrt(mse),seSlope,seIntercept,ciSlopeLow:mse>0?slope-critical*seSlope:null,ciSlopeHigh:mse>0?slope+critical*seSlope:null,ciInterceptLow:mse>0?intercept-critical*seIntercept:null,ciInterceptHigh:mse>0?intercept+critical*seIntercept:null,pSlope:mse>0?studentTwoSidedP(slope/seSlope,df):null,pIntercept:mse>0?studentTwoSidedP(intercept/seIntercept,df):null,alpha,includedIndices:pairs.map(p=>p.index),residuals};
  }
  function oneSampleTTest(values,populationMean=0,alpha=.05){
    if(!Array.isArray(values))throw new TypeError('One-sample t-test expects an array of numeric values.');
    if(!Number.isFinite(populationMean))throw new TypeError('The hypothesised population mean must be finite.');
    if(!(alpha>0&&alpha<1))throw new RangeError('Alpha must be strictly between 0 and 1.');
    const valid=values.filter(Number.isFinite),n=valid.length,missing=values.length-n;
    if(n<2)throw new Error('At least two valid numeric observations are required.');
    const mean=valid.reduce((sum,value)=>sum+value,0)/n,variance=valid.reduce((sum,value)=>sum+(value-mean)**2,0)/(n-1),sd=Math.sqrt(variance),se=sd/Math.sqrt(n),difference=mean-populationMean;
    if(!(se>0))throw new Error('The sample has zero variance; the t statistic is undefined.');
    const df=n-1,t=difference/se,critical=studentTCritical(alpha,df);
    return {n,missing,mean,sd,se,populationMean,difference,t,df,pValue:studentTwoSidedP(t,df),alpha,ciLow:mean-critical*se,ciHigh:mean+critical*se,cohensD:difference/sd};
  }
  function pairedTTest(beforeValues,afterValues,alpha=.05){
    if(!Array.isArray(beforeValues)||!Array.isArray(afterValues)||beforeValues.length!==afterValues.length)throw new TypeError('Paired t-test expects equal-length before and after arrays.');
    if(!(alpha>0&&alpha<1))throw new RangeError('Alpha must be strictly between 0 and 1.');
    const pairs=beforeValues.map((before,index)=>({before,after:afterValues[index]})).filter(pair=>Number.isFinite(pair.before)&&Number.isFinite(pair.after)),n=pairs.length,missingPairs=beforeValues.length-n;
    if(n<2)throw new Error('At least two complete numeric pairs are required.');
    const differences=pairs.map(pair=>pair.after-pair.before),mean=differences.reduce((sum,value)=>sum+value,0)/n,variance=differences.reduce((sum,value)=>sum+(value-mean)**2,0)/(n-1),sd=Math.sqrt(variance),se=sd/Math.sqrt(n);
    if(!(se>0))throw new Error('Paired differences have zero variance; the t statistic is undefined.');
    const df=n-1,t=mean/se,critical=studentTCritical(alpha,df);
    return {n,missingPairs,meanDifference:mean,sdDifference:sd,se,t,df,pValue:studentTwoSidedP(t,df),alpha,ciLow:mean-critical*se,ciHigh:mean+critical*se,cohensDz:mean/sd,differences};
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
  function normalErfc(x){
    const z=Math.abs(x),t=1/(1+.5*z);
    const answer=t*Math.exp(-z*z-1.26551223+t*(1.00002368+t*(.37409196+t*(.09678418+t*(-.18628806+t*(.27886807+t*(-1.13520398+t*(1.48851587+t*(-.82215223+t*.17087277)))))))));
    return x>=0?answer:2-answer;
  }
  function mannWhitneyU(groupA,groupB){
    if(!Array.isArray(groupA)||!Array.isArray(groupB))throw new TypeError('Mann–Whitney U expects two arrays of parsed numeric values.');
    const a=groupA.filter(Number.isFinite),b=groupB.filter(Number.isFinite),nA=a.length,nB=b.length,N=nA+nB;
    if(nA<2||nB<2)throw new Error('Each independent group requires at least two valid numeric observations.');
    const combined=[...a.map((value,index)=>({value,group:0,index})),...b.map((value,index)=>({value,group:1,index}))].sort((x,y)=>x.value-y.value);
    const ranksA=new Array(nA),tieGroups=[];let rankSumA=0;
    for(let start=0;start<combined.length;){
      let end=start+1;while(end<combined.length&&combined[end].value===combined[start].value)end++;
      const tieSize=end-start,averageRank=((start+1)+end)/2;
      if(tieSize>1)tieGroups.push(tieSize);
      for(let i=start;i<end;i++)if(combined[i].group===0){ranksA[combined[i].index]=averageRank;rankSumA+=averageRank}
      start=end;
    }
    const uA=rankSumA-nA*(nA+1)/2,uB=nA*nB-uA,meanU=nA*nB/2;
    const tieCorrection=tieGroups.reduce((sum,t)=>sum+t*t*t-t,0);
    const variance=nA*nB/12*((N+1)-tieCorrection/(N*(N-1)));
    if(!(variance>0))throw new Error('All pooled observations are tied; the Mann–Whitney U variance is zero and inference is undefined.');
    const difference=uA-meanU,correctedMagnitude=Math.max(0,Math.abs(difference)-.5),z=(difference===0?0:Math.sign(difference)*correctedMagnitude/Math.sqrt(variance));
    const pValue=Math.max(0,Math.min(1,normalErfc(Math.abs(z)/Math.SQRT2)));
    return {nA,nB,missingA:groupA.length-nA,missingB:groupB.length-nB,uA,uB,u:Math.min(uA,uB),meanU,rankSumA,rankBiserial:2*uA/(nA*nB)-1,z,pValue,tieGroups,tieCorrection,variance,continuityCorrection:true,method:'Asymptotic normal approximation with tie correction and continuity correction'};
  }
  function oneWayAnova(groups,alpha=.05){
    if(!Array.isArray(groups)||groups.length<2)throw new TypeError('One-way ANOVA expects at least two groups.');
    if(!(alpha>0&&alpha<1))throw new RangeError('Alpha must be strictly between 0 and 1.');
    const clean=groups.map((group,index)=>{if(!Array.isArray(group.values))throw new TypeError('Each ANOVA group must have a values array.');const values=group.values.filter(Number.isFinite);if(values.length<2)throw new Error('Each group requires at least two valid numeric observations.');const mean=values.reduce((sum,value)=>sum+value,0)/values.length;const ss=values.reduce((sum,value)=>sum+(value-mean)**2,0);return {label:String(group.label??('Group '+(index+1))),n:values.length,missing:group.values.length-values.length,mean,ss,values}});
    const N=clean.reduce((sum,group)=>sum+group.n,0),k=clean.length,grandMean=clean.reduce((sum,g)=>sum+g.n*g.mean,0)/N;
    const ssBetween=clean.reduce((sum,g)=>sum+g.n*(g.mean-grandMean)**2,0),ssWithin=clean.reduce((sum,g)=>sum+g.ss,0),ssTotal=ssBetween+ssWithin,dfBetween=k-1,dfWithin=N-k,msBetween=ssBetween/dfBetween,msWithin=ssWithin/dfWithin;
    if(!(msWithin>0))throw new Error('Within-group variance is zero; the F statistic is undefined.');
    const F=msBetween/msWithin,pValue=regularizedBeta(dfWithin/(dfWithin+dfBetween*F),dfWithin/2,dfBetween/2),etaSquared=ssTotal>0?ssBetween/ssTotal:null,omegaSquared=Math.max(0,(ssBetween-dfBetween*msWithin)/(ssTotal+msWithin));
    return {method:'One-way fixed-effects ANOVA',k,N,missing:groups.reduce((sum,g)=>sum+g.values.length,0)-N,groups:clean.map(({values,...g})=>g),grandMean,ssBetween,ssWithin,ssTotal,dfBetween,dfWithin,msBetween,msWithin,F,pValue,alpha,etaSquared,omegaSquared};
  }
  function holmAdjust(pValues){
    if(!Array.isArray(pValues))throw new TypeError('Holm adjustment expects an array of p-values.');
    const valid=pValues.map((p,index)=>{if(!Number.isFinite(p)||p<0||p>1)throw new RangeError('Every p-value must be finite and between 0 and 1.');return {p,index}}).sort((a,b)=>a.p-b.p);
    let running=0;const adjusted=new Array(valid.length);for(let i=0;i<valid.length;i++){running=Math.max(running,(valid.length-i)*valid[i].p);adjusted[valid[i].index]=Math.min(1,running)}
    return adjusted;
  }
  function pairwiseWelchPostHoc(groups,alpha=.05){
    if(!Array.isArray(groups)||groups.length<2)throw new TypeError('Pairwise post-hoc analysis expects at least two groups.');
    const comparisons=[];for(let i=0;i<groups.length;i++)for(let j=i+1;j<groups.length;j++){const result=welchTTest(groups[i].values,groups[j].values,alpha);comparisons.push({groupA:String(groups[i].label??('Group '+(i+1))),groupB:String(groups[j].label??('Group '+(j+1))),...result})}
    const adjusted=holmAdjust(comparisons.map(row=>row.pValue));return comparisons.map((row,index)=>({...row,pAdjustedHolm:adjusted[index],significantAfterHolm:adjusted[index]<alpha,adjustment:'Holm step-down correction'}));
  }
  const api={quantile,summariseNumeric,normalQuantile,studentTwoSidedP,studentTCritical,pearsonCorrelation,linearRegression,oneSampleTTest,pairedTTest,welchTTest,mannWhitneyU,oneWayAnova,holmAdjust,pairwiseWelchPostHoc};
  root.RTDataAnalysisStats=api;
  if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(typeof globalThis!=='undefined'?globalThis:this);
