import { describe, it, expect } from 'vitest'
import { calcularRadioExpansionTema } from './EstadoPanelContext'

describe('EstadoPanelContext - Radio de expansión circular de tema', () => {
  it('calcula la hipotenusa exacta hasta la esquina más lejana desde el dock izquierdo', () => {
    const radio = calcularRadioExpansionTema(40, 450, 1440, 900)
    expect(radio).toBeCloseTo(Math.hypot(1400, 450), 5)
  })

  it('cubre la diagonal completa cuando el botón está en la esquina superior derecha', () => {
    const radio = calcularRadioExpansionTema(360, 28, 390, 844)
    expect(radio).toBeCloseTo(Math.hypot(360, 816), 5)
  })

  it('calcula el mismo radio simétrico desde el centro de la ventana', () => {
    const radio = calcularRadioExpansionTema(500, 400, 1000, 800)
    expect(radio).toBeCloseTo(Math.hypot(500, 400), 5)
  })
})
