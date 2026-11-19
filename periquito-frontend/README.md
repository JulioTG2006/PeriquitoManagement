# Periquito frontend

Interfaz React + Vite + TypeScript del sistema del Restaurante Periquito.

## Requisitos

- Node.js 20.19+ (o 22.12+). Node.js 24 LTS también es compatible.
- npm 10+.
- API de PeriquitoManagement ejecutándose en `http://localhost:5169`.

## Ejecutar API y frontend desde Rider

1. Abre la solución `PeriquitoManagement.sln` en Rider.
2. En el selector de configuración, selecciona el perfil `http` del proyecto `PeriquitoManagement.Api` y presiona **Run**. El perfil inicia la API en `http://localhost:5169` y usa el entorno `Development`.
3. Abre la ventana **Terminal** de Rider y ejecuta:

   ```powershell
   cd periquito-frontend
   npm install
   npm run dev
   ```

4. Abre `http://localhost:5173`. Vite reenvía `/api/*` al backend local. No se necesita guardar la URL ni secretos para el desarrollo local.

Para compilar el frontend, ejecuta `npm run build` dentro de esta carpeta. Para arrancar la API desde una terminal independiente, usa `dotnet run --project PeriquitoManagement.Api --launch-profile http` desde la raíz del repositorio.

## Sesión

El token JWT permanece solo en memoria JavaScript y se envía como Bearer en las solicitudes autenticadas. No se escribe en `localStorage`, `sessionStorage` ni cookies. Al recargar o cerrar la pestaña se pierde la sesión y se debe volver a iniciar sesión. La API valida el token y `/api/auth/me` confirma el usuario después del login y al solicitar la verificación desde el perfil. La estrategia reduce la persistencia ante accesos posteriores al almacenamiento del navegador, pero un script malicioso activo en la página podría acceder al token mientras la sesión está abierta; se requiere HTTPS fuera del desarrollo local.

## API y despliegue posterior

`VITE_API_URL` es opcional; si se omite, la app usa `/api` y el proxy local de Vite. Copia `.env.example` a `.env.local` solo si necesitas configurar la URL. En Render, establece `VITE_API_URL` con el origen y prefijo de la API (por ejemplo, `https://api.ejemplo.com/api`) y configura en la API `Cors__AllowedOrigins__0` con el origen exacto del frontend publicado. La API deniega por defecto los orígenes no incluidos en esa lista. No pongas claves, contraseñas ni tokens en variables `VITE_*`: se incorporan al código público del navegador.

Las secciones administrativas de platos, categorías, mesas, pedidos, ventas, inventario, reportes y usuarios están preparadas en navegación y marcadas como pendientes. No representan operaciones implementadas.
