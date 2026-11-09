# Actualización manual de PrimitivaGPT

La actualización automática de resultados está desactivada. El workflow `.github/workflows/deploy-pages.yml` no tiene programación `schedule`: publica al recibir cambios en `main` o cuando se inicia manualmente desde GitHub Actions.

## Publicar la web

1. Actualiza de forma explícita `data/draws.json` con resultados oficiales verificados de SELAE. No inventes sorteos ni completes resultados por inferencia.
2. Comprueba que `data/draws.json` y `public/data/draws.json` contienen el mismo histórico.
3. Haz commit y push a `main`, o inicia **Publicar PrimitivaGPT en GitHub Pages** desde Actions.
4. El workflow ejecuta `npm run build` y `npm test`. El build regenera los análisis, el seguimiento prospectivo, los archivos públicos y `worker/index.js`.
5. Solo si compilación y pruebas terminan correctamente, guarda los artefactos generados, prepara `public/` y despliega GitHub Pages.
6. Comprueba la conclusión de la ejecución y la URL publicada. No des por publicada la web solo porque el commit exista.

## Comprobaciones

- Requisitos locales: Node.js 22+ y Python 3.12+.
- `npm test`: pruebas JavaScript y Python.
- `npm run build`: genera artefactos, prepara `dist/` y valida los artefactos.
- La copia estática usa los JSON versionados; no consulta SELAE durante la carga de la página.
- La auditoría prospectiva conserva las combinaciones emitidas antes de cada sorteo. Los huecos se señalan; nunca se inventan predicciones retroactivas.
- Si falla SELAE al realizar una actualización manual, conserva el histórico válido anterior y no publiques datos parciales.

La aplicación no garantiza premios ni demuestra una ventaja sobre el azar. Las métricas históricas son descriptivas y deben contrastarse con seguimiento prospectivo.
