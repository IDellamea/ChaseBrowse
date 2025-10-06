# ChaseBrowse (React + Vite + Electron)

Aplicación de escritorio construida con Electron que ofrece un conjunto de pestañas responsivas, persistiendo automáticamente la URL, el color y la etiqueta de cada pestaña. La interfaz se desarrolla con React + Vite y se incrusta en un contenedor Chromium mediante `<webview>`.

## Tabla de contenidos

1. [Descripción general](#descripción-general)
2. [Requisitos previos](#requisitos-previos)
3. [Instalación y preparación](#instalación-y-preparación)
4. [Scripts habituales](#scripts-habituales)
5. [Flujo de desarrollo](#flujo-de-desarrollo)
6. [Persistencia local de pestañas](#persistencia-local-de-pestañas)
7. [Construcción para producción](#construcción-para-producción)
8. [Empaquetado con electron-builder](#empaquetado-con-electron-builder)
9. [Versionado y publicación](#versionado-y-publicación)
10. [Preguntas frecuentes](#preguntas-frecuentes)
11. [Depuración y soporte](#depuración-y-soporte)

## Descripción general

- Interfaz web: React 18 + Vite.
- Contenedor de escritorio: Electron con soporte para `webviewTag`.
- Menú de aplicación: opciones estándar en español (Archivo, Editar, Ayuda) con atajos de teclado.
- Persistencia: el listado de pestañas se guarda como JSON en el directorio de datos de usuario de Electron.
- Auto-actualizaciones: configurables mediante `electron-updater` y GitHub Releases (si se publica un release con los artefactos esperados).

## Requisitos previos

- Node.js 18 LTS o superior.
- npm 9+ (instalado junto con Node).
- Git (opcional pero recomendado para clonar el repositorio).
- Windows para generar instaladores NSIS mediante electron-builder (la configuración actual está orientada a Windows).

Herramientas opcionales:
- PowerShell 7+ para seguir los ejemplos exactos de comandos.
- Cuenta de GitHub con un token personal (`GH_TOKEN`) si vas a automatizar el upload de artefactos.

## Instalación y preparación

1. Clonar o descargar el repositorio.
   ```powershell
   git clone https://github.com/<usuario>/<repo>.git
   cd ChaseBrowse
   ```
2. Instalar dependencias del proyecto.
   ```powershell
   npm install
   ```
3. (Opcional) Revisar [`package.json`](package.json) para confirmar nombre, versión y metadatos de publicación.

## Scripts habituales

| Comando | Descripción |
|---------|-------------|
| `npm run dev` | Arranca Vite en modo desarrollo y lanza Electron apuntando al dev-server (incluye HMR). |
| `npm run build` | Genera los assets estáticos de producción en `dist/` mediante Vite. |
| `npm run preview` | Sirve el build estático para pruebas rápidas (no lanza Electron). |
| `npm run lint` | Ejecuta la configuración de ESLint definida en [`eslint.config.js`](eslint.config.js). |
| `npm run dist` | Ejecuta electron-builder para empaquetar la aplicación y emitir instaladores/artefactos. |

> Nota: el script `npm run dist` requiere que `electron-builder` esté instalado como dependencia de desarrollo (ya viene declarado en [`package.json`](package.json)).

## Flujo de desarrollo

1. Definir, en caso necesario, el host público del túnel para Vite (solo si compartes la UI durante el desarrollo).
   ```powershell
   $env:DEV_TUNNEL_HOST = ''   # dejar vacío si no se usa túnel
   $env:DEV_SERVER_URL = ''    # idem
   ```
2. Iniciar el entorno interactivo.
   ```powershell
   npm run dev
   ```
   - Se abrirá la ventana de Electron apuntando al dev-server y cargará la interfaz.
   - Chromium DevTools se abre automáticamente en desarrollo.
3. Ajustar código en [`src/`](src/) y dejar que Vite recargue la UI automáticamente.
4. Al detener el dev-server (Ctrl+C) la ventana de Electron se cerrará.

## Persistencia local de pestañas

- El estado de todas las pestañas se guarda como JSON en:
  - Windows: `%APPDATA%\ChaseBrowse\tabs.json`
  - macOS: `~/Library/Application Support/ChaseBrowse/tabs.json`
  - Linux: `~/.config/ChaseBrowse/tabs.json`
- [`main.cjs`](main.cjs) expone los manejadores IPC `read-tabs` y `write-tabs`, que el front-end invoca para cargar y guardar el arreglo.
- Cada vez que se crea, elimina, re-etiqueta o cambia de URL una pestaña, [`App.jsx`](src/App.jsx) persiste la nueva lista automáticamente.

## Construcción para producción

1. Generar los assets estáticos optimizados.
   ```powershell
   npm run build
   ```
2. Probar el build con Electron sin empaquetar.
   ```powershell
   $env:NODE_ENV = 'production'
   npx electron .
   ```
   - El proceso carga `dist/index.html` dentro del contenedor Electron para validar que todo funciona igual que en desarrollo.

## Empaquetado con electron-builder

1. Asegurarse de tener `electron-builder` instalado (ya figura como devDependency, pero ejecuta `npm install` si vienes de un clon limpio).
2. Ejecutar el script de empaquetado.
   ```powershell
   npm run dist
   ```
3. Archivos de salida en `dist/`:
   - `win-unpacked/`: versión portable (extraer y ejecutar `ChaseBrowse.exe`).
   - `ChaseBrowse-Setup-<versión>.exe`: instalador NSIS por defecto.
   - `ChaseBrowse-portable.zip`: ZIP portable generado por la configuración.
   - `latest.yml`: manifiesto que usa `electron-updater` para resolver nuevas versiones.
4. Si electron-builder necesita firmar binarios y no dispone de certificados, el proceso continuará pero los binarios quedarán sin firmar (apto para pruebas internas).

## Versionado y publicación

### 1. Actualizar la versión

- Sigue el esquema SemVer usando los comandos nativos de npm:
  ```powershell
  npm version patch   # ó minor / major
  ```
  - Este comando actualiza `version` en [`package.json`](package.json) y crea automáticamente un tag Git (`vX.Y.Z`).
  - Si trabajas en equipo, sube el commit y el tag:
    ```powershell
    git push origin main
    git push origin vX.Y.Z
    ```

### 2. Generar artefactos

- Una vez versionado, ejecuta:
  ```powershell
  npm run dist
  ```
- Verifica que `dist/` contiene:
  - `ChaseBrowse-Setup-<versión>.exe`
  - `latest.yml`
  - `ChaseBrowse-portable.zip` (opcional, pero útil para distribución rápida)
  - Cualquier otro archivo configurado en la sección `build.artifactName` de [`package.json`](package.json)

### 3. Publicar en GitHub Releases

1. Crear o reutilizar un repositorio público en GitHub.
2. Definir `GH_TOKEN` en tu entorno si deseas que electron-builder suba los artefactos automáticamente:
   ```powershell
   $env:GH_TOKEN = 'ghp_XXXXXXXXXXXXXXXXXXXX'
   npm run dist
   ```
3. Si prefieres subir manualmente:
   - Crear un release asociado al tag `vX.Y.Z`.
   - Adjuntar los archivos:
     - `ChaseBrowse-Setup-<versión>.exe`
     - `latest.yml`
     - (Opcional) `ChaseBrowse-portable.zip`
4. Publicar el release. Los clientes que tengan instalada la app se conectarán al feed GitHub y descargarán la actualización cuando detecten un `latest.yml` con versión superior.

### 4. Probar el flujo de actualización

1. Instala la versión recién publicada mediante el instalador.
2. Incrementa la versión local (por ejemplo `npm version patch`).
3. Ejecuta `npm run dist` y publica un nuevo release con los artefactos.
4. Abre la aplicación instalada: debería descargar la nueva versión y ofrecer reiniciar gracias a `autoUpdater.checkForUpdatesAndNotify()` configurado en [`main.cjs`](main.cjs).

## Preguntas frecuentes

- **¿Necesito un backend?** No para navegar. Cada pestaña solicita directamente las URLs. Solo necesitas backend si quieres centralizar datos o manejar credenciales.
- **¿Puedo compartir la interfaz sin compilar?** Sí. Ejecuta `npm run preview` para servir el build y expón el puerto mediante un túnel; tu interlocutor accederá vía navegador.
- **¿Qué ocurre si borro `tabs.json`?** La app arrancará sin pestañas y generará el archivo de nuevo al guardar cambios.

## Depuración y soporte

- En desarrollo DevTools se abre automáticamente. Para producción puedes habilitar temporalmente `win.webContents.openDevTools()` en [`main.cjs`](main.cjs).
- Los logs de auto-actualización se escriben mediante `electron-log` en el directorio de usuario (`%APPDATA%\ChaseBrowse\logs`).
- Si encuentras fallos o necesitas nuevas funcionalidades, abre un issue en el repositorio o contacta al mantenedor.

---

### Resumen rápido de comandos

| Uso | Comando |
|-----|---------|
| Desarrollo | `npm run dev` |
| Build estático | `npm run build` |
| Previsualización | `npm run preview` |
| Producción local | `$env:NODE_ENV='production'; npx electron .` |
| Empaquetado | `npm run dist` |

Mantén este README actualizado cada vez que modifiques scripts, configuración de publicación o requisitos.
