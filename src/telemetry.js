const { NodeSDK } = require('@opentelemetry/sdk-node')
const { getNodeAutoInstrumentations } = require('@opentelemetry/auto-instrumentations-node')
const { JaegerExporter } = require('@opentelemetry/exporter-jaeger')
const { Resource } = require('@opentelemetry/resources')
const { SemanticResourceAttributes } = require('@opentelemetry/semantic-conventions')

const endpoint = process.env.JAEGER_ENDPOINT || 'http://localhost:14268/api/traces'

const sdk = new NodeSDK({
  resource: new Resource({ [SemanticResourceAttributes.SERVICE_NAME]: 'transaction-validator' }),
  traceExporter: new JaegerExporter({ endpoint }),
  instrumentations: [getNodeAutoInstrumentations()]
})

;(async () => {
  try {
    await sdk.start()
  } catch (e) {
    // ignore telemetry init errors
  }
})()
