import {
  buildRandomIntervals,
  calculateFrequencies,
  calculateProbabilities,
  convertTimeToSeconds,
  findIntervalForValue,
  formatSecondsAsClock,
  generateRandomNumber,
} from '../calculations/math'
import type { ArrivalSample, DistributionEntry, RandomInterval, SimulatedRow } from '../models/queue'

export type EmpiricalDistributionInput = Array<{ value: number; frequency: number }>

export function buildEmpiricalDistribution(values: number[]): DistributionEntry[] {
  const frequencies = calculateFrequencies(values)
  return calculateProbabilities(frequencies)
}

export function buildRandomIntervalFromDistribution(distribution: DistributionEntry[]): RandomInterval[] {
  return buildRandomIntervals(
    distribution.map((entry) => ({ value: entry.value, probability: entry.probability })),
  )
}

export function generateArrivalSample(intervals: RandomInterval[], previousArrivalSeconds: number): ArrivalSample {
  const random = generateRandomNumber()
  const interArrivalMinutes = findIntervalForValue(intervals, random)
  const arrivalSeconds = previousArrivalSeconds + interArrivalMinutes * 60

  return {
    random,
    arrivalTime: formatSecondsAsClock(arrivalSeconds),
    interArrivalMinutes,
  }
}

export function generateServiceSample(intervals: RandomInterval[]): { random: number; serviceMinutes: number } {
  const random = generateRandomNumber()
  const serviceMinutes = findIntervalForValue(intervals, random)

  return {
    random,
    serviceMinutes,
  }
}

export function simulateQueueFifo(params: {
  arrivalDistribution: Array<{ value: number; probability: number; cumulative?: number }>
  serviceDistribution: Array<{ value: number; probability: number; cumulative?: number }>
  arrivals: Array<{ random: number | null; arrivalTime: string; interArrivalMinutes: number }>
  serviceRandoms: number[]
}): SimulatedRow[] {
  if (params.arrivals.length !== params.serviceRandoms.length) {
    throw new Error('La cantidad de llegadas y valores aleatorios debe coincidir.')
  }

  const serviceIntervals = buildRandomIntervals(
    params.serviceDistribution.map((entry) => ({ value: entry.value, probability: entry.probability })),
  )

  let previousDepartureSeconds = 0

  return params.arrivals.map((arrival, index) => {
    const arrivalSeconds = convertTimeToSeconds(arrival.arrivalTime)
    const serviceMinutes = findIntervalForValue(serviceIntervals, params.serviceRandoms[index])
    const serverEntrySeconds = Math.max(arrivalSeconds, previousDepartureSeconds)
    const waitSeconds = Math.max(0, serverEntrySeconds - arrivalSeconds)
    const departureSeconds = serverEntrySeconds + serviceMinutes * 60
    const totalSystemSeconds = departureSeconds - arrivalSeconds

    previousDepartureSeconds = departureSeconds

    return {
      arrivalNumber: index + 1,
      arrivalRandom: arrival.random,
      arrivalTime: formatSecondsAsClock(arrivalSeconds),
      waitSeconds,
      serverEntryTime: formatSecondsAsClock(serverEntrySeconds),
      serviceRandom: params.serviceRandoms[index],
      serviceMinutes,
      departureTime: formatSecondsAsClock(departureSeconds),
      totalSystemSeconds,
    }
  })
}
