const DISTANCIA_TOTAL = 2000;

let cavalos = [];
let numCavalosPadrao = 10;

let mode = "observe";           // observe | bet | ride | multiplayer
let indiceCavaloJogador = null; // cavalo montado (single player)
let corridaAtiva = false;
let intervaloCorrida = null;

let stats = {
  corridas: 0,
  vitorias: 0,
  segundos: 0,
  terceiros: 0,
  xp: 0
};

let walletBalance = 0; // saldo inicial fictício
let currentBet = null;   // {horseIndex, amount}

/* ---------- LocalStorage: stats + avatar + wallet ---------- */
function carregarEstado() {
  const statsStr = localStorage.getItem("corridaStats");
  if (statsStr) {
    try {
      stats = JSON.parse(statsStr);
    } catch (_) {}
  }

  const avatarUrl = localStorage.getItem("corridaAvatar");
  if (avatarUrl) {
    // só mexe em elementos que existem
    const mini = document.getElementById("miniAvatar");
    const profile = document.getElementById("profileAvatar");
    if (mini) mini.src = avatarUrl;
    if (profile) profile.src = avatarUrl;
  }

  const walletStr = localStorage.getItem("corridaWallet");
  if (walletStr) {
    walletBalance = Number(walletStr) || walletBalance;
  }
}

function guardarEstado() {
  localStorage.setItem("corridaStats", JSON.stringify(stats));
  localStorage.setItem("corridaWallet", String(walletBalance));
}

/* ---------- Cavalos ---------- */
function criarCavalos() {
  cavalos = [];

  if (mode === "multiplayer") {
    // 2 cavalos, um para cada jogador
    const nomes = ["Jogador 1 (Espaço)", "Jogador 2 (Enter)"];
    for (let i = 0; i < 2; i++) {
      cavalos.push({ nome: nomes[i], posicao: 0 });
    }
  } else {
    const nomes = [
  "Relâmpago",
  "Trovão",
  "Flecha",
  "Tornado",
  "Tempestade",
  "Cometa",
  "Furacão",
  "Pegasus",
  "Veloz",
  "Destemido"
    ];
    for (let i = 0; i < numCavalosPadrao; i++) {
      cavalos.push({
        nome: nomes[i] || "Cavalo " + (i + 1),
        posicao: 0
      });
    }
  }

  // reset seleção de cavalo montado
  indiceCavaloJogador = null;

  desenharCavalos();
  atualizarBetHorseSelect();
}

/* Desenhar cavalos na pista */
function desenharCavalos() {
  const container = document.getElementById("horsesContainer");
  if (!container) return;

  container.innerHTML = "";

  cavalos.forEach((cavalo, index) => {
    const row = document.createElement("div");
    row.className =
      "horse-row" +
      (index === indiceCavaloJogador ? " mounted" : "") +
      (mode === "multiplayer" ? " multiplayer" : "");
    row.dataset.index = index;

    // Casinha / estábulo
    const stall = document.createElement("div");
    stall.className = "horse-stall";

    // Nome
    const label = document.createElement("div");
    label.className = "horse-label";
    label.textContent = cavalo.nome;

    // Pista e barra
    const track = document.createElement("div");
    track.className = "horse-track";

    const bar = document.createElement("div");
    bar.className = "horse-bar";
    const perc = Math.min(100, (cavalo.posicao / DISTANCIA_TOTAL) * 100);
    bar.style.width = perc + "%";

    // Cavalo na ponta da barra
const icon = document.createElement("img");
icon.className = "horse-icon";
icon.src = "img/cavalocorrendo.gif";
bar.appendChild(icon);



    track.appendChild(bar);

    row.appendChild(stall);
    row.appendChild(label);
    row.appendChild(track);
    container.appendChild(row);

    // Clica para montar (modo ride)
    row.addEventListener("click", () => {
      if (corridaAtiva) return; // não mudar durante corrida
      if (mode === "ride") {
        indiceCavaloJogador = index;
        updateUI();
      }
    });
  });
}


/* ---------- UI ---------- */
function updateWalletUI() {
  const el = document.getElementById("walletBalance");
  if (el) {
    el.textContent = walletBalance.toFixed(2);
  }
}

function showBetMessage(msg) {
  const el = document.getElementById("betMessage");
  if (el) el.textContent = msg;
}

/* Atualiza selects de cavalo para apostar */
function atualizarBetHorseSelect() {
  const select = document.getElementById("betHorseSelect");
  if (!select) return;

  select.innerHTML = "";
  cavalos.forEach((cavalo, index) => {
    const opt = document.createElement("option");
    opt.value = index;
    opt.textContent = cavalo.nome;
    select.appendChild(opt);
  });
}

/* Atualizar tudo */
function updateUI() {
  desenharCavalos();
  updateWalletUI();

  // Header mini stats
  const miniStatsEl = document.getElementById("miniStats");
  if (miniStatsEl) {
    miniStatsEl.textContent =
      `XP ${stats.xp} · ${stats.vitorias} vitórias`;
  }

  // Resumo rápido
  const statsMiniText = document.getElementById("statsMiniText");
  if (statsMiniText) {
    statsMiniText.innerHTML =
      `Corridas: ${stats.corridas}<br>` +
      `1º: ${stats.vitorias} · 2º: ${stats.segundos} · 3º: ${stats.terceiros}<br>` +
      `XP: ${stats.xp}`;
  }

  // Botão iniciar corrida
  const startBtn = document.getElementById("startRaceBtn");
  if (startBtn) {
    if (mode === "multiplayer") {
      startBtn.disabled = corridaAtiva; // basta clicar para começar
    } else if (mode === "ride") {
      startBtn.disabled = corridaAtiva || indiceCavaloJogador === null;
    } else {
      startBtn.disabled = corridaAtiva;
    }
  }

  // Texto de modo
  const modeHint = document.getElementById("modeHint");
  if (modeHint) {
    if (mode === "observe") {
      modeHint.textContent =
        "Só observar: todos os cavalos correm sozinhos de forma aleatória.";
    } else if (mode === "bet") {
      modeHint.textContent =
        "Apostar: faz a tua aposta e vê a corrida. Não controlas nenhum cavalo.";
    } else if (mode === "ride") {
      modeHint.textContent =
        "Apostar + Montar: clica num cavalo em cima para o montar e usa a tecla Espaço para correr.";
    } else if (mode === "multiplayer") {
      modeHint.textContent =
        "Multijogador: Jogador 1 (Espaço) vs Jogador 2 (Enter). Ganha quem chegar primeiro à meta.";
    }
  }

  // Perfil (modal)
  const profileXPText = document.getElementById("profileXPText");
  const xpFill = document.getElementById("xpFill");
  const profileStatsText = document.getElementById("profileStatsText");

  if (profileXPText && xpFill && profileStatsText) {
    profileXPText.textContent = `XP: ${stats.xp}`;
    const nivel = Math.floor(stats.xp / 100);
    const resto = stats.xp % 100;
    const percXP = Math.min(100, resto);
    xpFill.style.width = percXP + "%";
    profileStatsText.innerHTML =
      `Corridas: ${stats.corridas}<br>` +
      `Vitórias: ${stats.vitorias}<br>` +
      `2º lugar: ${stats.segundos}<br>` +
      `3º lugar: ${stats.terceiros}<br>` +
      `Nível: ${nivel}`;
  }
}

/* ---------- Mudar modo ---------- */
function setMode(newMode) {
  if (corridaAtiva) {
    alert("Termina a corrida atual antes de mudar o modo.");
    // voltar select para o modo antigo
    const modeSelect = document.getElementById("modeSelect");
    if (modeSelect) modeSelect.value = mode;
    return;
  }
  mode = newMode;
  currentBet = null;
  criarCavalos();
  updateUI();
}

/* ---------- Corrida ---------- */
function iniciarCorrida() {
  if (corridaAtiva) return;

  // Reset posições
  cavalos.forEach(c => (c.posicao = 0));
  corridaAtiva = true;

  // Em ride, precisamos de um cavalo montado
  if (mode === "ride" && indiceCavaloJogador === null) {
    corridaAtiva = false;
    alert("Escolhe um cavalo em cima para montar antes de iniciar.");
    return;
  }

  // Corrida automática com intervalo (menos no multiplayer, onde o movimento vem do teclado)
  clearInterval(intervaloCorrida);
  intervaloCorrida = setInterval(passoCorrida, 60);

  updateUI();
}

function passoCorrida() {
  if (!corridaAtiva) return;

  if (mode === "multiplayer") {
    // No multiplayer o avanço vem só das teclas. Aqui só verificamos se alguém ganhou.
    desenharCavalos();
    const terminou = cavalos.some(c => c.posicao >= DISTANCIA_TOTAL);
    if (terminou) {
      terminarCorrida();
    }
    return;
  }

  // Modos observe / bet / ride
  cavalos.forEach((cavalo, index) => {
    let passo = 0;
    if (mode === "ride" && index === indiceCavaloJogador) {
      // cavalo do jogador não anda sozinho
      passo = 0;
    } else {
      // todos os outros andam random
      passo = Math.floor(Math.random() * 4) + 1; // 1–4
    }
    cavalo.posicao += passo;
  });

  desenharCavalos();

  const terminou = cavalos.some(c => c.posicao >= DISTANCIA_TOTAL);
  if (terminou) {
    terminarCorrida();
  }
}

function terminarCorrida() {
  if (!corridaAtiva) return;
  corridaAtiva = false;
  clearInterval(intervaloCorrida);

  // Ordenar cavalo por posição
  const indices = cavalos.map((_, i) => i);
  indices.sort((a, b) => cavalos[b].posicao - cavalos[a].posicao);

  const primeiro = indices[0];
  const segundo = indices[1];
  const terceiro = indices[2];

  // Atualizar stats (contamos todas as corridas)
  stats.corridas++;
  if (mode !== "multiplayer") {
    if (indiceCavaloJogador === primeiro) stats.vitorias++;
    else if (indiceCavaloJogador === segundo) stats.segundos++;
    else if (indiceCavaloJogador === terceiro) stats.terceiros++;
  } else {
    // multiplayer: jogador 1 é cavalo 0, jogador 2 é cavalo 1
    // Conta vitória como "vitórias" também
    if (primeiro === 0) stats.vitorias++;
    else if (primeiro === 1) stats.segundos++;
  }

  // XP: 20 por corrida, +30 se ganhou (considerando cavalo do jogador ou jogador 1)
  stats.xp += 20;
  if (
    (mode !== "multiplayer" && indiceCavaloJogador === primeiro) ||
    (mode === "multiplayer" && primeiro === 0)
  ) {
    stats.xp += 30;
  }

  // Processar aposta se existir (só em bet / ride)
  processBetResult(indices);

  guardarEstado();
  updateUI();

  alert(
    "Resultados:\n" +
      `1º - ${cavalos[primeiro].nome}\n` +
      (cavalos[segundo]
        ? `2º - ${cavalos[segundo].nome}\n`
        : "") +
      (cavalos[terceiro]
        ? `3º - ${cavalos[terceiro].nome}\n`
        : "") +
      "\nCorrida terminada!"
  );
}

/* ---------- Apostas & Carteira ---------- */
function processBetResult(podiumIndices) {
  if (!currentBet) return;
  if (mode !== "bet" && mode !== "ride") return;

  const betHorse = currentBet.horseIndex;
  const amount = currentBet.amount;
  let multiplier = 0;

  if (betHorse === podiumIndices[0]) multiplier = 10;
  else if (betHorse === podiumIndices[1]) multiplier = 5;
  else if (betHorse === podiumIndices[2]) multiplier = 2.5;

  if (multiplier > 0) {
    const ganho = amount * multiplier;
    walletBalance += ganho;
    showBetMessage(
      `🎉 Ganhou! Recebeste ${ganho.toFixed(
        2
      )} créditos (multiplicador x${multiplier}).`
    );
  } else {
    showBetMessage(
      `Perdeste a aposta de ${amount.toFixed(2)} créditos. Tenta outra vez!`
    );
  }

  currentBet = null;
  updateWalletUI();
}

/* Fazer aposta */
function fazerAposta() {
  if (mode !== "bet" && mode !== "ride") {
    showBetMessage(
      "As apostas só estão disponíveis nos modos 'Apostar' e 'Apostar + Montar'."
    );
    return;
  }

  if (corridaAtiva) {
    showBetMessage("Não podes apostar com a corrida a decorrer.");
    return;
  }

  const horseIndex = Number(
    document.getElementById("betHorseSelect").value
  );
  const amount = Number(
    document.getElementById("betAmount").value
  );

  if (!amount || amount <= 0) {
    showBetMessage("Introduz um valor válido para apostar.");
    return;
  }

  if (amount % 5 !== 0) {
    showBetMessage("O valor da aposta deve ser múltiplo de 5.");
    return;
  }

  if (amount > walletBalance) {
    showBetMessage("Saldo insuficiente na carteira.");
    return;
  }

  if (mode === "ride" && indiceCavaloJogador !== horseIndex) {
    showBetMessage(
      "No modo 'Apostar + Montar', a tua aposta deve ser no cavalo que montas."
    );
    return;
  }

  walletBalance -= amount;
  currentBet = { horseIndex, amount };
  updateWalletUI();
  showBetMessage(
    `Aposta registada: ${amount.toFixed(
      2
    )} créditos no cavalo "${cavalos[horseIndex].nome}".`
  );
}

/* Adicionar dinheiro à carteira */
function adicionarDinheiro() {
  const val = Number(document.getElementById("walletInput").value);
  if (!val || val <= 0) return;
  walletBalance += val;
  document.getElementById("walletInput").value = "";
  updateWalletUI();
  guardarEstado();
}

/* ---------- Controlo por teclado ---------- */
function configurarTeclado() {
  window.addEventListener("keydown", e => {
    if (!corridaAtiva) return;

    if (mode === "ride") {
      if (e.code === "Space") {
        e.preventDefault();
        if (indiceCavaloJogador != null) {
          cavalos[indiceCavaloJogador].posicao += 10;
          desenharCavalos();
          if (cavalos[indiceCavaloJogador].posicao >= DISTANCIA_TOTAL) {
            terminarCorrida();
          }
        }
      }
    } else if (mode === "multiplayer") {
      if (e.code === "Space") {
        e.preventDefault();
        // Jogador 1
        cavalos[0].posicao += 10;
      } else if (e.code === "Enter") {
        e.preventDefault();
        // Jogador 2
        if (cavalos[1]) {
          cavalos[1].posicao += 10;
        }
      } else {
        return;
      }

      desenharCavalos();
      const terminou = cavalos.some(c => c.posicao >= DISTANCIA_TOTAL);
      if (terminou) {
        terminarCorrida();
      }
    }
  });
}

/* ---------- Perfil + Avatar ---------- */
function configurarPerfil() {
  const backdrop = document.getElementById("profileModalBackdrop");
  const openBtn = document.getElementById("openProfileBtn");
  const closeBtn = document.getElementById("closeProfileBtn");
  const avatarInput = document.getElementById("avatarInput");

  // se ainda não existe header (carregado por fetch), sai sem erro
  if (!backdrop || !openBtn || !closeBtn || !avatarInput) return;

  openBtn.addEventListener("click", () => {
    backdrop.style.display = "flex";
    updateUI();
  });

  closeBtn.addEventListener("click", () => {
    backdrop.style.display = "none";
  });

  backdrop.addEventListener("click", e => {
    if (e.target === backdrop) {
      backdrop.style.display = "none";
    }
  });

  avatarInput.addEventListener("change", e => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function (ev) {
      const url = ev.target.result;
      const mini = document.getElementById("miniAvatar");
      const profile = document.getElementById("profileAvatar");
      if (mini) mini.src = url;
      if (profile) profile.src = url;
      localStorage.setItem("corridaAvatar", url);
    };
    reader.readAsDataURL(file);
  });
}

/* ---------- Setup inicial ---------- */
window.addEventListener("DOMContentLoaded", () => {
  carregarEstado();
  criarCavalos();
  updateUI();

  // Eventos
  const modeSelect = document.getElementById("modeSelect");
  if (modeSelect) {
    modeSelect.addEventListener("change", e => setMode(e.target.value));
  }

  const startBtn = document.getElementById("startRaceBtn");
  if (startBtn) {
    startBtn.addEventListener("click", iniciarCorrida);
  }

  const placeBetBtn = document.getElementById("placeBetBtn");
  if (placeBetBtn) {
    placeBetBtn.addEventListener("click", fazerAposta);
  }

  const walletAddBtn = document.getElementById("walletAddBtn");
  if (walletAddBtn) {
    walletAddBtn.addEventListener("click", adicionarDinheiro);
  }

  configurarTeclado();
  configurarPerfil();   // se header ainda não existir, a função só retorna
});
