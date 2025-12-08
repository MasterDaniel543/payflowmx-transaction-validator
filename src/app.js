const express = require('express')
const pino = require('pino')

const app = express()
const logger = pino()

app.use(express.json())

app.get('/healthz', (req, res) => {
  res.status(200).json({ status: 'ok' })
})

app.post('/validate', (req, res) => {
  const tx = req.body
  const valid = tx && typeof tx.amount === 'number' && tx.amount > 0
  if (!valid) {
    logger.warn({ tx }, 'invalid_transaction')
    return res.status(400).json({ valid: false })
  }
  logger.info({ tx }, 'transaction_validated')
  res.json({ valid: true })
})

module.exports = app
