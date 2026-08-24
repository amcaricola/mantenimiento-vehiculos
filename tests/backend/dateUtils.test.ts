import { describe, it, expect } from 'vitest'
import {
  differenceInDays,
  getDiasRestantes,
  getRevisionStatus,
  formatDiasRestantes,
} from '../../src/shared/dates'

function isoDaysFromNow(days: number, base: Date = new Date()): string {
  const d = new Date(base)
  d.setDate(d.getDate() + days)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

describe('differenceInDays', () => {
  it('devuelve 0 para la fecha de hoy', () => {
    const hoy = new Date()
    expect(differenceInDays(isoDaysFromNow(0, hoy), hoy)).toBe(0)
  })

  it('devuelve un número positivo para una fecha futura', () => {
    const hoy = new Date()
    expect(differenceInDays(isoDaysFromNow(10, hoy), hoy)).toBe(10)
  })

  it('devuelve un número negativo para una fecha pasada', () => {
    const hoy = new Date()
    expect(differenceInDays(isoDaysFromNow(-3, hoy), hoy)).toBe(-3)
  })
})

describe('getDiasRestantes', () => {
  it('devuelve null sin fecha próxima', () => {
    expect(getDiasRestantes(undefined)).toBeNull()
  })

  it('devuelve 0 el día del vencimiento', () => {
    const hoy = new Date()
    expect(getDiasRestantes(isoDaysFromNow(0, hoy), hoy)).toBe(0)
  })

  it('devuelve 15 para una fecha dentro de 15 días', () => {
    const hoy = new Date()
    expect(getDiasRestantes(isoDaysFromNow(15, hoy), hoy)).toBe(15)
  })
})

describe('getRevisionStatus', () => {
  const MARGEN = 15

  it('clasifica como "vencido" con días negativos', () => {
    expect(getRevisionStatus(-1, MARGEN)).toBe('vencido')
    expect(getRevisionStatus(-30, MARGEN)).toBe('vencido')
  })

  it('clasifica como "proximo" en el límite del margen', () => {
    expect(getRevisionStatus(0, MARGEN)).toBe('proximo')
    expect(getRevisionStatus(15, MARGEN)).toBe('proximo')
  })

  it('clasifica como "al_dia" más allá del margen', () => {
    expect(getRevisionStatus(16, MARGEN)).toBe('al_dia')
    expect(getRevisionStatus(100, MARGEN)).toBe('al_dia')
  })

  it('clasifica como "sin_fecha" con null', () => {
    expect(getRevisionStatus(null, MARGEN)).toBe('sin_fecha')
  })

  it('respeta un margen de aviso configurado', () => {
    expect(getRevisionStatus(7, 30)).toBe('proximo')
    expect(getRevisionStatus(7, 5)).toBe('al_dia')
  })

  it('usa el margen por defecto de 15 días (constante)', () => {
    expect(getRevisionStatus(15)).toBe('proximo')
    expect(getRevisionStatus(16)).toBe('al_dia')
    expect(getRevisionStatus(-1)).toBe('vencido')
  })
})

describe('formatDiasRestantes', () => {
  it('formatea los distintos casos', () => {
    expect(formatDiasRestantes(null)).toBe('—')
    expect(formatDiasRestantes(0)).toBe('Hoy')
    expect(formatDiasRestantes(1)).toBe('1 día')
    expect(formatDiasRestantes(5)).toBe('5 días')
    expect(formatDiasRestantes(-4)).toBe('4 días vencido')
  })
})