[![CodeQL](https://github.com/bytewaveco/signal/actions/workflows/codeql-analysis.yml/badge.svg?branch=main)](https://github.com/bytewaveco/signal/actions/workflows/codeql-analysis.yml) [![CI](https://github.com/bytewaveco/signal/actions/workflows/node.js.yml/badge.svg?branch=main)](https://github.com/bytewaveco/signal/actions/workflows/node.js.yml) [![Packages Released](https://github.com/bytewaveco/signal/actions/workflows/npm-publish-packages.yml/badge.svg)](https://github.com/bytewaveco/signal/actions/workflows/npm-publish-packages.yml)
# Signal

Signal is a combination of MACD, EMA, and Williams %R. Signal offers a configurable set of financial indicators that can be used to determine whether a stock is overbought or oversold.

Generating signals provides actual determined output of the indicators, which can be used to visualize the performance of the parameters.

## Installation

```bash
npm install @bytwaveco/signal
```

### Usage

```js
import { Signal } from '@bytwave/signal'

// Compatible with any financial source that provides candles
const myFinData = [
  {
    open: 100,
    close: 105,
    low: 95,
    high: 110,
    timestamp: '2022-01-01T12:00:00.000Z',
  },

  // ...

  {
    open: 113,
    close: 115,
    low: 101,
    high: 115,
    timestamp: '2022-01-01T12:30:00.000Z',
  },
]

const signals = Signal(myFinData)

// Use calculated signals in your application
```

### Configuration

Signal is configurable using the options argument as shown below:

```js
// ...

const signals = Signal(myFinData, {
  emaPeriod: 10,
})

// ...
```

Available options are:

| Parameter | Description |
| --- | --- |
| `openKey` | The object key to treat as a candle open. Default `open`. |
| `closeKey` | The object key to treat as a candle close. Default `close`. |
| `lowKey` | The object key to treat as a candle low. Default `low`. |
| `highKey` | The object key to treat as a candle high. Default `high`. |
| `timestampISO8601Key` | The object key to treat as a candle ISO8601 timestamp. Default `timestamp`. |
| `emaPeriod` | Number of samples to take when generating EMA. Default `30`. |
| `emaBuyRatio` | The EMA buy filter relative ratio. Default `0.005`. |
| `emaSellRatio` | The EMA sell filter relative ratio. Default `0.005`. |
| `macdFastPeriod` | Number of samples to take for the fast parameter in MACD. Default `5`. |
| `macdSlowPeriod` | Number of samples to take for the slow parameter in MACD. Default `10`. |
| `macdSignalPeriod` | Number of samples to take for the signal parameter in MACD. Default `7`. |
| `williamsRPeriod` | Number of samples to take when generating Williams %R. Default `20`. |

### Output

Signal's output is an array of objects with the following common properties:

| Property         | Description                                    |
| ---------------- | ---------------------------------------------- |
| `open`           | The open price of the candle.                  |
| `close`          | The close price of the candle.                 |
| `high`           | The high price of the candle.                  |
| `low`            | The low price of the candle.                   |
| `timestamp`      | The ISO8601 timestamp of the candle.           |
| `ema`            | The EMA value of the candle.                   |
| `emaBuy`         | The EMA buy threshold of the candle.           |
| `emaSell`        | The EMA sell threshold of the candle.          |
| `macd`           | The MACD value of the candle.                  |
| `macdSignal`     | The MACD signal value of the candle.           |
| `macdHistogram`  | The MACD histogram value of the candle.        |
| `isIntersecting` | Flag if the MACD line crosses the Signal line. |
| `williamsR`      | The Williams %R value of the candle.           |
| `signal`         | `buy`, `sell`, or `hold`                       |
