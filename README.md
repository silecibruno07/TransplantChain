# TransplantChain — Demo Front + Back (boceto para el hackatón)

Boceto funcional simple del front y el back de TransplantChain, pensado para mostrarse en vivo durante la presentación. Implementa el flujo descrito en el dossier (registro de donante/órgano → análisis de compatibilidad y prioridad → asignación → punto de envío a Blockchain), simulando las partes que todavía no están integradas (IA real y red Hyperledger Fabric).

## Cómo correrlo

Esta versión usa **MySQL** para persistir los datos (antes vivían en memoria). Hace falta tener un servidor MySQL corriendo localmente — la forma más simple es con **XAMPP** (incluye MySQL/MariaDB + phpMyAdmin).

1. Instalar y arrancar MySQL (por ejemplo, abrir el panel de XAMPP y arrancar el módulo "MySQL").
2. Crear la base de datos y las tablas con el script incluido:
   ```bash
   mysql -u root < backend/schema.sql
   ```
   (o, desde phpMyAdmin: **Importar** → seleccionar `backend/schema.sql`). Esto crea la base `transplantchain` con las tablas `donantes`, `receptores` y `asignaciones`, y las deja precargadas con los mismos datos de ejemplo que antes estaban hardcodeados.
3. Si tu MySQL local no usa usuario `root` sin contraseña, ajustar `dbConfig` en `backend/data.js`.
4. Levantar el backend:
   ```bash
   cd backend
   npm install
   npm start
   ```

Abrir **http://localhost:3000** en el navegador. El mismo servidor de Node sirve el frontend, así que no hace falta levantar nada más.

## Qué incluye

- **Dashboard**: métricas generales y una tabla de "asignaciones confirmadas" que simula el registro inmutable de la blockchain.
- **Registrar Donante/Órgano**: formulario para dar de alta un nuevo órgano disponible (hospital de origen, tipo de órgano, grupo sanguíneo).
- **Lista de Pacientes**: al elegir un órgano disponible, se calcula automáticamente el ranking de receptores compatibles (compatibilidad sanguínea real + score de prioridad por urgencia, tiempo de espera y distancia). El botón **"Confirmar y enviar a Blockchain"** cierra la asignación.

## Qué es simulado (a propósito)

- El **score de prioridad** es una fórmula simple (`urgencia × 6 + días de espera × 0.08 − distancia × 0.3`), no el modelo de IA real (eso es la Semana 3 del cronograma del dossier).
- El **envío a blockchain** genera un hash aleatorio y lo muestra como si fuera el `tx hash` de Hyperledger Fabric. El punto exacto donde se debe enganchar el módulo real está marcado en `backend/data.js`, función `confirmarAsignacion()`, en el comentario `PUNTO DE INTEGRACIÓN CON BLOCKCHAIN`.
- Los datos viven en MySQL (base `transplantchain`, ver `backend/schema.sql`). Ya no se pierden al reiniciar el servidor, pero sí hay que tener MySQL corriendo y la base creada de antemano.

## Estructura

```
backend/
  server.js      → API REST (Express)
  data.js        → acceso a MySQL + lógica de matching
  schema.sql     → tablas y datos semilla para MySQL
  package.json
frontend/
  index.html     → 3 vistas (Dashboard, Registro, Pacientes)
  styles.css
  app.js         → fetch a la API + render
```

## Para integrar con el módulo de blockchain real

En `backend/data.js`, dentro de `confirmarAsignacion()`, donde dice `hashSimulado`, ahí se debería invocar el chaincode/SDK de Hyperledger Fabric para anclar la asignación (y opcionalmente el alta del donante) de forma inmutable, en lugar de generar un hash aleatorio.
