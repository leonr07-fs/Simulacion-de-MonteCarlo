import type { ChangeEvent } from 'react'
import { validateObservedRows } from '../../backend/services/simulationService'
import type { ObservedVehicleRow } from '../../backend/models/queue'

type DataEntryPageProps = {
  rows: ObservedVehicleRow[]
  simulationCount: number
  onRowsChange: (rows: ObservedVehicleRow[]) => void
  onSimulationCountChange: (count: number) => void
  onSimulate: () => void
  onBack: () => void
}

const MAX_ROWS = 50

function createRow(id: number): ObservedVehicleRow {
  return {
    id,
    arrival: '',
    start: '',
    exit: '',
  }
}

function DataEntryPage({
  rows,
  simulationCount,
  onRowsChange,
  onSimulationCountChange,
  onSimulate,
  onBack,
}: DataEntryPageProps) {
  const validationMessages = validateObservedRows(rows)
  const isFormValid = rows.length > 0 && validationMessages.length === 0

  const handleAddRow = () => {
    if (rows.length >= MAX_ROWS) {
      return
    }

    onRowsChange([...rows, createRow(rows.length + 1)])
  }

  const handleRemoveRow = (id: number) => {
    if (rows.length === 1) {
      onRowsChange([createRow(1)])
      return
    }

    const filtered = rows.filter((row) => row.id !== id)
    const renamed = filtered.map((row, index) => ({ ...row, id: index + 1 }))
    onRowsChange(renamed)
  }

  const updateRow = (id: number, field: 'arrival' | 'start' | 'exit', value: string) => {
    onRowsChange(
      rows.map((row) => {
        if (row.id !== id) {
          return row
        }

        return {
          ...row,
          [field]: value,
        }
      }),
    )
  }

  const handleInput = (event: ChangeEvent<HTMLInputElement>, rowId: number, field: 'arrival' | 'start' | 'exit') => {
    updateRow(rowId, field, event.target.value)
  }

  return (
    <section className="data-page">
      <div className="page-header">
        <button type="button" className="link-button" onClick={onBack}>
          Volver
        </button>
        <h2>Datos observados del surtidor</h2>
      </div>

      <p className="instruction">Ingrese la hora de llegada, inicio de atención y salida de cada automóvil.</p>

      <div className="table-wrap">
        <table className="spreadsheet-table">
          <thead>
            <tr>
              <th>Auto</th>
              <th>Hora de llegada</th>
              <th>Inicio de atención</th>
              <th>Hora de salida</th>
              <th>Acción</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => (
              <tr key={row.id}>
                <td>Auto {index + 1}</td>
                <td>
                  <input
                    type="text"
                    value={row.arrival}
                    onChange={(event) => handleInput(event, row.id, 'arrival')}
                    placeholder="HH:MM"
                    inputMode="numeric"
                  />
                </td>
                <td>
                  <input
                    type="text"
                    value={row.start}
                    onChange={(event) => handleInput(event, row.id, 'start')}
                    placeholder="HH:MM"
                    inputMode="numeric"
                  />
                </td>
                <td>
                  <input
                    type="text"
                    value={row.exit}
                    onChange={(event) => handleInput(event, row.id, 'exit')}
                    placeholder="HH:MM"
                    inputMode="numeric"
                  />
                </td>
                <td>
                  <button type="button" className="delete-button" onClick={() => handleRemoveRow(row.id)}>
                    Eliminar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="table-actions">
        <label className="simulation-count-control">
          <span>Cantidad de autos a simular</span>
          <input
            type="number"
            min={1}
            max={50}
            step={1}
            value={simulationCount}
            onChange={(event) => {
              const rawValue = Number(event.target.value)
              const nextValue = Number.isFinite(rawValue) ? rawValue : 1
              onSimulationCountChange(Math.min(50, Math.max(1, nextValue)))
            }}
          />
        </label>
        <button type="button" className="secondary-button" onClick={handleAddRow} disabled={rows.length >= MAX_ROWS}>
          Agregar auto
        </button>
      </div>

      {validationMessages.length > 0 && (
        <div className="alert-box" role="alert">
          {validationMessages.map((error, index) => (
            <div key={`${error}-${index}`}>{error}</div>
          ))}
        </div>
      )}

      <button type="button" className="primary-button simulate-button" onClick={onSimulate} disabled={!isFormValid}>
        Simular
      </button>
    </section>
  )
}

export default DataEntryPage
