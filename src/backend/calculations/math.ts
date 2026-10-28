import type {
  DistributionEntry,
  FrequencyEntry,
  ObservedVehicleRow,
  RandomInterval,
} from '../models/queue'

export function isValidTimeInput(value: string): boolean {
  if (typeof value !== 'string') {
    return false
  }

  const trimmed = value.trim()
  const match = /^\d{1,2}:\d{2}(?::\d{2})?$/.exec(trimmed)

  if (!match) {
    return false
  }

  const parts = trimmed.split(':').map((part) => Number(part))
  const [hours, minutes, extraSeconds = 0] = parts

  if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59 || extraSeconds < 0 || extraSeconds > 59) {
    return false
  }

  return true
}

export function convertTimeToSeconds(value: string): number {
  const parts = value.trim().split(':').map((part) => Number(part))

  if (parts.length === 2) {
    const [hours, minutes] = parts
    return hours * 3600 + minutes * 60
  }

  if (parts.length === 3) {
    const [hours, minutes, seconds] = parts
    return hours * 3600 + minutes * 60 + seconds
  }

  throw new Error(`Formato de hora inválido: ${value}`)
}

export function calculateDifferenceInSeconds(startTime: string, endTime: string): number {
  const startSeconds = convertTimeToSeconds(startTime)
  const endSeconds = convertTimeToSeconds(endTime)

  return Math.abs(endSeconds - startSeconds)
}

export function roundSecondsToMinutes(totalSeconds: number): number {
  if (!Number.isFinite(totalSeconds) || totalSeconds < 0) {
    throw new Error('Los segundos deben ser un número finito y no negativo.')
  }

  const minutes = Math.floor(totalSeconds / 60)
  const remainder = totalSeconds % 60

  return remainder < 30 ? minutes : minutes + 1
}

export function calculateInterArrivalMinutes(rows: ObservedVehicleRow[]): number[] {
  const sortedRows = [...rows].sort(
    (left, right) => convertTimeToSeconds(left.arrival) - convertTimeToSeconds(right.arrival),
  )

  const result: number[] = []

  for (let index = 1; index < sortedRows.length; index += 1) {
    const previousArrival = sortedRows[index - 1].arrival
    const currentArrival = sortedRows[index].arrival
    const differenceSeconds = calculateDifferenceInSeconds(previousArrival, currentArrival)
    result.push(roundSecondsToMinutes(differenceSeconds))
  }

  return result
}

export function calculateServiceMinutes(rows: ObservedVehicleRow[]): number[] {
  return [...rows]
    .sort((left, right) => convertTimeToSeconds(left.arrival) - convertTimeToSeconds(right.arrival))
    .map((row) => {
      const differenceSeconds = calculateDifferenceInSeconds(row.start, row.exit)
      return roundSecondsToMinutes(differenceSeconds)
    })
}

export function calculateFrequencies(values: number[]): FrequencyEntry[] {
  if (values.length === 0) {
    return []
  }

  const map = new Map<number, number>()

  for (const value of values) {
    map.set(value, (map.get(value) ?? 0) + 1)
  }

  return Array.from(map.entries())
    .map(([value, frequency]) => ({ value, frequency }))
    .sort((left, right) => left.value - right.value)
}

export function calculateProbabilities(frequencies: FrequencyEntry[]): DistributionEntry[] {
  if (frequencies.length === 0) {
    return []
  }

  const total = frequencies.reduce((sum, entry) => sum + entry.frequency, 0)
  let cumulative = 0

  return frequencies.map((entry) => {
    const probability = entry.frequency / total
    cumulative += probability

    return {
      value: entry.value,
      frequency: entry.frequency,
      probability: Number(probability.toFixed(12)),
      cumulative: Number(cumulative.toFixed(12)),
    }
  })
}

export function buildRandomIntervals(distribution: Array<{ value: number; probability: number }>): RandomInterval[] {
  if (distribution.length === 0) {
    return []
  }

  const normalizedDistribution = [...distribution].map((entry) => ({
    value: entry.value,
    probability: Number(entry.probability) || 0,
  }))

  const totalProbability = normalizedDistribution.reduce((sum, entry) => sum + entry.probability, 0)

  const entries = normalizedDistribution.map((entry) => ({
    value: entry.value,
    probability: totalProbability > 0 ? entry.probability / totalProbability : 0,
  }))

  const counts = entries.map((entry) => ({
    value: entry.value,
    count: Math.floor(entry.probability * 100 + Number.EPSILON),
  }))

  let remaining = 100 - counts.reduce((sum, item) => sum + item.count, 0)

  const orderedByFraction = entries
    .map((entry, index) => ({
      index,
      value: entry.value,
      fraction: entry.probability * 100 - Math.floor(entry.probability * 100 + Number.EPSILON),
    }))
    .sort((left, right) => right.fraction - left.fraction || left.value - right.value)

  while (remaining > 0) {
    for (const item of orderedByFraction) {
      if (remaining === 0) {
        break
      }

      counts[item.index].count += 1
      remaining -= 1
    }
  }

  let currentStart = 0
  const intervals: RandomInterval[] = []

  for (const item of [...counts].sort((left, right) => left.value - right.value)) {
    if (item.count <= 0) {
      continue
    }

    const interval: RandomInterval = {
      value: item.value,
      start: currentStart,
      end: currentStart + item.count - 1,
      probability: entries.find((entry) => entry.value === item.value)?.probability ?? 0,
    }

    intervals.push(interval)
    currentStart += item.count
  }

  if (intervals.length === 0) {
    throw new Error('No se pudo construir ningún intervalo aleatorio.')
  }

  if (intervals[intervals.length - 1].end !== 99) {
    throw new Error('El último intervalo aleatorio debe terminar en 99.')
  }

  return intervals
}

export function generateRandomNumber(): number {
  return Math.floor(Math.random() * 100)
}

export function formatTwoDigitNumber(value: number): string {
  return value.toString().padStart(2, '0')
}

export function findIntervalForValue(intervals: RandomInterval[], randomValue: number): number {
  const normalized = Number(randomValue)

  if (!Number.isInteger(normalized) || normalized < 0 || normalized > 99) {
    throw new Error(`El valor aleatorio ${randomValue} debe estar entre 00 y 99.`)
  }

  const match = intervals.find((interval) => normalized >= interval.start && normalized <= interval.end)

  if (!match) {
    throw new Error(`El valor ${randomValue} no pertenece a ningún intervalo aleatorio válido.`)
  }

  return match.value
}

export function formatSecondsAsClock(totalSeconds: number): string {
  const safeSeconds = Math.max(0, Math.floor(totalSeconds))
  const hours = Math.floor(safeSeconds / 3600)
  const minutes = Math.floor((safeSeconds % 3600) / 60)
  const seconds = safeSeconds % 60

  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
}

export function simulateQueueFifo(params: {
  arrivalDistribution: Array<{ value: number; probability: number; cumulative?: number }>
  serviceDistribution: Array<{ value: number; probability: number; cumulative?: number }>
  arrivals: Array<{ random: number | null; arrivalTime: string; interArrivalMinutes: number }>
  serviceRandoms: number[]
}): Array<{
  arrivalNumber: number
  arrivalRandom: number | null
  arrivalTime: string
  waitSeconds: number
  serverEntryTime: string
  serviceRandom: number
  serviceMinutes: number
  departureTime: string
  totalSystemSeconds: number
}> {
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
