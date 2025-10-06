# 🔢 Versionado del proyecto

| Comando                                                  | Descripción                                               |
|----------------------------------------------------------|-----------------------------------------------------------|
| npm version patch --no-git-tag-version                   | Corrección menor (1.2.3 → 1.2.4), sin crear tag Git       |
| npm version minor --no-git-tag-version                   | Nueva funcionalidad (1.2.3 → 1.3.0), sin crear tag Git    |
| npm version major --no-git-tag-version                   | Cambio incompatible (1.2.3 → 2.0.0), sin crear tag Git    |
| npm version prerelease --preid=beta --no-git-tag-version | Versión beta (1.2.3 → 1.2.4-beta.0)                       |
| npm version prerelease --preid=alpha --no-git-tag-version| Versión alpha (1.2.3 → 1.2.4-alpha.0)                      |

---

# ⚙️ Configuración de entorno

| Comando                          | Descripción                                  |
|----------------------------------|----------------------------------------------|
| $env:NODE_ENV = 'production'     | Establece entorno de producción (PowerShell) |
| NODE_ENV=production              | Establece entorno en Bash                    |
| $env:NODE_ENV = 'production' && npx electron . | Ejecuta Electron en entorno producción (PowerShell) |

---

# 🚀 Ejecución y distribución

| Comando                          | Descripción                                      |
|----------------------------------|--------------------------------------------------|
| npx electron . --clear-cache     | Limpia caché de Electron y ejecuta la app       |
| npx electron .                   | Ejecuta la app Electron normalmente             |
| npm run dist                     | Construye y empaqueta la app para distribución  |

---

# 🧪 Desarrollo

| Comando          | Descripción                              |
|------------------|------------------------------------------|
| npm run dev      | Ejecuta la app en modo desarrollo        |
| npm run build    | Compila la app para producción           |

# 🛠️ Herramientas online para convertir íconos

| Herramienta       | Formato       | Función                                     | Enlace                                      |
|-------------------|---------------|---------------------------------------------|---------------------------------------------|
| ConvertICO        | .ico          | Convierte PNG ↔ ICO con tamaños embebidos   | https://convertico.com/                     |
| ICO Convert       | .ico          | Crea íconos desde imágenes, redimensiona    | https://www.icoconvert.com/                 |
| ResizePixel       | .ico/.png     | Redimensiona imágenes                       | https://www.resizepixel.com/                |
| Online-Convert    | .ico          | Convierte imágenes a ICO con opciones       | https://image.online-convert.com/convert-to-ico |

---

# 🔄 Conversión de video a spinner animado (.webp)

| Herramienta       | Formato       | Función                                     | Enlace                                      |
|-------------------|---------------|---------------------------------------------|---------------------------------------------|
| EZGIF             | .mp4 → .webp  | Convierte video a WebP animado              | https://ezgif.com/video-to-webp             |
| Convertio         | .mp4 → .webp  | Conversión entre múltiples formatos         | https://convertio.co/mp4-webp/              |
| CloudConvert      | .mp4 → .webp  | Conversión avanzada de video                | https://cloudconvert.com/mp4-to-webp        |