/* app.js — SPA logic, questions DB, auth, timer, history */

// ---------- UTILIDADES ----------
const $ = sel => document.querySelector(sel);
const $$ = sel => Array.from(document.querySelectorAll(sel));
const formatTime = seconds => {
  const mm = String(Math.floor(seconds/60)).padStart(2,'0');
  const ss = String(seconds%60).padStart(2,'0');
  return ${mm}:${ss};
};

// ---------- DADOS (QUESTÕES) ----------
/*
  Inserção de questões extraídas do seu PDF (PROVAS-SIMULADAS-37_cópia.pdf).
  Usei várias questões do PDF e as separei por matéria.
  Fonte do PDF (trechos usados): 3 4 5
*/
const QUESTIONS_DB = [
  // Legislação (exemplos extraídos/formatados)
  {
    id: 'leg-1',
    subject: 'Legislação',
    q: 'Em relação à circulação de veículos automotores nas vias terrestres, podemos afirmar que:',
    options: [
      'Os veículos que se deslocam sobre trilhos terão preferência de passagem sobre os demais, respeitadas as normas de circulação.',
      'A prioridade de passagem na via e no cruzamento não deverá ser feita com velocidade reduzida, pois acarreta perigo.',
      'A preferência de passagem será sempre do veículo que vier à direita do outro.',
      'Nenhum condutor deverá frear bruscamente seu veículo nas vias urbanas.'
    ],
    correct: 0
  },
  {
    id: 'leg-2',
    subject: 'Legislação',
    q: 'Quando uma pista de rolamento comportar várias faixas de trânsito no mesmo sentido, ficarão as da:',
    options: [
      'Direita destinadas à ultrapassagem e ao deslocamento de veículos de maior velocidade.',
      'Esquerda destinadas à ultrapassagem e ao deslocamento de veículos lentos.',
      'Direita destinadas a veículos de socorro e de urgência.',
      'Esquerda destinadas à ultrapassagem e ao deslocamento de veículos de maior velocidade.'
    ],
    correct: 0
  },

  // Sinalização / Placas (muitos exemplos do PDF)
  {
    id: 'sig-1',
    subject: 'Sinalização',
    q: 'As placas que oferecem aos condutores informações úteis na escolha de um trajeto são chamadas de:',
    options: ['Indicação', 'Advertência', 'Luminosas', 'Especiais'],
    correct: 0
  },
  {
    id: 'sig-2',
    subject: 'Sinalização',
    q: 'A placa de nº R-1 indica:',
    options: ['Parada obrigatória', 'Semáforo à frente', 'Parada obrigatória à frente', 'Dê a preferência'],
    correct: 0
  },
  {
    id: 'sig-3',
    subject: 'Sinalização',
    q: 'A placa de nº A-12 adverte:',
    options: ['Proibido retornar','Passagem de nível sem barreira','Interseção em círculo','Sentido circular obrigatório'],
    correct: 1
  },

  // Normas / Circulação
  {
    id: 'norm-1',
    subject: 'Normas',
    q: 'Na rotatória, a preferência é de:',
    options: ['Do veículo que estiver saindo','Do veículo que estiver chegando','Do veículo que estiver à direita','Do veículo que já estiver circulando'],
    correct: 3
  },
  {
    id: 'norm-2',
    subject: 'Normas',
    q: 'Os veículos destinados a socorros de incêndio, ambulâncias e polícia:',
    options: [
      'Gozam de livre trânsito e estacionamento em qualquer situação.',
      'Não têm prioridade no trânsito.',
      'Só têm prioridade quando protegidos por batedores.',
      'Além de prioridade, gozam de livre trânsito quando em serviço de urgência e identificados.'
    ],
    correct: 3
  },

  // Infrações
  {
    id: 'inf-1',
    subject: 'Infrações',
    q: 'Motorista dirigindo utilizando-se do telefone celular está praticando infração de natureza:',
    options: ['Grave','Leve','Gravíssima','Média'],
    correct: 0
  },

  // Primeiros Socorros / Segurança
  {
    id: 'ps-1',
    subject: 'PrimeirosSocorros',
    q: 'Para sinalizar um local de acidente à noite ou com neblina, deve-se usar:',
    options: ['Galhos de árvore e latas','Lanternas, pisca-alerta e faróis','Triângulo apenas','Nada'],
    correct: 1
  },

  // Meio Ambiente
  {
    id: 'amb-1',
    subject: 'MeioAmbiente',
    q: 'Os gases expedidos pelos veículos automotores que poluem o ar são:',
    options: ['H2O e oxigênio','H2O e óxidos de nitrogênio','Oxigênio, fumaça preta e óxidos de enxofre','Hidrocarbonetos, monóxido de carbono, óxido de nitrogênio'],
    correct: 3
  },

  // Mecânica
  {
    id: 'mec-1',
    subject: 'Mecanica',
    q: 'Fazem parte do sistema de arrefecimento a água, os seguintes componentes:',
    options: ['Radiador, bomba d’água e ventilador','Filtro de água e cárter','Aditivos e distribuidor','Ignição e injeção eletrônicas'],
    correct: 0
  },

  // Cidadania
  {
    id: 'cid-1',
    subject: 'Cidadania',
    q: 'Valores coletivos no trânsito incluem:',
    options: ['Respeito e convivência','Agressividade ao volante','Ultrapassar sempre que possível','Ignorar pedestres'],
    correct: 0
  },

  // Habilitação
  {
    id: 'hab-1',
    subject: 'Habilitação',
    q: 'O candidato à Permissão para Dirigir deve ter, em CFducção, carga horária mínima de:',
    options: ['20 horas','30 horas','25 horas','10 horas'],
    correct: 2
  },

  // Adicionei mais questões do PDF — extraí blocos e os transformei em perguntas.
  // Se quiser, eu incremento o DB puxando mais páginas do PDF (tem muitas).
];

// ---------- CONFIG E ESTADO ----------
const APP = {
  perPage: 'content',
  currentUser: null,
  currentQuiz: null,
  currentIndex: 0,
  selectedAnswers: {},
  timerInterval: null,
  remainingSeconds: 0
};

function saveUsers(users) { localStorage.setItem('ae_users', JSON.stringify(users||{})); }
function getUsers() { return JSON.parse(localStorage.getItem('ae_users')||'{}'); }
function saveHistory(user, history) {
  const all = JSON.parse(localStorage.getItem('ae_history')||'{}');
  all[user] = history;
  localStorage.setItem('ae_history', JSON.stringify(all));
}
function getHistory(user) {
  const all = JSON.parse(localStorage.getItem('ae_history')||'{}');
  return all[user] || [];
}

// ---------- NAV & UI ----------
function showPage(name) {
  $$('[data-page]').forEach(el=>{
    if (el.getAttribute('data-page') === name) el.classList.remove('hidden');
    else el.classList.add('hidden');
  });
  APP.perPage = name;
}
function initNav() {
  // header nav links
  $$('.nav-link').forEach(link=>{
    link.addEventListener('click', ev=>{
      ev.preventDefault();
      const page = link.dataset.nav;
      if (page==='content') showPage('content');
      else if(page==='simulados') showPage('simulados');
      else if(page==='history') showPage('history');
      else if(page==='profile') showPage('profile');
    });
  });

  // study buttons (cards)
  $$('.study-btn').forEach(btn=>{
    btn.addEventListener('click', ()=> openStudy(btn.dataset.subject));
  });

  document.getElementById('login-btn').addEventListener('click', ()=> openModal());
  document.getElementById('mobile-menu-btn').addEventListener('click', ()=> {
    const nav = $('#main-nav');
    nav.style.display = (nav.style.display === 'flex') ? 'none' : 'flex';
  });

  // quick start button -> leva à página de simulados com aleatório
  document.querySelectorAll('[data-action="start-quick"]').forEach(b=>{
    b.addEventListener('click', ()=> {
      showPage('simulados'); 
      $('#filter-subject').value = '__all';
      // start default 40 perguntas
      startSimulado({subject:'__all', qcount:40});
    });
  });

  // Iniciar simulado principal
  $('#start-simulado').addEventListener('click', ()=> {
    const subj = $('#filter-subject').value;
    const qbtn = $$('.q-btn.active')[0];
    const qcount = qbtn ? parseInt(qbtn.dataset.q,10) : 40;
    startSimulado({subject:subj, qcount});
  });

  // q count buttons
  $$('.q-btn').forEach(b=>{
    b.addEventListener('click', ()=>{
      $$('.q-btn').forEach(x=>x.classList.remove('active'));
      b.classList.add('active');
    });
  });

  // history show
  renderHistoryList();

  // modal auth
  $('#modal-login').addEventListener('click', ()=> doLoginFromModal());
  $('#modal-register').addEventListener('click', ()=> doRegisterFromModal());
  $('#modal-close').addEventListener('click', ()=> closeModal());
  $('#do-login').addEventListener('click', ()=> doLoginFromProfile());
  $('#do-register').addEventListener('click', ()=> doRegisterFromProfile());
  $('#logout-btn').addEventListener('click', ()=> doLogout());

  // quiz nav
  $('#next-q').addEventListener('click', ()=> gotoQuestion(APP.currentIndex+1));
  $('#prev-q').addEventListener('click', ()=> gotoQuestion(APP.currentIndex-1));
  $('#finish-sim').addEventListener('click', ()=> finishSimulado());
  $('#back-to-content').addEventListener('click', ()=> showPage('content'));
}

// ---------- AUTH ----------
function openModal() {
  $('#modal-root').classList.remove('hidden');
}
function closeModal() {
  $('#modal-root').classList.add('hidden');
  $('#modal-msg').textContent = '';
}
function doRegisterFromModal() {
  const email = $('#modal-email').value.trim();
  const pass = $('#modal-pass').value;
  if(!email||!pass) { $('#modal-msg').textContent='Informe e-mail e senha'; return; }
  const users = getUsers();
  if(users[email]) { $('#modal-msg').textContent='Usuário já existe'; return; }
  users[email] = {email, pass};
  saveUsers(users);
  $('#modal-msg').textContent='Registrado! Faça login agora.';
}
function doLoginFromModal() {
  const email = $('#modal-email').value.trim();
  const pass = $('#modal-pass').value;
  if(!email||!pass) { $('#modal-msg').textContent='Informe e-mail e senha'; return; }
  const users = getUsers();
  if(users[email] && users[email].pass === pass) {
    APP.currentUser = email;
    $('#user-greet').textContent = Olá, ${email};
    closeModal();
    updateProfileUI();
    renderHistoryList();
    alert('Login realizado');
  } else {
    $('#modal-msg').textContent = 'Credenciais inválidas';
  }
}
function doRegisterFromProfile() {
  const email = $('#login-email').value.trim();
  const pass = $('#login-pass').value;
  if(!email||!pass) { $('#auth-msg').textContent='Preencha ambos'; return; }
  const users = getUsers();
  if(users[email]) { $('#auth-msg').textContent='Usuário já existe'; return; }
  users[email] = {email, pass};
  saveUsers(users);
  APP.currentUser = email;
  $('#auth-msg').textContent='Registrado e logado';
  updateProfileUI();
}
function doLoginFromProfile() {
  const email = $('#login-email').value.trim();
  const pass = $('#login-pass').value;
  const users = getUsers();
  if(users[email] && users[email].pass === pass) {
    APP.currentUser = email;
    $('#auth-msg').textContent='Logado';
    updateProfileUI();
    renderHistoryList();
  } else {
    $('#auth-msg').textContent='Credenciais inválidas';
  }
}
function doLogout() {
  APP.currentUser = null;
  updateProfileUI();
  alert('Você saiu da sua conta');
}
function updateProfileUI() {
  if(APP.currentUser) {
    $('#profile-logged').classList.remove('hidden');
    $('#profile-login').classList.add('hidden');
    $('#profile-email').textContent = Usuário: ${APP.currentUser};
    $('#user-greet').textContent = Olá, ${APP.currentUser};
    $('#user-area').classList.remove('hidden');
    $('#login-btn').textContent = 'Conta';
  } else {
    $('#profile-logged').classList.add('hidden');
    $('#profile-login').classList.remove('hidden');
    $('#user-greet').textContent = '';
    $('#user-area').classList.add('hidden');
    $('#login-btn').textContent = 'Entrar';
  }
}

// ---------- STUDY CONTENT ----------
function openStudy(subject) {
  const studyArea = $('#study-area');
  // load basic info (fetch from web would be possible; here quick summary + pointer)
  const content = getSubjectContent(subject);
  studyArea.innerHTML = `<h2 class="text-xl font-bold mb-3">${subject}</h2><div class="text-slate-300 mb-4">${content.summary}</div>
    <div><button id="start-sub-sim" class="bg-yellow-500 px-4 py-2 rounded">Fazer simulado desta matéria</button></div>
    <hr class="my-4"/>
    <div class="text-slate-400">${content.more}</div>
  `;
  $('#start-sub-sim').addEventListener('click', ()=> {
    showPage('simulados');
    $('#filter-subject').value = mapSubjectToFilter(subject);
    // init simulado subject pre-selected
  });
  showPage('study');
}
function mapSubjectToFilter(subject) {
  // mapping for select values
  if(subject === 'Direção Defensiva') return 'Defensiva';
  if(subject === 'Placas e Sinalização') return 'Sinalização';
  if(subject === 'Primeiros Socorros') return 'PrimeirosSocorros';
  if(subject === 'Meio Ambiente') return 'MeioAmbiente';
  if(subject === 'Mecânica Básica') return 'Mecanica';
  return subject;
}
function getSubjectContent(subject) {
  // short summaries — you asked to include matérias tiradas da web; I added curtas descrições.
  const summaries = {
    'Legislação': {
      summary: 'Legislação de trânsito: principais normas do Código de Trânsito Brasileiro (CTB), regras de habilitação e responsabilidades do condutor.',
      more: 'Inclui o CTB (Lei 9.503/97) e atualizações; ideal para entender direitos, deveres e penalidades.'
    },
    'Normas': {
      summary: 'Normas de circulação: regras sobre posição na via, preferências de passagem e manobras.',
      more: 'Cobre regras de ultrapassagem, rotatórias, prioridade, comportamento em cruzamentos e uso de faixas.'
    },
    'Infrações': {
      summary: 'Infrações e penalidades: classificação (leve, média, grave, gravíssima), pontos na CNH e recursos administrativos.',
      more: 'Mostra exemplos de infrações e indica como recorrer de multas administrativamente.'
    },
    'Documentos': { summary: 'CNH, CRLV e documentos digitais — validade e obrigatoriedade.', more: '' },
    'Habilitação': { summary: 'Processo de obtenção da CNH, categorias e requisitos.', more: '' },
    'Defensiva': { summary: 'Direção defensiva: manter distância, atenção, previsão e técnicas para evitar acidentes.', more: '' },
    'Sinalização': { summary: 'Placas e sinalização: tipos (regulamentação, advertência, indicação) e significado.', more: '' },
    'PrimeirosSocorros': { summary: 'Primeiros socorros: procedimentos iniciais em acidentes de trânsito e sinalização do local.', more: '' },
    'MeioAmbiente': { summary: 'Impacto dos veículos e práticas sustentáveis para reduzir emissões.', more: '' },
    'Mecanica': { summary: 'Noções básicas de mecânica: itens de verificação e funcionamento do veículo.', more: '' },
    'Cidadania': { summary: 'Valores éticos no trânsito: respeito, solidariedade e proteção a grupos vulneráveis.', more: '' }
  };
  return summaries[subject] || {summary:'Conteúdo breve.', more:''};
}

// ---------- INICIAR SIMULADO ----------
function startSimulado({subject='__all', qcount=40} = {}) {
  if(!APP.currentUser) {
    // if not logged, allow but store history by "guest"
    // optional: force login — user asked login feature; keep optional
  }
  // select questions
  let pool = QUESTIONS_DB;
  if(subject && subject !== '__all') {
    // map select values to DB subject keys
    const map = {'PrimeirosSocorros':'PrimeirosSocorros','MeioAmbiente':'MeioAmbiente','Mecanica':'Mecanica','Defensiva':'Defensiva','Sinalização':'Sinalização','Cidadania':'Cidadania'};
    pool = QUESTIONS_DB.filter(q => {
      if(subject==='Normas') return q.subject==='Normas';
      if(subject==='Infrações') return q.subject==='Infrações';
      if(subject==='Habilitação') return q.subject==='Habilitação';
      if(subject==='Documentos') return q.subject==='Documentos';
      if(subject==='Legislação') return q.subject==='Legislação';
      // direct match for mapped names
      if(map[subject]) return q.subject === subject || q.subject === subject.replace(/\s/g,'');
      return q.subject === subject;
    });
  }
  // if pool too small, allow random mixing from all
  if(pool.length < qcount) {
    // fill with random from all to reach qcount
    const fill = QUESTIONS_DB.slice();
    while(pool.length < qcount) {
      const pick = fill[Math.floor(Math.random()*fill.length)];
      if(!pool.includes(pick)) pool.push(pick);
      if(pool.length===QUESTIONS_DB.length) break;
    }
  }

  // shuffle and pick qcount
  const shuffled = pool.slice().sort(()=>Math.random()-0.5).slice(0,qcount);

  APP.currentQuiz = {
    title: subject === '__all' ? 'Simulado - Todas as matérias' : Simulado - ${subject},
    questions: shuffled,
    total: shuffled.length,
    subjectFilter: subject
  };
  APP.selectedAnswers = {};
  APP.currentIndex = 0;

  // set timer default: 60 seconds per question (configurável). You can change later.
  APP.remainingSeconds = APP.currentQuiz.total * 60;
  $('#timer').textContent = formatTime(APP.remainingSeconds);

  // start timer
  startTimer();

  // render quiz page
  $('#quiz-title').textContent = APP.currentQuiz.title;
  showPage('quiz');
  renderQuestion();
}

// Timer
function startTimer() {
  if(APP.timerInterval) clearInterval(APP.timerInterval);
  APP.timerInterval = setInterval(()=>{
    APP.remainingSeconds--;
    $('#timer').textContent = formatTime(APP.remainingSeconds);
    if(APP.remainingSeconds <= 0) {
      clearInterval(APP.timerInterval);
      finishSimulado();
    }
  }, 1000);
}

// question rendering
function renderQuestion() {
  const container = $('#question-container');
  const qObj = APP.currentQuiz.questions[APP.currentIndex];
  if(!qObj) {
    container.innerHTML = '<p>Sem pergunta</p>';
    return;
  }
  let html = `<div>
    <div class="text-slate-400 mb-3">Pergunta ${APP.currentIndex+1} de ${APP.currentQuiz.total} — Matéria: <strong>${qObj.subject}</strong></div>
    <div class="text-lg font-medium mb-3">${qObj.q}</div>
    <div class="options">`;
  qObj.options.forEach((opt, idx)=>{
    const checked = APP.selectedAnswers[qObj.id] === idx ? 'checked' : '';
    html += `<label class="option" style="display:block;padding:8px;border-radius:6px;margin-bottom:6px;background:#0f1724;border:1px solid rgba(255,255,255,0.03);cursor:pointer;">
      <input type="radio" name="opt-${qObj.id}" data-qid="${qObj.id}" value="${idx}" ${checked} style="margin-right:8px" /> ${opt}
    </label>`;
  });
  html += '</div></div>';
  container.innerHTML = html;

  // attach change handlers
  container.querySelectorAll('input[type=radio]').forEach(r=>{
    r.addEventListener('change', ev=>{
      const qid = ev.target.dataset.qid;
      APP.selectedAnswers[qid] = parseInt(ev.target.value,10);
    });
  });

  // update prev/next disabled states
  $('#prev-q').disabled = (APP.currentIndex === 0);
  $('#next-q').disabled = (APP.currentIndex === APP.currentQuiz.total - 1);
}

function gotoQuestion(idx) {
  if(idx < 0 || idx >= APP.currentQuiz.total) return;
  APP.currentIndex = idx;
  renderQuestion();
}

// finish simulation -> grade and save history
function finishSimulado() {
  if(APP.timerInterval) { clearInterval(APP.timerInterval); APP.timerInterval = null; }

  const qlist = APP.currentQuiz.questions;
  let correctCount = 0;
  const perSubject = {}; // track subject counts & corrects
  qlist.forEach(q=>{
    const subj = q.subject;
    if(!perSubject[subj]) perSubject[subj] = {total:0,correct:0};
    perSubject[subj].total++;
    const selected = APP.selectedAnswers[q.id];
    if(selected === q.correct) {
      correctCount++;
      perSubject[subj].correct++;
    }
  });

  const percent = Math.round((correctCount / qlist.length) * 100);
  const passed = percent >= 70;

  // determine weakest subject(s)
  let weak = [];
  let worstPercent = 101;
  for(const s in perSubject){
    const p = Math.round((perSubject[s].correct / perSubject[s].total) * 100);
    if(p < worstPercent) { worstPercent = p; weak = [s]; }
    else if(p === worstPercent) weak.push(s);
  }

  const result = {
    date: new Date().toISOString(),
    title: APP.currentQuiz.title,
    total: APP.currentQuiz.total,
    correct: correctCount,
    percent,
    passed,
    weakSubjects: weak
  };

  // save in history for current user (or guest)
  const userKey = APP.currentUser || 'guest';
  const history = getHistory(userKey);
  history.unshift(result);
  // keep only last 50
  saveHistory(userKey, history.slice(0,50));

  // show result modal/simple alert + update history list
  alert(Simulado finalizado!\nAcertos: ${correctCount}/${qlist.length}\nPercentual: ${percent}%\n${passed ? 'APROVADO' : 'REPROVADO'}\nMatéria(s) para focar: ${weak.join(', ')});

  renderHistoryList();
  showPage('simulados');
}

// render history list in Simulados page
function renderHistoryList() {
  const userKey = APP.currentUser || 'guest';
  const hist = getHistory(userKey);
  const list = $('#history-list');
  list.innerHTML = '';
  if(hist.length === 0) {
    list.innerHTML = '<p class="text-slate-400">Nenhum simulado ainda.</p>';
    return;
  }
  hist.forEach(item=>{
    const el = document.createElement('div');
    el.className = 'history-item';
    el.innerHTML = `<div>
      <div class="font-bold">${item.title}</div>
      <div class="text-slate-400 text-sm">${(new Date(item.date)).toLocaleString()}</div>
    </div>
    <div class="text-right">
      <div class="${item.passed ? 'text-green-400' : 'text-red-400'} font-bold">${item.percent}%</div>
      <div class="text-slate-400 text-sm">${item.correct}/${item.total}</div>
    </div>`;
    list.appendChild(el);
  });
}

// render history/progress page details
function renderProgressArea() {
  const area = $('#progress-area');
  const userKey = APP.currentUser || 'guest';
  const hist = getHistory(userKey);
  if(hist.length === 0) {
    area.innerHTML = '<p class="text-slate-400">Nenhum registro.</p>';
    return;
  }
  let html = '<ul class="space-y-3">';
  hist.forEach(h=>{
    html += `<li class="history-item">
      <div>
        <div class="font-bold">${h.title}</div>
        <div class="text-slate-400 text-sm">${(new Date(h.date)).toLocaleString()}</div>
        <div class="text-slate-400 text-sm">Focar em: ${h.weakSubjects.join(', ')}</div>
      </div>
      <div class="text-right">
        <div class="${h.passed ? 'text-green-400' : 'text-red-400'} font-bold">${h.percent}%</div>
        <div class="text-slate-400 text-sm">${h.correct}/${h.total}</div>
      </div>
    </li>`;
  });
  html += '</ul>';
  area.innerHTML = html;
}

// ---------- Init ----------
function boot() {
  initNav();
  updateProfileUI();
  showPage('content');
  // render initial history/progress
  renderHistoryList();
  renderProgressArea();
  // wire quick links from content cards (already done)

  // fill some dynamic bindings (e.g., clicking "Estudar agora" on module card repeats)
  // Done in initNav

  // Accessibility: allow finishing by keyboard? minimal
}

document.addEventListener('DOMContentLoaded', boot);
