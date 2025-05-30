const form = document.getElementById("instrumentForm");
const nameInput = document.getElementById("instrumentName");
const clientInput = document.getElementById("clientName");
const descriptionInput = document.getElementById("description");

const columns = {
  aguardando: document.querySelector("#aguardando .cards"),
  "em-servico": document.querySelector("#em-servico .cards"),
  "em-garantia": document.querySelector("#em-garantia .cards"),
  crm: document.querySelector("#crm .cards")
};

const counts = {
  aguardando: document.getElementById("count-aguardando"),
  "em-servico": document.getElementById("count-em-servico"),
  "em-garantia": document.getElementById("count-em-garantia"),
  crm: document.getElementById("count-crm")
};

let instruments = [];

// Base da URL da API
const API_BASE = "https://meu-backend.onrender.com";

// Função para buscar os instrumentos do backend
async function fetchInstruments() {
  try {
    const res = await fetch(`${API_BASE}/instrumentos`);
    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }
    instruments = await res.json();
    render();
  } catch (err) {
    console.error("Erro ao buscar instrumentos:", err);
  }
}

// Atualiza o status do instrumento chamando o endpoint específico
async function updateStatus(id, newStatus) {
  try {
    const res = await fetch(`${API_BASE}/instrumentos/${id}/status`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus })
    });
    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }
    return res.json();
  } catch (err) {
    console.error("Erro ao atualizar status:", err);
  }
}

// Função para excluir um instrumento
async function deleteInstrument(id) {
  try {
    const res = await fetch(`${API_BASE}/instrumentos/${id}`, { method: "DELETE" });
    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }
    fetchInstruments();
  } catch (err) {
    console.error("Erro ao excluir instrumento:", err);
  }
}

// Cria um novo instrumento, utilizando o formulário se existir
if (form) {
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const name = nameInput.value.trim();
    const client = clientInput.value.trim();
    const description = descriptionInput.value.trim();
    const status = "aguardando"; // Status inicial

    if (!name || !client) return;

    const instrument = {
      name,
      client,
      description,
      status,
      history: [{ status, date: new Date().toISOString() }]
    };

    try {
      const res = await fetch(`${API_BASE}/instrumentos`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(instrument)
      });
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      nameInput.value = "";
      clientInput.value = "";
      descriptionInput.value = "";
      fetchInstruments();
    } catch (err) {
      console.error("Erro ao adicionar instrumento:", err);
    }
  });
}

// Renderiza os instrumentos nas respectivas colunas conforme seu status
function render() {
  Object.values(columns).forEach((col) => {
    if (col) col.innerHTML = "";
  });

  const grouped = {
    aguardando: [],
    "em-servico": [],
    "em-garantia": [],
    crm: []
  };

  instruments.forEach((inst) => {
    if (grouped[inst.status]) {
      grouped[inst.status].push(inst);
    }
  });

  const totalProdElem = document.getElementById("total-produtos");
  if (totalProdElem) {
    const totalGeral = grouped["aguardando"].length + grouped["em-servico"].length;
    totalProdElem.innerText = `Total produtos: ${totalGeral}`;
  }

  if (columns.aguardando && columns["em-servico"]) {
    grouped["aguardando"].forEach((inst) =>
      addInstrumentCard("aguardando", inst)
    );
    grouped["em-servico"].forEach((inst) =>
      addInstrumentCard("em-servico", inst)
    );
    counts["aguardando"].innerText = `Total: ${grouped["aguardando"].length}`;
    counts["em-servico"].innerText = `Total: ${grouped["em-servico"].length}`;
  }

  if (columns["em-garantia"]) {
    grouped["em-garantia"].forEach((inst) =>
      addInstrumentCard("em-garantia", inst)
    );
    counts["em-garantia"].innerText = `Total: ${grouped["em-garantia"].length}`;
  }

  if (columns.crm) {
    grouped["crm"].forEach((inst) =>
      addInstrumentCard("crm", inst)
    );
    counts.crm.innerText = `Total: ${grouped["crm"].length}`;
  }
}

// Cria o card para cada instrumento, incluindo o select drop-down, botão de exclusão e histórico de datas
function addInstrumentCard(status, inst) {
  const col = columns[status];
  const card = document.createElement("div");
  card.className = `card ${status}`;
  const lastStatus = inst.history[inst.history.length - 1];
  card.innerHTML = `
    <strong>${inst.name}</strong><br/>
    Cliente: ${inst.client}<br/>
    <em>${inst.description}</em><br/>
    <span class="date">
      Status: ${inst.status.replace("-", " ")}<br>
      Data: ${new Date(lastStatus.date).toLocaleString("pt-BR")}
    </span>
  `;
  
  // Adiciona o event listener ao card para avanço de status via clique (exceto se clicar no select ou botão)
  card.addEventListener("click", () => {
    advanceStatus(inst._id);
  });
  
  // Cria o select drop-down com as opções de status
  const select = document.createElement("select");
  const statuses = ["aguardando", "em-servico", "em-garantia", "crm"];
  statuses.forEach((s) => {
    const option = document.createElement("option");
    option.value = s;
    option.textContent = s.charAt(0).toUpperCase() + s.slice(1);
    if (s === inst.status) {
      option.selected = true;
    }
    select.appendChild(option);
  });
  
  // Impede que cliques no select disparem o clique do card
  select.addEventListener("click", (e) => {
    e.stopPropagation();
  });
  
  // Ao alterar o select, atualiza o status e redireciona se necessário
  select.addEventListener("change", async () => {
    await updateStatus(inst._id, select.value);
    if (select.value === "em-garantia" && !window.location.pathname.includes("garantia.html")) {
      window.location.href = "garantia.html";
    } else if (select.value === "crm" && !window.location.pathname.includes("crm.html")) {
      window.location.href = "crm.html";
    } else if ((select.value === "aguardando" || select.value === "em-servico") &&
               !window.location.pathname.includes("index.html")) {
      window.location.href = "index.html";
    } else {
      fetchInstruments();
    }
  });
  
  // Cria o botão de exclusão
  const deleteBtn = document.createElement("button");
  deleteBtn.textContent = "Excluir";
  deleteBtn.style.marginTop = "10px";
  deleteBtn.style.backgroundColor = "#f44336";
  deleteBtn.style.color = "#fff";
  deleteBtn.style.border = "none";
  deleteBtn.style.padding = "5px 10px";
  deleteBtn.style.cursor = "pointer";
  deleteBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    if (confirm("Deseja realmente excluir este instrumento?")) {
      deleteInstrument(inst._id);
    }
  });
  const hist = document.createElement("p");
  hist.textContent = "Histórico de alteração:"
  // Adiciona o select e o botão ao card
  card.appendChild(document.createElement("br"));
  card.appendChild(select);
  card.appendChild(document.createElement("br"));
  card.appendChild(deleteBtn);
  card.appendChild(hist);
  
  // Cria e adiciona a lista de histórico
  const historyList = document.createElement("ul");
  historyList.className = "history-list";
  inst.history.forEach((entry) => {
    const li = document.createElement("li");
    li.textContent = `${entry.status}: ${new Date(entry.date).toLocaleString("pt-BR")}`;
    historyList.appendChild(li);
  });
  card.appendChild(historyList);
  
  col.appendChild(card);
}

// Função para avançar o status (via clique no card)
async function advanceStatus(id) {
  try {
    const res = await fetch(`${API_BASE}/instrumentos/${id}/advance`, {
      method: "PUT"
    });
    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }
    fetchInstruments();
  } catch (err) {
    console.error("Erro ao avançar status:", err);
  }
}

// Inicializa a aplicação e configura atualização periódica
fetchInstruments();
setInterval(fetchInstruments, 60000);