import {
  buildRandomIntervals,
  calculateDifferenceInSeconds,
  calculateInterArrivalMinutes,
  calculateServiceMinutes,
  convertTimeToSeconds,
  findIntervalForValue,
  formatSecondsAsClock,
  generateRandomNumber,
  isValidTimeInput,
  roundSecondsToMinutes,
} from '../calculations/math'
import type {
  ArrivalSample,
  DistributionEntry,
  ObservedVehicleRow,
  ProcessedData,
  RandomInterval,
  SimulatedRow,
} from '../models/queue'
import { buildEmpiricalDistribution, simulateQueueFifo } from '../simulation/queueSimulation'

function validateRow(row: ObservedVehicleRow): string | null {
  if (!row.arrival || !row.start || !row.exit) {
    return 'Falta completar una o más horas.'
  }

  if (!isValidTimeInput(row.arrival) || !isValidTimeInput(row.start) || !isValidTimeInput(row.exit)) {
    return 'Las horas deben tener formato HH:MM o HH:MM:SS.'
  }

  const arrivalSeconds = calculateDifferenceInSeconds('00:00:00', row.arrival)
  const startSeconds = calculateDifferenceInSeconds('00:00:00', row.start)
  const exitSeconds = calculateDifferenceInSeconds('00:00:00', row.exit)

  if (arrivalSeconds > startSeconds || startSeconds > exitSeconds) {
    return 'La secuencia debe respetar llegada <= inicio de atención <= salida.'
  }

  return null
}

export function validateObservedRows(rows: ObservedVehicleRow[]): string[] {
  return rows.flatMap((row) => {
    const result = validateRow(row)
    return result ? [result] : []
  })
}

export function sortRowsByArrival(rows: ObservedVehicleRow[]): ObservedVehicleRow[] {
  return [...rows].sort(
    (left, right) => convertTimeToSeconds(left.arrival) - convertTimeToSeconds(right.arrival),
  )
}

export function generateSimulatedArrivalSequence(params: {
  initialArrivalTime: string
  simulationCount: number
  arrivalIntervals: RandomInterval[]
  randomValues?: number[]
}): ArrivalSample[] {
  const count = Math.max(1, Number.isFinite(params.simulationCount) ? Math.floor(params.simulationCount) : 1)

  const sequence: ArrivalSample[] = [{
    random: null,
    arrivalTime: params.initialArrivalTime,
    interArrivalMinutes: 0,
  }]

  let previousArrivalSeconds = convertTimeToSeconds(params.initialArrivalTime)

  for (let index = 1; index < count; index += 1) {
    const randomValue = params.randomValues?.[index - 1] ?? generateRandomNumber()
    const interArrivalMinutes = findIntervalForValue(params.arrivalIntervals, randomValue)
    previousArrivalSeconds += interArrivalMinutes * 60

    sequence.push({
      random: randomValue,
      arrivalTime: formatSecondsAsClock(previousArrivalSeconds),
      interArrivalMinutes,
    })
  }

  return sequence
}

export function generateProcessedData(rows: ObservedVehicleRow[], simulationCount = rows.length): ProcessedData {
  const sortedRows = sortRowsByArrival(rows)
  const interArrivalValues = calculateInterArrivalMinutes(sortedRows)
  const serviceValues = calculateServiceMinutes(sortedRows)
  const targetSimulationCount = Math.min(50, Math.max(1, simulationCount))

  const arrivalDistribution = buildEmpiricalDistribution(interArrivalValues)
  const serviceDistribution = buildEmpiricalDistribution(serviceValues)

  const arrivalRandomIntervals = buildRandomIntervals(
    arrivalDistribution.map((entry) => ({ value: entry.value, probability: entry.probability })),
  )
  const serviceRandomIntervals = buildRandomIntervals(
    serviceDistribution.map((entry) => ({ value: entry.value, probability: entry.probability })),
  )

  const simulatedArrivalSequence = generateSimulatedArrivalSequence({
    initialArrivalTime: sortedRows[0]?.arrival ?? '00:00:00',
    simulationCount: targetSimulationCount,
    arrivalIntervals: arrivalRandomIntervals,
  })

  const simulationRows = simulateQueueFifo({
    arrivalDistribution: arrivalDistribution.map((entry) => ({
      value: entry.value,
      probability: entry.probability,
      cumulative: entry.cumulative,
    })),
    serviceDistribution: serviceDistribution.map((entry) => ({
      value: entry.value,
      probability: entry.probability,
      cumulative: entry.cumulative,
    })),
    arrivals: simulatedArrivalSequence,
    serviceRandoms: Array.from({ length: targetSimulationCount }, () => generateRandomNumber()),
  })

  return {
    sortedRows,
    interArrivalMinutes: interArrivalValues,
    serviceMinutes: serviceValues,
    arrivalDistribution,
    serviceDistribution,
    arrivalRandomIntervals,
    serviceRandomIntervals,
    simulationCount: targetSimulationCount,
    simulationRows,
  }
}

export function buildRowsFromObservedData(rows: ObservedVehicleRow[]): {
  arrivalDistribution: DistributionEntry[]
  serviceDistribution: DistributionEntry[]
  arrivalIntervals: RandomInterval[]
  serviceIntervals: RandomInterval[]
  simulationRows: SimulatedRow[]
} {
  const data = generateProcessedData(rows)

  return {
    arrivalDistribution: data.arrivalDistribution,
    serviceDistribution: data.serviceDistribution,
    arrivalIntervals: data.arrivalRandomIntervals,
    serviceIntervals: data.serviceRandomIntervals,
    simulationRows: data.simulationRows,
  }
}

export function calculateRoundedDurations(valuesInSeconds: number[]): number[] {
  return valuesInSeconds.map((value) => roundSecondsToMinutes(value))
}

export function computeProbabilityTotals(distribution: DistributionEntry[]): number {
  return distribution.reduce((sum, entry) => sum + entry.probability, 0)
}
