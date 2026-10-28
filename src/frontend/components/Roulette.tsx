type RouletteProps = {
  spinning: boolean
}

const rouletteNumbers = [
  '0', '32', '15', '19', '4', '21', '2', '25', '17', '34', '6', '27', '13', '36', '11', '30', '8', '23',
]

function Roulette({ spinning }: RouletteProps) {
  return (
    <div className={`roulette-wrap ${spinning ? 'is-spinning' : ''}`} aria-label="Ruleta de casino">
      <div className="roulette-wheel">
        <div className="roulette-numbers" aria-hidden="true">
          {rouletteNumbers.map((number, index) => (
            <span
              key={number + index}
              className={index % 2 === 0 ? 'number-red' : 'number-black'}
              style={{ transform: `translate(-50%, -50%) rotate(${index * 20}deg) translateY(-118px)` }}
            >
              {number}
            </span>
          ))}
        </div>
        <div className="roulette-center" />
        <div className="roulette-pointer" />
      </div>
    </div>
  )
}

export default Roulette
