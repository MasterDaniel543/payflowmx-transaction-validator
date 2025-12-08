const app = require('./app')
const pino = require('pino')

const logger = pino()
const port = process.env.PORT || 8080

app.listen(port, () => {
  logger.info({ port }, 'server_started')
})
