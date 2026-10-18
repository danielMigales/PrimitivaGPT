# Revisión completa de PrimitivaGPT — pendientes guardados

Fecha de revisión: 2026-10-18

## Estado verificado

- [x] El repositorio conserva el histórico normalizado en `data/draws.json` y los originales mensuales en `data/raw/`.
- [x] Existe motor estadístico en `engine/model.js` con siete métodos: azar uniforme, frecuencia acumulada, frecuencia reciente, recencia ponderada, parejas/estructura, Bayes regularizado y Markov regularizado.
- [x] El proceso de compilación genera una página estática y análisis para ventanas de 10, 20, 30…100 sorteos.
- [x] GitHub Pages ya ha completado una ejecución de publicación con estado `success`.
- [x] La página estática ahora guarda propuestas y evaluaciones en el almacenamiento local del navegador, separadas por ventana de 10–100, en incrementos de 10 sorteos. Esta persistencia es solo de ese navegador/dispositivo, no un backend compartido.
- [ ] La sincronización automática oficial y el almacenamiento compartido del Worker/Sites siguen sin estar demostrados como operativos; el almacenamiento local no sustituye estas funciones.
- [ ] Hay que comprobar que la web publicada refleja la versión actual del código y que todos los controles principales funcionan en móvil.

## Pendientes priorizados

### P0 — Verificar la publicación real
- [ ] Abrir la URL de GitHub Pages en móvil y comprobar Inicio, Histórico, filtros, paginación y exportación JSON.
- [ ] Comprobar que se carga el histórico real versionado y que las fechas/números coinciden con los datos del repositorio.
- [ ] Abrir Laboratorio IA y ejecutar una simulación para cada ventana (20, 30, 50); comprobar que no hay errores de consola visibles ni pantallas vacías.
- [ ] Verificar que el pie y los textos de la interfaz no prometan funciones del Worker que no están disponibles en la versión estática.

### P1 — Seguimiento de propuestas
- [x] Añadir un registro local de propuestas en la versión estática, separado por ventana y persistido en localStorage del navegador.
- [x] Reconciliar propuestas guardadas contra los resultados incluidos en el histórico estático y calcular aciertos de números/reintegro.
- [ ] Diseñar almacenamiento compartido de propuestas reales, separado de las simulaciones retrospectivas.
- [x] En el registro local, guardar fecha de creación, sorteo objetivo, combinación, reintegro, versión y estado pendiente/evaluada.
- [x] En el registro local, evaluar aciertos cuando el resultado aparece en el histórico cargado y conservar propuestas anteriores.
- [ ] Verificar en navegador real que el ciclo completo se ejecuta correctamente tras una actualización de datos.
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
- Conservar los siete métodos del motor y los análisis para ventanas de 10 a 100, en incrementos de 10 sorteos.
- Mantener separadas las evaluaciones retrospectivas y las propuestas reales.

## Cambios recientes

- Commit `87f01bf`: añadido seguimiento local a `public/index.html`. Las propuestas se guardan por ventana en localStorage y se evalúan al encontrar la fecha en `public/data/draws.json`.
- Límite importante: limpiar los datos del navegador o cambiar de dispositivo puede perder/no mostrar ese registro; no hay sincronización entre usuarios ni dispositivos. No debe describirse como persistencia de servidor.

## Siguiente paso recomendado

Ejecutar el workflow de validación tras el cambio y verificar el sitio publicado. Para recuperar seguimiento compartido y sincronización SELAE se necesita restaurar/provisionar el Worker privado y su bucket, con credenciales efímeras gestionadas de forma segura; no es seguro inventar ni publicar esos accesos.
