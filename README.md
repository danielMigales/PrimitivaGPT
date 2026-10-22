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

Abrir **Laboratorio IA** en la aplicación y pulsar **Analizar y simular**. La interfaz estática y la API pública del Worker usan una ventana fija de 7 sorteos. El motor combina siete métodos y aprende sus pesos en orden temporal; la versión 1.4.0 añade un incentivo moderado para los expertos que logran cuatro o más aciertos, sin alterar la referencia histórica legacy. El motor combina siete métodos (azar uniforme, frecuencia acumulada, frecuencia reciente, recencia ponderada, parejas/estructura, Bayes regularizado y Markov regularizado) y aprende sus pesos en orden temporal. El reintegro usa pesos independientes.

Cada prueba propone exactamente seis números y un reintegro antes de ver el resultado. La propuesta actual incluye una explicación de los criterios reales, los rangos de puntuación de sus números y los expertos con más peso cuando los datos corresponden exactamente a esa combinación; si se trata de una propuesta guardada distinta del recálculo actual, no se le atribuyen puntuaciones que no le pertenecen. Después se registran los aciertos y se actualizan los pesos. La interfaz permite repetir cualquier prueba, inspeccionar patrones, comparar con una referencia aleatoria y descargar el análisis. La prioridad sigue siendo medir el reintegro por separado; el objetivo numérico secundario es lograr cuatro o más aciertos. El informe registra los recuentos y tasas observadas de 4+ para el motor y para una referencia aleatoria con el mismo número de pruebas, además de la probabilidad teórica exacta. También conserva las métricas de 3+ para comparación. No se garantiza que el cambio mejore los resultados: la evaluación histórica es exploratoria y necesita validación prospectiva. No se garantizan esos resultados ni se demuestra una ventaja frente al azar.

- `engine/model.js`: motor puro y reproducible.
- `data/ai-analysis.json`: pruebas, patrones y propuesta generados con ventana fija de 7 sorteos.
- `data/ai-model.json`: estado aprendido del motor para la ventana de 7 sorteos.
- `public/data/ai-analysis-7.json`: informe generado para la ventana fija de la versión estática.
- `/api/ai?window=7`: análisis de la copia oficial alojada; el endpoint rechaza ventanas alternativas.

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

El workflow **Publicar PrimitivaGPT en GitHub Pages** se ejecuta con cada cambio en `main`, manualmente desde Actions y cada día a las 23:00 (hora peninsular, `Europe/Madrid`). En la ejecución programada intenta sincronizar el histórico con SELAE mediante `scripts/update_data.py`, valida los datos, ejecuta `npm test` y `npm run build`, guarda los archivos generados si hay cambios y publica `public/` en GitHub Pages. La hora programada se ajusta automáticamente al horario de verano. Las ejecuciones programadas de GitHub pueden retrasarse o fallar; comprueba el estado de Actions si la publicación no aparece.

La actualización automática depende de que SELAE responda con datos válidos y de que las pruebas y la publicación finalicen correctamente. Si falla la descarga o la validación, se conserva el histórico anterior y la ejecución falla en vez de inventar resultados. `SYNC.md` documenta el proceso y las comprobaciones necesarias.

## Investigación

Ver [INVESTIGACION.md](INVESTIGACION.md) para fuentes primarias, métodos integrados, límites y comparación reproducible con la versión 1.1. El laboratorio muestra el error Brier y la pérdida logarítmica del reintegro; reducir esos errores no equivale a garantizar más premios.

## Documentación

Ver [MEMORIA.md](MEMORIA.md) para decisiones, estructura, limitaciones y validación.

## Estado de esta entrega

La publicación anterior en ChatGPT Sites dejó de estar disponible al eliminarse la cuenta que la creó; su URL antigua ya no debe considerarse activa. El código y los datos del proyecto se conservan en este repositorio.

Se ha añadido un flujo de publicación estática con GitHub Pages en `.github/workflows/deploy-pages.yml`. Para activarlo, en Settings → Pages del repositorio hay que seleccionar **GitHub Actions** como fuente de publicación. Esta copia estática conserva el archivo histórico y el Laboratorio IA, pero no ofrece las funciones de persistencia del Worker/Sites ni recupera la publicación anterior. Los cambios de código no vuelven a publicar el Site eliminado automáticamente.

El laboratorio muestra la fecha del sorteo de su propuesta y «Resultado sin publicar» mientras no exista el resultado oficial. Cada propuesta emitida se guarda por experimento; al sincronizar el resultado se muestran debajo su combinación real y los aciertos de números y reintegro, y se prepara la siguiente. Las propuestas anteriores siguen consultables. El seguimiento real está separado de las simulaciones históricas y no garantiza premios. La copia estática no dispone de este registro persistente.

El laboratorio da prioridad a la propuesta actual y al resumen de propuestas reales. Simulaciones, patrones y métodos quedan en desplegables. El seguimiento muestra pendientes y aciertos oficiales del experimento seleccionado, con desglose por versión; las simulaciones de ventanas solapadas no se suman. El porcentaje de reintegros incorpora, cuando existen evaluaciones reales, un intervalo descriptivo orientativo del 95 % y la referencia aleatoria del 10 %.
