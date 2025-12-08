const request = require('supertest')
const app = require('../src/app')

describe('Transaction-Validator', () => {
  test('health endpoint returns ok', async () => {
    const res = await request(app).get('/healthz')
    expect(res.status).toBe(200)
    expect(res.body).toEqual({ status: 'ok' })
  })

  test('validate returns 400 for invalid transaction', async () => {
    const res = await request(app).post('/validate').send({ amount: -10 })
    expect(res.status).toBe(400)
    expect(res.body.valid).toBe(false)
  })

  test('validate returns valid true for positive amount', async () => {
    const res = await request(app).post('/validate').send({ amount: 100 })
    expect(res.status).toBe(200)
    expect(res.body.valid).toBe(true)
  })
})
