const { NodeSDK } = require('@opentelemetry/sdk-node')
const { getNodeAutoInstrumentations } = require('@opentelemetry/auto-instrumentations-node')
const { JaegerExporter } = require('@opentelemetry/exporter-jaeger')

const endpoint = process.env.JAEGER_ENDPOINT || 'http://localhost:14268/api/traces'
const exporter = new JaegerExporter({ endpoint })

const sdk = new NodeSDK({
  traceExporter: exporter,
  instrumentations: [getNodeAutoInstrumentations()]
})

sdk.start().catch((err) => {
  // do not throw
})
