export type TimeInput = string

export type ObservedVehicleRow = {
  id: number
  arrival: TimeInput
  start: TimeInput
  exit: TimeInput
}

export type FrequencyEntry = {
  value: number
  frequency: number
}

export type DistributionEntry = FrequencyEntry & {
  probability: number
  cumulative: number
}

export type RandomInterval = {
  value: number
  start: number
  end: number
  probability: number
}

export type ArrivalSample = {
  random: number | null
  arrivalTime: string
  interArrivalMinutes: number
}

export type ServiceSample = {
  random: number
  serviceMinutes: number
}

export type SimulatedRow = {
  arrivalNumber: number
  arrivalRandom: number | null
  arrivalTime: string
  waitSeconds: number
  serverEntryTime: string
  serviceRandom: number
  serviceMinutes: number
  departureTime: string
  totalSystemSeconds: number
}

export type ProcessedData = {
  sortedRows: ObservedVehicleRow[]
  interArrivalMinutes: number[]
  serviceMinutes: number[]
  arrivalDistribution: DistributionEntry[]
  serviceDistribution: DistributionEntry[]
  arrivalRandomIntervals: RandomInterval[]
  serviceRandomIntervals: RandomInterval[]
  simulationCount: number
  simulationRows: SimulatedRow[]
}
