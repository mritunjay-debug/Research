(function(root){
  'use strict';
  function toPlotly(config,overrides={}){
    if(!config||!config.data||!Array.isArray(config.data.datasets))throw new TypeError('A chart configuration with datasets is required.');
    const baseType=config.type||'bar',chartData=config.data,options=config.options||{},plugins=options.plugins||{},titleConfig=plugins.title||{},legendConfig=plugins.legend||{},scales=options.scales||{};
    const title=overrides.title||titleConfig.text||'Research figure',fontSize=Math.max(8,Math.min(24,Number(overrides.fontSize)||12));
    const xTitle=overrides.xTitle||scales.x?.title?.text||'',yTitle=overrides.yTitle||scales.y?.title?.text||'';
    const traces=[];
    if(baseType==='box'||baseType==='violin'){
      for(const ds of chartData.datasets){
        const values=(Array.isArray(ds.data)?ds.data:[]).filter(Number.isFinite);
        traces.push({type:baseType,name:ds.label||'Observations',y:values,boxpoints:baseType==='box'?'outliers':undefined,points:baseType==='violin'?'outliers':undefined,jitter:.28,pointpos:0,meanline:baseType==='violin'?{visible:true}:undefined,marker:{color:ds.backgroundColor||ds.borderColor,opacity:.72,size:5},line:{color:ds.borderColor||ds.backgroundColor,width:1.5},hovertemplate:'%{y}<extra>%{fullData.name}</extra>'});
      }
    }else if(baseType==='splom'){
      if(!Array.isArray(chartData.dimensions)||chartData.dimensions.length<2)throw new Error('A pair plot requires at least two selected numeric dimensions.');
      traces.push({type:'splom',dimensions:chartData.dimensions,showupperhalf:false,diagonal:{visible:true},marker:{color:'#176c55',size:4,opacity:.62,line:{width:.25,color:'#fffdf8'}},name:'Pairwise relationships',showlegend:false});
    }else if(baseType==='pie'){
      const ds=chartData.datasets[0]||{};
      traces.push({type:'pie',labels:chartData.labels||[],values:ds.data||[],name:ds.label||'Share',textinfo:'label+percent',hovertemplate:'%{label}<br>Value: %{value}<br>Share: %{percent}<extra></extra>',marker:{colors:Array.isArray(ds.backgroundColor)?ds.backgroundColor:undefined},sort:false});
    }else{
      for(const ds of chartData.datasets){
        const type=ds.type||baseType,data=Array.isArray(ds.data)?ds.data:[];
        if(type==='bar'){
          traces.push({type:'bar',name:ds.label||'Series',x:chartData.labels||data.map((_,i)=>String(i+1)),y:data.map(v=>v&&typeof v==='object'?(v.y??null):v),marker:{color:ds.backgroundColor||ds.borderColor},hovertemplate:'%{x}<br>%{y}<extra>%{fullData.name}</extra>'});
          continue;
        }
        const points=data.map((point,index)=>point&&typeof point==='object'?point:{x:(chartData.labels||[])[index]??index+1,y:point});
        const x=points.map(p=>p.x??null),y=points.map(p=>p.y??null),customdata=points.map(p=>p.sourceRow!==undefined?['Source row '+p.sourceRow]:p.record!==undefined?['Row '+p.record]:[]);
        const isLine=type==='line',mode=isLine?(ds.pointRadius===0?'lines':'lines+markers'):'markers';
        const trace={type:'scatter',mode,name:ds.label||'Series',x,y,customdata,marker:{color:ds.backgroundColor||ds.borderColor,size:Math.max(4,(Number(ds.pointRadius)||3)*2)},line:{color:ds.borderColor||ds.backgroundColor,width:Number(ds.borderWidth)||2,dash:Array.isArray(ds.borderDash)&&ds.borderDash.length?'dash':'solid'},hovertemplate:'x: %{x}<br>y: %{y}<br>%{customdata[0]}<extra>%{fullData.name}</extra>'};
        if(ds.stepped)trace.line.shape='hv';
        traces.push(trace);
      }
    }
    if(!traces.length)throw new Error('No chart series contains data.');
    const axis=(key,label)=>{const s=scales[key]||{},out={title:{text:label||s.title?.text||'',font:{size:fontSize}},tickfont:{size:fontSize-1},showgrid:true,gridcolor:'#e5e7eb',zerolinecolor:'#cbd5e1'};if(s.type==='linear')out.type='linear';if(Number.isFinite(s.min))out.range=[s.min,Number.isFinite(s.max)?s.max:null];if(Number.isFinite(s.max)){out.range=out.range||[null,s.max];out.range[1]=s.max}if(Number.isFinite(s.min)&&Number.isFinite(s.max))out.range=[s.min,s.max];if(s.beginAtZero)out.rangemode='tozero';return out};
    const layout={title:{text:title,font:{family:'Arial, sans-serif',size:fontSize+2,color:'#202d27'},x:0.02,xanchor:'left'},font:{family:'Arial, sans-serif',size:fontSize,color:'#26332d'},paper_bgcolor:'#fffdf8',plot_bgcolor:'#fffdf8',margin:{l:78,r:28,t:76,b:76},autosize:true,showlegend:legendConfig.display!==false,legend:{orientation:'h',y:-0.22,font:{size:fontSize-1}},hoverlabel:{font:{size:fontSize}},xaxis:axis('x',xTitle),yaxis:axis('y',yTitle),barmode:'group'};
    if(baseType==='pie'){delete layout.xaxis;delete layout.yaxis;layout.margin={l:24,r:24,t:70,b:30};layout.legend={orientation:'h',y:-0.08,font:{size:fontSize-1}}}
    if(options.scales?.y?.min===0){layout.yaxis.range=[0,Number.isFinite(options.scales.y.max)?options.scales.y.max:undefined]}
    return {traces,layout,config:{responsive:true,displaylogo:false,displayModeBar:true,scrollZoom:false,modeBarButtonsToRemove:['select2d','lasso2d','autoScale2d'],toImageButtonOptions:{format:'png',filename:'research-figure',width:1600,height:1100,scale:2}}};
  }
  const api={toPlotly};
  root.RTFigureEngine=api;
  if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(typeof globalThis!=='undefined'?globalThis:this);
