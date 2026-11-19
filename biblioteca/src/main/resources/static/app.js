
const hoje = new Date(); hoje.setHours(0,0,0,0);
const dia = n => { const d = new Date(hoje); d.setDate(d.getDate()+n); return d; };
const fmt = d => d.toLocaleDateString('pt-BR');
const real = v => v.toLocaleString('pt-BR',{style:'currency',currency:'BRL'});
const cores = ['#6b3f2a','#3d5a80','#7a2e3a','#4f6b3a','#5b4b8a','#8a5a1f','#2f6f6a','#7a4a6b'];

const db = {
  livros: [
    {id:1,titulo:'Dom Casmurro',autor:'Machado de Assis',genero:'Romance',total:4,disp:2,isbn:'978-85-359-0277-5',sinopse:'Bentinho revive a juventude e a dúvida sobre Capitu.',pop:true},
    {id:2,titulo:'Duna',autor:'Frank Herbert',genero:'Ficção',total:3,disp:0,isbn:'978-85-7657-407-1',sinopse:'Disputa pelo planeta deserto Arrakis e pela especiaria.',pop:true},
    {id:3,titulo:'It: A Coisa',autor:'Stephen King',genero:'Terror',total:2,disp:1,isbn:'978-85-560-8004-3',sinopse:'Um grupo de amigos enfrenta uma entidade que volta a cada geração.',pop:true},
    {id:4,titulo:'Sapiens',autor:'Yuval Noah Harari',genero:'História',total:5,disp:5,isbn:'978-85-254-3293-0',sinopse:'Uma breve história da humanidade, da pré-história à atualidade.',pop:false},
    {id:5,titulo:'Metodologia Científica',autor:'Antonio Carlos Gil',genero:'Acadêmico',total:6,disp:3,isbn:'978-85-970-2000-2',sinopse:'Guia para elaborar trabalhos e pesquisas acadêmicas.',pop:false},
    {id:6,titulo:'Orgulho e Preconceito',autor:'Jane Austen',genero:'Romance',total:3,disp:3,isbn:'978-85-254-2000-1',sinopse:'Elizabeth Bennet e o enigmático Sr. Darcy.',pop:false},
  ],
  emprestimos: [
    {id:1,cliente:'Diego Almeida',livroId:1,retirada:dia(-12),prevista:dia(-2),devolvido:false},
    {id:2,cliente:'Diego Almeida',livroId:3,retirada:dia(-5),prevista:dia(2),devolvido:false},
    {id:3,cliente:'Diego Almeida',livroId:4,retirada:dia(-1),prevista:dia(13),devolvido:false},
    {id:4,cliente:'Marina Souza',livroId:5,retirada:dia(-8),prevista:dia(6),devolvido:false},
    {id:5,cliente:'Diego Almeida',livroId:6,retirada:dia(-30),prevista:dia(-16),devolvido:true},
  ],
  reservas: [
    {id:1,cliente:'Diego Almeida',livroId:2,data:dia(-3),status:'Em espera'},
    {id:2,cliente:'Marina Souza',livroId:3,data:dia(-1),status:'Disponível'},
  ],
  pagamentos: [
    {id:1,cliente:'Diego Almeida',motivo:'Multa: Dom Casmurro',valor:6,data:dia(-1),pago:false},
    {id:2,cliente:'Marina Souza',motivo:'Multa: Duna',valor:4,data:dia(-20),pago:true},
    {id:3,cliente:'Diego Almeida',motivo:'Aluguel de leitura local',valor:3,data:dia(-9),pago:true},
  ],
};
const ME = 'Diego Almeida';
db.clientes = [
  {id:1,nome:'Diego Almeida',email:'diego@email.com',telefone:'(71) 99999-1111'},
  {id:2,nome:'Marina Souza',email:'marina@email.com',telefone:'(71) 98888-2222'},
  {id:3,nome:'Carlos Lima',email:'carlos@email.com',telefone:'(71) 97777-3333'},
];
db.avisos = [];    
db.leituras = [];  

const slug = t => t.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
db.livros.forEach(l => l.capa = l.capa || 'img/capas/' + slug(l.titulo) + '.jpg');
let sessao = JSON.parse(sessionStorage.getItem('sessao') || 'null');
const livro = id => db.livros.find(l => l.id == id);
const diasAte = d => Math.round((d - hoje) / 864e5);
const ativos = nome => db.emprestimos.filter(e => e.cliente === nome && !e.devolvido);
const atrasado = e => !e.devolvido && diasAte(e.prevista) < 0;
const temMulta = nome => db.pagamentos.some(p => p.cliente === nome && !p.pago && p.motivo.startsWith('Multa'));
const hora = d => d.toLocaleTimeString('pt-BR', {hour:'2-digit', minute:'2-digit'});
/* Avisos do cliente = calculados (prazos e reservas) + enviados pelo administrador */
function avisosDoCliente(nome){
  const lista = [];
  ativos(nome).forEach(e => {
    const d = diasAte(e.prevista), t = livro(e.livroId).titulo;
    if(d < 0) lista.push({tipo:'late', texto:`"${t}" está atrasado há ${-d} dia(s).`});
    else if(d <= 2) lista.push({tipo:'warn', texto:`"${t}" vence ${d===0 ? 'hoje' : 'em '+d+' dia(s)'}.`});
  });
  db.reservas.filter(r => r.cliente === nome && r.status === 'Disponível')
    .forEach(r => lista.push({tipo:'ok', texto:`Sua reserva de "${livro(r.livroId).titulo}" chegou. Retire na biblioteca.`}));
  return lista.concat(db.avisos.filter(a => a.cliente === nome));
}
function statusEmp(e){
  if(e.devolvido) return ['neutro','Devolvido'];
  const n = diasAte(e.prevista);
  return n < 0 ? ['late','Atrasado'] : n <= 2 ? ['warn','Próximo do vencimento'] : ['ok','Em dia'];
}
const classeReserva = s => s==='Disponível' ? 'ok' : s==='Cancelada' ? 'late' : 'warn';
const tag = ([c,t]) => `<span class="tag ${c}">${t}</span>`;
const esc = s => String(s).replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));

function toast(msg){
  const t = document.getElementById('toast'); t.textContent = msg; t.classList.add('show');
  clearTimeout(toast.t); toast.t = setTimeout(()=>t.classList.remove('show'), 2200);
}
const LOGO = `<img class="logo" src="img/logo.png" alt="Biblioteca Página Aberta">`;


const ic = d => `<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;
const ICONES = {
  'inicio': ic('<path d="M3 11l9-8 9 8v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/>'),
  'catalogo': ic('<path d="M2 4h6a4 4 0 0 1 4 4v13a3 3 0 0 0-3-3H2z"/><path d="M22 4h-6a4 4 0 0 0-4 4v13a3 3 0 0 1 3-3h7z"/>'),
  'meus': ic('<path d="M6 3h12v18l-6-4-6 4z"/>'),
  'pagamentos': ic('<rect x="3" y="6" width="18" height="14" rx="2"/><path d="M3 10h18M16 15h2"/>'),
  'admin': ic('<rect x="3" y="3" width="7" height="9"/><rect x="14" y="3" width="7" height="5"/><rect x="14" y="12" width="7" height="9"/><rect x="3" y="16" width="7" height="5"/>'),
  'admin/livros': ic('<path d="M2 4h6a4 4 0 0 1 4 4v13a3 3 0 0 0-3-3H2z"/><path d="M22 4h-6a4 4 0 0 0-4 4v13a3 3 0 0 1 3-3h7z"/>'),
  'admin/clientes': ic('<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c0-3.6 2.9-6 6.5-6s6.5 2.4 6.5 6"/><path d="M16 4.6a3.5 3.5 0 0 1 0 6.8M18 14.3c2.2.7 3.5 2.6 3.5 5.7"/>'),
  'admin/emprestimos': ic('<path d="M17 3l4 4-4 4M21 7H8M7 21l-4-4 4-4M3 17h13"/>'),
  'admin/pagamentos': ic('<rect x="3" y="6" width="18" height="14" rx="2"/><path d="M3 10h18M16 15h2"/>'),
};

const SINO = ic('<path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.9 1.9 0 0 0 3.4 0"/>');
function layoutCliente(ativo, corpo){
  const abas = [['inicio','Início'],['catalogo','Catálogo'],['meus','Reservas'],['pagamentos','Pagamentos']];
  const n = avisosDoCliente(ME).length;
  return `<header class="topo"><a class="marca" href="#/inicio"><img class="mini-logo" src="img/logo-icone.png" alt="" onerror="this.style.display='none'"><span>Biblioteca<br><b>Página Aberta</b></span></a><span class="dir"><a class="sino" href="#/avisos" aria-label="Avisos">${SINO}${n ? `<span class="badge">${n}</span>` : ''}</a><button data-sair>Sair</button></span></header>
  <main class="pagina">${corpo}</main>
  <nav class="nav">${abas.map(([r,n])=>`<a href="#/${r}" class="${ativo===r?'on':''}">${ICONES[r]}<span>${n}</span></a>`).join('')}</nav>`;
}
function layoutAdmin(ativo, corpo){
  const abas = [['admin','Painel'],['admin/livros','Livros'],['admin/emprestimos','Empréstimos'],['admin/clientes','Clientes'],['admin/pagamentos','Pagamentos']];
  return `<header class="topo admin"><a class="marca" href="#/inicio"><img class="mini-logo" src="img/logo-icone.png" alt="" onerror="this.style.display='none'"><span>Biblioteca<br><b>Página Aberta</b></span></a><span class="dir"><span class="selo">Admin</span><button data-sair>Sair</button></span></header>
  <main class="pagina">${corpo}</main>
  <nav class="nav admin">${abas.map(([r,n])=>`<a href="#/${r}" class="${ativo===r?'on':''}">${ICONES[r]}<span>${n}</span></a>`).join('')}</nav>`;
}
const capa = (l, g='') => `<div class="capa img ${g}" data-cor="${cores[l.id % cores.length]}" data-t="${esc(l.titulo)}"><img src="${l.capa}" alt="Capa de ${esc(l.titulo)}" loading="lazy"></div>`;

function ligarCapas(){
  const exts = ['jpg','jpeg','png','webp'];
  const falha = img => { const c = img.parentNode; c.className = c.className.replace('img','').trim(); c.style.background = c.dataset.cor; c.textContent = c.dataset.t; };
  const proxima = img => {
    const m = img.getAttribute('src').match(/^(img\/capas\/.+)\.(jpg|jpeg|png|webp)$/);
    const k = m ? exts.indexOf(m[2]) + 1 : exts.length;
    if(m && k < exts.length) img.src = m[1] + '.' + exts[k]; else falha(img);
  };
  document.querySelectorAll('.capa img').forEach(i => { i.addEventListener('error', () => proxima(i)); if(i.complete && !i.naturalWidth) proxima(i); });
}
const card = l => `<button class="livro" data-livro="${l.id}">${capa(l)}<div class="t">${esc(l.titulo)}</div><div class="a">${esc(l.autor)}</div>${tag(l.disp>0?['ok','Disponível']:['late','Indisponível'])}</button>`;

const linhaCliente = c => {
  const at = ativos(c.nome), atr = at.find(atrasado);
  return `<li><span><b>${esc(c.nome)}</b><br><small>${esc(c.telefone)} · ${esc(c.email)}</small><br>
    ${tag(['neutro', at.length+' emprestado(s)'])} ${atr ? tag(['late','Atrasado']) : ''}</span>
    <span class="acoes"><a class="btn mini sec" href="#/admin/cliente/${c.id}">Histórico</a>${atr ? `<button class="btn mini" data-aviso="${atr.id}">Enviar aviso</button>` : ''}</span></li>`;
};
const formEmprestimo = () => `<form id="f-emp" class="form-linha">
  <select name="cliente" aria-label="Cliente">${db.clientes.map(c => `<option>${esc(c.nome)}</option>`).join('')}</select>
  <select name="livroId" aria-label="Livro">${db.livros.filter(l => l.disp > 0).map(l => `<option value="${l.id}">${esc(l.titulo)} (${l.disp})</option>`).join('')}</select>
  <button class="btn">Registrar empréstimo</button></form>`;
const listaLeituras = ls => ls.length
  ? `<ul class="lista">${ls.map(x => `<li><span>${esc(livro(x.livroId).titulo)}<br><small>${esc(x.cliente)} · até ${hora(x.ate)}</small></span>${tag(['warn','Em leitura'])}</li>`).join('')}</ul>`
  : '<p class="vazio">Nenhuma leitura em andamento.</p>';


const telas = {
  login: () => `<div class="auth">${LOGO}<h1>Entrar</h1><p class="sub">Acesse sua conta da biblioteca</p>
    <form id="f-login" novalidate>
      <label class="campo"><span>E-mail ou telefone</span><input name="id" autocomplete="username"></label>
      <label class="campo"><span>Senha</span><input name="senha" type="password" autocomplete="current-password"></label>
      <div class="erro" id="erro"></div>
      <button class="btn">Entrar</button>
    </form>
    <a class="link" href="#/recuperar">Esqueci minha senha</a><br>
    <a class="link" href="#/cadastro">Criar conta</a>
    <p class="dica">Para testar: use qualquer senha. Um e-mail com "admin" abre a área administrativa.</p></div>`,

  cadastro: () => `<div class="auth">${LOGO}<h1>Criar conta</h1><p class="sub">Preencha seus dados para usar a biblioteca</p>
    <form id="f-cad" novalidate>
      ${[['nome','Nome completo','text'],['cpf','CPF','text'],['email','E-mail','email'],['tel','Telefone','tel'],['senha','Senha','password'],['conf','Confirmar senha','password']]
        .map(([n,l,t])=>`<label class="campo"><span>${l}</span><input name="${n}" type="${t}"></label>`).join('')}
      <div class="erro" id="erro"></div>
      <button class="btn">Criar conta</button>
    </form><a class="link" href="#/login">Já tenho conta</a></div>`,

  recuperar: () => `<div class="auth">${LOGO}<h1>Recuperar senha</h1><p class="sub">Enviaremos um código para você</p>
    <form id="f-rec"><label class="campo"><span>E-mail ou telefone</span><input name="id" required></label>
    <button class="btn">Enviar código</button></form><a class="link" href="#/login">Voltar ao login</a></div>`,

  inicio: () => {
    const prox = db.emprestimos.filter(e=>e.cliente===ME && !e.devolvido).sort((a,b)=>a.prevista-b.prevista)[0];
    const cartao = prox
      ? `<div class="hero-card"><small>Próxima devolução</small><b>${fmt(prox.prevista)}</b><span>${esc(livro(prox.livroId).titulo)}</span>${tag(statusEmp(prox))}</div>`
      : '<div class="hero-card"><span>Você não tem devoluções pendentes.</span></div>';
    return layoutCliente('inicio', `<section class="hero"><p>Bem-vindo de volta</p><h1>Olá, ${esc(sessao.nome)}!</h1>${cartao}</section>
      <h2>Livros em destaque</h2><div class="carrossel">${db.livros.filter(l=>l.pop).map(card).join('')}</div>
      <h2>Disponíveis agora</h2><div class="carrossel">${db.livros.filter(l=>l.disp>0).map(card).join('')}</div>`);
  },

  catalogo: () => layoutCliente('catalogo', `<h1>Catálogo</h1><br>
    <input class="busca" id="busca" type="search" placeholder="Buscar por título ou autor" aria-label="Buscar livros">
    <div class="chips" id="chips">${['Todos','Romance','Ficção','Terror','Acadêmico','História'].map((g,i)=>`<button class="chip ${i?'':'on'}" data-g="${g}">${g}</button>`).join('')}</div>
    <div class="grid" id="lista"></div>`),

  livro: id => {
    const l = livro(id); if(!l) return telas.catalogo();
    return layoutCliente('catalogo', `<button class="voltar" onclick="history.back()">‹ Voltar</button>
      ${capa(l,'grande')}<h1>${esc(l.titulo)}</h1><p class="a" style="color:var(--muda)">${esc(l.autor)} · ${esc(l.genero)}</p><br>
      <p>${esc(l.sinopse)}</p><br>${tag(l.disp>0?['ok',`${l.disp} de ${l.total} exemplares disponíveis`]:['late','Nenhum exemplar disponível'])}<br><br>
      ${l.disp>0 ? `<button class="btn" data-emp="${l.id}">Solicitar empréstimo</button>` : ''}
      <button class="btn ${l.disp>0?'sec':''}" data-res="${l.id}">Reservar</button>
      ${l.disp>0 ? `<div class="leitura"><h3>Ler na biblioteca</h3><p>Leia aqui mesmo, sem levar o livro. R$ 3,00 por hora.</p>
        <select id="horas" aria-label="Duração"><option value="1">1 hora · R$ 3,00</option><option value="2">2 horas · R$ 6,00</option></select>
        <button class="btn sec" data-ler="${l.id}">Reservar leitura</button></div>` : ''}`);
  },

  meus: () => {
    const emp = db.emprestimos.filter(e=>e.cliente===ME);
    const res = db.reservas.filter(r=>r.cliente===ME);
    return layoutCliente('meus', `<h1>Reservas e empréstimos</h1>
      <h2>Meus empréstimos</h2>
      ${emp.length?`<div class="rolagem"><table class="tabela"><tr><th>Livro</th><th>Devolução</th><th>Status</th></tr>
      ${emp.map(e=>`<tr><td>${esc(livro(e.livroId).titulo)}</td><td>${fmt(e.prevista)}</td><td>${tag(statusEmp(e))}</td></tr>`).join('')}</table></div>`
      :'<p class="vazio">Você ainda não tem empréstimos. Escolha um livro no catálogo.</p>'}
      <h2>Minhas reservas</h2>
      ${res.length?`<table class="tabela"><tr><th>Livro</th><th>Data</th><th>Status</th></tr>
      ${res.map(r=>`<tr><td>${esc(livro(r.livroId).titulo)}</td><td>${fmt(r.data)}</td><td>${tag([classeReserva(r.status),r.status])}</td></tr>`).join('')}</table>`
      :'<p class="vazio">Nenhuma reserva ativa.</p>'}
      <h2>Leituras na biblioteca</h2>${listaLeituras(db.leituras.filter(x => x.cliente === ME))}`);
  },

  pagamentos: () => {
    const meus = db.pagamentos.filter(p=>p.cliente===ME);
    const pend = meus.filter(p=>!p.pago), hist = meus.filter(p=>p.pago);
    return layoutCliente('pagamentos', `<h1>Pagamentos</h1><br>
      <div class="total"><span>Total em aberto</span><b>${real(pend.reduce((s,p)=>s+p.valor,0))}</b></div>
      <h2>Taxas pendentes</h2>
      ${pend.length?`<ul class="lista">${pend.map(p=>`<li><span>${esc(p.motivo)}<br><small>${real(p.valor)}</small></span>
        <span class="acoes"><button class="btn mini" data-pagar="${p.id}" data-forma="Pix">Pix</button><button class="btn mini sec" data-pagar="${p.id}" data-forma="Cartão">Cartão</button></span></li>`).join('')}</ul>`
      :'<p class="vazio">Você não tem taxas pendentes.</p>'}
      <h2>Histórico</h2><ul class="lista">${hist.map(p=>`<li><span>${esc(p.motivo)}<br><small>${fmt(p.data)}</small></span>${tag(['ok',real(p.valor)])}</li>`).join('')}</ul>`);
  },

  admin: () => {
    const total = db.livros.reduce((s,l)=>s+l.total,0), emp = db.emprestimos.filter(e=>!e.devolvido);
    const atras = emp.filter(e=>diasAte(e.prevista)<0).length;
    const cont = db.livros.reduce((m,l)=>(m[l.genero]=(m[l.genero]||0)+l.total-l.disp,m),{});
    const max = Math.max(1,...Object.values(cont));
    return layoutAdmin('admin', `<h1>Painel</h1><br>
      <div class="kpis">
        <div class="kpi"><b>${total}</b>Total de livros</div><div class="kpi"><b>${emp.length}</b>Emprestados</div>
        <div class="kpi"><b>${db.reservas.filter(r=>r.status!=='Cancelada').length}</b>Reservas ativas</div><div class="kpi atraso"><b>${atras}</b>Empréstimos atrasados</div>
      </div>
      <h2>Empréstimos por gênero</h2>
      <div class="barras">${Object.entries(cont).map(([g,v])=>`<div style="height:${Math.max(6,v/max*100)}%" title="${g}: ${v}"><span>${g.slice(0,4)}</span></div>`).join('')}</div><br><br>
      <h2>Atividade recente</h2><ul class="lista">${emp.slice(0,3).map(e=>`<li><span>${esc(e.cliente)}<br><small>${esc(livro(e.livroId).titulo)}</small></span>${tag(statusEmp(e))}</li>`).join('')}</ul>`);
  },

  'admin/livros': () => layoutAdmin('admin/livros', `<h1>Livros</h1><br>
    <a class="btn" href="#/admin/livro-novo">Novo livro</a><br>
    <input class="busca" id="busca-a" type="search" placeholder="Buscar por título, autor ou ISBN" aria-label="Buscar">
    <div class="rolagem"><table class="tabela"><thead><tr><th>Livro</th><th>Estoque</th><th>Ações</th></tr></thead><tbody id="tb-livros"></tbody></table></div>`),

  'admin/livro-novo': () => layoutAdmin('admin/livros', `<button class="voltar" onclick="history.back()">‹ Voltar</button><h1>Novo livro</h1><br>
    <form id="f-livro" novalidate>
      ${[['titulo','Título'],['autor','Autor'],['isbn','ISBN']].map(([n,l])=>`<label class="campo"><span>${l}</span><input name="${n}"></label>`).join('')}
      <label class="campo"><span>Gênero</span><select name="genero">${['Romance','Ficção','Terror','Acadêmico','História'].map(g=>`<option>${g}</option>`).join('')}</select></label>
      <label class="campo"><span>Quantidade</span><input name="qtd" type="number" min="1" value="1"></label>
      <label class="campo"><span>Sinopse</span><textarea name="sinopse" rows="3"></textarea></label>
      <label class="campo"><span>Capa</span><input type="file" name="capaArq" accept="image/*"></label>
      <div class="erro" id="erro"></div><button class="btn">Salvar livro</button></form>`),

  'admin/emprestimos': () => layoutAdmin('admin/emprestimos', `<h1>Reservas e empréstimos</h1>
    <h2>Registrar empréstimo</h2>${formEmprestimo()}
    <h2>Empréstimos</h2><div class="rolagem"><table class="tabela"><tr><th>Cliente</th><th>Livro</th><th>Devolução</th><th>Status</th></tr>
    ${db.emprestimos.map(e=>`<tr><td>${esc(e.cliente)}</td><td>${esc(livro(e.livroId).titulo)}</td><td>${fmt(e.prevista)}</td>
      <td>${tag(statusEmp(e))}${e.devolvido?'':`<br><button class="btn mini sec" data-dev="${e.id}">Registrar devolução</button>`}${atrasado(e)?`<button class="btn mini" data-aviso="${e.id}">Enviar aviso</button>`:''}</td></tr>`).join('')}</table></div>
    <h2>Reservas</h2><ul class="lista">${db.reservas.map(r=>`<li><span>${esc(livro(r.livroId).titulo)}<br><small>${esc(r.cliente)} · ${fmt(r.data)}</small></span>
      <span class="acoes">${tag([classeReserva(r.status),r.status])}${r.status==='Disponível'?`<button class="btn mini" data-conv="${r.id}">Emprestar</button>`:''}</span></li>`).join('')}</ul>
    <h2>Leituras na biblioteca</h2>${listaLeituras(db.leituras)}`),

  avisos: () => {
    const lista = avisosDoCliente(ME);
    return layoutCliente('', `<h1>Avisos</h1><br>${lista.length
      ? `<ul class="lista">${lista.map(a => `<li class="aviso ${a.tipo}"><span>${esc(a.texto)}</span></li>`).join('')}</ul>`
      : '<p class="vazio">Nenhum aviso por enquanto. Quando um prazo estiver perto, ele aparece aqui.</p>'}`);
  },

  'admin/clientes': () => layoutAdmin('admin/clientes', `<h1>Clientes</h1><br>
    <input class="busca" id="busca-c" type="search" placeholder="Buscar por nome ou e-mail" aria-label="Buscar clientes">
    <ul class="lista" id="lista-c"></ul>`),

  'admin/cliente': id => {
    const c = db.clientes.find(x => x.id == id); if(!c) return telas['admin/clientes']();
    const h = db.emprestimos.filter(e => e.cliente === c.nome);
    return layoutAdmin('admin/clientes', `<button class="voltar" onclick="history.back()">‹ Voltar</button><h1>${esc(c.nome)}</h1>
      <p style="color:var(--muda)">${esc(c.email)}</p><a class="btn sec mini" href="tel:${esc(c.telefone)}" style="margin-top:10px">Ligar: ${esc(c.telefone)}</a>
      <h2>Histórico de empréstimos</h2>${h.length
        ? `<div class="rolagem"><table class="tabela"><tr><th>Livro</th><th>Devolução</th><th>Status</th></tr>
           ${h.map(e => `<tr><td>${esc(livro(e.livroId).titulo)}</td><td>${fmt(e.prevista)}</td><td>${tag(statusEmp(e))}</td></tr>`).join('')}</table></div>`
        : '<p class="vazio">Este cliente ainda não pegou livros.</p>'}`);
  },

  'admin/pagamentos': () => {
    const rec = db.pagamentos.filter(p=>p.pago).reduce((s,p)=>s+p.valor,0), pen = db.pagamentos.filter(p=>!p.pago).reduce((s,p)=>s+p.valor,0);
    return layoutAdmin('admin/pagamentos', `<h1>Pagamentos</h1><br>
      <div class="kpis"><div class="kpi"><b>${real(rec)}</b>Arrecadado</div><div class="kpi atraso"><b>${real(pen)}</b>Pendente</div></div>
      <h2>Cobranças</h2><ul class="lista">${db.pagamentos.map(p=>`<li><span>${esc(p.cliente)}<br><small>${esc(p.motivo)} · ${real(p.valor)}</small></span>
      ${p.pago?tag(['ok','Pago']):`<button class="btn mini" data-baixa="${p.id}">Registrar pagamento</button>`}</li>`).join('')}</ul>`);
  },
};


function rota(){
  const h = (location.hash.replace('#/','') || 'login');
  const m = h.match(/^(.*)\/(\d+)$/);
  const [nome, arg] = m ? [m[1], m[2]] : [h];
  const publica = ['login','cadastro','recuperar'].includes(nome);
  if(!publica && !sessao) return location.hash = '#/login';
  if(nome.startsWith('admin') && sessao?.papel !== 'admin') return location.hash = '#/inicio';
  if(publica && sessao) return location.hash = sessao.papel==='admin' ? '#/admin' : '#/inicio';
  document.getElementById('app').innerHTML = (telas[nome] || telas.login)(arg);
  window.scrollTo(0,0); ligar(nome);
}
window.addEventListener('hashchange', rota);

/* Botões "Enviar aviso" (administrador) */
function ligarAvisos(){
  document.querySelectorAll('[data-aviso]').forEach(b => b.onclick = () => {
    const e = db.emprestimos.find(x => x.id == b.dataset.aviso);
    const texto = `Seu empréstimo de "${livro(e.livroId).titulo}" está atrasado desde ${fmt(e.prevista)}. Devolva o quanto antes.`;
    if(!db.avisos.some(a => a.texto === texto)) db.avisos.push({cliente:e.cliente, tipo:'late', texto});
    toast('Aviso enviado para ' + e.cliente + '.');
  });
}


function ligar(nome){
  const $ = s => document.querySelector(s);
  ligarCapas(); ligarAvisos();
  const erro = m => { $('#erro').textContent = m; };

  $('[data-sair]')?.addEventListener('click', () => { sessao=null; sessionStorage.removeItem('sessao'); location.hash='#/login'; });
  document.querySelectorAll('[data-livro]').forEach(b => b.onclick = () => location.hash = '#/livro/'+b.dataset.livro);

  $('#f-login')?.addEventListener('submit', e => {
    e.preventDefault(); const f = new FormData(e.target), id = f.get('id').trim();
    if(!id || !f.get('senha')) return erro('Informe e-mail (ou telefone) e senha.');
    sessao = id.toLowerCase().includes('admin') ? {papel:'admin',nome:'Administrador'} : {papel:'cliente',nome:'Diego'};
    sessionStorage.setItem('sessao', JSON.stringify(sessao)); rota();
  });

  $('#f-cad')?.addEventListener('submit', e => {
    e.preventDefault(); const f = Object.fromEntries(new FormData(e.target));
    if(Object.values(f).some(v=>!v.trim())) return erro('Preencha todos os campos.');
    if(f.cpf.replace(/\D/g,'').length !== 11) return erro('O CPF precisa ter 11 números.');
    if(!/^\S+@\S+\.\S+$/.test(f.email)) return erro('Digite um e-mail válido.');
    if(f.senha !== f.conf) return erro('As senhas não coincidem.');
    toast('Conta criada. Entre para continuar.'); location.hash = '#/login';
  });

  $('#f-rec')?.addEventListener('submit', e => { e.preventDefault(); toast('Código enviado.'); location.hash = '#/login'; });

  if(nome === 'catalogo'){
    let g = 'Todos';
    const desenhar = () => {
      const q = $('#busca').value.toLowerCase();
      const r = db.livros.filter(l => (g==='Todos'||l.genero===g) && (l.titulo+l.autor).toLowerCase().includes(q));
      $('#lista').innerHTML = r.length ? r.map(card).join('') : '<p class="vazio" style="grid-column:1/-1">Nenhum livro encontrado. Tente outro gênero ou termo.</p>';
      document.querySelectorAll('[data-livro]').forEach(b => b.onclick = () => location.hash = '#/livro/'+b.dataset.livro);
      ligarCapas();
    };
    $('#busca').oninput = desenhar;
    $('#chips').onclick = e => { if(!e.target.dataset.g) return; g = e.target.dataset.g;
      document.querySelectorAll('.chip').forEach(c=>c.classList.toggle('on', c===e.target)); desenhar(); };
    desenhar();
  }

  $('[data-emp]')?.addEventListener('click', e => {
    const l = livro(e.target.dataset.emp);
    if(temMulta(ME)) return toast('Quite as multas pendentes antes de pedir um empréstimo.');
    l.disp--; db.emprestimos.push({id:Date.now(),cliente:ME,livroId:l.id,retirada:hoje,prevista:dia(14),devolvido:false});
    toast('Empréstimo registrado. Devolva até '+fmt(dia(14))+'.'); location.hash = '#/meus';
  });
  $('[data-res]')?.addEventListener('click', e => {
    db.reservas.push({id:Date.now(),cliente:ME,livroId:+e.target.dataset.res,data:hoje,status:'Em espera'});
    toast('Reserva feita. Avisaremos quando o livro estiver disponível.'); location.hash = '#/meus';
  });
  document.querySelectorAll('[data-pagar]').forEach(b => b.onclick = () => {
    db.pagamentos.find(p=>p.id==b.dataset.pagar).pago = true; toast('Pagamento por '+b.dataset.forma+' confirmado.'); rota();
  });

  $('[data-ler]')?.addEventListener('click', e => {
    const l = livro(e.target.dataset.ler), h = +$('#horas').value, ate = new Date(Date.now() + h * 3600e3);
    db.leituras.push({id:Date.now(), cliente:ME, livroId:l.id, ate});
    db.pagamentos.push({id:Date.now()+1, cliente:ME, motivo:`Leitura local: ${l.titulo} (${h} h)`, valor:3*h, data:hoje, pago:false});
    toast('Leitura reservada até ' + hora(ate) + '. A taxa aparece em Pagamentos.'); location.hash = '#/meus';
  });

  /* admin */
  if(nome === 'admin/clientes'){
    const desenhar = () => {
      const q = $('#busca-c').value.toLowerCase();
      const r = db.clientes.filter(c => (c.nome+c.email).toLowerCase().includes(q));
      $('#lista-c').innerHTML = r.length ? r.map(linhaCliente).join('') : '<p class="vazio">Nenhum cliente encontrado.</p>';
      ligarAvisos();
    };
    $('#busca-c').oninput = desenhar; desenhar();
  }
  $('#f-emp')?.addEventListener('submit', e => {
    e.preventDefault(); const f = Object.fromEntries(new FormData(e.target)), l = livro(f.livroId);
    if(!l) return toast('Não há livros disponíveis para emprestar.');
    if(temMulta(f.cliente)) return toast(f.cliente + ' tem multa pendente e não pode pegar livros.');
    l.disp--; db.emprestimos.push({id:Date.now(), cliente:f.cliente, livroId:l.id, retirada:hoje, prevista:dia(14), devolvido:false});
    toast('Empréstimo registrado para ' + f.cliente + '.'); rota();
  });
  if(nome === 'admin/livros'){
    const desenhar = () => {
      const q = $('#busca-a').value.toLowerCase();
      $('#tb-livros').innerHTML = db.livros.filter(l=>(l.titulo+l.autor+l.isbn).toLowerCase().includes(q)).map(l =>
        `<tr><td>${esc(l.titulo)}<br><small>${esc(l.autor)}</small></td><td>${l.disp}/${l.total}</td>
        <td class="acoes"><button class="btn mini sec" data-edit="${l.id}">Editar</button><button class="btn mini perigo" data-del="${l.id}">Excluir</button></td></tr>`).join('');
      document.querySelectorAll('[data-del]').forEach(b => b.onclick = () => {
        const l = livro(b.dataset.del);
        if(db.emprestimos.some(e=>e.livroId===l.id) || db.reservas.some(r=>r.livroId===l.id)) return toast('Este livro tem histórico de empréstimos ou reservas e não pode ser excluído.');
        if(confirm('Excluir "'+l.titulo+'"?')){ db.livros = db.livros.filter(x=>x!==l); desenhar(); toast('Livro excluído.'); }
      });
      document.querySelectorAll('[data-edit]').forEach(b => b.onclick = () => {
        const l = livro(b.dataset.edit), t = prompt('Quantidade total de exemplares:', l.total);
        if(t && +t >= l.total - l.disp){ l.disp += +t - l.total; l.total = +t; desenhar(); toast('Estoque atualizado.'); }
      });
    };
    $('#busca-a').oninput = desenhar; desenhar();
  }
  let capaNova = '';
  $('#f-livro [name=capaArq]')?.addEventListener('change', e => {
    const arq = e.target.files[0]; if(!arq) return;
    const r = new FileReader(); r.onload = () => capaNova = r.result; r.readAsDataURL(arq);
  });
  $('#f-livro')?.addEventListener('submit', e => {
    e.preventDefault(); const f = Object.fromEntries(new FormData(e.target));
    if(!f.titulo.trim() || !f.autor.trim() || !f.isbn.trim()) return erro('Preencha título, autor e ISBN.');
    db.livros.push({id:Date.now(),capa:capaNova || 'img/capas/'+slug(f.titulo)+'.jpg',titulo:f.titulo,autor:f.autor,isbn:f.isbn,genero:f.genero,total:+f.qtd,disp:+f.qtd,sinopse:f.sinopse,pop:false});
    toast('Livro salvo.'); location.hash = '#/admin/livros';
  });
  document.querySelectorAll('[data-dev]').forEach(b => b.onclick = () => {
    const e = db.emprestimos.find(x=>x.id==b.dataset.dev), atraso = Math.max(0,-diasAte(e.prevista));
    e.devolvido = true; livro(e.livroId).disp++;
    if(atraso) db.pagamentos.push({id:Date.now(),cliente:e.cliente,motivo:'Multa: '+livro(e.livroId).titulo,valor:atraso*2,data:hoje,pago:false});
    toast(atraso ? `Devolvido com ${atraso} dia(s) de atraso. Multa de ${real(atraso*2)}.` : 'Devolução registrada.'); rota();
  });
  document.querySelectorAll('[data-conv]').forEach(b => b.onclick = () => {
    const r = db.reservas.find(x=>x.id==b.dataset.conv), l = livro(r.livroId);
    if(l.disp<1) return toast('Sem exemplar disponível.');
    l.disp--; db.emprestimos.push({id:Date.now(),cliente:r.cliente,livroId:l.id,retirada:hoje,prevista:dia(14),devolvido:false});
    db.reservas = db.reservas.filter(x=>x!==r); toast('Reserva convertida em empréstimo.'); rota();
  });
  document.querySelectorAll('[data-baixa]').forEach(b => b.onclick = () => {
    db.pagamentos.find(p=>p.id==b.dataset.baixa).pago = true; toast('Pagamento registrado.'); rota();
  });
}
rota();
