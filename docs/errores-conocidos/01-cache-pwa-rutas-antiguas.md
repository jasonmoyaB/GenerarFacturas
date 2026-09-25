# Rutas antiguas servidas por la caché PWA

## Síntomas

Al abrir el entorno de desarrollo en `http://localhost:5173` aparecen estos errores:

```text
GET http://localhost:5173/src/main.tsx 404 (Not Found)
GET http://localhost:5173/@vite-plugin-pwa/pwa-entry-point-loaded 404 (Not Found)
```

La aplicación no carga o muestra una página correspondiente a una versión anterior.

## Causa

Un service worker o la caché del navegador conserva un `index.html` antiguo para el mismo origen (`http://localhost:5173`). Ese HTML todavía intenta cargar:

- `/src/main.tsx`
- `/@vite-plugin-pwa/pwa-entry-point-loaded`

Esas rutas no existen en la versión actual:

- El punto de entrada vigente es `/src/main.jsx`, declarado en `index.html`.
- El proyecto no usa `vite-plugin-pwa`.
- La PWA actual se implementa manualmente con `public/sw.js` y `public/manifest.webmanifest`.
- El service worker actual solo se registra en builds de producción.

Por tanto, no es un error de resolución de Vite ni falta renombrar `main.jsx` a `main.tsx`. El navegador está sirviendo recursos obsoletos registrados anteriormente bajo el mismo host y puerto.

## Solución recomendada

El repositorio incluye `src/main.tsx` como entrada de recuperación. Si el navegador recibe el HTML antiguo, esta ruta ahora:

1. Desregistra los service workers del origen.
2. Elimina únicamente `Cache Storage`.
3. Conserva el borrador almacenado en `localStorage`.
4. Recarga `/` con una URL nueva para obtener el `index.html` vigente.

Además, `src/main.jsx` desregistra workers residuales al ejecutarse en desarrollo. Una vez actualizado el código, normalmente basta con recargar la pestaña una vez.

`vite.config.js` también responde temporalmente a `/@vite-plugin-pwa/pwa-entry-point-loaded` para que la segunda importación antigua no produzca otro 404 durante la recuperación.

Si el navegador continúa mostrando el HTML antiguo, aplicar la limpieza manual:

1. Detener el servidor de desarrollo.
2. Abrir las herramientas de desarrollo del navegador.
3. Ir a **Application > Service Workers**.
4. Pulsar **Unregister** para los workers asociados a `localhost:5173`.
5. Ir a **Application > Storage** y borrar `Cache storage` para ese origen.
6. No borrar `Local storage` si se quiere conservar el borrador de la proforma.
7. Cerrar la pestaña.
8. Iniciar nuevamente el servidor:

```bash
npm run dev
```

9. Abrir de nuevo `http://localhost:5173` y hacer una recarga forzada con `Ctrl+Shift+R`.

## Limpieza desde la consola

Como alternativa, ejecutar esto en la consola del navegador mientras se está en `http://localhost:5173`:

```js
await Promise.all(
  (await navigator.serviceWorker.getRegistrations()).map((registration) => registration.unregister()),
);

await Promise.all(
  (await caches.keys()).map((name) => caches.delete(name)),
);

location.reload();
```

Esta limpieza elimina service workers y cachés, pero conserva los datos de la proforma guardados en `localStorage`.

## Verificación

Después de limpiar la caché:

1. La pestaña **Network** debe mostrar una solicitud exitosa a `/src/main.jsx`.
2. No deben aparecer solicitudes a `/src/main.tsx`.
3. No deben aparecer solicitudes a `/@vite-plugin-pwa/pwa-entry-point-loaded`.
4. En desarrollo no debe quedar ningún service worker controlando la página.

## Prevención

- No registrar service workers durante `npm run dev`.
- Probar la PWA con `npm run build` y `npm run preview`, preferiblemente en otro puerto.
- Incrementar el nombre de caché de `public/sw.js` al cambiar la estrategia o los recursos precargados.
- Si otro proyecto usa `localhost:5173`, limpiar sus workers antes de reutilizar el mismo origen.
