import express from 'express'
import http from 'node:http'

const app = express()
const port = Number(process.env.PORT) || 3000
const springApi = new URL(process.env.SPRING_API_URL || 'http://127.0.0.1:8080')
// A local default keeps the gateway alive in development; production should set a secret explicitly.
const dbPassword = process.env.DB_PASSWORD || 'EduNexa2026!'
const allowedOrigins = new Set((process.env.CORS_ORIGIN || 'http://localhost:5173,http://localhost:80,http://localhost')
  .split(',').map((origin) => origin.trim()).filter(Boolean))

app.disable('x-powered-by')
app.use((req, res, next) => {
  const origin = req.headers.origin
  if (origin && allowedOrigins.has(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin)
    res.setHeader('Vary', 'Origin')
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization')
  if (req.method === 'OPTIONS') return res.sendStatus(204)
  next()
})

app.get('/health', (_req, res) => res.json({ status: 'UP', service: 'edunexa-api-gateway', sqlPasswordConfigured: Boolean(dbPassword) }))

app.use(['/api', '/api-docs'], (req, res) => {
  const upstreamPath = req.originalUrl
  const proxyRequest = http.request({
    hostname: springApi.hostname,
    port: springApi.port || 80,
    path: upstreamPath,
    method: req.method,
    headers: { ...req.headers, host: springApi.host, connection: 'close' },
    timeout: Number(process.env.UPSTREAM_TIMEOUT_MS) || 15000,
  }, (proxyResponse) => {
    res.writeHead(proxyResponse.statusCode || 502, proxyResponse.headers)
    proxyResponse.pipe(res)
  })

  proxyRequest.on('timeout', () => proxyRequest.destroy(new Error('Spring API request timed out')))
  proxyRequest.on('error', (error) => {
    if (res.headersSent) return res.destroy(error)
    res.status(503).json({ ok: false, error: { message: 'La API vocacional está iniciando o no responde. Puedes continuar con el modo local.' } })
  })
  req.pipe(proxyRequest)
})

app.use((_req, res) => res.status(404).json({ ok: false, error: { message: 'Ruta no encontrada.' } }))
app.listen(port, '0.0.0.0', () => console.log(`EDUNEXA API gateway listo en el puerto ${port}`))
