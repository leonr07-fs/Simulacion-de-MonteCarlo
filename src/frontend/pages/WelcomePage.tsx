import Roulette from '../components/Roulette'

type WelcomePageProps = {
  spinning: boolean
  onStart: () => void
}

function WelcomePage({ spinning, onStart }: WelcomePageProps) {
  return (
    <section className="welcome-screen">
      <div className="welcome-panel">
        <div className="welcome-visual">
          <Roulette spinning={spinning} />
        </div>

        <h1>SIMULACIÓN DE MONTECARLO</h1>

        <button type="button" className="primary-button" onClick={onStart}>
          Simulación de colas en surtidor
        </button>
      </div>
    </section>
  )
}

export default WelcomePage
