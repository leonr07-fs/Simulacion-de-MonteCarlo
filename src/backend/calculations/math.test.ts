import { describe, expect, it } from 'vitest'
import { generateSimulatedArrivalSequence } from '../services/simulationService'
import {
  buildRandomIntervals,
  calculateDifferenceInSeconds,
  convertTimeToSeconds,
  findIntervalForValue,
  roundSecondsToMinutes,
  simulateQueueFifo,
} from './math'

describe('convertTimeToSeconds', () => {
  it('converts HH:MM and HH:MM:SS to seconds', () => {
    expect(convertTimeToSeconds('01:29')).toBe(5340)
    expect(convertTimeToSeconds('01:29:30')).toBe(5370)
  })
})

describe('calculateDifferenceInSeconds', () => {
  it('calculates the difference between two clock times', () => {
    expect(calculateDifferenceInSeconds('08:06:20', '08:04:15')).toBe(125)
    expect(calculateDifferenceInSeconds('08:10:48', '08:06:20')).toBe(268)
  })
})

describe('roundSecondsToMinutes', () => {
  it('applies the required rounding rule', () => {
    expect(roundSecondsToMinutes(89)).toBe(1)
    expect(roundSecondsToMinutes(90)).toBe(2)
    expect(roundSecondsToMinutes(149)).toBe(2)
    expect(roundSecondsToMinutes(150)).toBe(3)
    expect(roundSecondsToMinutes(180)).toBe(3)
  })
})

describe('buildRandomIntervals', () => {
  it('assigns all values from 00 to 99 without gaps or overlaps', () => {
    const result = buildRandomIntervals([
      { value: 1, probability: 0.2 },
      { value: 2, probability: 0.35 },
      { value: 3, probability: 0.3 },
      { value: 4, probability: 0.15 },
    ])

    expect(result.length).toBe(4)
    expect(result[0].start).toBe(0)
    expect(result[0].end).toBe(19)
    expect(result[1].start).toBe(20)
    expect(result[1].end).toBe(54)
    expect(result[2].start).toBe(55)
    expect(result[2].end).toBe(84)
    expect(result[3].start).toBe(85)
    expect(result[3].end).toBe(99)

    const allValues = result.flatMap((interval) =>
      Array.from({ length: interval.end - interval.start + 1 }, (_, index) => interval.start + index),
    )

    expect(new Set(allValues).size).toBe(100)
    expect(Math.min(...allValues)).toBe(0)
    expect(Math.max(...allValues)).toBe(99)
  })
})

describe('findIntervalForValue', () => {
  it('finds the correct interval using the generated ranges', () => {
    const intervals = buildRandomIntervals([
      { value: 1, probability: 0.2 },
      { value: 2, probability: 0.35 },
      { value: 3, probability: 0.3 },
      { value: 4, probability: 0.15 },
    ])

    expect(findIntervalForValue(intervals, 0)).toBe(1)
    expect(findIntervalForValue(intervals, 19)).toBe(1)
    expect(findIntervalForValue(intervals, 20)).toBe(2)
    expect(findIntervalForValue(intervals, 54)).toBe(2)
    expect(findIntervalForValue(intervals, 55)).toBe(3)
    expect(findIntervalForValue(intervals, 84)).toBe(3)
    expect(findIntervalForValue(intervals, 85)).toBe(4)
    expect(findIntervalForValue(intervals, 99)).toBe(4)
  })
})

describe('generateSimulatedArrivalSequence', () => {
  it('uses the real initial arrival and then grows from randomized intervals', () => {
    const intervals = buildRandomIntervals([
      { value: 1, probability: 0.4 },
      { value: 2, probability: 0.2 },
      { value: 3, probability: 0.2 },
      { value: 7, probability: 0.2 },
    ])

    const result = generateSimulatedArrivalSequence({
      initialArrivalTime: '13:00:00',
      simulationCount: 6,
      arrivalIntervals: intervals,
      randomValues: [50, 13, 90, 5, 44],
    })

    expect(result.map((row) => row.arrivalTime)).toEqual([
      '13:00:00',
      '13:02:00',
      '13:03:00',
      '13:10:00',
      '13:11:00',
      '13:13:00',
    ])
    expect(result[0].random).toBeNull()
    expect(result[1].random).toBe(50)
    expect(result[2].random).toBe(13)
  })
})

describe('simulateQueueFifo', () => {
  it('executes a FIFO queue simulation using the empirical distributions', () => {
    const arrivalDistribution = [
      { value: 1, probability: 0.5, cumulative: 0.5 },
      { value: 2, probability: 0.3, cumulative: 0.8 },
      { value: 3, probability: 0.2, cumulative: 1 },
    ]
    const serviceDistribution = [
      { value: 1, probability: 0.6, cumulative: 0.6 },
      { value: 2, probability: 0.4, cumulative: 1 },
    ]

    const result = simulateQueueFifo({
      arrivalDistribution,
      serviceDistribution,
      arrivals: [
        { random: null, arrivalTime: '00:00:00', interArrivalMinutes: 0 },
        { random: 60, arrivalTime: '00:01:00', interArrivalMinutes: 1 },
        { random: 95, arrivalTime: '00:02:00', interArrivalMinutes: 2 },
      ],
      serviceRandoms: [12, 70, 98],
    })

    expect(result).toHaveLength(3)
    expect(result[0].waitSeconds).toBe(0)
    expect(result[1].waitSeconds).toBe(0)
    expect(result[2].waitSeconds).toBe(60)
    expect(result.every((row) => row.waitSeconds >= 0)).toBe(true)
  })
})
