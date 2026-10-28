import type { ProcessedData } from '../../backend/models/queue'
import { formatTwoDigitNumber } from '../../backend/calculations/math'

type SimulationResultsPageProps = {
  data: ProcessedData
  onReset: () => void
}

function SimulationResultsPage({ data, onReset }: SimulationResultsPageProps) {
  return (
    <section className="results-page">
      <div className="page-header results-header">
        <button type="button" className="link-button" onClick={onReset}>
          Volver
        </button>
        <h2>Resultados de la simulación</h2>
      </div>

      <div className="results-section">
        <h3>Datos procesados</h3>
        <div className="summary-grid">
          <div className="summary-card">
            <span>Automóviles observados</span>
            <strong>{data.sortedRows.length}</strong>
          </div>
          <div className="summary-card">
            <span>Automóviles simulados</span>
            <strong>{data.simulationCount}</strong>
          </div>
          <div className="summary-card">
            <span>TI entre llegadas</span>
            <strong>{data.interArrivalMinutes.length}</strong>
          </div>
          <div className="summary-card">
            <span>TI de servicio</span>
            <strong>{data.serviceMinutes.length}</strong>
          </div>
        </div>
      </div>

      <div className="results-section">
        <h3>Tabla de Intervalos entre Llegadas (Distribución Empírica)</h3>
        <div className="table-wrap">
          <table className="results-table">
            <thead>
              <tr>
                <th>Tiempo entre llegadas (min)</th>
                <th>Frecuencia Observada</th>
                <th>Probabilidad P(x)</th>
                <th>P(x) Acumulada</th>
                <th>Intervalo Números Aleatorios</th>
              </tr>
            </thead>
            <tbody>
              {data.arrivalDistribution.map((entry) => {
                const interval = data.arrivalRandomIntervals.find((item) => item.value === entry.value)
                const intervalLabel = interval ? `${formatTwoDigitNumber(interval.start)}-${formatTwoDigitNumber(interval.end)}` : '—'

                return (
                  <tr key={`arrival-${entry.value}`}>
                    <td>{entry.value}</td>
                    <td>{entry.frequency}</td>
                    <td>{entry.probability.toFixed(4)}</td>
                    <td>{entry.cumulative.toFixed(4)}</td>
                    <td>{intervalLabel}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="results-section">
        <h3>Tabla de Tiempos de Servicio (Distribución Empírica)</h3>
        <div className="table-wrap">
          <table className="results-table">
            <thead>
              <tr>
                <th>Tiempo de servicio (min)</th>
                <th>Frecuencia Observada</th>
                <th>Probabilidad P(x)</th>
                <th>P(x) Acumulada</th>
                <th>Intervalo Números Aleatorios</th>
              </tr>
            </thead>
            <tbody>
              {data.serviceDistribution.map((entry) => {
                const interval = data.serviceRandomIntervals.find((item) => item.value === entry.value)
                const intervalLabel = interval ? `${formatTwoDigitNumber(interval.start)}-${formatTwoDigitNumber(interval.end)}` : '—'

                return (
                  <tr key={`service-${entry.value}`}>
                    <td>{entry.value}</td>
                    <td>{entry.frequency}</td>
                    <td>{entry.probability.toFixed(4)}</td>
                    <td>{entry.cumulative.toFixed(4)}</td>
                    <td>{intervalLabel}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="results-section">
        <h3>Tabla Final de Simulación</h3>
        <div className="table-wrap">
          <table className="results-table simulation-table">
            <thead>
              <tr>
                <th># llegada</th>
                <th># aleatorio</th>
                <th>Hora llegada</th>
                <th>Tiempo espera (min)</th>
                <th>Hora ingreso servidor</th>
                <th># aleatorio</th>
                <th>Tiempo servicio (min)</th>
                <th>Hora salida servidor</th>
                <th>Tiempo en sistema (min)</th>
              </tr>
            </thead>
            <tbody>
              {data.simulationRows.map((row) => (
                <tr key={`sim-${row.arrivalNumber}`}>
                  <td>{row.arrivalNumber}</td>
                  <td>{row.arrivalRandom === null ? '—' : formatTwoDigitNumber(row.arrivalRandom)}</td>
                  <td>{row.arrivalTime}</td>
                  <td>{Math.round(row.waitSeconds / 60)}</td>
                  <td>{row.serverEntryTime}</td>
                  <td>{formatTwoDigitNumber(row.serviceRandom)}</td>
                  <td>{row.serviceMinutes}</td>
                  <td>{row.departureTime}</td>
                  <td>{Math.round(row.totalSystemSeconds / 60)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  )
}

export default SimulationResultsPage
