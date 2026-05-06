import { useState, useCallback, useEffect } from 'react'

const WORDS = [
  { word: 'REACT',     hint: 'A JavaScript UI library' },
  { word: 'VITE',      hint: 'Next-gen frontend tooling' },
  { word: 'COMPONENT', hint: 'Reusable UI building block' },
  { word: 'STATE',     hint: 'useState tracks this' },
  { word: 'PROPS',     hint: 'Data passed to a component' },
  { word: 'EFFECT',    hint: 'useEffect runs this' },
  { word: 'BUNDLE',    hint: 'What Rollup creates' },
  { word: 'MODULE',    hint: 'ES import/export unit' },
]

const C = {
  bg:      '#0d0d0f',
  surface: '#17171a',
  surf2:   '#1f1f24',
  border:  '#2a2a30',
  border2: '#3a3a44',
  text:    '#f0eff4',
  muted:   '#7a7a8a',
  accent:  '#6ee7b7',
  accent2: '#a78bfa',
  danger:  '#f87171',
}

const MONO = "'JetBrains Mono', 'Fira Mono', monospace"
const SANS = "'Outfit', 'Segoe UI', sans-serif"

function scramble(word) {
  const arr = word.split('')
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr.join('') === word ? scramble(word) : arr.join('')
}

function useHover() {
  const [hovered, setHovered] = useState(false)
  return [hovered, { onMouseEnter: () => setHovered(true), onMouseLeave: () => setHovered(false) }]
}

function LetterTile({ letter, used, onClick }) {
  const [hov, hovProps] = useHover()
  const [pressed, setPressed] = useState(false)
  return (
    <button
      {...hovProps}
      onMouseDown={() => setPressed(true)}
      onMouseUp={() => setPressed(false)}
      onClick={onClick}
      disabled={used}
      style={{
        width: 52, height: 52, borderRadius: 10,
        background: used ? C.border : hov ? C.border2 : C.surf2,
        border: `1px solid ${used ? C.border : hov ? C.muted : C.border2}`,
        color: C.text, fontSize: '1.2rem', fontWeight: 700, fontFamily: MONO,
        cursor: used ? 'default' : 'pointer',
        opacity: used ? 0.15 : 1,
        transform: used ? 'none' : pressed ? 'scale(0.94)' : hov ? 'translateY(-3px) scale(1.05)' : 'none',
        transition: 'background .12s, border-color .12s, transform .1s, opacity .2s',
        outline: 'none',
      }}
    >
      {letter}
    </button>
  )
}

function AnswerTile({ letter, onClick }) {
  const [hov, hovProps] = useHover()
  return (
    <button
      {...hovProps}
      onClick={onClick}
      style={{
        width: 44, height: 50, borderRadius: 10,
        background: C.surf2, border: `1.5px solid ${C.accent2}`,
        color: C.accent2, fontSize: '1.3rem', fontWeight: 700, fontFamily: MONO,
        cursor: 'pointer',
        transform: hov ? 'translateY(-2px)' : 'none',
        transition: 'background .15s, transform .1s',
        outline: 'none', animation: 'tileIn .15s ease',
      }}
    >
      {letter}
    </button>
  )
}

function GhostBtn({ children, onClick, disabled }) {
  const [hov, hovProps] = useHover()
  const active = hov && !disabled
  return (
    <button
      {...hovProps}
      onClick={onClick}
      disabled={disabled}
      style={{
        flex: 1, padding: '0.65rem 0', borderRadius: 10,
        background: active ? C.surf2 : 'transparent',
        border: `1px solid ${active ? C.muted : C.border2}`,
        color: active ? C.text : C.muted,
        fontFamily: SANS, fontSize: '0.9rem', fontWeight: 600,
        cursor: disabled ? 'default' : 'pointer',
        opacity: disabled ? 0.3 : 1,
        transition: 'background .12s, color .12s, border-color .12s',
        outline: 'none',
      }}
    >
      {children}
    </button>
  )
}

function CheckBtn({ onClick, disabled }) {
  const [hov, hovProps] = useHover()
  const [pressed, setPressed] = useState(false)
  const active = hov && !disabled
  return (
    <button
      {...hovProps}
      onMouseDown={() => setPressed(true)}
      onMouseUp={() => setPressed(false)}
      onClick={onClick}
      disabled={disabled}
      style={{
        flex: 2, padding: '0.65rem 0', borderRadius: 10,
        background: 'linear-gradient(135deg, #6ee7b7, #34d399)',
        border: 'none', color: '#052e16',
        fontFamily: SANS, fontSize: '0.95rem', fontWeight: 700,
        cursor: disabled ? 'default' : 'pointer',
        opacity: disabled ? 0.35 : 1,
        transform: disabled ? 'none' : pressed ? 'scale(0.97)' : active ? 'translateY(-1px)' : 'none',
        filter: active ? 'brightness(1.08)' : 'none',
        transition: 'opacity .15s, transform .1s, filter .15s',
        outline: 'none',
      }}
    >
      Check ↵
    </button>
  )
}

function WordGame() {
  const [order] = useState(() =>
    [...Array(WORDS.length).keys()].sort(() => Math.random() - 0.5)
  )
  const [roundIdx, setRoundIdx]           = useState(0)
  const [score, setScore]                 = useState(0)
  const [streak, setStreak]               = useState(0)
  const [chosen, setChosen]               = useState([])
  const [usedIdxs, setUsedIdxs]           = useState([])
  const [feedback, setFeedback]           = useState(null)
  const [done, setDone]                   = useState(false)
  const [scrambledWord, setScrambledWord] = useState(() => scramble(WORDS[order[0]].word))
  const [shake, setShake]                 = useState(false)
  const [scoreAnim, setScoreAnim]         = useState(false)
  const [answerPop, setAnswerPop]         = useState(false)

  const answer = chosen.map(c => c.l).join('')
  const { word, hint } = WORDS[order[roundIdx]] ?? {}

  const clear = useCallback(() => {
    setChosen([]); setUsedIdxs([]); setFeedback(null)
  }, [])

  const nextRound = useCallback((newIdx) => {
    if (newIdx >= WORDS.length) { setDone(true); return }
    setScrambledWord(scramble(WORDS[order[newIdx]].word))
    setRoundIdx(newIdx)
    setChosen([]); setUsedIdxs([]); setFeedback(null)
  }, [order])

  const pickLetter = (l, idx) => {
    if (usedIdxs.includes(idx) || feedback === 'correct') return
    setUsedIdxs(u => [...u, idx])
    setChosen(c => [...c, { l, idx }])
  }

  const removeLetter = (i) => {
    if (feedback === 'correct') return
    const { idx } = chosen[i]
    setChosen(c => c.filter((_, j) => j !== i))
    setUsedIdxs(u => u.filter(x => x !== idx))
  }

  const check = () => {
    if (!chosen.length) return
    if (answer === word) {
      const pts = 10 + streak * 2
      setScore(s => s + pts)
      setStreak(s => s + 1)
      setFeedback('correct')
      setAnswerPop(true);  setTimeout(() => setAnswerPop(false), 600)
      setScoreAnim(true);  setTimeout(() => setScoreAnim(false), 800)
      setTimeout(() => nextRound(roundIdx + 1), 1000)
    } else {
      setStreak(0)
      setFeedback('wrong')
      setShake(true)
      setTimeout(() => { setShake(false); clear() }, 650)
    }
  }

  const skip = () => {
    if (feedback === 'correct') return
    setStreak(0); setFeedback('skip')
    setTimeout(() => nextRound(roundIdx + 1), 1100)
  }

  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'Enter') check()
      if (e.key === 'Backspace' && chosen.length) removeLetter(chosen.length - 1)
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [chosen, answer, word, streak, roundIdx, feedback])

  if (done) return (
    <div style={{ textAlign: 'center', padding: '2rem 1rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
      <div style={{ fontSize: '3.5rem' }}>🏆</div>
      <h2 style={{ fontSize: '1.5rem', fontWeight: 800, letterSpacing: '-0.03em', color: C.text, fontFamily: SANS }}>
        Game over
      </h2>
      <p style={{ fontSize: '3rem', fontWeight: 800, fontFamily: MONO, background: 'linear-gradient(135deg,#6ee7b7,#a78bfa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
        {score} <span style={{ fontSize: '1.2rem', fontWeight: 500, opacity: 0.6 }}>pts</span>
      </p>
      <p style={{ fontSize: '0.875rem', color: C.muted, fontFamily: MONO }}>{WORDS.length} words done</p>
      <button
        onClick={() => window.location.reload()}
        style={{ marginTop: '0.5rem', padding: '0.75rem 2.5rem', borderRadius: 99, background: 'linear-gradient(135deg,#6ee7b7,#a78bfa)', border: 'none', color: '#1a0533', fontFamily: SANS, fontSize: '1rem', fontWeight: 700, cursor: 'pointer' }}
      >
        Play again
      </button>
    </div>
  )

  const progress = (roundIdx / WORDS.length) * 100
  const fbColor  = feedback === 'correct' ? C.accent : feedback === 'wrong' ? C.danger : C.muted

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, background: C.surf2, border: `1px solid ${C.border}`, borderRadius: 99, padding: '5px 14px', minWidth: 60, justifyContent: 'center' }}>
          <span style={{ fontSize: '1rem', fontWeight: 700, fontFamily: MONO, color: scoreAnim ? C.accent : C.text, transform: scoreAnim ? 'scale(1.35)' : 'scale(1)', transition: 'transform .2s, color .2s', display: 'inline-block' }}>
            {score}
          </span>
          <span style={{ fontSize: '0.75rem', color: C.muted }}>pts</span>
        </div>

        <div style={{ display: 'flex', gap: 5, alignItems: 'center' }}>
          {Array.from({ length: WORDS.length }).map((_, i) => (
            <span key={i} style={{
              width: 8, height: 8, borderRadius: '50%', display: 'inline-block',
              background: i <= roundIdx ? C.accent : C.border2,
              opacity: i < roundIdx ? 0.45 : 1,
              transform: i === roundIdx ? 'scale(1.3)' : 'scale(1)',
              transition: 'background .3s, transform .2s',
            }} />
          ))}
        </div>

        <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, background: C.surf2, border: `1px solid ${C.border}`, borderRadius: 99, padding: '5px 14px', minWidth: 60, justifyContent: 'center' }}>
          <span style={{ fontSize: '1rem', fontWeight: 700, fontFamily: MONO, color: C.text }}>{streak}</span>
          <span style={{ fontSize: '0.75rem' }}>🔥</span>
        </div>
      </div>

      {/* Progress bar */}
      <div style={{ height: 3, background: C.border, borderRadius: 2, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${progress}%`, background: 'linear-gradient(90deg,#6ee7b7,#a78bfa)', borderRadius: 2, transition: 'width .5s cubic-bezier(.4,0,.2,1)' }} />
      </div>

      {/* Hint + scramble */}
      <div style={{ textAlign: 'center', padding: '0.5rem 0' }}>
        <p style={{ fontSize: '0.8rem', fontFamily: MONO, color: C.muted, marginBottom: '0.75rem', letterSpacing: '0.03em' }}>{hint}</p>
        <div style={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: 6, animation: shake ? 'shake .5s ease' : 'none' }}>
          {scrambledWord.split('').map((l, i) => (
            <span key={i} style={{
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              width: 44, height: 50, borderRadius: 10,
              background: usedIdxs.includes(i) ? C.border : C.surf2,
              border: `1px solid ${C.border2}`,
              fontSize: '1.3rem', fontWeight: 700, fontFamily: MONO, color: C.text,
              opacity: usedIdxs.includes(i) ? 0.18 : 1,
              transition: 'opacity .2s, background .2s',
            }}>{l}</span>
          ))}
        </div>
      </div>

      {/* Answer row */}
      <div style={{
        minHeight: 58, display: 'flex', flexWrap: 'wrap', justifyContent: 'center',
        alignItems: 'center', gap: 6, padding: '0.5rem',
        border: `1.5px dashed ${chosen.length ? C.accent2 : C.border2}`,
        borderRadius: 10, transition: 'border-color .2s',
        animation: answerPop ? 'pop .35s ease' : 'none',
      }}>
        {chosen.length === 0
          ? <span style={{ fontSize: '0.8rem', fontFamily: MONO, color: C.muted, letterSpacing: '0.05em' }}>tap letters below</span>
          : chosen.map(({ l }, i) => <AnswerTile key={i} letter={l} onClick={() => removeLetter(i)} />)
        }
      </div>

      {/* Feedback */}
      <div style={{ textAlign: 'center', fontSize: '0.85rem', fontWeight: 600, fontFamily: MONO, minHeight: '1.4rem', color: fbColor, letterSpacing: '0.02em' }}>
        {feedback === 'correct' && `✓ Correct! +${10 + (streak - 1) * 2} pts`}
        {feedback === 'wrong'   && '✗ Not quite — try again'}
        {feedback === 'skip'    && `Skipped · answer: ${word}`}
      </div>

      {/* Letter grid */}
      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 8 }}>
        {scrambledWord.split('').map((l, i) => (
          <LetterTile key={i} letter={l} used={usedIdxs.includes(i)} onClick={() => pickLetter(l, i)} />
        ))}
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: 8 }}>
        <GhostBtn onClick={clear} disabled={!chosen.length}>Clear</GhostBtn>
        <GhostBtn onClick={skip}>Skip</GhostBtn>
        <CheckBtn onClick={check} disabled={chosen.length !== word?.length} />
      </div>

      <p style={{ textAlign: 'center', fontSize: '0.72rem', fontFamily: MONO, color: C.border2, letterSpacing: '0.04em' }}>
        Enter to check · Backspace to remove
      </p>
    </div>
  )
}

export default function App() {
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;700;800&family=JetBrains+Mono:wght@400;600&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #0d0d0f; min-height: 100vh; }
        @keyframes tileIn {
          from { transform: scale(.7) translateY(6px); opacity: 0; }
          to   { transform: scale(1) translateY(0); opacity: 1; }
        }
        @keyframes pop {
          0%   { transform: scale(1); }
          40%  { transform: scale(1.1); }
          70%  { transform: scale(.96); }
          100% { transform: scale(1); }
        }
        @keyframes shake {
          0%,100% { transform: translateX(0); }
          20%     { transform: translateX(-8px); }
          40%     { transform: translateX(8px); }
          60%     { transform: translateX(-6px); }
          80%     { transform: translateX(6px); }
        }
      `}</style>

      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '2rem 1rem 4rem', fontFamily: SANS }}>
        <header style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: '0.4rem' }}>
            <span style={{ fontSize: '1.6rem' }}>⌨</span>
            <span style={{ fontSize: '1.75rem', fontWeight: 800, letterSpacing: '-0.04em', background: 'linear-gradient(135deg,#6ee7b7,#a78bfa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
              Testing
            </span>
          </div>
          {/* <p style={{ fontSize: '0.875rem', color: '#7a7a8a', letterSpacing: '0.04em', fontFamily: MONO }}>
            Unscramble the dev terms
          </p> */}
        </header>

        <main style={{ width: '100%', maxWidth: 520, background: '#17171a', border: '1px solid #2a2a30', borderRadius: 16, padding: '1.5rem' }}>
          <WordGame />
        </main>
      </div>
    </>
  )
}