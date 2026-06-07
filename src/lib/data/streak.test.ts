import { describe, it, expect } from 'vitest'
import { bucketByUtcDay, computeWeek, computeStreak, sumCounts, utcDayKey, DAY_INITIAL } from './streak'

const NOW = new Date('2026-06-07T12:00:00.000Z')
const DAY = 86_400_000
const iso = (daysAgo: number) => new Date(NOW.getTime() - daysAgo * DAY).toISOString()

describe('bucketByUtcDay', () => {
  it('counts timestamps per UTC calendar day', () => {
    const m = bucketByUtcDay([iso(0), iso(0), iso(1)])
    expect(m.get(utcDayKey(NOW))).toBe(2)
    expect(m.get(utcDayKey(new Date(NOW.getTime() - DAY)))).toBe(1)
    expect(m.get(utcDayKey(new Date(NOW.getTime() - 5 * DAY)))).toBeUndefined()
  })
})

describe('computeWeek', () => {
  it('returns 7 days oldest→newest with correct counts and labels', () => {
    const wk = computeWeek(bucketByUtcDay([iso(0), iso(2), iso(2), iso(6)]), NOW)
    expect(wk).toHaveLength(7)
    expect(wk[6].count).toBe(1)            // today
    expect(wk[4].count).toBe(2)            // 2 days ago
    expect(wk[0].count).toBe(1)            // 6 days ago
    expect(wk[5].count).toBe(0)            // 1 day ago (no reviews)
    expect(wk[6].label).toBe(DAY_INITIAL[NOW.getUTCDay()])
    expect(sumCounts(wk)).toBe(4)
    // reviews older than 7 days are excluded from the window
    expect(sumCounts(computeWeek(bucketByUtcDay([iso(9)]), NOW))).toBe(0)
  })
})

describe('computeStreak', () => {
  it('counts consecutive days, today-open does not break it, gaps do', () => {
    expect(computeStreak(bucketByUtcDay([iso(0), iso(1)]), NOW)).toBe(2)   // today + yesterday
    expect(computeStreak(bucketByUtcDay([iso(0)]), NOW)).toBe(1)           // today only
    expect(computeStreak(bucketByUtcDay([iso(1)]), NOW)).toBe(1)           // today open, yesterday counts
    expect(computeStreak(bucketByUtcDay([iso(1), iso(2)]), NOW)).toBe(2)   // today open, two prior days
    expect(computeStreak(bucketByUtcDay([]), NOW)).toBe(0)                 // nothing
    expect(computeStreak(bucketByUtcDay([iso(2)]), NOW)).toBe(0)           // gap at yesterday
    expect(computeStreak(bucketByUtcDay([iso(0), iso(1), iso(3)]), NOW)).toBe(2) // gap breaks the run
  })
})
