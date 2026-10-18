# PrimitivaGPT · Archivo de sorteos

Aplicación web en español para consultar los cinco últimos sorteos de La Primitiva y el histórico oficial desde el **1 de enero de 2026**.

- Seis números, complementario y reintegro.
- Colores por número repetido e insignias ×N según sus apariciones entre los cinco resultados visibles.
- El reintegro tiene su propio recuento. El complementario queda fuera del cálculo.
- Histórico por fechas, paginación de cinco sorteos y exportación JSON.
- Resultados de SELAE, conservados como JSON normalizado y respuestas mensuales originales.
- Worker de Cloudflare con almacenamiento R2, lectura del archivo persistente y carga privada del histórico validado.
- Alternativa estática para GitHub Pages con generación de una versión estática y validación mediante GitHub Actions.

## Laboratorio IA

Abrir **Laboratorio IA** en la aplicación y pulsar **Analizar y simular**. Se pueden elegir 20, 30 o 50 sorteos iniciales. El motor combina siete métodos (azar uniforme, frecuencia acumulada, frecuencia reciente, recencia ponderada, parejas/estructura, Bayes regularizado y Markov regularizado) y aprende sus pesos en orden temporal. El reintegro usa pesos independientes.

Cada prueba propone exactamente seis números y un reintegro antes de ver el resultado. Después se registran los aciertos y se actualizan los pesos. La interfaz permite repetir cualquier prueba, inspeccionar patrones, comparar con una referencia aleatoria y descargar el análisis. La prioridad es acertar el reintegro; el segundo objetivo es lograr tres o más aciertos. Se registra también cuándo coinciden ambos. No se garantizan esos resultados ni se demuestra una ventaja frente al azar.

- `engine/model.js`: motor puro y reproducible.
- `data/ai-analysis.json`: pruebas, patrones y propuesta, con ventana inicial 30.
- `data/ai-model.json`: estado aprendido por defecto.
- `public/data/ai-analysis-{20,30,50}.json`: análisis para la versión estática.
- `/api/ai?window=30`: análisis de la copia oficial alojada; R2 conserva modelos e informes por ventana.

El archivo oficial completo sigue siendo `data/draws.json` con originales mensuales en `data/raw/`. El proceso de sincronización carga ese archivo, reconstruye el análisis con los nuevos resultados y confirma su fecha de entrenamiento. No requiere API de pago ni credenciales de inteligencia artificial.

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

## Investigación

Ver [INVESTIGACION.md](INVESTIGACION.md) para fuentes primarias, métodos integrados, límites y comparación reproducible con la versión 1.1. El laboratorio muestra el error Brier y la pérdida logarítmica del reintegro; reducir esos errores no equivale a garantizar más premios.

## Documentación

Ver [MEMORIA.md](MEMORIA.md) para decisiones, estructura, limitaciones y validación.

## Estado de esta entrega

La aplicación privada está publicada en https://primitiva-archivo-2026.wittyeel5.chatgpt.site y tiene una tarea vinculada cada hora, en el minuto 35 (Europe/Madrid), para mantener el archivo alojado. El procedimiento de actualización está en `SYNC.md`: el importador consulta SELAE y `scripts/sync_site.py` carga y verifica el archivo en la web privada.

El proyecto se conserva también en el repositorio público `danielMigales/PrimitivaGPT`. La versión de Sites tiene una tarea independiente para actualizar sus propios datos; los cambios de código en GitHub no redespliegan Sites automáticamente.
