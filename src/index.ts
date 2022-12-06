import { EMA, MACD, WilliamsR } from 'technicalindicators'

/**
 * A generic financial candle. May contain non-controlled values.
 */
export interface SignalCandle extends Record<string, unknown> {
  open: number
  close: number
  low: number
  high: number
  timestamp: string
}

/**
 * Configuration options for Signal.
 */
export interface SignalOptions {
  openKey: string
  closeKey: string
  lowKey: string
  highKey: string
  timestampISO8601Key: string
  emaPeriod: number
  emaBuyRatio: number
  emaSellRatio: number
  macdFastPeriod: number
  macdSlowPeriod: number
  macdSignalPeriod: number
  williamsRPeriod: number
}

/**
 * Extended technicalindicators MACD output.
 */
export interface SignalMACDOutput {
  MACD: number
  signal: number
  histogram: number
  index: number
  isIntersecting: boolean
}

/**
 * An output signal.
 */
export interface SignalOutput {
  open: number
  close: number
  low: number
  high: number
  timestamp: string
  ema: number
  emaBuy: number
  emaSell: number
  macd: number
  macdSignal: number
  macdHistogram: number
  isIntersecting: boolean
  williamsR: number
  signal: 'buy' | 'sell' | 'hold'
}

/**
 * Default configuration options for Signal.
 */
const defaultOptions: SignalOptions = {
  openKey: 'open',
  closeKey: 'close',
  lowKey: 'low',
  highKey: 'high',
  timestampISO8601Key: 'timestamp',
  emaPeriod: 30,
  emaBuyRatio: 0.005,
  emaSellRatio: 0.005,
  macdFastPeriod: 5,
  macdSlowPeriod: 10,
  macdSignalPeriod: 7,
  williamsRPeriod: 20,
}

/**
 * Slice an array returning the last n elements.
 *
 * @param arr - The array to slice.
 * @param length - The number of elements to keep.
 * @returns The array with the last `length` elements.
 */
function sliceToLength<T>(arr: T[], length: number): T[] {
  return arr.slice(arr.length - length, arr.length)
}

/**
 * Calculate buy and sell signals for a given set of candles.
 *
 * @param candles - The candles to calculate signals for.
 * @returns The signals for the given candles.
 */
export function signal(
  candles: Partial<SignalCandle>[],
  options: Partial<SignalOptions> = {},
): SignalOutput[] {
  options = { ...defaultOptions, ...options }
  candles = candles
    .map<SignalCandle>((candle) => ({
      open: parseFloat(String(candle[options.openKey])),
      close: parseFloat(String(candle[options.closeKey])),
      low: parseFloat(String(candle[options.lowKey])),
      high: parseFloat(String(candle[options.highKey])),
      timestamp: String(candle[options.timestampISO8601Key]),
    }))
    .sort((a, b) => (a.timestamp < b.timestamp ? -1 : a.timestamp > b.timestamp ? 1 : 0))

  const closes = candles.map((candle) => candle.close)
  let emas = EMA.calculate({
    values: closes,
    period: options.emaPeriod,
  })
  let macds = MACD.calculate({
    values: closes,
    fastPeriod: options.macdFastPeriod,
    slowPeriod: options.macdSlowPeriod,
    signalPeriod: options.macdSignalPeriod,
    SimpleMAOscillator: false,
    SimpleMASignal: false,
  }) as SignalMACDOutput[]
  let williamsRs = WilliamsR.calculate({
    high: candles.map((candle) => candle.high),
    low: candles.map((candle) => candle.low),
    close: closes,
    period: options.williamsRPeriod,
  })

  const minLength = Math.min(candles.length, emas.length, macds.length, williamsRs.length)

  candles = sliceToLength<Partial<SignalCandle>>(candles, minLength)
  emas = sliceToLength<number>(emas, minLength)
  macds = sliceToLength<SignalMACDOutput>(macds, minLength).map((macd, index) => ({
    ...macd,
    index,
  }))
  williamsRs = sliceToLength<number>(williamsRs, minLength)

  for (const macd of macds.slice(1)) {
    /* eslint-disable-next-line max-len */
    // https://stackoverflow.com/questions/9043805/test-if-two-lines-intersect-javascript-function
    // [a, b]
    const macdStart = [macd.index - 1, macds[macd.index - 1].MACD]
    // [c, d]
    const macdEnd = [macd.index, macds[macd.index].MACD]
    // [p, q]
    const signalStart = [macd.index - 1, macds[macd.index - 1].signal]
    // [r, s]
    const signalEnd = [macd.index, macds[macd.index].signal]
    // (c - a) * (s - q) - (r - p) * (d - b);
    const det =
      (macdEnd[0] - macdStart[0]) * (signalEnd[1] - signalStart[1]) -
      (signalEnd[0] - signalStart[0]) * (macdEnd[1] - macdStart[1])

    if (det !== 0) {
      // ((s - q) * (r - a) + (p - r) * (s - b)) / det
      const lambda =
        ((signalEnd[1] - signalStart[1]) * (signalEnd[0] - macdStart[0]) +
          (signalStart[0] - signalEnd[0]) * (signalEnd[1] - macdStart[1])) /
        det
      // ((b - d) * (r - a) + (c - a) * (s - b)) / det
      const gamma =
        ((macdStart[1] - macdEnd[1]) * (signalEnd[0] - macdStart[0]) +
          (macdEnd[0] - macdStart[0]) * (signalEnd[1] - macdStart[1])) /
        det

      if (lambda > 0 && lambda < 1 && gamma > 0 && gamma < 1) {
        macd.isIntersecting = true
      }
    }
  }

  const emaBuys = emas.map((ema) => ema - ema * options.emaBuyRatio)
  const emaSells = emas.map((ema) => ema + ema * options.emaSellRatio)

  const signals = {}

  for (const { index } of macds.filter((macd) => macd.isIntersecting)) {
    if (williamsRs[index] >= -20 && candles[index].close >= emaSells[index]) {
      // Signal sell
      signals[index] = 'sell'
    } else if (williamsRs[index] <= -80 && candles[index].close <= emaBuys[index]) {
      // Signal buy
      signals[index] = 'buy'
    }
  }

  return macds.map<SignalOutput>((macd) => ({
    open: candles[macd.index].open,
    close: candles[macd.index].close,
    low: candles[macd.index].low,
    high: candles[macd.index].high,
    timestamp: candles[macd.index].timestamp,
    ema: emas[macd.index],
    emaBuy: emaBuys[macd.index],
    emaSell: emaSells[macd.index],
    macd: macd.MACD,
    macdSignal: macd.signal,
    macdHistogram: macd.histogram,
    williamsR: williamsRs[macd.index],
    isIntersecting: macd.isIntersecting,
    signal: signals[macd.index] ?? 'hold',
  }))
}
