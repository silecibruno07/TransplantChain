// app.js
// Lógica de la demo: navegación entre vistas + llamadas a la API del backend.

const API = "/api";

// ---------------------------------------------------------------------
// Navegación entre tabs/vistas
// ---------------------------------------------------------------------
document.querySelectorAll(".tab-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".tab-btn").forEach((b) => b.classList.remove("active"));
    document.querySelectorAll(".view").forEach((v) => v.classList.remove("active"));
    btn.classList.add("active");
    document.getElementById(`view-${btn.dataset.view}`).classList.add("active");

    if (btn.dataset.view === "dashboard") cargarDashboard();
    if (btn.dataset.view === "registro") cargarDonantes();
    if (btn.dataset.view === "pacientes") cargarSelectOrganos();
  });
});

// ---------------------------------------------------------------------
// DASHBOARD
// ---------------------------------------------------------------------
async function cargarDashboard() {
  const stats = await fetch(`${API}/dashboard`).then((r) => r.json());
  document.getElementById("stat-donantes").textContent = stats.totalDonantes;
  document.getElementById("stat-disponibles").textContent = stats.organosDisponibles;
  document.getElementById("stat-pacientes").textContent = stats.pacientesEnEspera;
  document.getElementById("stat-confirmados").textContent = stats.trasplantesConfirmados;

  const asignaciones = await fetch(`${API}/asignaciones`).then((r) => r.json());
  const tbody = document.getElementById("tabla-asignaciones");

  if (asignaciones.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" class="empty-row">Todavía no hay asignaciones confirmadas.</td></tr>`;
    return;
  }

  tbody.innerHTML = asignaciones
    .slice()
    .reverse()
    .map(
      (a) => `
      <tr>
        <td>${new Date(a.fecha).toLocaleString()}</td>
        <td>${a.organo}</td>
        <td>${a.receptor}</td>
        <td>${a.hospitalDestino}</td>
        <td class="hash-cell">${a.txHash.slice(0, 14)}...</td>
        <td>${a.estadoBlockchain}</td>
      </tr>`
    )
    .join("");
}

// ---------------------------------------------------------------------
// REGISTRO DE DONANTE / ÓRGANO
// ---------------------------------------------------------------------
document.getElementById("form-donante").addEventListener("submit", async (e) => {
  e.preventDefault();
  const body = {
    hospitalOrigen: document.getElementById("input-hospital").value,
    organo: document.getElementById("input-organo").value,
    grupoSanguineo: document.getElementById("input-grupo").value,
  };

  const res = await fetch(`${API}/donantes`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  const msg = document.getElementById("registro-msg");
  if (res.ok) {
    msg.textContent = "Donante/órgano registrado correctamente.";
    document.getElementById("form-donante").reset();
    cargarDonantes();
  } else {
    msg.textContent = "Hubo un error al registrar.";
  }
});

async function cargarDonantes() {
  const donantes = await fetch(`${API}/donantes`).then((r) => r.json());
  const tbody = document.getElementById("tabla-donantes");
  tbody.innerHTML = donantes
    .map(
      (d) => `
      <tr>
        <td>${d.id}</td>
        <td>${d.hospitalOrigen}</td>
        <td>${d.organo}</td>
        <td>${d.grupoSanguineo}</td>
        <td><span class="estado-badge ${d.estado === "Disponible" ? "estado-disponible" : "estado-asignado"}">${d.estado}</span></td>
      </tr>`
    )
    .join("");
}

// ---------------------------------------------------------------------
// LISTA DE PACIENTES / MATCHING
// ---------------------------------------------------------------------
async function cargarSelectOrganos() {
  const donantes = await fetch(`${API}/donantes`).then((r) => r.json());
  const disponibles = donantes.filter((d) => d.estado === "Disponible");
  const select = document.getElementById("select-organo-disponible");

  if (disponibles.length === 0) {
    select.innerHTML = `<option value="">No hay órganos disponibles</option>`;
    document.getElementById("tabla-matching").innerHTML =
      `<tr><td colspan="9" class="empty-row">No hay órganos disponibles en este momento.</td></tr>`;
    return;
  }

  select.innerHTML = disponibles
    .map((d) => `<option value="${d.id}">#${d.id} · ${d.organo} (${d.grupoSanguineo}) · ${d.hospitalOrigen}</option>`)
    .join("");

  select.onchange = () => cargarMatching(select.value);
  cargarMatching(select.value);
}

async function cargarMatching(donanteId) {
  if (!donanteId) return;
  const data = await fetch(`${API}/matching/${donanteId}`).then((r) => r.json());
  const tbody = document.getElementById("tabla-matching");

  if (!data.ranking || data.ranking.length === 0) {
    tbody.innerHTML = `<tr><td colspan="9" class="empty-row">No hay receptores compatibles para este órgano.</td></tr>`;
    return;
  }

  tbody.innerHTML = data.ranking
    .map(
      (r, i) => `
      <tr class="${i === 0 ? "row-best" : ""}">
        <td>${r.ranking}</td>
        <td>${r.nombre}</td>
        <td>${r.hospital}</td>
        <td>${r.grupoSanguineo}</td>
        <td>${r.urgencia}/10</td>
        <td>${r.diasEspera}</td>
        <td>${r.distanciaKm} km</td>
        <td><strong>${r.score}</strong></td>
        <td>
          <button class="secondary" onclick="confirmarAsignacion(${data.donante.id}, ${r.id})">
            Confirmar y enviar a Blockchain
          </button>
        </td>
      </tr>`
    )
    .join("");
}

// ---------------------------------------------------------------------
// CONFIRMAR ASIGNACIÓN (gancho hacia el módulo de Blockchain)
// ---------------------------------------------------------------------
async function confirmarAsignacion(donanteId, receptorId) {
  const res = await fetch(`${API}/asignaciones`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ donanteId, receptorId }),
  });

  if (!res.ok) {
    const err = await res.json();
    alert(`No se pudo confirmar: ${err.error}`);
    return;
  }

  const asignacion = await res.json();
  mostrarModal(asignacion);
  cargarSelectOrganos();
}

function mostrarModal(asignacion) {
  document.getElementById("modal-texto").textContent =
    `${asignacion.organo} asignado a ${asignacion.receptor} (${asignacion.hospitalDestino}). La lista de pacientes ya quedó preparada para anclarse en la red Blockchain.`;
  document.querySelector(".modal-hash").textContent = `tx hash (simulado): ${asignacion.txHash}`;
  document.getElementById("modal-confirmacion").classList.remove("hidden");
}

document.getElementById("modal-cerrar").addEventListener("click", () => {
  document.getElementById("modal-confirmacion").classList.add("hidden");
});

// ---------------------------------------------------------------------
// Carga inicial
// ---------------------------------------------------------------------
cargarDashboard();
