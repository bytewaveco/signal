import { CandleGranularity, CoinbasePro } from 'coinbase-pro-node'
import dayjs from 'dayjs'
import { Signal, SignalCandles } from '../src'

let data: Partial<SignalCandles>[] = []

describe('Signal', () => {
  it('sorts candles', async () => {
    const signals = Signal([
      ...new Array(100).fill({
        open: 1,
        close: 2,
        low: 3,
        high: 4,
        timestamp: '2022-07-01T00:00:00.000Z',
      }),
      {
        open: 4,
        close: 3,
        low: 2,
        high: 1,
        timestamp: '2022-08-17T00:00:00.000Z',
      },
      {
        open: 4,
        close: 3,
        low: 2,
        high: 1,
        timestamp: '2022-08-16T23:59:59.000Z',
      },
    ])

    expect(signals.map(({ timestamp }) => timestamp)[signals.length - 1]).toBe(
      '2022-08-17T00:00:00.000Z'
    )
    expect(signals.map(({ timestamp }) => timestamp)[signals.length - 2]).toBe(
      '2022-08-16T23:59:59.000Z'
    )
  })
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

      expect(intersections.length).toBe(119)
    })
  })
})
