// data.js
// Datos en memoria + lógica de "IA" simplificada (compatibilidad y priorización).
// Esto es un boceto para la demo del hackatón: en la versión real, esta capa
// se conectaría a PostgreSQL (datos clínicos) y a un modelo entrenado (Scikit-Learn/TensorFlow).

const crypto = require("crypto");

// ----------------------------------------------------------------------
// Compatibilidad sanguínea simplificada (donante -> receptores compatibles)
// ----------------------------------------------------------------------
const COMPATIBILIDAD = {
  "O-": ["O-", "O+", "A-", "A+", "B-", "B+", "AB-", "AB+"], // donante universal
  "O+": ["O+", "A+", "B+", "AB+"],
  "A-": ["A-", "A+", "AB-", "AB+"],
  "A+": ["A+", "AB+"],
  "B-": ["B-", "B+", "AB-", "AB+"],
  "B+": ["B+", "AB+"],
  "AB-": ["AB-", "AB+"],
  "AB+": ["AB+"],
};

// ----------------------------------------------------------------------
// Datos de ejemplo (semilla) para que la demo se vea viva desde el arranque
// ----------------------------------------------------------------------
let donantes = [
  {
    id: 1,
    hospitalOrigen: "Hospital Italiano",
    organo: "Riñón",
    grupoSanguineo: "O+",
    horaExtraccion: new Date().toISOString(),
    estado: "Disponible", // Disponible | Asignado
  },
  {
    id: 2,
    hospitalOrigen: "Hospital de Clínicas",
    organo: "Hígado",
    grupoSanguineo: "A-",
    horaExtraccion: new Date().toISOString(),
    estado: "Disponible",
  },
];

let receptores = [
  { id: 1, nombre: "Paciente A. Gómez", organoNecesitado: "Riñón", grupoSanguineo: "O+", urgencia: 9, diasEspera: 210, distanciaKm: 12, hospital: "Hospital Italiano" },
  { id: 2, nombre: "Paciente B. Fernández", organoNecesitado: "Riñón", grupoSanguineo: "A+", urgencia: 6, diasEspera: 95, distanciaKm: 40, hospital: "Hospital Austral" },
  { id: 3, nombre: "Paciente C. Rodríguez", organoNecesitado: "Riñón", grupoSanguineo: "O-", urgencia: 8, diasEspera: 300, distanciaKm: 8, hospital: "Hospital Italiano" },
  { id: 4, nombre: "Paciente D. Silva", organoNecesitado: "Hígado", grupoSanguineo: "O-", urgencia: 10, diasEspera: 150, distanciaKm: 25, hospital: "Hospital de Clínicas" },
  { id: 5, nombre: "Paciente E. Torres", organoNecesitado: "Hígado", grupoSanguineo: "A-", urgencia: 5, diasEspera: 60, distanciaKm: 5, hospital: "Hospital de Clínicas" },
  { id: 6, nombre: "Paciente F. Acosta", organoNecesitado: "Corazón", grupoSanguineo: "B+", urgencia: 7, diasEspera: 180, distanciaKm: 60, hospital: "Hospital Austral" },
];

let asignaciones = []; // Historial de asignaciones confirmadas (simula lo que ya quedó "en la blockchain")

let nextDonorId = donantes.length + 1;
let nextAsignacionId = 1;

// ----------------------------------------------------------------------
// "Motor de IA" simplificado: filtra por compatibilidad y calcula un score
// de prioridad. En producción esto se reemplaza por el módulo real de IA
// (Semana 3 del cronograma del dossier).
// ----------------------------------------------------------------------
function calcularMatching(donante) {
  const compatibles = COMPATIBILIDAD[donante.grupoSanguineo] || [];

  return receptores
    .filter(
      (r) =>
        r.organoNecesitado === donante.organo &&
        compatibles.includes(r.grupoSanguineo)
    )
    .map((r) => {
      // Score simple: más urgencia y más tiempo de espera suman, más distancia resta.
      const score =
        r.urgencia * 6 + r.diasEspera * 0.08 - r.distanciaKm * 0.3;
      return { ...r, score: Math.round(score * 10) / 10 };
    })
    .sort((a, b) => b.score - a.score)
    .map((r, index) => ({ ranking: index + 1, ...r }));
}

function registrarDonante({ hospitalOrigen, organo, grupoSanguineo }) {
  const nuevo = {
    id: nextDonorId++,
    hospitalOrigen,
    organo,
    grupoSanguineo,
    horaExtraccion: new Date().toISOString(),
    estado: "Disponible",
  };
  donantes.push(nuevo);
  return nuevo;
}

function confirmarAsignacion({ donanteId, receptorId }) {
  const donante = donantes.find((d) => d.id === Number(donanteId));
  const receptor = receptores.find((r) => r.id === Number(receptorId));
  if (!donante || !receptor) {
    throw new Error("Donante o receptor no encontrado");
  }
  if (donante.estado === "Asignado") {
    throw new Error("Este órgano ya fue asignado");
  }

  donante.estado = "Asignado";

  // ------------------------------------------------------------------
  // PUNTO DE INTEGRACIÓN CON BLOCKCHAIN
  // Acá es donde, en la versión final, se llama al módulo de Jose
  // (Hyperledger Fabric / chaincode) para anclar esta asignación de forma
  // inmutable. Por ahora se simula generando un hash, para poder mostrar
  // el flujo completo en la demo.
  // ------------------------------------------------------------------
  const hashSimulado = crypto.randomBytes(32).toString("hex");

  const asignacion = {
    id: nextAsignacionId++,
    fecha: new Date().toISOString(),
    organo: donante.organo,
    hospitalOrigen: donante.hospitalOrigen,
    receptor: receptor.nombre,
    hospitalDestino: receptor.hospital,
    score: receptor.urgencia * 6 + receptor.diasEspera * 0.08 - receptor.distanciaKm * 0.3,
    txHash: hashSimulado,
    estadoBlockchain: "Simulado (pendiente módulo Hyperledger)",
  };

  asignaciones.push(asignacion);
  return asignacion;
}

function getDashboard() {
  return {
    totalDonantes: donantes.length,
    organosDisponibles: donantes.filter((d) => d.estado === "Disponible").length,
    pacientesEnEspera: receptores.length,
    trasplantesConfirmados: asignaciones.length,
  };
}

module.exports = {
  donantes,
  receptores,
  asignaciones,
  calcularMatching,
  registrarDonante,
  confirmarAsignacion,
  getDashboard,
};
