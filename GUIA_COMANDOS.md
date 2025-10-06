# 🔢 Versionado del proyecto
npm version patch --no-git-tag-version       # Corrección menor (1.2.3 → 1.2.4), sin crear tag Git
npm version minor --no-git-tag-version       # Nueva funcionalidad (1.2.3 → 1.3.0), sin crear tag Git
npm version major --no-git-tag-version       # Cambio incompatible (1.2.3 → 2.0.0), sin crear tag Git
npm version prerelease --preid=beta --no-git-tag-version   # Versión beta (1.2.3 → 1.2.4-beta.0)
npm version prerelease --preid=alpha --no-git-tag-version  # Versión alpha (1.2.3 → 1.2.4-alpha.0)

# ⚙️ Configuración de entorno
$env:NODE_ENV = 'production'                 # Establece entorno de producción (PowerShell)
# En Bash sería: NODE_ENV=production

" $env:NODE_ENV = 'production'
>>    npx electron .  "  //comando completo

# 🚀 Ejecución y distribución
npx electron . --clear-cache                 # Limpia caché de Electron y ejecuta la app
npx electron .                               # Ejecuta la app Electron normalmente
npm run dist                                 # Construye y empaqueta la app para distribución

# 🧪 Desarrollo
npm run dev                                  # Ejecuta la app en modo desarrollo
npm run build                                # Compila la app para producción