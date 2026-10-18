# PrimitivaGPT · Archivo de sorteos

Aplicación web en español para consultar los cinco últimos sorteos de La Primitiva y el histórico oficial desde el **1 de enero de 2026**.

- Seis números, complementario y reintegro.
- Colores por número repetido e insignias ×N según sus apariciones entre los cinco resultados visibles.
- El reintegro tiene su propio recuento. El complementario queda fuera del cálculo.
- Histórico por fechas, paginación de cinco sorteos y exportación JSON.
- Resultados de SELAE, conservados como JSON normalizado y respuestas mensuales originales.
- Worker de Cloudflare con almacenamiento R2, lectura del archivo persistente y carga privada del histórico validado.
- Alternativa estática para GitHub Pages con generación de una versión estática y validación mediante GitHub Actions.

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

El workflow **Validar PrimitivaGPT** se activa con cada cambio en `main` y manualmente desde Actions. Ejecuta las pruebas y ofrece `public/` como artefacto descargable. No requiere activar GitHub Pages.

La tarea horaria vinculada a la aplicación consulta SELAE, valida el histórico y guarda las novedades en este repositorio usando la conexión autorizada de GitHub. Se ejecuta en el minuto 35 de cada hora (Europe/Madrid). `SYNC.md` describe el proceso. Se usa esta tarea porque las dos primeras descargas directas desde runners de GitHub fallaron; no se oculta el fallo ni se reemplazan resultados por datos de ejemplo. El script también puede ejecutarse manualmente con Python y curl.

## Documentación

Ver [MEMORIA.md](MEMORIA.md) para decisiones, estructura, limitaciones y validación.

## Estado de esta entrega

La aplicación privada está publicada en https://primitiva-archivo-2026.wittyeel5.chatgpt.site y tiene una tarea vinculada cada hora, en el minuto 35 (Europe/Madrid), para mantener el archivo alojado. El procedimiento de actualización está en `SYNC.md`: el importador consulta SELAE y `scripts/sync_site.py` carga y verifica el archivo en la web privada.

El proyecto se conserva también en el repositorio público `danielMigales/PrimitivaGPT`. La versión de Sites tiene una tarea independiente para actualizar sus propios datos; los cambios de código en GitHub no redespliegan Sites automáticamente.
