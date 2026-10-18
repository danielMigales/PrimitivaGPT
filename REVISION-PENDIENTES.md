# Revisión completa de PrimitivaGPT — pendientes guardados

Fecha de revisión: 2026-10-18

## Estado verificado

- [x] El repositorio conserva el histórico normalizado en `data/draws.json` y los originales mensuales en `data/raw/`.
- [x] Existe motor estadístico en `engine/model.js` con siete métodos: azar uniforme, frecuencia acumulada, frecuencia reciente, recencia ponderada, parejas/estructura, Bayes regularizado y Markov regularizado.
- [x] El proceso de compilación genera una página estática y análisis para ventanas de 20, 30 y 50 sorteos.
- [x] GitHub Pages ya ha completado una ejecución de publicación con estado `success`.
- [ ] La página estática no tiene un backend persistente; la propia documentación indica que el seguimiento real de propuestas no se conserva en GitHub Pages.
- [ ] La sincronización automática de resultados oficiales y el almacenamiento persistente que existían en el flujo de Sites/Worker no están demostrados como operativos en la publicación estática.
- [ ] Hay que comprobar que la web publicada refleja la versión actual del código y que todos los controles principales funcionan en móvil.

## Pendientes priorizados

### P0 — Verificar la publicación real
- [ ] Abrir la URL de GitHub Pages en móvil y comprobar Inicio, Histórico, filtros, paginación y exportación JSON.
- [ ] Comprobar que se carga el histórico real versionado y que las fechas/números coinciden con los datos del repositorio.
- [ ] Abrir Laboratorio IA y ejecutar una simulación para cada ventana (20, 30, 50); comprobar que no hay errores de consola visibles ni pantallas vacías.
- [ ] Verificar que el pie y los textos de la interfaz no prometan funciones del Worker que no están disponibles en la versión estática.

### P1 — Recuperar el seguimiento de propuestas reales
- [ ] Diseñar almacenamiento persistente para las propuestas reales, separado de las simulaciones retrospectivas.
- [ ] Guardar cada propuesta con fecha de creación, fecha del sorteo objetivo, combinación de seis números, reintegro, método/versión y estado pendiente/evaluada.
- [ ] Al llegar el resultado oficial, evaluar aciertos de números y reintegro, conservar el historial y preparar la siguiente propuesta.
- [ ] Evitar que reconstruir los análisis de 20/30/50 ventanas borre o duplique el seguimiento real.
- [ ] Elegir y documentar un backend persistente compatible con la web pública. GitHub Pages por sí solo no puede escribir de forma segura en el repositorio ni ofrece una base de datos.

### P1 — Sincronización segura de resultados oficiales
- [ ] Confirmar que la fuente es SELAE y que los resultados se validan antes de actualizar datos.
- [ ] No sustituir datos oficiales por ejemplos ni modificar el histórico si la descarga falla.
- [ ] Hacer la sincronización idempotente: dos ejecuciones consecutivas no deben duplicar sorteos.
- [ ] Registrar fecha de última sincronización, último sorteo disponible y errores recuperables.
- [ ] No almacenar tokens, claves ni credenciales en archivos del repositorio o en el navegador.

### P2 — Laboratorio IA y transparencia
- [ ] Verificar la reproducción de resultados y el aprendizaje temporal sin fuga de información del sorteo evaluado.
- [ ] Mostrar claramente diferencia entre simulaciones históricas y propuestas reales seguidas en producción.
- [ ] Mantener la comparación con una referencia aleatoria, los aciertos por categoría y las métricas probabilísticas cuando estén disponibles.
- [ ] Dejar explícito que el análisis estadístico no garantiza premios ni demuestra ventaja sobre el azar.

### P2 — Interfaz, accesibilidad y robustez móvil
- [ ] Revisar navegación, botones, contraste, tamaños táctiles, tablas/bolas y diseño en pantallas estrechas.
- [ ] Comprobar estados de carga, errores de red y datos vacíos.
- [ ] Confirmar que la exportación descarga datos válidos y que los filtros/paginación no cambian los recuentos globales.

### P3 — Calidad y mantenimiento
- [ ] Ejecutar todas las pruebas JS y Python y la compilación desde un estado limpio.
- [ ] Añadir pruebas para datos duplicados, resultados incompletos, fechas fuera de orden y fallos de sincronización.
- [ ] Documentar qué funciones requieren Worker/backend y cuáles funcionan como sitio estático.
- [ ] Mantener el workflow de Pages separado de la validación y comprobar que ambos informan claramente del resultado.

## Restricciones de seguridad y datos

- No borrar ni sobrescribir el histórico oficial ni los archivos mensuales originales para implementar el seguimiento.
- No añadir secretos al repositorio.
- No marcar una tarea como completada hasta verificarla en la web publicada o con una prueba automatizada.
- Conservar los siete métodos del motor y los análisis para ventanas de 20, 30 y 50 sorteos.
- Mantener separadas las evaluaciones retrospectivas y las propuestas reales.

## Siguiente paso recomendado

Completar primero P0 con pruebas en la URL publicada. Después diseñar P1, ya que la persistencia del seguimiento y la sincronización oficial no se pueden resolver solo con HTML estático. Registrar cada cambio en este archivo y actualizar las casillas únicamente tras verificarlo.
