// data.js
// Lógica de "IA" simplificada (compatibilidad y priorización).
// Conectado a MySQL para persistencia de datos (antes era un boceto en memoria).
// En la versión real, esta capa podría seguir en MySQL o migrar a PostgreSQL
// y a un modelo entrenado (Scikit-Learn/TensorFlow) para el matching.

const crypto = require("crypto");
const mysql = require("mysql2/promise");

// --- Configuración de la Conexión a la Base de Datos ---
const dbConfig = {
  host: "localhost",
  user: "root", // Usuario por defecto en XAMPP
  password: "", // Contraseña por defecto en XAMPP es vacía
  database: "transplantchain",
};

// Creamos un "pool" de conexiones para reutilizarlas y mejorar el rendimiento.
const pool = mysql.createPool(dbConfig);

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

// --- Funciones de acceso a datos (asíncronas, vía MySQL) ---

async function getDonantes() {
  const [rows] = await pool.query("SELECT * FROM donantes ORDER BY id DESC");
  return rows;
}

async function getDonanteById(id) {
  const [rows] = await pool.query("SELECT * FROM donantes WHERE id = ?", [id]);
  return rows[0];
}

async function getReceptores() {
  const [rows] = await pool.query("SELECT * FROM receptores ORDER BY id");
  return rows;
}

async function getAsignaciones() {
  const [rows] = await pool.query("SELECT * FROM asignaciones ORDER BY id DESC");
  return rows;
}

// ----------------------------------------------------------------------
// "Motor de IA" simplificado: filtra por compatibilidad y calcula un score
// de prioridad. En producción esto se reemplaza por el módulo real de IA
// (Semana 3 del cronograma del dossier).
// ----------------------------------------------------------------------
async function calcularMatching(donante) {
  const compatibles = COMPATIBILIDAD[donante.grupoSanguineo] || [];
  const placeholders = compatibles.map(() => "?").join(","); // -> ?,?,?

  const query = `
    SELECT * FROM receptores
    WHERE organoNecesitado = ? AND grupoSanguineo IN (${placeholders})
  `;
  const params = [donante.organo, ...compatibles];

  const [receptores] = await pool.query(query, params);

  return receptores
    .map((r) => {
      // Score simple: más urgencia y más tiempo de espera suman, más distancia resta.
      const score =
        r.urgencia * 6 + r.diasEspera * 0.08 - r.distanciaKm * 0.3;
      return { ...r, score: Math.round(score * 10) / 10 };
    })
    .sort((a, b) => b.score - a.score)
    .map((r, index) => ({ ranking: index + 1, ...r }));
}

async function registrarDonante({ hospitalOrigen, organo, grupoSanguineo }) {
  const query = `
    INSERT INTO donantes (hospitalOrigen, organo, grupoSanguineo, horaExtraccion, estado)
    VALUES (?, ?, ?, ?, ?)
  `;
  const params = [hospitalOrigen, organo, grupoSanguineo, new Date(), "Disponible"];
  const [result] = await pool.query(query, params);

  const [newDonante] = await pool.query("SELECT * FROM donantes WHERE id = ?", [
    result.insertId,
  ]);
  return newDonante[0];
}

async function confirmarAsignacion({ donanteId, receptorId }) {
  const [donantes] = await pool.query("SELECT * FROM donantes WHERE id = ?", [donanteId]);
  const donante = donantes[0];

  const [receptores] = await pool.query("SELECT * FROM receptores WHERE id = ?", [receptorId]);
  const receptor = receptores[0];

  if (!donante || !receptor) {
    throw new Error("Donante o receptor no encontrado");
  }
  if (donante.estado === "Asignado") {
    throw new Error("Este órgano ya fue asignado");
  }

  // Actualizar estado del donante
  await pool.query("UPDATE donantes SET estado = 'Asignado' WHERE id = ?", [donanteId]);

  const score = receptor.urgencia * 6 + receptor.diasEspera * 0.08 - receptor.distanciaKm * 0.3;

  // ------------------------------------------------------------------
  // PUNTO DE INTEGRACIÓN CON BLOCKCHAIN
  // Acá es donde, en la versión final, se llama al módulo de Jose
  // (Hyperledger Fabric / chaincode) para anclar esta asignación de forma
  // inmutable. Por ahora se simula generando un hash, para poder mostrar
  // el flujo completo en la demo.
  // ------------------------------------------------------------------
  const hashSimulado = crypto.randomBytes(32).toString("hex");

  const asignacionData = {
    donanteId,
    receptorId,
    fecha: new Date(),
    organo: donante.organo,
    hospitalOrigen: donante.hospitalOrigen,
    receptor: receptor.nombre,
    hospitalDestino: receptor.hospital,
    score: Math.round(score * 10) / 10,
    txHash: hashSimulado,
    estadoBlockchain: "Simulado (pendiente módulo Hyperledger)",
  };

  const query = "INSERT INTO asignaciones SET ?";
  const [result] = await pool.query(query, asignacionData);

  const [newAsignacion] = await pool.query("SELECT * FROM asignaciones WHERE id = ?", [
    result.insertId,
  ]);
  return newAsignacion[0];
}

async function getDashboard() {
  const [[{ totalDonantes }]] = await pool.query("SELECT COUNT(*) as totalDonantes FROM donantes");
  const [[{ organosDisponibles }]] = await pool.query("SELECT COUNT(*) as organosDisponibles FROM donantes WHERE estado = 'Disponible'");
  const [[{ pacientesEnEspera }]] = await pool.query("SELECT COUNT(*) as pacientesEnEspera FROM receptores");
  const [[{ trasplantesConfirmados }]] = await pool.query("SELECT COUNT(*) as trasplantesConfirmados FROM asignaciones");

  return {
    totalDonantes,
    organosDisponibles,
    pacientesEnEspera,
    trasplantesConfirmados,
  };
}

module.exports = {
  getDonantes,
  getDonanteById,
  getReceptores,
  getAsignaciones,
  calcularMatching,
  registrarDonante,
  confirmarAsignacion,
  getDashboard,
};
