# Actualización desatendida del archivo alojado

Sitio: `appgprj_6ad47d5e88c88191ab3a55378b7ce93e`.

1. Consultar `get_site` y confirmar que el sitio sigue siendo privado y propiedad del usuario. Usar la URL devuelta; no cambiar la audiencia.
2. Obtener el acceso de servicio efímero que devuelva `get_site` o `generate_siwc_bypass_token`, sin imprimirlo ni guardarlo.
3. Hacer GET a `/api/draws`, pasando el acceso únicamente a este sitio en la cabecera `OAI-Sites-Authorization: Bearer <valor>`. El manejador incorpora desde SELAE las novedades y conserva el histórico en R2.
4. Leer el JSON: exigir HTTP 200, ausencia de `warning`, `source` igual a SELAE, fecha inicial 2026-01-01 y ausencia de huecos. Una segunda lectura comprueba que `checkedAt`, `latestDate` y los identificadores coinciden con lo guardado.
5. Si hay error o aviso, conservar los datos y reportar el fallo; no inventar resultados, borrar registros ni publicar versiones de código. No enviar mensajes a terceros.

El lector de datos es también el escritor controlado de la copia oficial compartida. El límite de quince minutos evita consultas redundantes. No se necesitan secretos de SELAE ni sesiones de apps conectadas. Los resultados históricos iniciales permanecen además en el repositorio fuente del sitio.
