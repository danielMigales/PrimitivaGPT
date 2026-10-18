# Memoria técnica — Primitiva / Archivo

Versión 1.0 · 18 de octubre de 2026

## 1. Objetivo y alcance

Mostrar los cinco últimos sorteos de La Primitiva, detectar coincidencias y permitir consultar todos los resultados publicados desde el 1 de enero de 2026. Los datos proceden exclusivamente del servicio de resultados de SELAE. La aplicación es un proyecto independiente, sin funcionalidades de apuesta.

## 2. Reglas de cálculo

Cada combinación contiene seis enteros distintos entre 1 y 49. El complementario está entre 1 y 49 y no puede coincidir con la combinación. El reintegro está entre 0 y 9, incluido el cero.

Se calculan frecuencias sobre los seis números de los cinco sorteos visibles. Los números con frecuencia mayor que uno reciben un color propio y una insignia en la esquina superior derecha: ×2 significa dos apariciones totales, no dos apariciones adicionales. Las ocurrencias de un mismo número comparten color dentro de la ventana. Los colores se reasignan al cambiar la ventana. Se usan quince colores: en treinta posiciones puede haber como máximo quince valores repetidos.

Los reintegros tienen un mapa de frecuencias independiente. Su coincidencia numérica con una bola principal no suma apariciones. Los complementarios se muestran, pero no se incluyen en el recuento. En la vista histórica se aplica la misma regla a cada página de hasta cinco sorteos.

## 3. Datos oficiales y cobertura

Fuente de descarga:

`https://www.loteriasyapuestas.es/servicios/buscadorSorteos?game_id=LAPR&celebrados=true&fechaInicioInclusiva=AAAAMMDD&fechaFinInclusiva=AAAAMMDD`

Referencia oficial para enlaces a resultados:

https://www.loteriasyapuestas.es/es/resultados-ultimos-sorteos

La consulta amplia de enero a octubre devolvió 115 resultados y comenzaba el 24 de enero. Por ello la importación consulta cada mes de forma separada y valida el calendario hasta el último resultado publicado. Se conserva cada respuesta mensual original en `data/raw/AAAA-MM.json` y una versión normalizada en `data/draws.json`. Se ordena por fecha descendente y se actualiza por fecha, manteniendo el identificador oficial.

La importación inicial validó **125 sorteos**, del 1 de enero al 17 de octubre de 2026, sin huecos en el calendario habitual.

La cobertura se comprueba con los días habituales lunes, jueves y sábado. Una modificación oficial del calendario que suprima un sorteo requiere adaptar esta validación; ante un hueco no se reemplaza el histórico normalizado por un resultado incompleto. El servicio JSON no se trata como una API con contrato estable: un cambio de formato produce un error explícito.

## 4. Arquitectura y almacenamiento

El cliente usa HTML, CSS y JavaScript nativos, sin dependencias. El diseño responde a pantallas móviles y de escritorio. No descarga fuentes, analítica ni scripts externos. Los colores se acompañan de un contador textual accesible.

`worker/template.js` implementa el servidor. `scripts/build.mjs` incorpora la interfaz y el JSON validado en `worker/index.js`. El Worker sirve `/` y `/api/draws`. Sites conecta un bucket R2 llamado lógicamente BUCKET. La copia normalizada se conserva en `history/draws.json`; las nuevas respuestas mensuales en `raw/AAAA-MM.json`; los sorteos consultados en registros por fecha dentro de `draws/`. La copia incorporada al proyecto conserva también todos los sorteos iniciales.

La primera petición inicializa el archivo con la copia incorporada. GET `/api/draws` lee el histórico persistente sin consultar servicios externos; indica un aviso si la última consulta oficial confirmada tiene más de tres horas. La tarea descarga los resultados desde SELAE en el entorno donde se ha verificado el acceso, valida y carga el JSON mediante POST `/api/sync`. El endpoint admite solo peticiones de servicio sin Origin, JSON acotado a 2 MiB y el acceso privado de Sites. Revalida combinaciones, fechas, identificadores, cobertura y conservación de todas las fechas existentes. No permite retroceder la fecha de consulta. Reconstruye los enlaces oficiales y confirma la escritura del archivo normalizado al final.

`scripts/sync_site.py` recibe el acceso efímero por stdin, carga los datos y realiza dos lecturas comparando fecha, último sorteo e identificadores. No guarda ni imprime credenciales. La tarea carga los datos incluso si no hay sorteos nuevos; en GitHub no crea commits por cambiar únicamente la marca de consulta. La interfaz recarga el archivo al abrir y cada quince minutos mientras está visible. El botón Recargar datos obtiene la última copia guardada. Si falla el almacenamiento mantiene la copia incorporada con un aviso.

La audiencia permanece privada: la autorización del escritor depende de la puerta de acceso de Sites. Antes de hacer público el sitio se deberá añadir autorización específica al escritor o retirarlo. No se ha hecho público.

## 5. Actualización desatendida y GitHub

La tarea vinculada a Sites está habilitada cada hora en el minuto 35 (Europe/Madrid). Descarga desde SELAE con `scripts/update_data.py`, valida el histórico y las pruebas y sincroniza `data/`, `worker/index.js` y `public/` en `danielMigales/PrimitivaGPT` usando la conexión autorizada de GitHub. Mantiene además el archivo alojado mediante el endpoint privado. El procedimiento completo está en `SYNC.md` y en la tarea.

`.github/workflows/update.yml` valida cada cambio en main y ofrece la versión estática como artefacto descargable. La consulta a SELAE se ejecuta en la tarea vinculada: los dos primeros intentos de descarga desde Actions fallaron (HTTP 403 con urllib y código 22 con curl). La importación desde el entorno de trabajo sí ha funcionado; se mantiene el error explícito y no se simula una actualización exitosa.

La versión estática usa `public/data/draws.json`; no consulta SELAE desde el teléfono. Sites mantiene su copia persistente y la renueva con las visitas y la tarea. Los cambios de código en GitHub no redespliegan Sites automáticamente. Los commits conservan el historial y permiten revisar correcciones.

## 6. Estructura

| Ruta | Finalidad |
| --- | --- |
| `web/` | Diseño, cliente y cálculo de frecuencias |
| `worker/template.js` | Servidor, consulta SELAE y persistencia |
| `worker/index.js` | Worker generado con copia de datos |
| `scripts/update_data.py` | Importación, validación y guardado mensual |
| `scripts/build.mjs` | Generador de Worker y versión estática |
| `scripts/build.sh` | Empaquetado de despliegue |
| `data/draws.json` | Histórico normalizado |
| `data/raw/` | Respuestas originales oficiales |
| `public/` | Versión para GitHub Pages |
| `tests/` | Pruebas de cálculos, descarga, cobertura y errores |
| `.github/workflows/update.yml` | Actualización y publicación programadas |
| `.openai/hosting.json` | Configuración de Sites |

## 7. Verificación y límites

Las pruebas cubren repeticiones dobles y triples, separación de reintegros, filtros temporales, validación de combinaciones, detección de huecos, respuestas HTTP y conservación de datos ante fallos de almacenamiento o de SELAE. El empaquetado comprueba que el resultado sea un módulo ESM con un manejador fetch. La importación comprueba unicidad de fechas e identificadores.

El recuento es descriptivo; no aumenta la probabilidad de acertar sorteos futuros. La fuente oficial debe consultarse para verificar resultados. No se almacenan datos personales ni credenciales en el proyecto. La automatización no garantiza actualización instantánea: depende de la publicación de SELAE y de la disponibilidad y programación de GitHub Actions.

El entorno no dispone del controlador de navegador exigido para QA de Sites; no se realizó una prueba visual del sitio con navegador. La publicación y el almacenamiento se comprueban mediante las herramientas del alojamiento y las pruebas del servidor. El estado real de GitHub se documenta al entregar, sin considerar un workflow preparado como si ya estuviera activado.

## 8. Estado de entrega

- Sitio privado publicado: https://primitiva-archivo-2026.wittyeel5.chatgpt.site
- Histórico importado: 125 sorteos, del 01/01/2026 al 17/10/2026.
- 11 pruebas automatizadas superadas y módulo de despliegue validado.
- Dos lecturas autenticadas del archivo alojado devolvieron el mismo histórico y fecha de consulta, sin avisos: persistencia inicial y lectura verificadas.
- Tarea de Sites habilitada cada hora en el minuto 35, zona Europe/Madrid. Su creación está confirmada; aún no se ha observado una ejecución programada. El escritor inicial y la lectura ya se comprobaron de forma directa.
- Repositorio autorizado: https://github.com/danielMigales/PrimitivaGPT. Se incorpora la aplicación completa, las respuestas oficiales de SELAE, las pruebas y esta memoria. La validación final del workflow se documenta a continuación. GitHub Pages no es necesario: la aplicación ya está alojada en Sites.

## 9. Verificación en GitHub

La primera subida quedó registrada en el commit `f00df297842b0c20c3fd09d9b6017aad5e4b3c9b`. Actions se activó automáticamente. Su primera ejecución devolvió HTTP 403 desde SELAE usando el cliente HTTP de Python. Se adapta el importador a curl, disponible en los runners de Ubuntu y usado con éxito para la descarga oficial durante la importación inicial. Ante un rechazo de SELAE se mantiene la copia histórica anterior y la tarea señala el error.

La programación horaria se ha actualizado para sincronizar el histórico tanto en el sitio como en GitHub. El cambio de curl no resolvió la descarga desde Actions; por ello el workflow final solo valida y genera el proyecto.

Validación final confirmada en GitHub Actions: ejecución https://github.com/danielMigales/PrimitivaGPT/actions/runs/39110984165 completada con éxito para el commit `a8cc5200ec14014500a4e918835dc066791b69fc`. Ejecutó las once pruebas, generó la aplicación y subió el artefacto estático. La nueva descarga completa de SELAE realizada desde el entorno de trabajo también validó los 125 sorteos y se guardó en ese commit. La tarea horaria está configurada para repetir el procedimiento; aún no se ha observado una ocurrencia programada.

## 10. Corrección de visualización (18/10/2026)

Un reintegro sin coincidencias devolvía -1 al buscar su color. El cliente intentaba desestructurar un color inexistente y detenía el dibujo de los cinco sorteos. Se usa un índice válido también para los reintegros únicos. Se añade una prueba del script real de la interfaz con el histórico completo y ventanas con reintegros todos distintos y repetidos; se verifica el listado, la ausencia de avisos y el cambio a histórico.

## 11. Corrección de sincronización (18/10/2026)

La prueba real de la web devolvía un aviso de fallo de consulta a SELAE, mientras la importación mensual desde el entorno de trabajo sí obtenía los 125 resultados oficiales. Se elimina esa dependencia de red del lector web. La nueva ruta privada recibe el archivo validado desde el importador y lo conserva en R2; no requiere redespliegues rutinarios. Se añaden seis pruebas de escritura, rechazo de archivos inválidos, prevención de pérdidas y retrocesos, reconstrucción de enlaces oficiales y tratamiento de fallos de almacenamiento. Total: 21 pruebas automatizadas. La prueba de producción se realiza con la carga autenticada y dos lecturas posteriores.

## 12. Consulta histórica con confirmación visible (18/10/2026)

En un intervalo amplio que incluye el último sorteo, el filtro conservaba correctamente los mismos cinco resultados iniciales, pero no mostraba confirmación y la paginación quedaba al final del listado. Se añade un resumen visible con intervalo, número de resultados y orden. Los controles de página pasan a estar encima de los sorteos y se puede elegir orden ascendente o descendente. Los filtros se aplican al pulsar Consultar y no al paginar con fechas aún sin confirmar. Se limpia la validación al corregir cualquiera de las fechas. Se prueban el intervalo de la captura, el orden antiguo, los extremos inclusivos, la consulta vacía y la recuperación de fechas inválidas.

## 13. Motor de aprendizaje adaptativo — versión 1.0

### Propósito y límites

Analizar patrones descriptivos del histórico oficial y evaluar una predicción de seis números y reintegro con el objetivo experimental de alcanzar cuatro aciertos. No se garantiza ese objetivo ni una mejora sobre el azar. No se utiliza un modelo de lenguaje: es un conjunto de métodos estadísticos con aprendizaje secuencial de pesos, sin servicios de pago ni modificación autónoma del código.

### Características y modelos

Se calculan frecuencias de los 49 números y diez reintegros, distribución del número de pares/impares, parejas dentro de una misma combinación, diferencias entre números vecinos de la combinación ordenada y suma media. Cinco expertos aportan propuestas: azar uniforme reproducible, frecuencia acumulada, frecuencia reciente, recencia exponencial con semivida de doce sorteos y un método de parejas/estructura. Este último y la propuesta conjunta consideran coapariciones, paridad y distancias, con suavizado para observaciones escasas. Cada combinación contiene seis números distintos y un reintegro separado. El complementario no se predice.

Los pesos parten de 20 % por experto y se actualizan después de comprobar cada resultado. Los pesos para números y reintegro son independientes. La propuesta final combina las puntuaciones de los expertos y evalúa un conjunto acotado de candidatos; esos candidatos son un mecanismo interno de búsqueda, no varios boletos en la evaluación. Solo se evalúa una combinación final por sorteo. Las puntuaciones y pesos no son probabilidades calibradas de ganar.

### Prueba temporal sin anticipar resultados

Con ventana inicial de 30 sorteos, la primera predicción se hace para el 31 usando únicamente los 30 anteriores. Una vez evaluada se ajustan los pesos y se pasa al siguiente. Los expertos globales usan todo el pasado disponible; los recientes usan la ventana configurada (20, 30 o 50). El estado de pesos recoge solo resultados ya evaluados. Cada registro informa del intervalo de entrenamiento, combinación previa, resultado oficial, aciertos, reintegro y pesos anteriores. La simulación es determinista. Cambiar la ventana es otro experimento sobre los mismos datos, no una validación independiente. No se afina retrospectivamente el motor para aparentar acertar el resultado conocido.

Se compara con una sola combinación aleatoria reproducible por fecha y con la referencia combinatoria exacta: media de aciertos 36/49 y probabilidad de cuatro o más igual a la suma, para k de 4 a 6, de C(6,k) C(43,6-k) / C(49,6). El reintegro aleatorio tiene probabilidad 1/10. Una muestra pequeña y una media algo mayor no demuestran ventaja predictiva.

### Resultado inicial reproducible

Con los 125 sorteos oficiales hasta 17/10/2026 y ventana inicial 30: 95 predicciones evaluadas, media 0,8316 aciertos, máximo 3, cero sorteos con cuatro o más y 8 reintegros acertados (8,42 %). El azar simulado obtuvo media 0,7895 y 8 reintegros. **El objetivo de cuatro aciertos no se alcanzó**. La interfaz muestra este resultado, incluidos los fallos.

### Persistencia y actualización

`engine/model.js` contiene el cálculo puro. La construcción genera `data/ai-analysis.json`, `data/ai-model.json` y los tres informes estáticos en `public/data/`. El Worker incluye el motor y expone `/api/ai?window=20|30|50`. Guarda informes y estados en `ai/reports/` y `ai/models/` de R2. Conserva además la primera propuesta emitida por versión, ventana y fecha de entrenamiento en `ai/forecasts/`, sin reemplazar esa propuesta al recalcular. Esto permite distinguir una propuesta ya emitida de una simulación reconstruida. Su firma incluye versión y resultados oficiales; cualquier incorporación o corrección invalida el informe anterior. Una consulta con la misma firma reutiliza lo guardado. Las advertencias de antigüedad proceden del archivo oficial y se mantienen en el análisis.

La tarea existente descarga SELAE, valida, genera y sincroniza el histórico. `scripts/sync_site.py` confirma además que el análisis alojado corresponde al último sorteo, haciendo que el modelo por defecto se reconstruya y conserve sin redesplegar. Los modelos de otras ventanas se guardan al consultarlos. Si no cambian resultados ni respuestas originales no se crea un commit por una nueva marca temporal.

### Pruebas

Se añaden pruebas de combinaciones válidas, métricas, reproducibilidad, suma de pesos, comparación combinatoria, características, datos insuficientes, invalidación de caché y visualización del laboratorio. La prueba de no anticipación modifica el sorteo objetivo y todos los posteriores y verifica que la predicción previa no cambia; también comprueba que ejecutar solo un prefijo produce exactamente las mismas primeras pruebas. Total: 33 pruebas automatizadas antes de publicar. La comprobación alojada exige guardar el modelo y recibir un análisis coherente con el último resultado oficial.

## 14. Prioridad de reintegro — versión 1.1.0

El objetivo se actualiza por petición del propietario: primero el reintegro; después tres o más números. Se conservan los modelos de reintegro y combinación independientes, sin sacrificar uno para puntuar el otro. La recompensa adicional de los expertos numéricos se activa desde tres aciertos, manteniendo el aprendizaje posterior a cada resultado. La regla de reintegro no cambia: se selecciona el valor con mayor puntuación de su conjunto de expertos, aprendido por separado. La prioridad no se presenta como una mejora de precisión.

Se añaden métricas de tres o más aciertos y de tres o más más reintegro, y sus equivalentes de azar. La interfaz coloca primero el reintegro, luego el objetivo numérico y la coincidencia de ambos. La referencia conjunta de azar usa P(tres o más) × 1/10. Los informes de cuatro aciertos se conservan en el JSON para comparar, pero ya no son el objetivo principal de la pantalla.

La versión 1.1.0 conserva en el histórico de 30 sorteos iniciales el mismo resultado observado: 8 reintegros de 95 pruebas, una prueba con tres aciertos y ninguna con tres o más junto al reintegro. La propuesta permanece sin cambios. El azar simulado logró dos pruebas con tres o más y una junto al reintegro: el nuevo objetivo no convierte la prueba en una mejora demostrada. Se invalida la caché por versión y se conserva por separado la primera propuesta de cada versión. Total: 34 pruebas automatizadas superadas.
