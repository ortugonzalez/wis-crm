import express from 'express'
import ffmpegPath from 'ffmpeg-static'
import { createWriteStream } from 'node:fs'
import { promises as fs } from 'node:fs'
import { tmpdir } from 'node:os'
import { basename, extname, join } from 'node:path'
import { randomUUID } from 'node:crypto'
import { pipeline } from 'node:stream/promises'
import { spawn } from 'node:child_process'

const PORT = Number(process.env.PORT || 3001)
const OPENAI_API_KEY = process.env.OPENAI_API_KEY
const MODEL = process.env.OPENAI_TRANSCRIPTION_MODEL || 'gpt-4o-mini-transcribe'
const SECRET = process.env.AUDIO_GATEWAY_SECRET || ''

const app = express()
app.use(express.json({ limit: '2mb' }))

function fail(status, message) {
  const error = new Error(message)
  error.status = status
  return error
}

function assertSecret(req) {
  if (!SECRET) return
  const header = req.headers['x-transcribe-secret']
  if (header !== SECRET) {
    throw fail(401, 'Secret invalido.')
  }
}

async function downloadFile(url, targetPath) {
  const response = await fetch(url)
  if (!response.ok || !response.body) {
    throw fail(400, `No pude descargar el audio. Status ${response.status}.`)
  }

  await pipeline(response.body, createWriteStream(targetPath))
}

async function convertToMp3(inputPath, outputPath) {
  if (!ffmpegPath) {
    throw fail(500, 'ffmpeg no esta disponible en el gateway.')
  }

  await new Promise((resolve, reject) => {
    const process = spawn(ffmpegPath, [
      '-y',
      '-i', inputPath,
      '-ar', '16000',
      '-ac', '1',
      outputPath,
    ])

    let stderr = ''
    process.stderr.on('data', (chunk) => {
      stderr += chunk.toString()
    })

    process.on('error', reject)
    process.on('close', (code) => {
      if (code === 0) {
        resolve()
        return
      }

      reject(fail(500, `ffmpeg fallo al convertir el audio. ${stderr}`))
    })
  })
}

async function transcribeFile(filePath, fileName, language) {
  if (!OPENAI_API_KEY) {
    throw fail(500, 'Falta OPENAI_API_KEY en el gateway.')
  }

  const buffer = await fs.readFile(filePath)
  const form = new FormData()
  form.append('model', MODEL)
  if (language) {
    form.append('language', language)
  }
  form.append('file', new Blob([buffer], { type: 'audio/mpeg' }), fileName)

  const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${OPENAI_API_KEY}`,
    },
    body: form,
  })

  const body = await response.json().catch(() => ({}))
  if (!response.ok) {
    const message = body?.error?.message || 'OpenAI rechazo la transcripcion.'
    throw fail(response.status, message)
  }

  return body
}

function normalizePayload(req) {
  const fileUrl = req.body?.fileUrl || req.body?.file_url
  const fileName = req.body?.fileName || req.body?.file_name || 'telegram-audio.oga'
  const mimeType = req.body?.mimeType || req.body?.mime_type || 'audio/ogg'
  const language = req.body?.language || 'es'

  if (typeof fileUrl !== 'string' || !fileUrl.startsWith('http')) {
    throw fail(400, 'fileUrl es obligatorio y debe ser una URL valida.')
  }

  return { fileUrl, fileName, mimeType, language }
}

app.get('/healthz', async (_req, res) => {
  res.json({
    ok: true,
    service: 'wis-crm-audio-gateway',
    ffmpeg: Boolean(ffmpegPath),
    model: MODEL,
  })
})

async function handleTranscription(req, res, next) {
  const jobDir = join(tmpdir(), `wis-crm-audio-${randomUUID()}`)

  try {
    assertSecret(req)
    const { fileUrl, fileName, mimeType, language } = normalizePayload(req)

    await fs.mkdir(jobDir, { recursive: true })

    const inputExtension = extname(fileName) || '.oga'
    const inputPath = join(jobDir, `input${inputExtension}`)
    const outputName = `${basename(fileName, extname(fileName) || '.oga')}.mp3`
    const outputPath = join(jobDir, outputName)

    await downloadFile(fileUrl, inputPath)
    await convertToMp3(inputPath, outputPath)
    const transcription = await transcribeFile(outputPath, outputName, language)

    res.json({
      text: transcription.text || '',
      model: MODEL,
      sourceMimeType: mimeType,
      outputMimeType: 'audio/mpeg',
      fileName: outputName,
    })
  } catch (error) {
    next(error)
  } finally {
    await fs.rm(jobDir, { recursive: true, force: true }).catch(() => undefined)
  }
}

app.post('/', handleTranscription)
app.post('/transcribe', handleTranscription)

app.use((error, _req, res, _next) => {
  const status = error?.status || 500
  res.status(status).json({
    error: true,
    message: error?.message || 'Fallo el audio gateway.',
  })
})

app.listen(PORT, () => {
  console.log(`wis-crm-audio-gateway escuchando en ${PORT}`)
})
