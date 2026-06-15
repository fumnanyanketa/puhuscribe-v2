import { describe, it, expect } from 'vitest'
import { rankState, ladder, newlyReached, MILESTONES } from './milestones'

describe('milestones', () => {
  it('no rank before the first milestone', () => {
    const s = rankState(10)
    expect(s.level).toBe(0)
    expect(s.rank).toBeNull()
    expect(s.next?.words).toBe(50)
    expect(s.toNext).toBe(40)
  })

  it('reports the current rank and progress to the next', () => {
    const s = rankState(180) // past 100, before 250
    expect(s.level).toBe(2)
    expect(s.rank?.words).toBe(100)
    expect(s.next?.words).toBe(250)
    expect(s.toNext).toBe(70)
    // 180 is 80/150 of the way from 100 -> 250
    expect(s.pctToNext).toBe(53)
  })

  it('caps out when every milestone is reached', () => {
    const s = rankState(2500)
    expect(s.level).toBe(MILESTONES.length)
    expect(s.next).toBeNull()
    expect(s.pctToNext).toBe(100)
  })

  it('ladder marks done / current / locked', () => {
    const rungs = ladder(120)
    expect(rungs[0].done).toBe(true)  // 50
    expect(rungs[1].done).toBe(true)  // 100
    expect(rungs[2].current).toBe(true) // 250 is next
    expect(rungs[3].done).toBe(false) // 500 locked
  })

  it('newlyReached returns the highest uncelebrated milestone', () => {
    expect(newlyReached(120, 0)?.words).toBe(100)   // crossed 50 + 100, celebrate the higher
    expect(newlyReached(120, 100)).toBeNull()        // already celebrated 100
    expect(newlyReached(40, 0)).toBeNull()           // none reached yet
    expect(newlyReached(300, 100)?.words).toBe(250)  // next one up
  })
})
