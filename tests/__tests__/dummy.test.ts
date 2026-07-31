import supertest from 'supertest'
import { describe, expect, jest, test } from '@jest/globals'
import app from '../../src/app'

// Stripe servisinin test esnasında patlamasını önlemek için Stripe modülünü mock'luyoruz
jest.mock('../../src/common/stripe', () => ({
  stripe: {
    checkout: {
      sessions: {
        retrieve: jest.fn(),
      },
    },
  },
  stripeApiKey: '',
  endpointSecret: '',
}))

const request = supertest(app)

describe('Checking the health of the app', () => {
  test('It should respond with a health check message', async () => {
    const response = await request.get('/')
    expect(response.body).toEqual({ 'health-check': 'OK: top level api working' })
    expect(response.status).toBe(200)
  })
})