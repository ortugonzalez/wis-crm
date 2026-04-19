# Deploy en Easypanel - WIS CRM

## Tipo de servicio

Crear un servicio nuevo tipo `App` o `Dockerfile` apuntando a esta carpeta:

`C:\Users\Operador\wis-crm`

## Build

El proyecto ya fue validado localmente con:

1. `npm run lint`
2. `npm run build`

## Variables de entorno

Minimas:

1. `NEXT_PUBLIC_SUPABASE_URL`
2. `NEXT_PUBLIC_SUPABASE_ANON_KEY`
3. `SUPABASE_URL`
4. `SUPABASE_SERVICE_ROLE_KEY`
5. `PORT=3000`

Recomendadas:

1. `BASIC_AUTH_USER`
2. `BASIC_AUTH_PASSWORD`

## Puerto

Exponer el puerto `3000`.

## Healthcheck sugerido

Usar la ruta `/`.

## Orden recomendado de despliegue

1. Correr el SQL de `supabase/schema.sql`
2. Crear variables en Easypanel
3. Desplegar `wis-crm`
4. Verificar que cargue la home
5. Verificar que `/api/prospects` responda
6. Recien despues conectar n8n y Telegram
