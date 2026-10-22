/* Plain-language rule explanations, tutorial affordances, presets and mode hints. */
(()=>{'use strict';
const EXPLAIN={
particles:{
attract:['红色会更用力追逐青色，常出现更快的追逐链。','红色追逐减弱，颜色更容易分散。','观察红色是否总跟在青色后面。'],
avoid:['青色更主动远离红色，追逃差异被放大。','青色更愿意与红色混在一起。','把红追青设高、青躲红也设高，比较两侧。'],
reach:['每个粒子能受到更远同伴的影响，群体联系更密。','只感知身边很近的粒子，容易碎成局部小群。','距离不等于速度，改变的是相互作用的范围。'],
motion:['粒子每步移动更远，碰撞与追逐变化更快。','粒子移动更慢，形态更容易观察。','它不会直接改变谁喜欢谁。']},
neighbors:{
min:['居民需要更多同色邻居才满意，搬迁通常更多。','比较容易满意，可能形成更混合的街区。','如果下限大于上限，可能没有人能满意。'],
max:['允许住在更密集的同色街区。','即使同类太多也不满意，可能出现碎花纹。','试试“恰好 3 个”：将上下限都设为 3。'],
vacancy:['空房更多，搬迁更容易，但居民总数更少。','空间拥挤、选择更少，可能长期不满意。','此值只改变开局，请点重置。'],
moves:['每一步检查更多居民，格局重排得更快。','居民搬家更慢，适合仔细观察迁移过程。','这个值主要改变推进速度，而非满意标准。']},
slime:{
sense:['能“闻到”更远的气味，可能更早转弯。','只看眼前的气味，探索更局部。','过远不一定更好：可能错过短距离分叉。'],
turn:['对侧方气味更敏感，路径转弯更急。','运动更直，曲折和改道速度可能降低。','气味网络也可能因太敏感而不稳定。'],
fade:['旧气味保存更久，既有通路更稳定。','旧气味消失快，需要持续通过才能维护路线。','它是保留比例：越接近 1 越不容易挥发。'],
speed:['小点走得更快，网络刷新更迅速。','小点走得慢，更容易看到细小分叉。','过快可能跨过狭窄气味带。']},
ecology:{
birth:['向空白格扩张更容易，边界可能迅速推进。','繁殖变慢，种群可能更容易消失。','只有相邻位置空着，才能繁殖。'],
hunt:['遇到能战胜的对手时更容易发生捕食。','物种间进攻减弱，领地边界变化更慢。','本模型捕食后会先出现空位。'],
swap:['不同种群更容易交换位置，边界更混杂。','种群更固定，可能形成清晰的大块领地。','移动不改变“谁克谁”的关系。'],
ticks:['每个画面批次计算更多局部交互，变化更快。','每次只计算少量交互，适合看边界演化。','它调整演化量，不直接提高繁殖概率。']},
sand:{
cluster:['虫子更偏向在已有沙堆附近放沙。','沙更可能零散放置，堆积效率下降。','这里控制放沙偏好，不是虫子数量。'],
wander:['虫子一次能走更远，搬运覆盖面扩大。','虫子只在近处活动，沙堆更局部。','走得远不等于更会分类。'],
bugs:['初始搬运虫更多，整体整理速度可能更快。','初始虫子少，搬运速度可能降低。','需要重置生效。'],
activity:['每一步允许更多捡沙、放沙尝试。','放慢动作次数，便于观察沙堆变化。','它是模拟工作量，不是自然时间。']},
fireflies:{
couple:['邻居闪光会更明显地提前自己的相位。','闪光影响变弱，更接近各自独立闪烁。','强同步不保证所有局部区域同时闪。'],
range:['看得见更远同伴，跨区域同步更有机会。','只会被很近的同伴带节奏，可能形成多个区域。','比较小范围和大范围的同步指数。'],
variance:['每只虫自带节奏的差异更大，同步更困难。','天然周期更接近，整体更容易合拍。','改变周期差异需重置以重新生成个体。'],
density:['同时存在更多萤火虫，潜在邻居也更多。','个体稀疏，闪光影响的传播机会减少。','需要重置生效。']},
evolution:{
food:['每步补充食物更多，可能支持更大种群。','环境更稀缺，生存和繁殖难度提高。','快速增殖不一定意味着特征更优。'],
cost:['移动的能量开销更大，快个体可能更吃亏。','移动更便宜，快个体更容易持续觅食。','观察长期平均速度，而非单步波动。'],
mutation:['后代性状和亲代差异更大，探索更广。','后代更接近亲代，变化较慢。','高变异不保证有利。'],
awareness:['能发现更远的食物，觅食路径可能更直接。','只有很近才能看见食物，搜索更随机。','感知越广不一定性价比越高。']},
boids:{
align:['邻居方向更一致，容易出现同向飞行。','每只鸟方向更独立，队形容易散乱。','对齐不是让所有鸟都飞向同一目标。'],
cohere:['更努力接近局部群体中心，群体较紧。','靠拢减弱，局部鸟群可能拆散。','凝聚过强可能使鸟群过密。'],
separate:['近距离避让更强，不容易挤在一起。','容易挤成高密度群，甚至短暂重叠。','这是三条 Boids 规则中的“个人空间”。'],
reach:['每只鸟看见更多邻居，动作更协调。','只响应附近的小群，可能分成独立队伍。','对照两侧不同感知距离的队形。']},
reaction:{
feed:['A 不断补充得更快，可能改变斑点大小和形态。','A 补充放慢，现有花纹可能停滞或消失。','花纹随参数非线性变化，并非越大越复杂。'],
kill:['B 被移除得更快，色块可能缩小或消失。','B 存在更久，可能拓展或合并成图案。','把它和补给率组合调整最有效。'],
diff:['物质在邻格间更快均匀化，细节可能变粗。','物质传播更慢，局部差异更明显。','这里 A/B 的相对扩散系数保持不变。']},
life:{
birth:['空格需要更多活邻居才会出生，新增通常更少。','较稀疏也能出生，增长可能更激烈。','标准规则出生数 = 3。'],
surviveLo:['活细胞必须更拥挤才能存活，稀疏处更容易死。','独处的细胞更容易留下来。','标准规则存活下限 = 2。'],
surviveHi:['拥挤区域更能存活。','太挤时细胞会死亡，空洞可能增多。','标准规则存活上限 = 3。'],
density:['初始活细胞更多，碰撞与出生更频繁。','初始稀疏，图案更容易相互隔离。','需要重置才能重新生成初始布局。']},
crystal:{
stick:['遇到晶体就更容易粘附，分叉可能更密。','更常绕过晶体继续漂移，生长速度下降。','密不密也受接触位置和随机游走影响。'],
walkers:['同时有更多游走粒子尝试靠近晶体。','粒子少，晶体可能长得更慢。','需要重置。'],
activity:['每一步安排更多游走尝试，生长更快。','每一步更少尝试，便于观察枝杈生长。','它主要改变模拟推进速度。']},
forest:{
spread:['树靠近火焰时更容易点燃，火线蔓延快。','火更难跨过树间空隙，大片火灾减少。','观察不同火线形状和空地。'],
regrow:['烧尽空地更快长树，下一场火可能更早发生。','森林恢复慢，空带阻隔火势更久。','不是越快恢复就越安全。'],
lightning:['更多树可能无邻火自行点燃，火源增加。','更少出现无外部传播的新火点。','设为 0 可仅观察已有火源传播。']},
ants:{
follow:['蚂蚁更愿意沿浓气味走，路径可能快速强化。','更自由随机探索，路线不够稳定。','过于追随可能被旧路线误导。'],
evap:['气味更快消失，过时路径清除快但路线难维持。','气味维持更久，常走的路更容易保留。','看能否从杂乱游走中生成通道。'],
wander:['蚂蚁转向更随机，探索范围增大。','更少乱转，路径更直但容易陷入固定路线。','随机探索与追随气味需要平衡。']},
traffic:{
cars:['车辆增加，车距缩短，扰动更可能造成拥堵。','道路更空，车流通常更顺畅。','需要重置后重新布置车辆。'],
maxSpeed:['空旷时能跑得更快，但追上前车也更快。','最高车速低，前后车速度差可能缩小。','最高车速不是实际平均速度。'],
brake:['更常出现无事故的小减速，可能形成堵车波。','随机干扰少，车流更稳定。','观察低速车辆数量。'],
reaction:['司机更注意车距，提前减速而避免贴得太近。','更敢靠近前车，密集车流更敏感。','该模型是简化跟驰规则。']}
};
const oldSetupUI=setupUI;
setupUI=function(){oldSetupUI();enhanceControls();updateGuide()};
function impact(id){return EXPLAIN[mode]?.[id]||['提高会强化当前规则的作用。','降低会弱化当前规则的作用。','推荐一次只改变一条规则。']}
function enhanceControls(){
 const host=$('controls');if(!host)return;
 const old=$('parameter-guide');if(old)old.remove();
 const head=document.createElement('div');head.id='parameter-guide';head.className='parameter-guide';head.innerHTML='<div class="guide-icon">?</div><div><strong>每个滑块会改变什么？</strong><p>展开参数下方的「为什么」，先预测结果，再实际验证。<br>↑ 和 ↓ 表示调高或调低时可能出现的变化。</p></div>';host.before(head);
 const elements=host.querySelectorAll('.control');
 MODES[mode].params.forEach((param,i)=>{const [key,label,min,max,base,step,hint]=param;const el=elements[i];if(!el)return;const input=el.querySelector('input');if(!input)return;
 const [up,down,tip]=impact(key);
 const hints=document.createElement('div');hints.className='impact-hints';
 const higher=document.createElement('div');higher.className='impact-row';const downer=document.createElement('div');downer.className='impact-row';
 higher.innerHTML='<span class="direction up">↑ 调高</span><span></span>';downer.innerHTML='<span class="direction down">↓ 调低</span><span></span>';higher.children[1].textContent=up;downer.children[1].textContent=down;hints.append(higher,downer);
 const detail=document.createElement('details');detail.className='why-detail';const summary=document.createElement('summary');summary.textContent='为什么会这样？';const p=document.createElement('p');p.textContent=tip;detail.append(summary,p);
 const meter=document.createElement('div');meter.className='range-scale';meter.innerHTML='<span>弱 / 少</span><span>强 / 多</span>';
 el.append(meter,hints,detail);
 let badge=document.createElement('span');badge.className='value-badge';badge.textContent='';el.querySelector('label').append(badge);
 const set=()=>{const n=Number(input.value),fraction=(n-min)/(max-min||1);badge.textContent=fraction<.3?'较低':fraction>.7?'较高':'中等';el.style.setProperty('--level',(fraction*100)+'%');const isInit=['vacancy','bugs','density'].includes(key)||mode==='crystal'&&key==='walkers'||mode==='traffic'&&key==='cars';const isReset=(mode==='life'&&key==='density')||(mode==='neighbors'&&key==='vacancy')||(mode==='fireflies'&&key==='density')||(mode==='sand'&&key==='bugs')||(mode==='crystal'&&key==='walkers')||(mode==='traffic'&&key==='cars');
 if(isReset){el.dataset.reset='true';if(!el.querySelector('.reset-hint')){const span=document.createElement('div');span.className='reset-hint';span.textContent='↺ 需要点击「重置」才会改变开局';el.append(span)}}else{el.dataset.reset='false'} };
 input.addEventListener('input',()=>{set();updateGuide(key,input.value)});
 set();
 });
}
function updateGuide(key,value){const host=$('rule-guide');if(!host)return;const def=MODES[mode];let first=def.params[0],name=key||first[0],p=def.params.find(x=>x[0]===name)||first;
 const [up,down,tip]=impact(name);
 host.querySelector('strong').textContent=key?'正在改变：'+p[1]:'观察这个实验';
 host.querySelector('p').textContent=key?'现在改动的是「'+p[1]+'」。建议暂停观察一会儿，再开启 A/B 对照验证差异。':'推荐从「'+first[1]+'」开始：只改变这一个参数，观察画面与指标。';
}
const originalSelectMode=selectMode;
selectMode=function(next){originalSelectMode(next);updateGuide();decorateNav();};
function decorateNav(){document.querySelectorAll('#nav button').forEach((button,i)=>{button.dataset.ordinal=String(i+1).padStart(2,'0');button.setAttribute('title',MODES[button.dataset.mode]?.intro||'');});const h=$('world-counter');if(h)h.textContent=Object.keys(MODES).length.toString().padStart(2,'0')+' WORLDS';}
function addGuide(){const sidebar=document.querySelector('.sidebar');const after=sidebar?.querySelector('p');if(after){const guide=document.createElement('div');guide.id='rule-guide';guide.className='rule-guide';guide.innerHTML='<span class="rule-guide-label">先猜，再实验</span><strong>观察这个实验</strong><p>只改变一个参数，再观察会发生什么。</p><div class="rule-guide-actions"><button type="button" id="quick-ab">⇄ 做一次 A/B 比较</button><button type="button" id="randomize">⚄ 随机参数</button></div>';after.after(guide)}
 const nav=document.getElementById('nav');if(nav){const top=document.createElement('div');top.className='nav-heading';top.innerHTML='<span>EXPLORE THE WORLDS <b>/ 点击一个世界开始探索</b></span><span id="world-counter">14 WORLDS</span>';nav.before(top)}
 const mast=document.querySelector('.hero .orb');if(mast)mast.innerHTML='14<small>WORLDS</small>';
 const footer=document.querySelector('footer');if(footer){const source=document.createElement('div');source.className='research-note';source.innerHTML='<strong>14 个模型 · 14 种局部规则</strong><span>实验属于教学模拟，不等同于自然与社会系统的精确预测。参考 <a href="https://ccl.netlogo.org/netlogo/models/" target="_blank" rel="noopener">NetLogo</a>、<a href="https://www.complexity-explorables.org/topics/" target="_blank" rel="noopener">Complexity Explorables</a>、<a href="https://lifelabs.online/en/experiments" target="_blank" rel="noopener">LifeLabs</a> 的交互研究思路。</span>';footer.before(source);}
 document.getElementById('quick-ab')?.addEventListener('click',()=>{const checkbox=$('compare');if(!checkbox.checked){checkbox.checked=true;checkbox.dispatchEvent(new Event('change',{bubbles:true}))}document.getElementById('abEdit')?.scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth',block:'nearest'});});
 document.getElementById('randomize')?.addEventListener('click',()=>{for(const row of MODES[mode].params){const [key,,lo,hi,base,step]=row;let n=Math.round((lo+Math.random()*(hi-lo))/step)*step;params[key]=Number(Math.max(lo,Math.min(hi,n)).toFixed(5));}defaultB();setupUI();init();toast('参数已随机生成；试着观察有什么意外。')});
}
Object.assign(PRESETS,{
boids:{align:1.8,cohere:.34,separate:1.9,reach:88},
reaction:{feed:.044,kill:.064,diff:1.1},
life:{birth:3,surviveLo:2,surviveHi:3,density:.31},
crystal:{stick:.97,walkers:95,activity:750},
forest:{spread:.95,regrow:.012,lightning:.0001},
ants:{follow:2.6,evap:.018,wander:.22},
traffic:{cars:115,maxSpeed:8,brake:.13,reaction:.75}
});
addGuide();setupUI();decorateNav();
})();