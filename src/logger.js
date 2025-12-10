const fs = require('fs')
const pino = require('pino')

const stream = fs.createWriteStream('logs/app.log', { flags: 'a' })
module.exports = pino({}, stream)
