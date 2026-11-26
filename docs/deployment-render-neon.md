# Despliegue manual en Render y Neon

Esta guía utiliza el proyecto Neon ya creado: rama `production`, base `neondb`, puerto `5432` y SSL requerido. No crea otra base de datos ni copia los registros locales de pedidos o ventas.

## 1. Preparar Neon desde DBeaver

Conecta DBeaver a la conexión Neon existente y confirma que el catálogo sea `neondb`, la rama `production` y SSL esté habilitado (`SSL Mode=Require`). No selecciones ni ejecutes scripts sobre la conexión local `periquito_db`.

Ejecuta estos archivos, en este orden, desde la raíz del repositorio:

1. `database/schema.sql`: crea las tablas, claves, restricciones, índices, función y trigger. No inserta filas.
2. `database/seed-production.sql`: agrega solamente roles, categorías, platos, mesas e insumos iniciales. Es repetible y no crea usuarios, pedidos, detalles, ventas ni movimientos de inventario.
3. `database/verify-production.sql`: lectura de conteos. Antes de crear usuarios o empezar a operar, `users`, `orders`, `order_details`, `sales` e `inventory_movements` deben ser cero.

No ejecutes `database/seed.sql` en Neon: es la semilla existente sin protección frente a repetición. `database/queries.sql` contiene consultas de lectura para revisar la información después de la carga; las consultas de ventas estarán vacías al iniciar.

El esquema continúa siendo Database First. No se ejecuta migración de EF, scaffolding ni SQL sobre la base local. Los usuarios iniciales se crearán después con `UserBootstrapper`, que aplica el `PasswordService` y el hasher de ASP.NET Identity.

## 2. Crear el Web Service de API en Render

Desde el repositorio GitHub, crea un Web Service con estos valores:

- Runtime: Docker.
- Root directory: vacío, raíz del repositorio.
- Dockerfile path: `./Dockerfile`.
- Docker build context: `.`.
- Región: Ohio, para acercar la API a Neon AWS US East 2 (Ohio).
- Health check path: `/api/health`.
- Plan: Free para la primera validación.
- No agregues un servicio PostgreSQL de Render.

El Dockerfile escucha en `0.0.0.0` y usa `PORT` de Render, con `10000` como valor local por defecto. Render termina HTTPS en su proxy y reenvía HTTP al contenedor. La variable `ASPNETCORE_FORWARDEDHEADERS_ENABLED=true` permite a ASP.NET Core reconocer el esquema HTTPS reenviado y mantiene correcta la redirección HTTPS. Esta configuración confía los encabezados de proxy que llegan al servicio; úsala únicamente en este servicio tras Render.

Configura estas variables en el Web Service. En `render.yaml` ya están declaradas como plantilla, sin secretos reales:

| Nombre | Valor |
| --- | --- |
| `ASPNETCORE_ENVIRONMENT` | `Production` |
| `ASPNETCORE_FORWARDEDHEADERS_ENABLED` | `true` |
| `ConnectionStrings__DefaultConnection` | Cadena Npgsql de Neon para `neondb` en `production`; host, usuario y contraseña copiados del panel Neon; puerto `5432`; `SSL Mode=Require`. Guárdala como variable secreta de Render. |
| `Jwt__Key` | Clave aleatoria nueva de al menos 32 bytes UTF-8; no reutilices la clave local. Guardar como secreta. |
| `Jwt__Issuer` | `PeriquitoManagement` |
| `Jwt__Audience` | `PeriquitoManagementFrontend` |
| `Jwt__ExpirationMinutes` | `30` |
| `Cors__AllowedOrigins__0` | Origen exacto del Static Site, por ejemplo `https://<nombre-frontend>.onrender.com`, sin ruta ni barra final. |
| `BootstrapUsers__Enabled` | `false` normalmente; ver creación inicial más abajo. |
| `BootstrapUsers__Administrator__Username` | Nombre de usuario administrativo que elijas, máximo 60 caracteres. Secreto/configuración privada. |
| `BootstrapUsers__Administrator__FullName` | Nombre para mostrar, máximo 120 caracteres. |
| `BootstrapUsers__Administrator__Password` | Contraseña aleatoria exclusiva, de 12 a 128 caracteres. Secreto. |
| `BootstrapUsers__Waiter__Username` | Nombre de usuario del mesero, diferente al administrador. |
| `BootstrapUsers__Waiter__FullName` | Nombre para mostrar, máximo 120 caracteres. |
| `BootstrapUsers__Waiter__Password` | Contraseña aleatoria exclusiva, de 12 a 128 caracteres. Secreto. |

Render asigna `PORT`; no la fijes manualmente. La cadena Npgsql sigue el formato habitual de claves, por ejemplo `Host=...;Port=5432;Database=neondb;Username=...;Password=...;SSL Mode=Require`; reemplaza todos los valores por los datos del panel de tu conexión Neon, sin guardar esa cadena en archivos.

### Crear los usuarios de producción una sola vez

1. Primero ejecuta schema y semilla para que existan los roles `Administrador` y `Mesero`.
2. En la configuración privada del Web Service, establece `BootstrapUsers__Enabled=true` y agrega las cuatro variables de usuario y las dos contraseñas descritas arriba. Usa contraseñas únicas generadas por un gestor; no uses las contraseñas locales de prueba.
3. Despliega o reinicia la API. `UserBootstrapper` crea los dos usuarios faltantes dentro de una transacción y genera sus hashes con `PasswordService`. No actualiza las contraseñas de usuarios ya existentes.
4. Comprueba el inicio de sesión por HTTPS y que ambos roles se mapeen correctamente.
5. Cambia `BootstrapUsers__Enabled=false` y elimina las dos variables de contraseña de Render. Conserva de forma segura las credenciales elegidas en tu gestor. Si la base estuviera vacía en un reinicio y el bootstrap quedara habilitado sin credenciales, la aplicación fallaría al iniciar.

No uses credenciales predeterminadas ni compartas secretos en GitHub, el navegador o variables `VITE_*`.

## 3. Crear el Static Site del frontend

Desde el mismo repositorio GitHub, crea un Static Site:

- Root directory: `periquito-frontend`.
- Build command: `npm ci && npm run build`.
- Publish directory: `dist`.
- Variable de entorno de compilación `VITE_API_URL`: `https://<nombre-api>.onrender.com/api`.
- Regla de rewrite: source `/*`, destination `/index.html`, action `Rewrite`.

La aplicación consume `VITE_API_URL` al compilar; cambiarla requiere volver a desplegar el Static Site. Esta variable solo debe contener la URL pública de la API, nunca una clave o credencial. La URL de producción no debe ser `localhost`.

Después de conocer la URL final del frontend, configura `Cors__AllowedOrigins__0` con ese origen exacto y vuelve a desplegar la API. Si más adelante agregas un dominio propio, añade otro índice como `Cors__AllowedOrigins__1` con el origen exacto del dominio.

## 4. Compilar y probar localmente

Desde la raíz del repositorio:

```powershell
dotnet build PeriquitoManagement.sln
```

En otra terminal:

```powershell
Set-Location periquito-frontend
npm ci
npm run build
```

Para desarrollo, conserva las configuraciones y credenciales locales existentes. El proxy de Vite usa `VITE_API_PROXY_TARGET` y su valor de desarrollo es `http://localhost:5169`; esta variable solo sirve al servidor de desarrollo. No establezcas ese destino como `VITE_API_URL` para Render.

Una vez desplegada y con las tablas creadas, abre `https://<nombre-api>.onrender.com/api/health`. La respuesta `200` con `{"status":"connected"}` confirma la conexión a Neon; `503` indica que la API no pudo conectarse. El proceso requiere entonces revisar variables/logs de Render y el estado de la conexión Neon, sin exponer la cadena en capturas o registros.

## 5. Seguridad y límites

- El CORS de producción solo acepta los orígenes escritos en `Cors__AllowedOrigins__0`, `__1`, etc.; no uses `*`.
- El JWT y la cadena Neon se guardan solo como variables privadas en Render.
- Vite expone al navegador todas las variables `VITE_*`; no pongas ahí secretos.
- Las políticas de autenticación y roles existentes continúan activas. Los costos siguen restringidos a las respuestas administrativas.
- La aplicación no sirve imágenes ni archivos persistentes; el sistema de archivos del contenedor no debe usarse para datos durables.
- En el plan Free, Render suspende una API inactiva por 15 minutos y la siguiente solicitud puede tardar alrededor de un minuto en despertar. Está pensado para pruebas/hobby y no garantiza disponibilidad continua. El Static Site sí puede permanecer en plan Free.
