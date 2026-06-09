import { describe, it, expect } from 'vitest'
import { gradeAnswer, normalizeAnswer, levenshtein } from './grade'
import { Rating } from './fsrs/types'

describe('normalizeAnswer', () => {
  it('lowercases, trims, drops punctuation, collapses spaces — keeps ä/ö', () => {
    expect(normalizeAnswer('  Hyvä! ')).toBe('hyvä')
    expect(normalizeAnswer('Mun  nimi on Maria.')).toBe('mun nimi on maria')
  })
})

describe('levenshtein', () => {
  it('computes edit distance', () => {
    expect(levenshtein('a', 'a')).toBe(0)
    expect(levenshtein('a', 'b')).toBe(1)
    expect(levenshtein('kitten', 'sitting')).toBe(3)
  })
})

describe('gradeAnswer', () => {
  it('exact match → correct / Good', () => {
    expect(gradeAnswer('hyvä', 'hyvä')).toEqual({ tier: 'correct', rating: Rating.Good })
  })
  it('ignores case, spacing and punctuation', () => {
    expect(gradeAnswer('  Hyvä! ', 'hyvä').tier).toBe('correct')
    expect(gradeAnswer('mun nimi on maria', 'Mun nimi on Maria.').tier).toBe('correct')
  })
  it('a missing ä is a near miss → close / Hard', () => {
    expect(gradeAnswer('hyva', 'hyvä')).toEqual({ tier: 'close', rating: Rating.Hard })
  })
  it('a single typo → close', () => {
    expect(gradeAnswer('kissaa', 'kissa').tier).toBe('close')
  })
  it('a wrong word → wrong / Again', () => {
    expect(gradeAnswer('koira', 'kissa')).toEqual({ tier: 'wrong', rating: Rating.Again })
  })
  it('empty answer → wrong / Again (the "I don\'t know" path)', () => {
    expect(gradeAnswer('', 'kissa')).toEqual({ tier: 'wrong', rating: Rating.Again })
  })
})
