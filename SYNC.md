# Actualización de PrimitivaGPT

La tarea vinculada al sitio consulta SELAE y sincroniza `danielMigales/PrimitivaGPT` en `main`, con permiso del propietario.

1. Obtener un checkout de la rama main actual. Ejecutar `python scripts/update_data.py`, `npm test` y `npm run build`. Requiere Python 3.12+, Node 22+ y curl.
2. Tras descarga y validación completas, guardar en GitHub solo los cambios de `data/`, `worker/index.js` y `public/`. Conservar el resto del árbol y comprobar el head actual. Usar el conector GitHub para escribir; no hacen falta claves personales en el proyecto. Ante un cambio concurrente, releer y mezclar sin force push.
3. El importador conserva los resultados anteriores y añade/corrige los oficiales. No publicar resultados incompletos ni sustituirlos por ejemplos. Si los archivos no cambian no se necesita commit.
4. Para el sitio privado `appgprj_6ad47d5e88c88191ab3a55378b7ce93e`, obtener `get_site`, conservar su audiencia y usar el acceso efímero devuelto únicamente en su URL, con la cabecera `OAI-Sites-Authorization: Bearer <valor>`; nunca imprimirlo ni guardarlo.
5. GET `/api/draws` actualiza la copia R2 con SELAE cuando tiene más de quince minutos. Exigir HTTP 200 y ausencia de warning; volver a leer y comprobar iguales `checkedAt`, `latestDate` e identificadores. Ante error conservar la copia anterior y reportar el fallo.

GitHub Actions valida el proyecto cuando se actualiza main y genera una versión estática descargable. La descarga oficial se ejecuta en la tarea vinculada porque las pruebas iniciales desde GitHub Actions fallaron tanto con urllib (403) como con curl (código 22). No se realizan cambios de código ni despliegues durante una actualización rutinaria.
