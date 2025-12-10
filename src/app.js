const express = require('express')
const fs = require('fs')
const pino = require('pino')
const client = require('prom-client')

const app = express()
const logStream = fs.createWriteStream('logs/app.log', { flags: 'a' })
const logger = pino({}, logStream)

const register = new client.Registry()
client.collectDefaultMetrics({ register })
const httpRequestDuration = new client.Histogram({
  name: 'http_request_duration_seconds',
  help: 'HTTP request latency in seconds',
  labelNames: ['method', 'path', 'status_code'],
  buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2, 5]
})
const httpErrorsTotal = new client.Counter({
  name: 'http_errors_total',
  help: 'Total number of HTTP errors (>=500)',
  labelNames: ['path']
})
register.registerMetric(httpRequestDuration)
register.registerMetric(httpErrorsTotal)

app.use(express.json())

const { context, trace } = require('@opentelemetry/api')
app.use((req, res, next) => {
  const span = trace.getSpan(context.active())
  const sc = span && typeof span.spanContext === 'function' ? span.spanContext() : undefined
  req.traceId = sc && sc.traceId
  if (req.traceId) res.set('X-Trace-Id', req.traceId)
  next()
})

app.use((req, res, next) => {
  const start = process.hrtime.bigint()
  res.on('finish', () => {
    const dur = Number(process.hrtime.bigint() - start) / 1e9
    const path = req.route?.path || req.path
    httpRequestDuration.labels(req.method, path, String(res.statusCode)).observe(dur)
    if (res.statusCode >= 500) httpErrorsTotal.labels(path).inc()
  })
  next()
})

app.get('/healthz', (req, res) => {
  res.status(200).json({ status: 'ok' })
})

app.get('/fail', (req, res) => {
  res.status(500).json({ error: 'simulated_failure' })
})

app.post('/validate', (req, res) => {
  const tx = req.body
  const valid = tx && typeof tx.amount === 'number' && tx.amount > 0
  if (!valid) {
    logger.warn({ tx, traceId: req.traceId }, 'invalid_transaction')
    return res.status(400).json({ valid: false })
  }
  logger.info({ tx, traceId: req.traceId }, 'transaction_validated')
  res.json({ valid: true })
})

app.get('/metrics', async (req, res) => {
  res.set('Content-Type', register.contentType)
  res.end(await register.metrics())
})

module.exports = app
