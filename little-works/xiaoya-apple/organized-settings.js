/* Progressive disclosure without replacing existing application handlers or stored state. */
(function(){
  function organize(){
    const root=document.querySelector('#view-settings');
    if(!root || root.dataset.organized==='true')return;
    root.dataset.organized='true';
    const panels=[...root.children].filter(el=>el.matches('.panel'));
    const semester=panels.find(el=>el.querySelector('#semester-save'));
    const ai=document.getElementById('byok-settings');
    const toggles=panels.find(el=>el.classList.contains('settings-list'));
    const reminder=panels.find(el=>el.querySelector('#reminder-settings-save'));
    const transactions=panels.find(el=>el.querySelector('#transactions'));
    const data=panels.find(el=>el.querySelector('#export-btn'));
    const about=panels.find(el=>el.textContent.includes('关于小芽'));
    function detailsFor(panel,title,expanded){
      if(!panel)return;
      const details=document.createElement('details');
      details.className='xy-organized-details';
      details.open=!!expanded;
      const summary=document.createElement('summary');
      summary.textContent=title;
      panel.before(details);
      details.append(summary,panel);
      panel.classList.add('xy-in-details');
      return details;
    }
    if(semester){
      semester.classList.add('xy-semester');
      const p=semester.querySelector('p.muted');if(p)p.hidden=true;
    }
    if(ai){
      const paragraph=ai.querySelector('p:not(.muted)');
      if(paragraph)paragraph.hidden=true;
      detailsFor(ai,'AI 模型连接',false);
    }
    if(toggles)toggles.classList.add('xy-system-settings');
    detailsFor(reminder,'提醒与时间安排',false);
    detailsFor(transactions,'操作记录与撤销',false);
    if(data)data.classList.add('xy-data-settings');
    detailsFor(about,'关于小芽',false);
    const heading=root.querySelector('.page-head h1');
    if(heading)heading.textContent='设置';
    const desc=root.querySelector('.page-head p');if(desc)desc.hidden=true;
    // Show the selected section when an existing navigation action focuses one of its controls.
    root.addEventListener('focusin',event=>{
      const wrapped=event.target.closest('.xy-organized-details');
      if(wrapped)wrapped.open=true;
    });
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',organize);
  else organize();
})();