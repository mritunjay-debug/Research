/* Workspace sync: merges browser projects/tasks with the signed-in user's Supabase rows.
   Does not delete cloud rows or clear browser data. Bibliography sync is a separate next step. */
(function(){
 'use strict';
 const KEY='research-scholar-workspace-v1';
 const $=id=>document.getElementById(id);
 let client=null, session=null, busy=false;
 const bar=document.getElementById('rt-auth-bar');
 if(!bar)return;
 const btn=$('rt-cloud-sync');
 if(!btn)return;
 btn.hidden=false;
 const syncState=$('rt-cloud-state'),syncLabel=$('rt-cloud-state-label');
 if(syncState)syncState.hidden=false;
 const status=document.createElement('div');
 status.id='rt-cloud-sync-status';
 status.style.cssText='padding:8px clamp(14px,2.5vw,32px);background:#edf4ee;color:#245B49;font:12px system-ui,sans-serif;display:none;border-bottom:1px solid #dbe7dc;overflow-wrap:anywhere';
 bar.insertAdjacentElement('afterend',status);
 function setSyncState(label,state){if(syncLabel)syncLabel.textContent=label;if(syncState)syncState.dataset.state=state||'unknown'}
 function say(s,error){status.textContent=s;status.style.display='block';status.style.background=error?'#fff0ee':'#edf4ee';status.style.color=error?'#8c2822':'#245B49';setSyncState(error?'Sync failed':'Sync not confirmed',error?'error':'unknown')}
 function read(){try{const x=JSON.parse(localStorage.getItem(KEY)||'{}');return {projects:Array.isArray(x.projects)?x.projects:[],tasks:Array.isArray(x.tasks)?x.tasks:[],activeProjectId:x.activeProjectId||null}}catch(e){throw new Error('Could not read the local workspace: '+e.message)}}
 function save(x){localStorage.setItem(KEY,JSON.stringify(x))}
 function localId(v){return String(v||'')}
 function parseTaskMeta(description){try{const m=String(description||'').match(/__RT_META__(\{.*\})$/);return m?JSON.parse(m[1]):{}}catch(e){return {}}}
 function taskDescription(t){return '__RT_META__'+JSON.stringify({local_id:t.id,type:t.type||'Task'})}
 function taskStatus(t){return t.done?'done':'todo'}
 function localTask(row){const meta=parseTaskMeta(row.description);return {id:meta.local_id||('cloud-'+row.id),cloudId:row.id,title:row.title,projectId:row.project_id||null,due:row.due_at?String(row.due_at).slice(0,10):'',type:meta.type||'Task',done:row.status==='done',createdAt:row.created_at||new Date().toISOString()}}
 function projectStatus(p){return String(p.stage||'').toLowerCase()==='completed'?'completed':'active'}
 function localProject(row){const meta=row.metadata||{};return {id:meta.local_id||('cloud-'+row.id),cloudId:row.id,title:row.title,discipline:meta.discipline||'Mining Engineering',stage:meta.stage||'Planning',objective:row.description||'',createdAt:row.created_at||new Date().toISOString(),updatedAt:row.updated_at||new Date().toISOString(),...(meta.reviewSnapshots?{reviewSnapshots:meta.reviewSnapshots}:{}),...(meta.bibliography?{bibliography:meta.bibliography}:{})}}
 async function sync(){
  if(busy)return; if(!client||!session||!session.user){say('Sign in first to sync cloud data.',true);return}
  busy=true;btn.disabled=true;btn.textContent='Syncing…';setSyncState('Syncing…','syncing');
  try{
   const userId=session.user.id;
   const state=read();
   let {data:remoteProjects,error}=await client.from('research_projects').select('*').eq('user_id',userId);
   if(error)throw error;
   const projectByLocal=new Map((remoteProjects||[]).map(r=>[String((r.metadata||{}).local_id||''),r]).filter(([k])=>k));
   const projectIdMap=new Map();
   for(const p of state.projects){
    let row=projectByLocal.get(localId(p.id))||(p.cloudId?(remoteProjects||[]).find(r=>r.id===p.cloudId):null);
    const payload={user_id:userId,title:String(p.title||'Untitled project'),description:String(p.objective||''),research_question:'',status:projectStatus(p),metadata:{local_id:p.id,discipline:p.discipline||'Mining Engineering',stage:p.stage||'Planning',reviewSnapshots:p.reviewSnapshots||[]}};
    if(row){const res=await client.from('research_projects').update(payload).eq('id',row.id).select('*').single();if(res.error)throw res.error;row=res.data}
    else {const res=await client.from('research_projects').insert(payload).select('*').single();if(res.error)throw res.error;row=res.data}
    p.cloudId=row.id;projectIdMap.set(String(p.id),row.id);
   }
   for(const row of remoteProjects||[]){
    const meta=row.metadata||{},lid=String(meta.local_id||'');
    if(!lid||!state.projects.some(p=>String(p.id)===lid)){
     const p=localProject(row);if(!state.projects.some(x=>x.id===p.id))state.projects.push(p);
     projectIdMap.set(String(p.id),row.id);
    }else projectIdMap.set(lid,row.id);
   }
   let {data:remoteTasks,error:taskErr}=await client.from('research_tasks').select('*').eq('user_id',userId);
   if(taskErr)throw taskErr;
   const taskByLocal=new Map((remoteTasks||[]).map(r=>[String(parseTaskMeta(r.description).local_id||''),r]).filter(([k])=>k));
   for(const t of state.tasks){
    const payload={user_id:userId,project_id:t.projectId?projectIdMap.get(String(t.projectId))||null:null,title:String(t.title||'Untitled task'),description:taskDescription(t),status:taskStatus(t),priority:'normal',due_at:t.due?String(t.due)+'T12:00:00.000Z':null,completed_at:t.done?(new Date().toISOString()):null};
    let row=taskByLocal.get(String(t.id))||(t.cloudId?(remoteTasks||[]).find(r=>r.id===t.cloudId):null);
    if(row){const res=await client.from('research_tasks').update(payload).eq('id',row.id).select('*').single();if(res.error)throw res.error;row=res.data}
    else {const res=await client.from('research_tasks').insert(payload).select('*').single();if(res.error)throw res.error;row=res.data}
    t.cloudId=row.id;
   }
   for(const row of remoteTasks||[]){
    const meta=parseTaskMeta(row.description),lid=String(meta.local_id||'');
    if(!lid||!state.tasks.some(t=>String(t.id)===lid)){
     const t=localTask(row);if(!state.tasks.some(x=>x.id===t.id))state.tasks.push(t);
    }
   }
   save(state);
   if(typeof window.rtRenderWorkspace==='function')window.rtRenderWorkspace();
   say('Cloud sync complete: '+state.projects.length+' project(s), '+state.tasks.length+' task(s). Browser data was preserved. Bibliography records are not synced yet.',false);setSyncState('Synced just now','synced');
  }catch(e){say('Cloud sync failed: '+(e.message||String(e))+'. Your browser-local data has not been intentionally deleted.',true)}
  finally{busy=false;btn.disabled=!(client&&session&&session.user);btn.textContent='Sync'}
 }
 $('rt-cloud-sync').addEventListener('click',sync);
 function attach(c,s){client=c;session=s;btn.disabled=!(client&&session&&session.user);btn.title=session&&session.user?'Sync projects and tasks to your signed-in account':'Sign in to enable cloud sync';if(!session||!session.user)setSyncState('Not synced','unknown')}
 window.addEventListener('rt-supabase-ready',e=>{client=e.detail.client;client.auth.getSession().then(({data})=>attach(client,data.session));});
 window.addEventListener('rt-auth-state',e=>attach(client,e.detail.session));
 if(window.rtSupabase){client=window.rtSupabase;client.auth.getSession().then(({data})=>attach(client,data.session))}
 window.addEventListener('workspace-local-change',()=>{if(session&&session.user)setSyncState('Changes not synced','unknown');else setSyncState('Local only','unknown')});
})();