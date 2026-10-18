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

La primera petición inicializa el archivo persistente con la copia del proyecto. Pasados quince minutos desde la última consulta válida, una petición vuelve a SELAE, consulta desde el mes del último resultado guardado y mezcla las novedades. La última escritura del JSON normalizado ocurre tras validar la respuesta. Ante fallos de SELAE o del almacenamiento, el cliente recibe los resultados conservados y un aviso visible con la fecha de consulta. El servidor limita los métodos a GET y aplica cabeceras de seguridad.

La interfaz consulta al abrirse y cada quince minutos mientras está visible. El botón manual consulta el servidor, que respeta la ventana de quince minutos para no sobrecargar SELAE. Esta comprobación depende de visitas: por sí sola no actualiza el archivo con la aplicación cerrada.

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
