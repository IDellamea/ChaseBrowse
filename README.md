# Navegador (React + Vite + Electron)

Esta aplicación es un pequeño navegador basado en Electron que usa React y Vite para la interfaz. Cada "pestaña" carga una URL en un <webview> (Chromium embebido) por lo que la app puede abrir sitios y navegar directamente en Internet sin necesidad de un backend.

Resumen rápido
- Interfaz: React + Vite
- Contenedor de escritorio: Electron (con webview)
- Persistencia: las pestañas abiertas se guardan localmente en el directorio de usuario (ver abajo)

Características principales
- Crear y cerrar pestañas que cargan URLs reales.
- Editar la etiqueta (nombre) de cada pestaña en la UI.
- Elegir color de cabecera por pestaña.
- Persistencia automática de la lista de pestañas en disco.

¿Necesito backend?
- No para navegar: las pestañas y el webview acceden directamente a Internet.
- Sí necesitas backend si quieres centralizar datos, ocultar claves API, evitar CORS en peticiones fetch o procesar datos sensibles.

Dónde se guardan las pestañas
- En Windows la app guarda un archivo `tabs.json` en:

	%APPDATA%\Navegador\tabs.json

	(equivalente a `app.getPath('userData')` en Electron). Puedes abrir ese archivo para ver/editar manualmente el estado guardado.

Cómo ejecutar (PowerShell)

- Modo desarrollo (Vite + Electron, con HMR):

	$env:DEV_TUNNEL_HOST=''; npm run dev

	Esto arranca Vite y abre una ventana de Electron. Si quieres exponer Vite por un túnel (solo para desarrollo) exporta `DEV_TUNNEL_HOST` y `DEV_SERVER_URL` antes de `npm run dev`.

- Solo servidor dev Vite (sin Electron):

	npx vite --host 0.0.0.0 --port 5173

	Esto sirve la UI en http://localhost:5173 (útil si usas un túnel para mostrar la UI a otra persona).

- Probar en modo producción local (usa los assets en `dist`):

	npm run build
	$env:NODE_ENV='production'; npx electron .

	Esto abre la app apuntando a los archivos estáticos generados por Vite.

Empaquetado / Instalador

- Generar instalador con electron-builder (configurado en `package.json`):

	npm install --save-dev electron-builder
	npm run dist

	- El proceso crea `dist/win-unpacked` y (si electron-builder lo permite) un instalador. Si el empaquetado automático de instaladores falla por permisos al extraer herramientas de firma, encontrarás una versión portable en `dist/Navegador-portable.zip` que puedes copiar/extraer en otra máquina y ejecutar `Navegador.exe`.

- Nombre de artefacto y versiones: electron-builder puede incluir la versión en el nombre del instalador (usa `package.json.version`). Usa `npm version patch|minor|major` para versionar antes de `npm run dist`.

Distribución rápida (portable)

- Ya se genera automáticamente un ZIP portable (`dist/Navegador-portable.zip`) con el contenido de `dist/win-unpacked`. Para probar en otra máquina extrae y ejecuta `Navegador.exe`.

Notas de seguridad y recomendaciones
- Actualmente `main.cjs` habilita `nodeIntegration: true` y `contextIsolation: false` para facilitar el desarrollo. Para producción te recomiendo desactivar `nodeIntegration` y activar `contextIsolation` y exponer funciones seguras mediante IPC.
- Si integras actualizaciones automáticas, usa `electron-updater` y publica releases (por ejemplo en GitHub Releases) configurando `publish` en `package.json`.
## Auto-actualizaciones con GitHub Releases

1. **Versionar antes de compilar**  
   Ejecuta `npm version patch|minor|major` para actualizar [`package.json`](package.json:4-6) y crea un tag coincidente (ejemplo `v0.0.2`).

2. **Generar artefactos de distribución**  
   Ejecuta `npm run dist`. Conserva de la carpeta `dist/` al menos:  
   - `Navegador-Setup-&lt;versión&gt;.exe` (instalador NSIS)  
   - `latest.yml` (manifiesto que consulta `electron-updater`)  
   También se mantiene la carpeta `win-unpacked` por si necesitas distribución portable.

3. **Publicar el release en GitHub**  
   - Asegúrate de que el repositorio sea público (requisito del `provider: "github"` definido en [`package.json`](package.json:43-62)).  
  - Sube los artefactos anteriores al release asociado al tag.  
  - Si prefieres automatizar el upload, define `GH_TOKEN` (PAT con permiso `repo`) antes de ejecutar `npm run dist`.

4. **Consumo por parte de los clientes**  
   Los usuarios deben instalar la versión publicada mediante el setup NSIS. Al iniciarse, `autoUpdater.checkForUpdatesAndNotify()` definido en [`main.cjs`](main.cjs:40-67) descargará `latest.yml`, detectará una versión nueva y gestionará la descarga e instalación automática.

5. **Pruebas de flujo completo**  
   - Instala la versión recién liberada.  
   - Incrementa la versión local, reconstruye y sube un release nuevo con sus artefactos.  
   - Abre la app instalada: deberá descargar la actualización y preguntar si quieres reiniciar para aplicarla.

> Mantén todos los releases (especialmente `latest.yml`) disponibles públicamente; si los eliminas, los clientes no podrán resolver la URL de actualización definida por `electron-updater`.

Depuración
- En desarrollo Electron abre DevTools automáticamente. En producción puedes forzar `win.webContents.openDevTools()` temporalmente para depurar.

Preguntas frecuentes
- "¿La app necesita un servidor?" — No, para navegar no. Solo si quieres backend para datos/servicios.
- "¿Puedo compartir la UI con otra persona?" — Sí, pero normalmente solo en desarrollo (usa un túnel que exponga el puerto 5173). Si vas a distribuir la app usa el .exe o el ZIP portable.

Contacto y contribuciones
- Este repo es un proyecto local; si quieres añadir features (autoupdate, firma de binarios, mejor seguridad) con gusto puedo ayudarte a integrarlos.

---
Pequeña guía rápida de comandos

Dev:    npm run dev
Vite:   npx vite --host 0.0.0.0 --port 5173
Build:  npm run build
Prod:   $env:NODE_ENV='production'; npx electron .
Dist:   npm run dist

