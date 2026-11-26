import { describe, it, expect } from 'vitest'
import {
  ARCO_GRADOS_DEFECTO,
  TOTAL_SEGMENTOS_DEFECTO,
  calcularGeometriaVelocimetro,
  obtenerColorNivelVelocimetro,
} from './MedidorVelocimetro'

describe('MedidorVelocimetro - Geometría radial y semántica', () => {
  it('genera 54 segmentos distribuidos en un arco de ~250° (-125° a +125°)', () => {
    const geom = calcularGeometriaVelocimetro(50)

    expect(TOTAL_SEGMENTOS_DEFECTO).toBe(54)
    expect(ARCO_GRADOS_DEFECTO).toBe(250)
    expect(geom.segmentos).toHaveLength(54)
    expect(geom.segmentos[0].anguloDeg).toBeCloseTo(-125, 5)
    expect(geom.segmentos[53].anguloDeg).toBeCloseTo(125, 5)
    expect(geom.segmentosActivos).toBe(27)
  })

  it('calcula exactamente los segmentos activos para 0%, 50% y 100%', () => {
    expect(calcularGeometriaVelocimetro(0).segmentosActivos).toBe(0)
    expect(calcularGeometriaVelocimetro(0).segmentos.every((s) => !s.activo)).toBe(true)

    expect(calcularGeometriaVelocimetro(50).segmentosActivos).toBe(27)
    expect(calcularGeometriaVelocimetro(100).segmentosActivos).toBe(54)
    expect(calcularGeometriaVelocimetro(100).segmentos.every((s) => s.activo)).toBe(true)
  })

  it('hace clamp seguro ante valores negativos, mayores a 100 o NaN', () => {
    const negativo = calcularGeometriaVelocimetro(-25)
    expect(negativo.porcentajeSeguro).toBe(0)
    expect(negativo.segmentosActivos).toBe(0)

    const exceso = calcularGeometriaVelocimetro(145)
    expect(exceso.porcentajeSeguro).toBe(100)
    expect(exceso.segmentosActivos).toBe(54)

    const invalido = calcularGeometriaVelocimetro(Number.NaN)
    expect(invalido.porcentajeSeguro).toBe(0)
    expect(invalido.segmentosActivos).toBe(0)
    expect(invalido.segmentos.every((s) => Number.isFinite(s.anguloDeg))).toBe(true)
  })

  it('usa colores semánticos suaves y nunca el rojo institucional #AD3333', () => {
    const rojoInstitucional = '#AD3333'
    const colorBajo = obtenerColorNivelVelocimetro('bajo')
    const colorMedio = obtenerColorNivelVelocimetro('medio')
    const colorAlto = obtenerColorNivelVelocimetro('alto')

    expect(colorBajo).toBe('#059669')
    expect(colorMedio).toBe('#D97706')
    expect(colorAlto).toBe('#D96B43')

    for (const color of [colorBajo, colorMedio, colorAlto]) {
      expect(color.toUpperCase()).not.toBe(rojoInstitucional)
    }
  })
})
