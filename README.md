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
3. Copiar el archivo de ejemplo y ajustar la conexión si es necesario:
   ```bash
   cd backend
   copy .env.example .env
   ```
   Luego modifícalo con tus datos de MySQL/MariaDB si no usas `root` sin contraseña.
4. Levantar el backend:
   ```bash
   cd backend
   npm install
   npm start
   ```

Abrir **http://localhost:3000** en el navegador. El mismo servidor de Node sirve el frontend, así que no hace falta levantar nada más.

### Compartir la aplicación con otras personas

- Si todo está en tu PC y accedes solo con `localhost:3000`, solo tú podrás verlo desde tu navegador.
- Para que otras personas vean los datos, necesitas dos cosas:
  1. Una base de datos accesible desde fuera de tu PC (`DB_HOST` puede ser una IP o un host remoto).
  2. Un backend accesible desde la red. Puede ser tu PC con IP pública/puerto abierto o un servidor en la nube.
- Si solo quieres compartir la base de datos pero no el backend, no alcanza: el frontend consume `/api` del backend, así que el backend también debe estar disponible.

### Usar un servidor de base de datos compartido

Puedes usar un servicio de base de datos remota (o `Subbase` si tienen ese servicio) poniendo su host, puerto, usuario, contraseña y nombre en `backend/.env`:

```ini
DB_HOST=mi-host-remoto
DB_PORT=3306
DB_USER=usuario
DB_PASSWORD=secreto
DB_NAME=transplantchain
```

Si tu proveedor te da una URL de conexión, usa los valores de host, puerto, usuario y contraseña que te proporcionen.

Luego reinicia el backend. Si el backend está en la misma máquina que la base de datos, puedes dejar `DB_HOST=localhost`.

#### Importar la base en Subbase

1. Copia el archivo de esquema al servidor local o usa tu terminal.
2. Si tenés acceso `mysql` desde tu PC, ejecuta:
   ```bash
   mysql -h <SUBBASE_HOST> -P <SUBBASE_PORT> -u <SUBBASE_USER> -p <SUBBASE_DB> < backend/schema.sql
   ```
   Te pedirá la contraseña.
3. Si Subbase tiene consola web, podés usar la opción de importar SQL y cargar `backend/schema.sql` directamente.
4. Después de importar, configura `backend/.env` con los datos de Subbase y reinicia el backend.

Ejemplo de `.env` para Subbase:

```ini
DB_HOST=subbase.tuempresa.com
DB_PORT=3306
DB_USER=usuario_subbase
DB_PASSWORD=mi_contraseña
DB_NAME=transplantchain
```

Con esto la base de datos estará compartida y no solo tú verás los datos si también expones el backend al resto del equipo.

### Integración funcional con Hedera

Para probar Hedera Testnet con esta demo, completa `backend/.env` con:

```ini
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=
DB_NAME=transplantchain
JWT_SECRET=replace_with_a_strong_random_secret
HEDERA_NETWORK=testnet
HEDERA_ACCOUNT_ID=0.0.xxxx
HEDERA_PRIVATE_KEY=302e020100300506032b657004220420...
```

Luego crea un topic con el comando:

```bash
cd backend
npm run create-hedera-topic
```

El script imprimirá el `HEDERA_TOPIC_ID`. Copialo y agrégalo a `backend/.env`:

```ini
HEDERA_TOPIC_ID=0.0.yyyy
```

Arranca el backend con:

```bash
npm start
```

Y verificá el estado de Hedera con:

```bash
curl http://localhost:3000/api/hedera/status
```

Si está configurado correctamente, el backend usará Hedera cada vez que confirmes una asignación.

### Login y roles

Esta versión incluye ahora:

- login de administrador y hospitales
- roles `admin` y `hospital`
- control de acceso para registrar donantes, pacientes y asignaciones
- filtrado de datos por hospital cuando el usuario es hospital

Las credenciales seed son:

- admin: `admin@transplantchain.local` / `admin123`
- Hospital Italiano: `italiano@transplantchain.local` / `hospital123`
- Hospital de Clínicas: `clinicas@transplantchain.local` / `hospital123`
- Hospital Austral: `austral@transplantchain.local` / `hospital123`

El servidor crea estos usuarios automáticamente la primera vez que arranca.

## Qué incluye

- **Dashboard**: métricas generales y una tabla de "asignaciones confirmadas" que simula el registro inmutable de la blockchain.
- **Registrar Donante/Órgano**: formulario para dar de alta un nuevo órgano disponible (hospital de origen, tipo de órgano, grupo sanguíneo).
- **Lista de Pacientes**: al elegir un órgano disponible, se calcula automáticamente el ranking de receptores compatibles (compatibilidad sanguínea real + score de prioridad por urgencia, tiempo de espera y distancia). El botón **"Confirmar y enviar a Blockchain"** cierra la asignación.

## Qué es simulado (a propósito)

- El **score de prioridad** es una fórmula simple (`urgencia × 6 + días de espera × 0.08 − distancia × 0.3`), no el modelo de IA real (eso es la Semana 3 del cronograma del dossier).
- El **envío a blockchain** ya puede integrarse con Hedera: si configuras `HEDERA_ACCOUNT_ID`, `HEDERA_PRIVATE_KEY` y `HEDERA_TOPIC_ID` en `backend/.env`, el backend intentará enviar un mensaje a la red Hedera Testnet en vez de usar solamente un hash aleatorio.
- Si no se configura Hedera, la demo sigue funcionando como antes y solo genera una txHash simulado.
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

En `backend/data.js`, dentro de `confirmarAsignacion()`, el proceso ahora puede enviar un mensaje a Hedera si configuras:

- `HEDERA_NETWORK` (por ejemplo `testnet`)
- `HEDERA_ACCOUNT_ID`
- `HEDERA_PRIVATE_KEY`
- `HEDERA_TOPIC_ID`

Si estas variables están presentes, el backend intentará registrar la asignación como mensaje en Hedera. Si no están, seguirá funcionando en modo demo y guardará un hash simulado.

Para usarlo con Hedera, crea un topic en Hedera Testnet y copia el `topicId` y las credenciales a `backend/.env`.
