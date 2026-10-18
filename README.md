# PrimitivaGPT · Archivo de sorteos

Aplicación web en español para consultar los cinco últimos sorteos de La Primitiva y el histórico oficial desde el **1 de enero de 2026**.

- Seis números, complementario y reintegro.
- Colores por número repetido e insignias ×N según sus apariciones entre los cinco resultados visibles.
- El reintegro tiene su propio recuento. El complementario queda fuera del cálculo.
- Histórico por fechas, paginación de cinco sorteos y exportación JSON.
- Resultados de SELAE, conservados como JSON normalizado y respuestas mensuales originales.
- Worker de Cloudflare con almacenamiento R2, comprobaciones cada 15 minutos al consultar y conservación ante errores.
- Alternativa estática para GitHub Pages con generación de una versión estática y actualización del histórico cada hora mediante GitHub Actions.

## Ejecutar

Requiere Node.js 22+ y Python 3.12+. No hay dependencias de terceros.

```sh
python scripts/update_data.py
node scripts/build.mjs
npm test
npm run build
python -m http.server 8000 --directory public
```

Abrir http://localhost:8000. El servidor Python usa el JSON versionado; el Worker se publica a través de Sites.

## GitHub

Repositorio público: https://github.com/danielMigales/PrimitivaGPT

El workflow **Actualizar SELAE y validar** se activa al subir cambios a `main`, cada hora y manualmente desde Actions. Descarga los resultados oficiales, ejecuta las pruebas, guarda los cambios del histórico en el repositorio y ofrece `public/` como artefacto descargable para alojarlo en cualquier servidor estático. No requiere activar GitHub Pages.

El cron `17 * * * *` se ejecuta cada hora en UTC. GitHub puede retrasarlo; no equivale a una actualización instantánea ni a un SLA. En repositorios públicos, GitHub puede desactivar cron tras periodos prolongados de inactividad; revisar el estado de Actions. No usa secretos personales.

## Documentación

Ver [MEMORIA.md](MEMORIA.md) para decisiones, estructura, limitaciones y validación.

## Estado de esta entrega

La aplicación privada está publicada en https://primitiva-archivo-2026.wittyeel5.chatgpt.site y tiene una tarea vinculada cada hora, en el minuto 35 (Europe/Madrid), para mantener el archivo alojado. El procedimiento de actualización está en `SYNC.md`.

El proyecto se conserva también en el repositorio público `danielMigales/PrimitivaGPT`. La versión de Sites tiene una tarea independiente para actualizar sus propios datos; los cambios de código en GitHub no redespliegan Sites automáticamente.
