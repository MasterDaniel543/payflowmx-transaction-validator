require('./telemetry')
const app = require('./app')
const logger = require('./logger')

const port = process.env.PORT || 8080

app.listen(port, () => {
  logger.info({ port }, 'server_started')
})
