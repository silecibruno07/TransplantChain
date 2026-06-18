// server.js
// API simple para la demo de TransplantChain (front + back).
// Sirve también el frontend estático, así con un solo "npm start" queda todo arriba.

// Helper para envolver las rutas asíncronas y capturar errores
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch((err) => {
    res.status(500).json({ error: err.message });
  });
};

const express = require("express");
const path = require("path");
const db = require("./data");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, "..", "frontend")));

// ----- Donantes / Órganos -----
app.get("/api/donantes", asyncHandler(async (req, res) => {
  const donantes = await db.getDonantes();
  res.json(donantes);
}));

app.post("/api/donantes", asyncHandler(async (req, res) => {
  const { hospitalOrigen, organo, grupoSanguineo } = req.body;
  if (!hospitalOrigen || !organo || !grupoSanguineo) {
    return res.status(400).json({ error: "Faltan campos obligatorios" });
  }
  const nuevo = await db.registrarDonante({ hospitalOrigen, organo, grupoSanguineo });
  res.status(201).json(nuevo);
}));

// ----- Receptores -----
app.get("/api/receptores", asyncHandler(async (req, res) => {
  const receptores = await db.getReceptores();
  res.json(receptores);
}));

// ----- Matching / "IA" -----
app.get("/api/matching/:donanteId", asyncHandler(async (req, res) => {
  const donante = await db.getDonanteById(req.params.donanteId);
  if (!donante) {
    return res.status(404).json({ error: "Donante no encontrado" });
  }
  const ranking = await db.calcularMatching(donante);
  res.json({ donante, ranking });
}));

// ----- Asignaciones (gancho hacia Blockchain) -----
app.get("/api/asignaciones", asyncHandler(async (req, res) => {
  const asignaciones = await db.getAsignaciones();
  res.json(asignaciones);
}));

app.post("/api/asignaciones", asyncHandler(async (req, res) => {
  const { donanteId, receptorId } = req.body;
  try {
    const asignacion = await db.confirmarAsignacion({ donanteId, receptorId });
    res.status(201).json(asignacion);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}));

// ----- Dashboard -----
app.get("/api/dashboard", asyncHandler(async (req, res) => {
  const dashboardData = await db.getDashboard();
  res.json(dashboardData);
}));

app.listen(PORT, () => {
  console.log(`TransplantChain demo corriendo en http://localhost:${PORT}`);
});
