function Origin() {
  return (
    <>
      <h3 className='mt-6 font-reading text-[18px] leading-none text-ink'>
        Why does a game like this exist, and why is it so complex? Did you just want to watch people
        suffer?
      </h3>
      <p className='mt-3 text-[15px] leading-relaxed text-ink-dim'>
        Partly, yes. Mostly, though, it is an attempt at a proper war on the board. Every army
        follows a leader with a plan and guards one piece it cannot afford to lose, just as in
        chess, but nothing here comes down to luck. No dice to blame, no ladder to climb by
        accident, no lucky roll to save you. Win and you outplayed someone. Lose and you were
        outplayed, and the board will not let you pretend otherwise. That is what an ideal war looks
        like, at least to whoever made this, and that part is purely a matter of taste.
      </p>
    </>
  )
}
function Outcomes() {
  return (
    <>
      <h3 className='mt-6 font-reading text-[18px] leading-none text-ink'>
        Why do games end so differently from chess?
      </h3>
      <p className='mt-3 text-[15px] leading-relaxed text-ink-dim'>
        To cut down on draws, so that more games end in a win or a loss. In standard chess a game
        can be drawn by stalemate, by threefold repetition, by the fifty-move rule, by insufficient
        material or a dead position, and by agreement.
      </p>
      <p className='mt-2.5 text-[15px] leading-relaxed text-ink-dim'>
        Here most of those are gone. Stalemate is a win for the side that cannot move, and a third
        repetition loses for whoever plays it. Insufficient material counts only when the two Popes
        stand alone (not final yet), and the fifty-move rule becomes a no-progress limit that grows
        as pieces leave the board. That leaves three draws only: insufficient material, the
        no-progress limit and agreement.
      </p>
    </>
  )
}
function Dormancy() {
  return (
    <>
      <h3 className='mt-6 font-reading text-[18px] leading-none text-ink'>
        Why does the Emperor stand still at the start? And why does promotion not work the way it
        does in chess?
      </h3>
      <p className='mt-3 text-[15px] leading-relaxed text-ink-dim'>
        To keep the game from snowballing. If a piece as strong as a queen were free from the first
        move, whoever got ahead early would stay ahead and the game would be decided quickly. The
        Emperor wakes once its own Marshal is captured, so taking the Marshal raises a powerful
        piece on the side that just lost it, and the attacker has to weigh that before taking. And
        if you poke the dormant Emperor awake yourself, nobody is to blame but you and whatever you
        were calling a strategy.
      </p>
      <p className='mt-2.5 text-[15px] leading-relaxed text-ink-dim'>
        Promotion runs on the same grudge against snowballs. A Legionary can only become a piece its
        own side has already lost, so the side getting beaten has plenty to pick from while the side
        in front may get nothing at all. Being ahead was never meant to be comfortable.
      </p>
    </>
  )
}
export function Faq() {
  return (
    <section>
      <h2 className='font-reading text-[22px] leading-none text-ink'>FAQ</h2>
      <Origin />
      <Outcomes />
      <Dormancy />
    </section>
  )
}