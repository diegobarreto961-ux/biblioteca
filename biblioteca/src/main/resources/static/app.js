const hoje = new Date(); hoje.setHours(0,0,0,0);
const dia = n => { const d = new Date(hoje); d.setDate(d.getDate()+n); return d; };
const isoData = d => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};
const parseData = s => {
  if (!s) return null;
  if (s instanceof Date) return s;
  const [y, m, d] = String(s).split('T')[0].split('-').map(Number);
  return new Date(y, m - 1, d);
};
const fmt = d => {
  const dt = parseData(d);
  return dt ? dt.toLocaleDateString('pt-BR') : '-';
};
const real = v => Number(v || 0).toLocaleString('pt-BR',{style:'currency',currency:'BRL'});
const cores = ['#6b3f2a','#3d5a80','#7a2e3a','#4f6b3a','#5b4b8a','#8a5a1f','#2f6f6a','#7a4a6b'];

const db = {
  livros: [],
  emprestimos: [],
  clientes: [],
  reservas: [],
  pagamentos: [],
  avisos: [],
  dashboard: null
};

const slug = t => String(t || '').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
const SINOPSES_PADRAO = {
  '978-85-359-0277-5': 'Bentinho revive a juventude e a dúvida sobre Capitu.',
  '978-85-7657-407-1': 'Disputa pelo planeta deserto Arrakis e pela especiaria.',
  '978-85-560-8004-3': 'Um grupo de amigos enfrenta uma entidade que volta a cada geração.',
  '978-85-254-3293-0': 'Uma breve história da humanidade, da pré-história à atualidade.',
  '978-85-970-2000-2': 'Guia para elaborar trabalhos e pesquisas acadêmicas.',
  '978-85-254-2000-1': 'Elizabeth Bennet e o enigmático Sr. Darcy.'
};
const normalizarLivro = l => ({
  id: l.id,
  isbn: l.isbn,
  titulo: l.titulo,
  autor: l.autor,
  genero: l.genero,
  total: l.quantidadeTotal ?? l.total ?? 0,
  disp: l.quantidadeDisponivel ?? l.disp ?? 0,
  sinopse: l.sinopse || SINOPSES_PADRAO[l.isbn] || `Exemplar catalogado sob ISBN ${l.isbn}.`,
  pop: (l.quantidadeDisponivel ?? 0) > 0,
  capa: 'img/capas/' + slug(l.titulo) + '.jpg'
});

const normalizarEmprestimo = e => ({
  id: e.id,
  idCliente: e.idCliente,
  cliente: e.nomeCliente,
  livroId: e.idLivro,
  tituloLivro: e.tituloLivro,
  status: e.status,
  retirada: parseData(e.dataRetirada),
  prevista: parseData(e.dataDevolucaoPrevista),
  devolvido: e.status === 'DEVOLVIDO' || Boolean(e.dataDevolucaoReal),
  dataDevolucaoReal: parseData(e.dataDevolucaoReal)
});

const labelStatusReserva = s => s === 'CONFIRMADA' ? 'Disponível / Leitura' : s === 'CANCELADA' ? 'Cancelada' : 'Em espera';
const normalizarReserva = r => ({
  id: r.id,
  idCliente: r.idCliente,
  cliente: r.nomeCliente,
  livroId: r.idLivro,
  tituloLivro: r.tituloLivro,
  data: parseData(r.dataReserva),
  statusRaw: r.status,
  status: labelStatusReserva(r.status),
  posicaoFila: r.posicaoFila
});

let sessao = JSON.parse(sessionStorage.getItem('sessao') || 'null');
let pagosIds = JSON.parse(localStorage.getItem('multas_pagas') || '[]');
let leiturasExtras = JSON.parse(localStorage.getItem('leituras_extras') || '{}');
const salvarPagos = () => localStorage.setItem('multas_pagas', JSON.stringify(pagosIds));
const salvarLeiturasExtras = () => localStorage.setItem('leituras_extras', JSON.stringify(leiturasExtras));
const nomeLogado = () => sessao?.nome || 'Cliente';

async function api(url, opts = {}) {
  const headers = { 'Content-Type': 'application/json', ...(opts.headers || {}) };
  if (sessao?.token) {
    headers['Authorization'] = `Bearer ${sessao.token}`;
  }
  const resp = await fetch(url, { ...opts, headers });
  const texto = await resp.text();
  let dados = null;
  try { dados = texto ? JSON.parse(texto) : null; } catch { dados = { mensagem: texto }; }

  if (!resp.ok) {
    if (resp.status === 401 && sessao) {
      sessao = null;
      sessionStorage.removeItem('sessao');
      location.hash = '#/login';
    }
    const msg = dados?.mensagem || dados?.message || dados?.erro || 'Erro ao processar requisição.';
    throw new Error(msg);
  }
  return dados;
}

const livro = id => db.livros.find(l => l.id == id);
const diasAte = d => {
  const dt = parseData(d);
  return dt ? Math.round((dt - hoje) / 864e5) : 0;
};
const ativosPorClienteId = id => db.emprestimos.filter(e => e.idCliente == id && !e.devolvido);
const atrasado = e => !e.devolvido && diasAte(e.prevista) < 0;

function reconstruirPagamentosReais() {
  const cobrancas = [];
  db.emprestimos.forEach(e => {
    const ref = e.devolvido && e.dataDevolucaoReal ? e.dataDevolucaoReal : hoje;
    const diasAtraso = Math.max(0, Math.round((ref - e.prevista) / 864e5));
    if (diasAtraso > 0) {
      const chave = `emp-${e.id}`;
      cobrancas.push({
        id: chave,
        idCliente: e.idCliente,
        cliente: e.cliente,
        motivo: `Multa (${diasAtraso} dia(s) de atraso): ${e.tituloLivro}`,
        valor: diasAtraso * 2,
        data: e.prevista,
        pago: pagosIds.includes(chave)
      });
    }
  });
  db.reservas.forEach(r => {
    const extra = leiturasExtras[r.id];
    if (extra) {
      const chave = `res-${r.id}`;
      cobrancas.push({
        id: chave,
        idCliente: r.idCliente,
        cliente: r.cliente,
        motivo: `Leitura local: ${r.tituloLivro} (${extra.horas} h)`,
        valor: extra.valor,
        data: r.data,
        pago: pagosIds.includes(chave)
      });
    }
  });
  db.pagamentos = cobrancas;
}

const temMultaCliente = (idCliente, nomeCliente) =>
  db.pagamentos.some(p => !p.pago && (p.idCliente == idCliente || p.cliente === nomeCliente));

function avisosDoCliente(){
  const lista = [];
  db.emprestimos.filter(e => !e.devolvido).forEach(e => {
    const d = diasAte(e.prevista), t = e.tituloLivro || livro(e.livroId)?.titulo || 'Livro';
    if(d < 0) lista.push({tipo:'late', texto:`"${t}" está atrasado há ${-d} dia(s).`});
    else if(d <= 2) lista.push({tipo:'warn', texto:`"${t}" vence ${d===0 ? 'hoje' : 'em '+d+' dia(s)'}.`});
  });
  db.reservas.filter(r => r.statusRaw === 'CONFIRMADA')
    .forEach(r => lista.push({tipo:'ok', texto:`Sua solicitação de "${r.tituloLivro}" está confirmada na biblioteca.`}));
  return lista.concat(db.avisos.filter(a => a.cliente === nomeLogado()));
}
function statusEmp(e){
  if(e.devolvido) return ['neutro','Devolvido'];
  const n = diasAte(e.prevista);
  return n < 0 ? ['late','Atrasado'] : n <= 2 ? ['warn','Próximo do vencimento'] : ['ok','Em dia'];
}
const classeReserva = r => r.statusRaw === 'CONFIRMADA' ? 'ok' : r.statusRaw === 'CANCELADA' ? 'late' : 'warn';
const tag = ([c,t]) => `<span class="tag ${c}">${t}</span>`;
const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));

function toast(msg){
  const t = document.getElementById('toast'); t.textContent = msg; t.classList.add('show');
  clearTimeout(toast.t); toast.t = setTimeout(()=>t.classList.remove('show'), 2600);
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
  const n = avisosDoCliente().length;
  return `<header class="topo"><a class="marca" href="#/inicio"><img class="mini-logo" src="img/logo-icone.png" alt="" onerror="this.style.display='none'"><span>Biblioteca<br><b>Página Aberta</b></span></a><span class="dir"><a class="sino" href="#/avisos" aria-label="Avisos">${SINO}${n ? `<span class="badge">${n}</span>` : ''}</a><button data-sair>Sair</button></span></header>
  <main class="pagina">${corpo}</main>
  <nav class="nav">${abas.map(([r,n])=>`<a href="#/${r}" class="${ativo===r?'on':''}">${ICONES[r]}<span>${n}</span></a>`).join('')}</nav>`;
}
function layoutAdmin(ativo, corpo){
  const abas = [['admin','Painel'],['admin/livros','Livros'],['admin/emprestimos','Empréstimos'],['admin/clientes','Clientes'],['admin/pagamentos','Pagamentos']];
  return `<header class="topo admin"><a class="marca" href="#/admin"><img class="mini-logo" src="img/logo-icone.png" alt="" onerror="this.style.display='none'"><span>Biblioteca<br><b>Página Aberta</b></span></a><span class="dir"><span class="selo">Admin</span><button data-sair>Sair</button></span></header>
  <main class="pagina">${corpo}</main>
  <nav class="nav admin">${abas.map(([r,n])=>`<a href="#/${r}" class="${ativo===r?'on':''}">${ICONES[r]}<span>${n}</span></a>`).join('')}</nav>`;
}
const capa = (l, g='') => `<div class="capa img ${g}" data-cor="${cores[(l.id || 0) % cores.length]}" data-t="${esc(l.titulo)}"><img src="${l.capa}" alt="Capa de ${esc(l.titulo)}" loading="lazy"></div>`;

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
  const at = ativosPorClienteId(c.id), atr = at.find(atrasado);
  const contato = [c.telefone, c.email].filter(Boolean).join(' · ') || 'Sem contato';
  return `<li><span><b>${esc(c.nome)}</b><br><small>${esc(contato)}</small><br>
    ${tag(['neutro', at.length+' emprestado(s)'])} ${atr ? tag(['late','Atrasado']) : ''}</span>
    <span class="acoes"><a class="btn mini sec" href="#/admin/cliente/${c.id}">Histórico</a>${atr ? `<button class="btn mini" data-aviso="${atr.id}">Enviar aviso</button>` : ''}</span></li>`;
};

const formEmprestimo = () => {
  const optsClientes = db.clientes.length
    ? db.clientes.map(c => `<option value="${c.id}">${esc(c.nome)}${c.email ? ' ('+esc(c.email)+')' : ''}</option>`).join('')
    : '<option value="">Nenhum cliente cadastrado</option>';
  const disponiveis = db.livros.filter(l => l.disp > 0);
  const optsLivros = disponiveis.length
    ? disponiveis.map(l => `<option value="${l.id}">${esc(l.titulo)} (${l.disp} disp.)</option>`).join('')
    : '<option value="">Nenhum livro disponível</option>';
  const padraoDev = isoData(dia(14));
  return `<form id="f-emp" class="form-linha">
    <select name="idCliente" aria-label="Cliente" required>${optsClientes}</select>
    <select name="idLivro" aria-label="Livro" required>${optsLivros}</select>
    <input type="date" name="dataDevolucaoPrevista" value="${padraoDev}" min="${isoData(dia(1))}" aria-label="Devolução prevista" required>
    <button class="btn" type="submit">Registrar empréstimo</button>
  </form>`;
};

const telas = {
  login: () => `<div class="auth">${LOGO}<h1>Entrar</h1><p class="sub">Acesse sua conta da biblioteca</p>
    <form id="f-login" novalidate>
      <label class="campo"><span>E-mail ou telefone</span><input name="id" autocomplete="username" required></label>
      <label class="campo"><span>Senha</span><input name="senha" type="password" autocomplete="current-password" required></label>
      <div class="erro" id="erro"></div>
      <button class="btn" type="submit">Entrar</button>
    </form>
    <a class="link" href="#/recuperar">Esqueci minha senha</a><br>
    <a class="link" href="#/cadastro">Criar conta</a></div>`,

  cadastro: () => `<div class="auth">${LOGO}<h1>Criar conta</h1><p class="sub">Preencha seus dados para usar a biblioteca</p>
    <form id="f-cad" novalidate>
      ${[['nome','Nome completo','text'],['email','E-mail','email'],['tel','Telefone','tel'],['senha','Senha (mínimo 8 caracteres)','password'],['conf','Confirmar senha','password']]
        .map(([n,l,t])=>`<label class="campo"><span>${l}</span><input name="${n}" type="${t}"></label>`).join('')}
      <div class="erro" id="erro"></div>
      <button class="btn" type="submit">Criar conta</button>
    </form><a class="link" href="#/login">Já tenho conta</a></div>`,

  recuperar: () => `<div class="auth">${LOGO}<h1>Recuperar senha</h1><p class="sub">Enviaremos um código para você</p>
    <form id="f-rec"><label class="campo"><span>E-mail ou telefone</span><input name="id" required></label>
    <button class="btn">Enviar código</button></form><a class="link" href="#/login">Voltar ao login</a></div>`,

  inicio: () => {
    const eu = nomeLogado();
    const prox = db.emprestimos.filter(e=>!e.devolvido).sort((a,b)=>a.prevista-b.prevista)[0];
    const cartao = prox
      ? `<div class="hero-card"><small>Próxima devolução</small><b>${fmt(prox.prevista)}</b><span>${esc(prox.tituloLivro)}</span>${tag(statusEmp(prox))}</div>`
      : '<div class="hero-card"><span>Você não tem devoluções pendentes.</span></div>';
    return layoutCliente('inicio', `<section class="hero"><p>Bem-vindo de volta</p><h1>Olá, ${esc(eu)}!</h1>${cartao}</section>
      <h2>Livros em destaque</h2><div class="carrossel">${db.livros.length ? db.livros.filter(l=>l.pop).map(card).join('') : '<p class="vazio">Nenhum livro cadastrado no momento.</p>'}</div>
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
      ${l.disp>0 ? `<button class="btn" data-emp="${l.id}">Solicitar empréstimo</button> ` : ''}
      <button class="btn ${l.disp>0?'sec':''}" data-res="${l.id}">Reservar</button>
      ${l.disp>0 ? `<div class="leitura"><h3>Ler na biblioteca</h3><p>Leia aqui mesmo, sem levar o livro. R$ 3,00 por hora.</p>
        <select id="horas" aria-label="Duração"><option value="1">1 hora · R$ 3,00</option><option value="2">2 horas · R$ 6,00</option></select>
        <button class="btn sec" data-ler="${l.id}">Reservar leitura</button></div>` : ''}`);
  },

  meus: () => {
    const emp = db.emprestimos;
    const res = db.reservas;
    return layoutCliente('meus', `<h1>Reservas e empréstimos</h1>
      <h2>Meus empréstimos</h2>
      ${emp.length?`<div class="rolagem"><table class="tabela"><tr><th>Livro</th><th>Devolução</th><th>Status</th></tr>
      ${emp.map(e=>`<tr><td>${esc(e.tituloLivro)}</td><td>${fmt(e.prevista)}</td><td>${tag(statusEmp(e))}</td></tr>`).join('')}</table></div>`
      :'<p class="vazio">Você ainda não tem empréstimos. Escolha um livro no catálogo.</p>'}
      <h2>Minhas reservas e leituras</h2>
      ${res.length?`<div class="rolagem"><table class="tabela"><tr><th>Livro</th><th>Data</th><th>Tipo / Fila</th><th>Status</th></tr>
      ${res.map(r=>`<tr><td>${esc(r.tituloLivro)}</td><td>${fmt(r.data)}</td><td>${leiturasExtras[r.id] ? `Leitura (${leiturasExtras[r.id].horas}h)` : `Fila #${r.posicaoFila}`}</td><td>${tag([classeReserva(r),r.status])}</td></tr>`).join('')}</table></div>`
      :'<p class="vazio">Nenhuma reserva ativa.</p>'}`);
  },

  pagamentos: () => {
    const meus = db.pagamentos;
    const pend = meus.filter(p=>!p.pago), hist = meus.filter(p=>p.pago);
    return layoutCliente('pagamentos', `<h1>Pagamentos</h1><br>
      <div class="total"><span>Total em aberto</span><b>${real(pend.reduce((s,p)=>s+p.valor,0))}</b></div>
      <h2>Taxas pendentes</h2>
      ${pend.length?`<ul class="lista">${pend.map(p=>`<li><span>${esc(p.motivo)}<br><small>${real(p.valor)}</small></span>
        <span class="acoes"><button class="btn mini" data-pagar="${p.id}" data-forma="Pix">Pix</button><button class="btn mini sec" data-pagar="${p.id}" data-forma="Cartão">Cartão</button></span></li>`).join('')}</ul>`
      :'<p class="vazio">Você não tem taxas pendentes.</p>'}
      <h2>Histórico</h2>${hist.length
        ? `<ul class="lista">${hist.map(p=>`<li><span>${esc(p.motivo)}<br><small>${fmt(p.data)}</small></span>${tag(['ok',real(p.valor)])}</li>`).join('')}</ul>`
        : '<p class="vazio">Nenhum pagamento realizado.</p>'}`);
  },

  admin: () => {
    const d = db.dashboard;
    const total = d ? d.totalExemplares : db.livros.reduce((s,l)=>s+l.total,0);
    const empAtivos = d ? d.emprestimosAtivos : db.emprestimos.filter(e=>!e.devolvido).length;
    const resAtivas = d ? d.reservasAtivas : db.reservas.filter(r=>r.statusRaw !== 'CANCELADA').length;
    const atras = d ? d.emprestimosAtrasados : db.emprestimos.filter(atrasado).length;

    const generos = d?.emprestimosPorGenero?.length
      ? d.emprestimosPorGenero
      : Object.entries(db.livros.reduce((m,l)=>(m[l.genero]=(m[l.genero]||0)+l.total-l.disp,m),{})).map(([genero,quantidade])=>({genero,quantidade}));
    const max = Math.max(1, ...generos.map(g => g.quantidade));
    const recentes = db.emprestimos.slice(0, 5);

    return layoutAdmin('admin', `<h1>Painel</h1><br>
      <div class="kpis">
        <div class="kpi"><b>${total}</b>Total de exemplares</div>
        <div class="kpi"><b>${empAtivos}</b>Emprestados</div>
        <div class="kpi"><b>${resAtivas}</b>Reservas ativas</div>
        <div class="kpi atraso"><b>${atras}</b>Empréstimos atrasados</div>
      </div>
      <h2>Empréstimos por gênero</h2>
      ${generos.length
        ? `<div class="barras">${generos.map(g=>`<div style="height:${Math.max(8,g.quantidade/max*100)}%" title="${esc(g.genero)}: ${g.quantidade}"><span>${esc(g.genero).slice(0,5)}</span></div>`).join('')}</div><br><br>`
        : '<p class="vazio">Ainda não há empréstimos registrados por gênero.</p>'}
      <h2>Atividade recente</h2>
      ${recentes.length
        ? `<ul class="lista">${recentes.map(e=>`<li><span><b>${esc(e.cliente)}</b><br><small>${esc(e.tituloLivro)} · Retirada: ${fmt(e.retirada)}</small></span>${tag(statusEmp(e))}</li>`).join('')}</ul>`
        : '<p class="vazio">Nenhuma movimentação registrada no banco.</p>'}`);
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
      <div class="erro" id="erro"></div><button class="btn" type="submit">Salvar livro</button></form>`),

  'admin/emprestimos': () => {
    const reservasAbertas = db.reservas.filter(r => r.statusRaw !== 'CANCELADA');
    return layoutAdmin('admin/emprestimos', `<h1>Empréstimos e Reservas</h1>
      <h2>Registrar empréstimo</h2>${formEmprestimo()}
      <h2>Empréstimos registrados</h2>
      ${db.emprestimos.length
        ? `<div class="rolagem"><table class="tabela"><tr><th>Cliente</th><th>Livro</th><th>Retirada</th><th>Devolução</th><th>Status</th></tr>
           ${db.emprestimos.map(e=>`<tr>
             <td><b>${esc(e.cliente)}</b></td>
             <td>${esc(e.tituloLivro)}</td>
             <td>${fmt(e.retirada)}</td>
             <td>${fmt(e.prevista)}</td>
             <td>${tag(statusEmp(e))}${e.devolvido?'':`<br><button class="btn mini sec" data-dev="${e.id}">Registrar devolução</button>`}${atrasado(e)?`<button class="btn mini" data-aviso="${e.id}">Enviar aviso</button>`:''}</td>
           </tr>`).join('')}</table></div>`
        : '<p class="vazio">Nenhum empréstimo registrado no banco ainda.</p>'}
      <h2>Reservas e leituras solicitadas pelos clientes</h2>
      ${reservasAbertas.length
        ? `<ul class="lista">${reservasAbertas.map(r=>`<li><span><b>${esc(r.cliente)}</b> — ${esc(r.tituloLivro)}<br>
             <small>${fmt(r.data)} · ${leiturasExtras[r.id] ? `Leitura na biblioteca (${leiturasExtras[r.id].horas}h · ${real(leiturasExtras[r.id].valor)})` : `Fila #${r.posicaoFila}`}</small></span>
             <span class="acoes">
               ${tag([classeReserva(r), r.status])}
               ${r.statusRaw === 'ATIVA' ? `<button class="btn mini sec" data-conf-res="${r.id}">Liberar</button>` : ''}
               <button class="btn mini" data-conv="${r.id}">Emprestar</button>
             </span></li>`).join('')}</ul>`
        : '<p class="vazio">Nenhuma reserva ou leitura solicitada no momento.</p>'}`);
  },

  avisos: () => {
    const lista = avisosDoCliente();
    return layoutCliente('', `<h1>Avisos</h1><br>${lista.length
      ? `<ul class="lista">${lista.map(a => `<li class="aviso ${a.tipo}"><span>${esc(a.texto)}</span></li>`).join('')}</ul>`
      : '<p class="vazio">Nenhum aviso por enquanto. Quando um prazo estiver perto, ele aparece aqui.</p>'}`);
  },

  'admin/clientes': () => layoutAdmin('admin/clientes', `<h1>Clientes</h1><br>
    <input class="busca" id="busca-c" type="search" placeholder="Buscar por nome ou e-mail" aria-label="Buscar clientes">
    <ul class="lista" id="lista-c"><li class="vazio">Carregando clientes do banco...</li></ul>`),

  'admin/cliente': id => {
    const c = db.clientes.find(x => x.id == id); if(!c) return telas['admin/clientes']();
    const h = db.emprestimos.filter(e => e.idCliente == c.id);
    return layoutAdmin('admin/clientes', `<button class="voltar" onclick="history.back()">‹ Voltar</button><h1>${esc(c.nome)}</h1>
      <p style="color:var(--muda)">${esc(c.email || 'Sem e-mail')}</p>
      ${c.telefone ? `<a class="btn sec mini" href="tel:${esc(c.telefone)}" style="margin-top:10px">Ligar: ${esc(c.telefone)}</a>` : ''}
      <h2>Histórico de empréstimos</h2>${h.length
        ? `<div class="rolagem"><table class="tabela"><tr><th>Livro</th><th>Devolução</th><th>Status</th></tr>
           ${h.map(e => `<tr><td>${esc(e.tituloLivro)}</td><td>${fmt(e.prevista)}</td><td>${tag(statusEmp(e))}</td></tr>`).join('')}</table></div>`
        : '<p class="vazio">Este cliente ainda não pegou livros.</p>'}`);
  },

  'admin/pagamentos': () => {
    const rec = db.pagamentos.filter(p=>p.pago).reduce((s,p)=>s+p.valor,0);
    const pen = db.pagamentos.filter(p=>!p.pago).reduce((s,p)=>s+p.valor,0);
    return layoutAdmin('admin/pagamentos', `<h1>Pagamentos e Multas</h1><br>
      <div class="kpis"><div class="kpi"><b>${real(rec)}</b>Arrecadado</div><div class="kpi atraso"><b>${real(pen)}</b>Pendente</div></div>
      <h2>Cobranças vinculadas aos clientes</h2>
      ${db.pagamentos.length
        ? `<ul class="lista">${db.pagamentos.map(p=>`<li><span><b>${esc(p.cliente)}</b><br><small>${esc(p.motivo)} · ${real(p.valor)}</small></span>
           ${p.pago?tag(['ok','Pago']):`<button class="btn mini" data-baixa="${esc(p.id)}">Registrar pagamento</button>`}</li>`).join('')}</ul>`
        : '<p class="vazio">Nenhuma multa ou cobrança pendente entre os clientes cadastrados.</p>'}`);
  },
};

async function sincronizarDados() {
  if (!sessao?.token) return;
  const ehAdmin = sessao?.perfil === 'ADMINISTRADOR' || sessao?.papel === 'admin';
  try {
    const livrosApi = await api('/api/livros');
    db.livros = (livrosApi || []).map(normalizarLivro);

    if (ehAdmin) {
      const [clientesApi, emprestimosApi, reservasApi, dashApi] = await Promise.all([
        api('/api/admin/clientes').catch(() => []),
        api('/api/admin/emprestimos').catch(() => []),
        api('/api/admin/reservas').catch(() => []),
        api('/api/admin/dashboard').catch(() => null)
      ]);
      db.clientes = clientesApi || [];
      db.emprestimos = (emprestimosApi || []).map(normalizarEmprestimo);
      db.reservas = (reservasApi || []).map(normalizarReserva);
      db.dashboard = dashApi;
      reconstruirPagamentosReais();
    } else {
      const [meusEmpApi, minhasResApi] = await Promise.all([
        api('/api/meus/emprestimos').catch(() => []),
        api('/api/meus/reservas').catch(() => [])
      ]);
      db.emprestimos = (meusEmpApi || []).map(normalizarEmprestimo);
      db.reservas = (minhasResApi || []).map(normalizarReserva);
      reconstruirPagamentosReais();
    }
  } catch (err) {
    console.error('Falha ao sincronizar dados:', err);
  }
}

async function rota(){
  const h = (location.hash.replace('#/','') || 'login');
  const m = h.match(/^(.*)\/(\d+)$/);
  const [nome, arg] = m ? [m[1], m[2]] : [h];
  const publica = ['login','cadastro','recuperar'].includes(nome);
  const ehAdmin = sessao?.perfil === 'ADMINISTRADOR' || sessao?.papel === 'admin';

  if(!publica && (!sessao || !sessao.token)) return location.hash = '#/login';
  if(nome.startsWith('admin') && !ehAdmin) return location.hash = '#/inicio';
  if(publica && sessao && sessao.token) return location.hash = ehAdmin ? '#/admin' : '#/inicio';

  if (!publica) {
    await sincronizarDados();
  }

  document.getElementById('app').innerHTML = (telas[nome] || telas.login)(arg);
  window.scrollTo(0,0);
  ligar(nome);
}
window.addEventListener('hashchange', rota);

function ligarAvisos(){
  document.querySelectorAll('[data-aviso]').forEach(b => b.onclick = () => {
    const e = db.emprestimos.find(x => x.id == b.dataset.aviso);
    if (!e) return;
    const texto = `Seu empréstimo de "${e.tituloLivro}" está atrasado desde ${fmt(e.prevista)}. Devolva o quanto antes.`;
    if(!db.avisos.some(a => a.texto === texto)) db.avisos.push({cliente:e.cliente, tipo:'late', texto});
    toast('Aviso enviado para ' + e.cliente + '.');
  });
}

async function ligar(nome){
  const $ = s => document.querySelector(s);
  ligarCapas(); ligarAvisos();
  const erro = m => { const el = $('#erro'); if (el) el.textContent = m; };

  $('[data-sair]')?.addEventListener('click', () => {
    sessao = null;
    sessionStorage.removeItem('sessao');
    location.hash = '#/login';
  });
  document.querySelectorAll('[data-livro]').forEach(b => b.onclick = () => location.hash = '#/livro/'+b.dataset.livro);

  // LOGIN REAL
  $('#f-login')?.addEventListener('submit', async e => {
    e.preventDefault();
    erro('');
    const f = new FormData(e.target);
    const identificador = f.get('id').trim();
    const senha = f.get('senha');
    if(!identificador || !senha) return erro('Informe e-mail (ou telefone) e senha.');

    const btn = e.target.querySelector('button[type="submit"]');
    btn.disabled = true; btn.textContent = 'Entrando...';
    try {
      const res = await api('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ identificador, senha })
      });
      sessao = {
        token: res.token,
        perfil: res.perfil,
        papel: res.perfil === 'ADMINISTRADOR' ? 'admin' : 'cliente',
        nome: res.nome
      };
      sessionStorage.setItem('sessao', JSON.stringify(sessao));
      rota();
    } catch (err) {
      erro(err.message || 'Credenciais inválidas.');
    } finally {
      btn.disabled = false; btn.textContent = 'Entrar';
    }
  });

  // CADASTRO REAL
  $('#f-cad')?.addEventListener('submit', async e => {
    e.preventDefault();
    erro('');
    const f = Object.fromEntries(new FormData(e.target));
    if(!f.nome.trim() || !f.senha) return erro('Preencha nome e senha.');
    if(!f.email.trim() && !f.tel.trim()) return erro('Informe ao menos e-mail ou telefone.');
    if(f.email.trim() && !/^\S+@\S+\.\S+$/.test(f.email.trim())) return erro('Digite um e-mail válido.');
    if(f.senha.length < 8) return erro('A senha deve ter no mínimo 8 caracteres.');
    if(f.senha !== f.conf) return erro('As senhas não coincidem.');

    const btn = e.target.querySelector('button[type="submit"]');
    btn.disabled = true; btn.textContent = 'Cadastrando...';
    try {
      await api('/api/auth/cadastro', {
        method: 'POST',
        body: JSON.stringify({
          nome: f.nome.trim(),
          email: f.email.trim() || null,
          telefone: f.tel.trim() || null,
          senha: f.senha
        })
      });
      toast('Conta criada com sucesso! Faça login para continuar.');
      location.hash = '#/login';
    } catch (err) {
      erro(err.message || 'Não foi possível concluir o cadastro.');
    } finally {
      btn.disabled = false; btn.textContent = 'Criar conta';
    }
  });

  $('#f-rec')?.addEventListener('submit', e => { e.preventDefault(); toast('Código enviado.'); location.hash = '#/login'; });

  if(nome === 'catalogo'){
    let g = 'Todos';
    const desenhar = () => {
      const q = $('#busca').value.toLowerCase();
      const r = db.livros.filter(l => (g==='Todos'||l.genero===g) && (l.titulo+l.autor).toLowerCase().includes(q));
      $('#lista').innerHTML = r.length ? r.map(card).join('') : '<p class="vazio" style="grid-column:1/-1">Nenhum livro encontrado.</p>';
      document.querySelectorAll('[data-livro]').forEach(b => b.onclick = () => location.hash = '#/livro/'+b.dataset.livro);
      ligarCapas();
    };
    $('#busca').oninput = desenhar;
    $('#chips').onclick = e => { if(!e.target.dataset.g) return; g = e.target.dataset.g;
      document.querySelectorAll('.chip').forEach(c=>c.classList.toggle('on', c===e.target)); desenhar(); };
    desenhar();
  }

  // SOLICITAR EMPRÉSTIMO PELO CLIENTE (GRAVA NO POSTGRESQL)
  $('[data-emp]')?.addEventListener('click', async e => {
    if (temMultaCliente(sessao?.id, nomeLogado())) {
      return toast('Quite as multas pendentes antes de pedir um empréstimo.');
    }
    const idLivro = Number(e.target.dataset.emp);
    e.target.disabled = true;
    try {
      await api('/api/meus/emprestimos', {
        method: 'POST',
        body: JSON.stringify({ idLivro })
      });
      toast('Empréstimo registrado! Devolva até ' + fmt(dia(14)) + '.');
      location.hash = '#/meus';
    } catch (err) {
      toast(err.message || 'Erro ao solicitar empréstimo.');
      e.target.disabled = false;
    }
  });

  // RESERVAR LIVRO (GRAVA NO POSTGRESQL)
  $('[data-res]')?.addEventListener('click', async e => {
    const idLivro = Number(e.target.dataset.res);
    e.target.disabled = true;
    try {
      await api('/api/reservas', {
        method: 'POST',
        body: JSON.stringify({ idLivro, leituraLocal: false })
      });
      toast('Reserva registrada no banco de dados!');
      location.hash = '#/meus';
    } catch (err) {
      toast(err.message || 'Erro ao reservar livro.');
      e.target.disabled = false;
    }
  });

  // LER NA BIBLIOTECA (GRAVA NO POSTGRESQL E GERA TAXA)
  $('[data-ler]')?.addEventListener('click', async e => {
    const idLivro = Number(e.target.dataset.ler);
    const horas = Number($('#horas').value || 1);
    e.target.disabled = true;
    try {
      const res = await api('/api/reservas', {
        method: 'POST',
        body: JSON.stringify({ idLivro, leituraLocal: true })
      });
      leiturasExtras[res.id] = { horas, valor: 3 * horas };
      salvarLeiturasExtras();
      toast('Leitura na biblioteca registrada! A taxa aparece em Pagamentos.');
      location.hash = '#/meus';
    } catch (err) {
      toast(err.message || 'Erro ao registrar leitura.');
      e.target.disabled = false;
    }
  });

  document.querySelectorAll('[data-pagar]').forEach(b => b.onclick = () => {
    const id = b.dataset.pagar;
    if (!pagosIds.includes(id)) { pagosIds.push(id); salvarPagos(); }
    toast('Pagamento por '+b.dataset.forma+' confirmado.');
    rota();
  });

  // ABA CLIENTES DO ADMIN
  if(nome === 'admin/clientes'){
    const desenhar = () => {
      const q = $('#busca-c').value.toLowerCase();
      const r = db.clientes.filter(c => ((c.nome||'')+(c.email||'')+(c.telefone||'')).toLowerCase().includes(q));
      $('#lista-c').innerHTML = r.length ? r.map(linhaCliente).join('') : '<p class="vazio">Nenhum cliente cadastrado no banco.</p>';
      ligarAvisos();
    };
    $('#busca-c').oninput = desenhar;
    desenhar();
  }

  // REGISTRAR EMPRÉSTIMO NO ADMIN
  $('#f-emp')?.addEventListener('submit', async e => {
    e.preventDefault();
    const f = Object.fromEntries(new FormData(e.target));
    const idCliente = Number(f.idCliente);
    const idLivro = Number(f.idLivro);
    if(!idCliente) return toast('Selecione um cliente cadastrado.');
    if(!idLivro) return toast('Não há livros disponíveis para emprestar.');

    const clienteObj = db.clientes.find(c => c.id == idCliente);
    if(clienteObj && temMultaCliente(clienteObj.id, clienteObj.nome)) {
      return toast(clienteObj.nome + ' tem multa pendente e não pode pegar livros.');
    }

    const btn = e.target.querySelector('button[type="submit"]');
    btn.disabled = true; btn.textContent = 'Registrando...';
    try {
      await api('/api/admin/emprestimos', {
        method: 'POST',
        body: JSON.stringify({
          idCliente,
          idLivro,
          dataDevolucaoPrevista: f.dataDevolucaoPrevista
        })
      });
      toast('Empréstimo registrado no banco de dados!');
      rota();
    } catch (err) {
      toast(err.message || 'Erro ao registrar empréstimo.');
    } finally {
      btn.disabled = false; btn.textContent = 'Registrar empréstimo';
    }
  });

  // LIBERAR RESERVA (ADMIN)
  document.querySelectorAll('[data-conf-res]').forEach(b => b.onclick = async () => {
    try {
      await api(`/api/admin/reservas/${b.dataset.confRes}/status?status=CONFIRMADA`, { method: 'PUT' });
      toast('Reserva marcada como disponível para retirada.');
      rota();
    } catch (err) {
      toast(err.message || 'Erro ao atualizar reserva.');
    }
  });

  // CONVERTER RESERVA EM EMPRÉSTIMO REAL (ADMIN)
  document.querySelectorAll('[data-conv]').forEach(b => b.onclick = async () => {
    const r = db.reservas.find(x => x.id == b.dataset.conv);
    if (!r) return;
    const l = livro(r.livroId);
    if (!l || l.disp < 1) return toast('Sem exemplar disponível no estoque.');
    try {
      await api('/api/admin/emprestimos', {
        method: 'POST',
        body: JSON.stringify({
          idCliente: r.idCliente,
          idLivro: r.livroId,
          dataDevolucaoPrevista: isoData(dia(14))
        })
      });
      await api(`/api/admin/reservas/${r.id}/status?status=CANCELADA`, { method: 'PUT' });
      toast('Reserva convertida em empréstimo!');
      rota();
    } catch (err) {
      toast(err.message || 'Erro ao converter reserva.');
    }
  });

  // REGISTRAR DEVOLUÇÃO
  document.querySelectorAll('[data-dev]').forEach(b => b.onclick = async () => {
    const id = b.dataset.dev;
    b.disabled = true;
    try {
      await api(`/api/admin/emprestimos/${id}/devolucao`, { method: 'PUT' });
      toast('Devolução registrada com sucesso!');
      rota();
    } catch (err) {
      toast(err.message || 'Erro ao registrar devolução.');
      b.disabled = false;
    }
  });

  // BAIXA DE PAGAMENTO / MULTA
  document.querySelectorAll('[data-baixa]').forEach(b => b.onclick = () => {
    const id = b.dataset.baixa;
    if (!pagosIds.includes(id)) { pagosIds.push(id); salvarPagos(); }
    toast('Pagamento registrado e cliente liberado.');
    rota();
  });

  // ABA LIVROS DO ADMIN
  if(nome === 'admin/livros'){
    const desenhar = () => {
      const q = $('#busca-a').value.toLowerCase();
      $('#tb-livros').innerHTML = db.livros.filter(l=>(l.titulo+l.autor+l.isbn).toLowerCase().includes(q)).map(l =>
        `<tr><td>${esc(l.titulo)}<br><small>${esc(l.autor)} · ${esc(l.isbn)}</small></td><td>${l.disp}/${l.total}</td>
        <td class="acoes"><button class="btn mini sec" data-edit="${l.id}">Editar</button><button class="btn mini perigo" data-del="${l.id}">Excluir</button></td></tr>`).join('')
        || '<tr><td colspan="3" class="vazio">Nenhum livro cadastrado no banco.</td></tr>';

      document.querySelectorAll('[data-del]').forEach(b => b.onclick = async () => {
        const l = livro(b.dataset.del);
        if(!confirm('Excluir "'+l.titulo+'"?')) return;
        try {
          await api(`/api/admin/livros/${l.id}`, { method: 'DELETE' });
          toast('Livro excluído do banco.');
          rota();
        } catch (err) {
          toast(err.message || 'Não foi possível excluir o livro.');
        }
      });

      document.querySelectorAll('[data-edit]').forEach(b => b.onclick = async () => {
        const l = livro(b.dataset.edit);
        const t = prompt('Quantidade total de exemplares:', l.total);
        if(!t || isNaN(+t) || +t < 0) return;
        try {
          await api(`/api/admin/livros/${l.id}`, {
            method: 'PUT',
            body: JSON.stringify({
              isbn: l.isbn,
              titulo: l.titulo,
              autor: l.autor,
              genero: l.genero,
              quantidadeTotal: Number(t)
            })
          });
          toast('Estoque atualizado no banco.');
          rota();
        } catch (err) {
          toast(err.message || 'Erro ao atualizar estoque.');
        }
      });
    };
    $('#busca-a').oninput = desenhar; desenhar();
  }

  // CADASTRAR NOVO LIVRO
  $('#f-livro')?.addEventListener('submit', async e => {
    e.preventDefault();
    erro('');
    const f = Object.fromEntries(new FormData(e.target));
    if(!f.titulo.trim() || !f.autor.trim() || !f.isbn.trim()) return erro('Preencha título, autor e ISBN.');
    const btn = e.target.querySelector('button[type="submit"]');
    btn.disabled = true; btn.textContent = 'Salvando...';
    try {
      await api('/api/admin/livros', {
        method: 'POST',
        body: JSON.stringify({
          isbn: f.isbn.trim(),
          titulo: f.titulo.trim(),
          autor: f.autor.trim(),
          genero: f.genero,
          quantidadeTotal: Number(f.qtd || 1)
        })
      });
      toast('Livro salvo no banco de dados!');
      location.hash = '#/admin/livros';
    } catch (err) {
      erro(err.message || 'Erro ao salvar livro.');
    } finally {
      btn.disabled = false; btn.textContent = 'Salvar livro';
    }
  });
}
rota();