'use strict';
// Protótipo de alta fidelidade para demonstração de interações de IHC.
// NÃO contém algoritmos científicos nem consultas à rede.
const $ = id => document.getElementById(id);
const escapeHTML = value => String(value).replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
const months = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
const lines = [
 {id:'L1',color:'#2566bb',name:'Linha 1 · Azul',stops:['Jabaquara','São Judas','Santa Cruz','Ana Rosa','Paraíso','São Bento','Sé','Luz','Santana','Tucuruvi']},
 {id:'L2',color:'#268a68',name:'Linha 2 · Verde',stops:['Vila Prudente','Tamanduateí','Chácara Klabin','Ana Rosa','Paraíso','Brigadeiro','Consolação','Clínicas','Vila Madalena']},
 {id:'L3',color:'#e04b43',name:'Linha 3 · Vermelha',stops:['Palmeiras-Barra Funda','Marechal Deodoro','República','Sé','Pedro II','Brás','Tatuapé','Penha','Corinthians-Itaquera']},
 {id:'L4',color:'#c0a42f',name:'Linha 4 · Amarela',stops:['Luz','República','Higienópolis-Mackenzie','Paulista','Faria Lima','Pinheiros','Butantã','São Paulo-Morumbi','Vila Sônia']},
 {id:'L5',color:'#9868b4',name:'Linha 5 · Lilás',stops:['Capão Redondo','Campo Limpo','Santo Amaro','Brooklin','Borba Gato','Santa Cruz','Chácara Klabin']}
];
const stations = [...new Set(lines.flatMap(l=>l.stops))].sort((a,b)=>a.localeCompare(b,'pt-BR'));
const nodes = lines.flatMap((line,li)=>line.stops.map((name,i)=>({name,line:line.name,color:line.color,x:0.09+i*.82/Math.max(1,line.stops.length-1),y:.16+li*.17})));
let selectedStation=null, selectedLine='', routePath=[], simDay=0, playing=null, simReady=false, tech=false;
const stationLine = name => lines.find(l=>l.stops.includes(name))?.name || 'Rede ilustrativa';
const message = (title,body) => `<div class="hint"><b>${title}</b><p style="margin:5px 0 0">${body}</p></div>`;
function goto(id){
 if(!$(id)||!$(id).classList.contains('view'))id='cidadao';
 document.querySelectorAll('.view').forEach(el=>el.classList.toggle('current',el.id===id));
 document.querySelectorAll('[data-view]').forEach(el=>{if(el.dataset.view===id)el.setAttribute('aria-current','page');else el.removeAttribute('aria-current')});
 $('aux-menu').hidden=true;$('menu-button').setAttribute('aria-expanded','false');
 if(playing){clearInterval(playing);playing=null;$('play-sim').textContent='▶ Reproduzir'}
 location.hash=id;document.title='VigiMetro · '+({cidadao:'Meu trajeto',inicio:'Entenda',simulador:'Simule',modelo:'Sobre',apresentacao:'Site'}[id]);
 window.scrollTo(0,0);requestAnimationFrame(drawAll);
}
function selectOptions(el, options){el.innerHTML=options.map(o=>`<option value="${escapeHTML(o)}">${escapeHTML(o)}</option>`).join('')}
function draw(kind){
 const canvas=$('map-'+kind);if(!canvas || canvas.getClientRects().length===0)return;
 const r=canvas.getBoundingClientRect(),w=r.width,h=r.height,dpr=Math.min(window.devicePixelRatio||1,2);if(w===0||h===0)return;
 canvas.width=Math.floor(w*dpr);canvas.height=Math.floor(h*dpr);const ctx=canvas.getContext('2d');ctx.scale(dpr,dpr);
 ctx.clearRect(0,0,w,h);
 nodes.forEach((n,i)=>{const line=lines.find(l=>l.name===n.line);if(selectedLine && kind==='home'&&line.id!==selectedLine)return;
 const siblings=nodes.filter(x=>x.line===n.line);const j=siblings.indexOf(n);if(j===0)return;
 const previous=siblings[j-1];ctx.beginPath();ctx.moveTo(previous.x*w,previous.y*h);ctx.lineTo(n.x*w,n.y*h);ctx.lineWidth=3;ctx.strokeStyle=line.color;ctx.globalAlpha=.36;ctx.stroke();ctx.globalAlpha=1;
 });
 nodes.forEach(n=>{const l=lines.find(x=>x.name===n.line);if(selectedLine&&kind==='home'&&l.id!==selectedLine)return;
 const highlighted=kind==='route'&&routePath.includes(n.name);const active=selectedStation===n.name;const x=n.x*w,y=n.y*h;ctx.beginPath();ctx.arc(x,y,highlighted?7:active?8:kind==='sim'&&simReady?3.5+7*Math.max(0,Math.sin(simDay/10+n.x*7)) :4.2,0,Math.PI*2);ctx.fillStyle=highlighted?'#ef6473':kind==='sim'&&simReady?'#df5667':n.color;ctx.fill();ctx.lineWidth=2;ctx.strokeStyle='#fff';ctx.stroke();
 if(highlighted||active||['Sé','Luz','Pinheiros','Brás','Paraíso'].includes(n.name)&&kind!=='sim'){ctx.font='600 11px Segoe UI, Arial';ctx.fillStyle='#2b405f';ctx.textAlign='center';ctx.fillText(n.name,x,Math.max(11,y-12))}
 });
 canvas._nodes=nodes;canvas._w=w;canvas._h=h;
}
function drawAll(){['home','route','sim'].forEach(draw)}
function selectStation(name){selectedStation=name;$('station-title').textContent=name;$('station-body').innerHTML=`<p class="fine">${escapeHTML(stationLine(name))}</p>${message('Informações de referência','Aqui ficarão disponíveis a demanda mensal, as conexões e as métricas da estação na versão completa.')}`;$('station-popup').classList.remove('off');drawAll()}
function setup(){
 document.querySelectorAll('[data-view]').forEach(x=>x.addEventListener('click',()=>goto(x.dataset.view)));
 document.querySelectorAll('[data-goto]').forEach(x=>x.addEventListener('click',()=>goto(x.dataset.goto)));
 $('menu-button').onclick=()=>{const open=$('aux-menu').hidden;$('aux-menu').hidden=!open;$('menu-button').setAttribute('aria-expanded',String(open))};
 document.addEventListener('click',e=>{if(!e.target.closest('.menu-wrap')){$('aux-menu').hidden=true;$('menu-button').setAttribute('aria-expanded','false')}});
 document.addEventListener('keydown',e=>{if(e.key==='Escape'){$('station-popup').classList.add('off');$('aux-menu').hidden=true}});
 $('close-popup').onclick=()=>$('station-popup').classList.add('off');
 document.querySelectorAll('.month-select').forEach(el=>{selectOptions(el,months);el.value=months[new Date().getMonth()]});
 document.querySelectorAll('.cenario-select').forEach(el=>selectOptions(el,['Referência ilustrativa','Transmissibilidade reduzida (exemplo)','Transmissibilidade elevada (exemplo)']));
 document.querySelectorAll('.protecao-select').forEach(el=>selectOptions(el,['Sem proteção (exemplo)','Uso de máscara (exemplo)','Medidas combinadas (exemplo)']));
 ['origem','destino','sim-seed'].forEach(id=>selectOptions($(id),stations));$('origem').value='Corinthians-Itaquera';$('destino').value='Pinheiros';$('sim-seed').value='Sé';
 $('h-nos').textContent='—';$('h-arestas').textContent='—';$('h-linhas').textContent=lines.length+'*';
 $('entenda-linha').innerHTML='<option value="">Todas as linhas</option>'+lines.map(l=>`<option value="${l.id}">${l.name}</option>`).join('');
 $('entenda-linha').onchange=()=>{selectedLine=$('entenda-linha').value;renderHighlights();drawAll()};$('entenda-mes').onchange=renderHighlights;
 $('route-mes').onchange=drawAll;
 $('mode-cit').onclick=()=>setTech(false);$('mode-tec').onclick=()=>setTech(true);
 document.querySelectorAll('[data-mapzoom]').forEach(b=>{b.onclick=()=>{const canvas=$('map-'+b.dataset.mapzoom.split(':')[0]);if(canvas){const wrap=canvas.parentElement;wrap.animate([{outline:'2px solid #9bbff6'},{outline:'2px solid transparent'}],{duration:450});} }});
 ['home','route','sim'].forEach(kind=>{$('map-'+kind).addEventListener('click',ev=>{const canvas=ev.currentTarget,r=canvas.getBoundingClientRect(),px=(ev.clientX-r.left),py=(ev.clientY-r.top);let found=null,distance=18;for(const n of nodes){const d=Math.hypot(n.x*r.width-px,n.y*r.height-py);if(d<distance){distance=d;found=n}}if(found)selectStation(found.name)})});
 $('route-form').onsubmit=e=>{e.preventDefault();renderRoute()};
 $('add-seed').onclick=()=>{const n=$('sim-seed').value;if(!document.querySelector(`[data-seed="${CSS.escape(n)}"]`)){const chip=document.createElement('span');chip.className='seed';chip.dataset.seed=n;chip.innerHTML=`${escapeHTML(n)} <button type="button" aria-label="Remover estação">×</button>`;chip.querySelector('button').onclick=()=>chip.remove();$('seed-list').appendChild(chip)}};
 $('sim-form').onsubmit=e=>{e.preventDefault();simReady=true;setDay(0);renderSim()};
 $('sim-day').oninput=e=>setDay(Number(e.target.value));$('play-sim').onclick=()=>{if(playing){clearInterval(playing);playing=null;$('play-sim').textContent='▶ Reproduzir'}else{playing=setInterval(()=>setDay((simDay+1)%(Number($('sim-day').max)+1)),300);$('play-sim').textContent='Ⅱ Pausar'}};
 $('comp-btn').onclick=()=>{$('comp-result').innerHTML=message('Comparação demonstrativa','Na aplicação completa, esta área comparará diferentes cenários epidemiológicos. Aqui mostramos apenas o fluxo e a posição reservada para os gráficos.')+demoChart()};
 $('rank-btn').onclick=()=>{$('ranking-result').innerHTML=message('Ranking estrutural — demonstração','Nesta área serão exibidos os rankings de grau e centralidade calculados com a rede completa. Nenhum ranking real foi executado.')};
 $('server-status').textContent='●';$('server-status').classList.add('connected');$('server-status').title='Protótipo local, sem servidor';
 $('link-status').innerHTML=message('Link deste protótipo','Depois de publicar no GitHub Pages, este mesmo endereço poderá ser compartilhado com sua professora.');
 $('local-link').textContent=location.href.split('#')[0];$('lan-link').textContent='Não é necessário servidor ou conexão de rede';
 $('qr-display').innerHTML=message('QR Code','O link do GitHub Pages poderá ser convertido em QR Code após a publicação.');
 $('share-public').classList.remove('off');$('public-link').textContent=location.href.split('#')[0];
 $('copy-link').onclick=()=>{navigator.clipboard?.writeText(location.href.split('#')[0]).then(()=>{$('copy-link').textContent='Copiado ✓'}).catch(()=>prompt('Copie o endereço:',location.href.split('#')[0]))};
 $('open-link').onclick=()=>window.open(location.href.split('#')[0],'_blank','noopener');
 $('avisos-modelo').innerHTML=message('Limites desta versão','A malha exibida foi reduzida exclusivamente para testar a interface. Os dados, pesos, métricas epidemiológicas e algoritmos originais não são executados nesta demonstração.');
 renderHighlights();setTech(false);window.addEventListener('resize',drawAll);window.addEventListener('hashchange',()=>goto(location.hash.slice(1)||'cidadao'));goto(location.hash.slice(1)||'cidadao');
}
function setTech(v){tech=v;$('cidadao').dataset.profile=v?'tecnico':'cidadao';$('mode-cit').setAttribute('aria-pressed',String(!v));$('mode-tec').setAttribute('aria-pressed',String(v));if(routePath.length)renderRoute()}
function renderHighlights(){const relevant=selectedLine?lines.filter(l=>l.id===selectedLine):lines;$('entenda-destaques').innerHTML=relevant.flatMap(l=>l.stops.slice(0,3).map(s=>`<button type="button" class="station-highlight" data-station="${escapeHTML(s)}"><span class="station-index">●</span><span class="station-name">${escapeHTML(s)}<small>${escapeHTML(l.name)}</small></span><span class="station-value">Ver</span></button>`)).join('');$('entenda-destaques').querySelectorAll('[data-station]').forEach(el=>el.onclick=()=>selectStation(el.dataset.station));draw('home')}
function renderRoute(){const a=$('origem').value,b=$('destino').value;if(a===b){$('route-result').innerHTML='<p class="error" role="alert">Escolha estações diferentes para embarque e desembarque.</p>';routePath=[];draw('route');return}
 // Demonstração de interface: os pontos não são um caminho ferroviário calculado.
 routePath=[a,b];$('route-maplabel').textContent='Seleção ilustrativa (sem cálculo)';
 const head=`<h2 class="subhead">Exemplo de consulta</h2><div class="trip-stations"><div><span class="trip-dot dot-teal"></span><small>Embarque</small><strong>${escapeHTML(a)}</strong></div><div class="trip-rail">↓</div><div><span class="trip-dot dot-pink"></span><small>Desembarque</small><strong>${escapeHTML(b)}</strong></div></div>`;
 $('route-result').innerHTML=head+'<div class="sectiongap">'+message('Demonstração de interação','O formulário e o mapa respondem às escolhas. A rota e a probabilidade não foram calculadas; os pontos destacam apenas origem e destino.')+'</div>'+(tech?`<div class="grid twocol sectiongap"><div class="outcard"><h3>BFS</h3><p class="fine">Espaço reservado ao percurso com menor número de arestas.</p></div><div class="outcard"><h3>Dijkstra</h3><p class="fine">Espaço reservado ao percurso de menor custo ponderado.</p></div></div><p class="chart-axes">Gráfico comparativo previsto: eixo X = etapas do percurso; eixo Y = probabilidade acumulada. Nenhum valor foi calculado.</p>`:'<div class="hint sectiongap">No sistema completo, esta área apresenta a comparação de percursos, a lista de estações e orientações ao cidadão.</div>');draw('route')}
function demoChart(){const p=[11,17,16,29,24,34,28,46,38,41,33,23,18];const coords=p.map((v,i)=>`${20+i*41},${135-v*2}`).join(' ');return `<svg class="graph" viewBox="0 0 560 170" role="img" aria-label="Gráfico puramente ilustrativo"><line x1="20" y1="145" x2="540" y2="145" stroke="#9aaec8"/><line x1="20" y1="10" x2="20" y2="145" stroke="#9aaec8"/><polyline fill="none" stroke="#236bdd" stroke-width="3" points="${coords}"/><text x="280" y="164" text-anchor="middle" fill="#647087" font-size="11">Etapas ou dias (ilustrativos)</text></svg><p class="fine">Curva fictícia apenas para demonstrar a apresentação visual dos resultados.</p>`}
function renderSim(){const days=Math.max(1,Math.min(120,Number($('sim-dias').value)||60));$('sim-result').innerHTML='<h2 class="subhead">Resultado demonstrativo</h2>'+message('Simulação não executada','Este gráfico apresenta somente o comportamento visual previsto. No projeto final, SEIR e Monte Carlo produzirão os resultados para os parâmetros escolhidos.')+demoChart();$('sim-day').max=days;$('sim-day').disabled=false;$('play-sim').disabled=false;draw('sim')}
function setDay(n){simDay=n;$('sim-day').value=n;$('day-val').textContent=n;$('sim-maplabel').textContent='Dia ilustrativo '+n+' · sem dados epidemiológicos';draw('sim')}
document.addEventListener('DOMContentLoaded',setup);
