# WIS CRM

CRM visual de uso personal para WIS Agency.

## Que hace

1. Muestra prospectos en pipeline tipo kanban.
2. Guarda datos en Supabase.
3. Expone endpoints internos para crear, actualizar y listar prospectos y actividades.
4. Esta pensado para integrarse con Telegram + n8n + Supabase.

## Variables de entorno

Copiar `.env.example` a `.env.local` para desarrollo.

Variables requeridas:

1. `NEXT_PUBLIC_SUPABASE_URL`
2. `NEXT_PUBLIC_SUPABASE_ANON_KEY`
3. `SUPABASE_URL`
4. `SUPABASE_SERVICE_ROLE_KEY`

Variables recomendadas para produccion:

1. `BASIC_AUTH_USER`
2. `BASIC_AUTH_PASSWORD`
3. `PORT`

## Desarrollo local

```bash
npm install
npm run dev
```

Abrir [http://localhost:3000](http://localhost:3000)

## Produccion

```bash
npm install
npm run build
npm run start
```

## Seguridad

Si definis `BASIC_AUTH_USER` y `BASIC_AUTH_PASSWORD`, la app y sus endpoints quedan protegidos con autenticacion basica.

Esto es importante si la vas a publicar en Easypanel para uso personal.

## Modelo de datos actual

La app ya esta preparada para trabajar con:

1. `prospects`
2. `activities`
3. `follow_ups`
4. `reminders`
5. `raw_messages`

Eso permite que n8n y Telegram escriban sobre la misma base que luego ves en la interfaz web.
