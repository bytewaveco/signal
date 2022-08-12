import { intersections, Point, Polyline } from '@mathigon/euclid'
import { EMA, MACD, WilliamsR } from 'technicalindicators'

interface SignalCandles extends Record<string, unknown> {
  open: number
  close: number
  low: number
  high: number
  timestamp: string
}

interface SignalOptions {
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

interface SignalMACDOutput {
  MACD: number
  signal: number
  histogram: number
  index: number
  isIntersecting: boolean
}

interface SignalOutput {
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

const SignalOptionsDefault: SignalOptions = {
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
 * @param {any[]} arr The array to slice.
 * @param {number} length The number of elements to keep.
 * @returns {any[]} The array with the last `length` elements.
 */
function sliceToLength(arr: any[], length: number): any[] {
  return arr.slice(arr.length - length, arr.length)
}

/**
 * Calculate buy and sell signals for a given set of candles.
 *
 * @typedef {SignalCandles} SignalCandles
 * @typedef {SignalOutput} SignalOutput
 * @param {SignalCandles[]} candles The candles to calculate signals for.
 * @returns {SignalOutput[]} The signals for the given candles.
 */
export function Signal(
  candles: Partial<SignalCandles>[],
  options: Partial<SignalOptions> = {}
): SignalOutput[] {
  options = { ...SignalOptionsDefault, ...options }
  candles = candles
    .map<SignalCandles>((candle) => ({
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

  for (const intersectionIndex of intersections(
    new Polyline(...macds.map(({ signal }, index) => new Point(index, signal))),
    new Polyline(...macds.map(({ MACD }, index) => new Point(index, MACD)))
  ).map(({ x }) => Math.floor(x))) {
    macds[intersectionIndex].isIntersecting = true
  }

  const minLength = Math.min(candles.length, emas.length, macds.length, williamsRs.length)

  candles = sliceToLength(candles, minLength)
  emas = sliceToLength(emas, minLength)
  macds = sliceToLength(macds, minLength).map((macd, index) => ({ ...macd, index }))
  williamsRs = sliceToLength(williamsRs, minLength)

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
