import { useMemo, useState } from 'react'
import './App.css'
import type { ObservedVehicleRow, ProcessedData } from './backend/models/queue'
import { generateProcessedData, validateObservedRows } from './backend/services/simulationService'
import DataEntryPage from './frontend/pages/DataEntryPage'
import SimulationResultsPage from './frontend/pages/SimulationResultsPage'
import WelcomePage from './frontend/pages/WelcomePage'

function createInitialRows(): ObservedVehicleRow[] {
  return [
    {
      id: 1,
      arrival: '',
      start: '',
      exit: '',
    },
  ]
}

function App() {
  const [screen, setScreen] = useState<'welcome' | 'data' | 'results'>('welcome')
  const [spinning, setSpinning] = useState(false)
  const [rows, setRows] = useState<ObservedVehicleRow[]>(createInitialRows)
  const [simulationCount, setSimulationCount] = useState<number>(1)
  const [processedData, setProcessedData] = useState<ProcessedData | null>(null)

  const validationErrors = useMemo(() => validateObservedRows(rows), [rows])

  const handleStart = () => {
    setSpinning(true)
    window.setTimeout(() => {
      setSpinning(false)
      setScreen('data')
    }, 1400)
  }

  const handleSimulate = () => {
    if (validationErrors.length > 0) {
      return
    }

    const nextData = generateProcessedData(rows, simulationCount)
    setProcessedData(nextData)
    setScreen('results')
  }

  return (
    <main className="app-shell">
      {screen === 'welcome' && <WelcomePage spinning={spinning} onStart={handleStart} />}

      {screen === 'data' && (
        <DataEntryPage
          rows={rows}
          simulationCount={simulationCount}
          onRowsChange={setRows}
          onSimulationCountChange={setSimulationCount}
          onSimulate={handleSimulate}
          onBack={() => setScreen('welcome')}
        />
      )}

      {screen === 'results' && processedData && (
        <SimulationResultsPage
          data={processedData}
          onReset={() => setScreen('data')}
        />
      )}
    </main>
  )
}

export default App
