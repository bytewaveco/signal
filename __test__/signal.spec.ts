import { CandleGranularity, CoinbasePro } from 'coinbase-pro-node'
import dayjs from 'dayjs'
import { Signal } from '../src'

let data: any[] = []

describe('Signal', () => {
  describe('Coinbase Pro', async () => {
    beforeAll(async () => {
      const client = new CoinbasePro()
      data = await client.rest.product.getCandles('ADA-USD', {
        granularity: CandleGranularity.ONE_MINUTE,
        start: dayjs('2022-08-01T12:00:00Z')
          .subtract(12, 'h')
          .format('YYYY-MM-DDTHH:mm:ssZ'),
        end: dayjs('2022-08-01T12:00:00Z').format('YYYY-MM-DDTHH:mm:ssZ'),
      })
    })

    it('generates signals using Coinbase data', async () => {
      const signals = Signal(data, {
        timestampISO8601Key: 'openTimeInISO',
      })
      expect(signals).toBeDefined()
      expect(Array.isArray(signals)).toBe(true)
    })

    it('creates expected number of intersections', async () => {
      const intersections = Signal(data, {
        timestampISO8601Key: 'openTimeInISO',
      })
        .map((signal, index) => ({ ...signal, index }))
        .filter(({ isIntersecting }) => isIntersecting)

      expect(intersections.length).toBe(198)
    })
  })
})
