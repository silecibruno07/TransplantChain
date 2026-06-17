// server.js
// API simple para la demo de TransplantChain (front + back).
// Sirve también el frontend estático, así con un solo "npm start" queda todo arriba.

const express = require("express");
const path = require("path");
const db = require("./data");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, "..", "frontend")));

// ----- Donantes / Órganos -----
app.get("/api/donantes", (req, res) => {
  res.json(db.donantes);
});

app.post("/api/donantes", (req, res) => {
  const { hospitalOrigen, organo, grupoSanguineo } = req.body;
  if (!hospitalOrigen || !organo || !grupoSanguineo) {
    return res.status(400).json({ error: "Faltan campos obligatorios" });
  }
  const nuevo = db.registrarDonante({ hospitalOrigen, organo, grupoSanguineo });
  res.status(201).json(nuevo);
});

// ----- Receptores -----
app.get("/api/receptores", (req, res) => {
  res.json(db.receptores);
});

// ----- Matching / "IA" -----
app.get("/api/matching/:donanteId", (req, res) => {
  const donante = db.donantes.find((d) => d.id === Number(req.params.donanteId));
  if (!donante) {
    return res.status(404).json({ error: "Donante no encontrado" });
  }
  const ranking = db.calcularMatching(donante);
  res.json({ donante, ranking });
});

// ----- Asignaciones (gancho hacia Blockchain) -----
app.get("/api/asignaciones", (req, res) => {
  res.json(db.asignaciones);
});

app.post("/api/asignaciones", (req, res) => {
  const { donanteId, receptorId } = req.body;
  try {
    const asignacion = db.confirmarAsignacion({ donanteId, receptorId });
    res.status(201).json(asignacion);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// ----- Dashboard -----
app.get("/api/dashboard", (req, res) => {
  res.json(db.getDashboard());
});

app.listen(PORT, () => {
  console.log(`TransplantChain demo corriendo en http://localhost:${PORT}`);
});
