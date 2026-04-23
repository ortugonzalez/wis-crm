# Audio Gateway

Servicio chico para convertir audios `oga/ogg` de Telegram a `mp3` usando `ffmpeg`, y luego transcribir con OpenAI.

## Endpoints

- `GET /healthz`
- `POST /`
- `POST /transcribe`

## Body esperado

```json
{
  "fileUrl": "https://api.telegram.org/file/bot.../voice/file_123.oga",
  "fileName": "file_123.oga",
  "mimeType": "audio/ogg",
  "language": "es"
}
```

## Header de seguridad

```text
x-transcribe-secret: TU_SECRETO
```

## Respuesta

```json
{
  "text": "texto transcripto",
  "model": "gpt-4o-mini-transcribe",
  "sourceMimeType": "audio/ogg",
  "outputMimeType": "audio/mpeg",
  "fileName": "file_123.mp3"
}
```
