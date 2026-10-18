(function(root,factory){
  const api=factory();
  if(typeof module!=='undefined'&&module.exports)module.exports=api;
  if(root)root.PillarStrengthCore=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';
  function estimate(p){
    const wh=p.width/p.height;
    let strength=null,cpav=null,kappa=null,note='';
    if(p.method==='none')return {strength:null,cpav:null,kappa:null,note:'Strength calculation disabled: stress screening only.'};
    if(!(p.ucs>0&&p.width>0&&p.height>0))return {strength:null,cpav:null,kappa:null,note:'UCS, pillar width, and pillar height must be positive.'};
    if(p.method==='lunder'){
      if(wh<=0.25)return {strength:null,cpav:null,kappa:null,note:'Lunder–Pakalnis confinement expression is not evaluated at W/H ≤ 0.25 because the logarithmic term is outside the supported real-valued domain.'};
      const logTerm=Math.log10(wh+0.75);
      cpav=0.46*Math.pow(logTerm,1.4/wh);
      if(!Number.isFinite(cpav)||cpav<0||cpav>=1)return {strength:null,cpav:cpav,kappa:null,note:'Lunder–Pakalnis confinement term fell outside its supported numerical domain; check geometry.'};
      const arg=Math.max(-1,Math.min(1,(1-cpav)/(1+cpav)));
      kappa=Math.tan(Math.acos(arg));
      strength=0.44*p.ucs*(0.68+0.52*kappa);
    }else if(p.method==='krauland'){
      strength=0.354*p.ucs*(0.778+0.222*wh);
    }else return {strength:null,cpav:null,kappa:null,note:'Unknown strength model. Select a listed model or stress-only mode.'};
    if(!Number.isFinite(strength)||strength<=0)return {strength:null,cpav:cpav,kappa:kappa,note:'The selected formula did not return a valid positive strength for these inputs.'};
    if(p.material==='coal')note='Coal is not an appropriate target for these hard-rock formulations; use a coal-specific design method. Treat this result as unsuitable for design.';
    else if(p.method==='krauland'&&p.material!=='limestone')note='Krauland–Soder is associated with limestone/skarn pillar contexts; use for this material requires independent justification.';
    else if(p.method==='lunder'&&p.material==='custom')note='Custom/other material: independently justify that this hard-rock model is appropriate.';
    else if(p.method==='lunder'&&p.material==='marble')note='Marble selected: use site-specific UCS, jointing, weathering and rock-mass characterization; this general hard-rock model is not automatically marble-validated.';
    else if(p.method==='lunder'&&p.material==='generic')note='Generic hard rock is a placeholder category, not a calibrated material class.';
    else note='Empirical estimate only. Confirm the original method’s calibration domain and applicability to the actual mine.';
    return {strength:strength,cpav:cpav,kappa:kappa,note:note};
  }
  return {estimate:estimate};
});