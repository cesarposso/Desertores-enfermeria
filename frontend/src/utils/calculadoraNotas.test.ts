import { describe, it, expect } from 'vitest'
import { calcularNotas } from './calculadoraNotas'
import { formatearConMaximo, formatearNumero } from './formateadorNotas'

describe('calculadoraNotas - Lógica de proyección de calificaciones', () => {
  it('calcula correctamente el caso especificado: Corte 1 con quices 2,8 y parcial 1,0', () => {
    // Corte 1: quices 2.8 (15%) + parcial 1.0 (20%)
    // Aporte: 2.8 * 0.15 + 1.0 * 0.20 = 0.42 + 0.20 = 0.62
    // Sobre 5: 0.62 / 0.35 = 1.77142857... -> 1.77
    const resultado = calcularNotas({
      1: { quices: 2.8, parcial: 1.0 },
      2: { quices: null, parcial: null },
      3: { quices: null, parcial: null },
    })

    const c1 = resultado.cortes[0]
    expect(c1.habilitado).toBe(true)
    expect(c1.completo).toBe(true)
    expect(c1.cuentaParaCalculo).toBe(true)

    // Precisión matemática completa
    expect(c1.aporteTotalCorte).toBeCloseTo(0.62, 5)
    expect(c1.notaCorteSobre5).toBeCloseTo(1.771428, 4)

    // Formateo con unidad y máximo
    expect(formatearConMaximo(c1.aporteTotalCorte, c1.pesoTotal * 5.0)).toBe('0,62 de 1,75')
    expect(formatearConMaximo(c1.notaCorteSobre5, 5.0)).toBe('1,77 de 5,0')

    // Acumulado y proyección tras Corte 1
    expect(resultado.cortesCompletadosCount).toBe(1)
    expect(resultado.aporteAcumulado).toBeCloseTo(0.62, 5)
    expect(resultado.pesoEvaluado).toBe(0.35)
    expect(resultado.pesoRestante).toBe(0.65)

    // Máximo alcanzable: 0.62 + 5.0 * 0.65 = 0.62 + 3.25 = 3.87
    expect(resultado.maximoAlcanzable).toBeCloseTo(3.87, 5)
    expect(formatearConMaximo(resultado.maximoAlcanzable, 5.0)).toBe('3,87 de 5,0')

    // Promedio necesario para 3.0 en cortes restantes (65% restante):
    // (3.0 - 0.62) / 0.65 = 2.38 / 0.65 = 3.6615...
    expect(resultado.promedioNecesarioSobre5).toBeCloseTo(3.6615, 3)
    expect(formatearConMaximo(resultado.promedioNecesarioSobre5, 5.0)).toBe('3,66 de 5,0')
    expect(resultado.esPosibleAprobar).toBe(true)
    expect(resultado.yaAprobado).toBe(false)
  })

  it('un campo vacío no cuenta como cero y un corte incompleto no cuenta', () => {
    const resultado = calcularNotas({
      1: { quices: 4.5, parcial: null }, // solo quices, parcial vacío
      2: { quices: null, parcial: null },
      3: { quices: null, parcial: null },
    })

    const c1 = resultado.cortes[0]
    expect(c1.completo).toBe(false)
    expect(c1.cuentaParaCalculo).toBe(false)
    expect(resultado.cortesCompletadosCount).toBe(0)
    expect(resultado.aporteAcumulado).toBe(0)

    // Corte 2 no debe habilitarse si el 1 está incompleto
    expect(resultado.cortes[1].habilitado).toBe(false)
  })

  it('si un corte anterior queda incompleto tras editarlo, los siguientes conservan valores pero no cuentan y quedan bloqueados', () => {
    // El usuario había ingresado valores en Corte 2, pero luego borró el parcial del Corte 1
    const resultado = calcularNotas({
      1: { quices: 3.5, parcial: null }, // incompleto
      2: { quices: 4.0, parcial: 4.0 }, // tiene valores guardados pero no debe contar
      3: { quices: null, parcial: null },
    })

    expect(resultado.cortes[0].completo).toBe(false)
    expect(resultado.cortes[0].cuentaParaCalculo).toBe(false)

    // Corte 2 conserva valores pero está bloqueado y no cuenta
    expect(resultado.cortes[1].quices).toBe(4.0)
    expect(resultado.cortes[1].parcial).toBe(4.0)
    expect(resultado.cortes[1].habilitado).toBe(false)
    expect(resultado.cortes[1].cuentaParaCalculo).toBe(false)

    // Nada se acumula
    expect(resultado.cortesCompletadosCount).toBe(0)
    expect(resultado.aporteAcumulado).toBe(0)
  })

  it('detecta caso imposible cuando el promedio necesario supera 5,0', () => {
    // Corte 1 pésimo: 0.5 y 0.5 (Aporte = 0.5*0.15 + 0.5*0.20 = 0.175)
    // Corte 2 pésimo: 0.5 y 0.5 (Aporte = 0.175)
    // Aporte acumulado = 0.35. Peso restante = 30% (Corte 3).
    // Máximo alcanzable = 0.35 + 5.0 * 0.30 = 0.35 + 1.50 = 1.85 < 3.0
    // Promedio necesario = (3.0 - 0.35) / 0.30 = 2.65 / 0.30 = 8.83 > 5.0
    const resultado = calcularNotas({
      1: { quices: 0.5, parcial: 0.5 },
      2: { quices: 0.5, parcial: 0.5 },
      3: { quices: null, parcial: null },
    })

    expect(resultado.cortesCompletadosCount).toBe(2)
    expect(resultado.maximoAlcanzable).toBeCloseTo(1.85, 2)
    expect(resultado.esPosibleAprobar).toBe(false)
    expect(resultado.promedioNecesarioSobre5).toBeGreaterThan(5.0)
    expect(resultado.mensajeAcompanamiento).toContain('no permite alcanzar la nota mínima aprobatoria')
  })

  it('si el acumulado ya supera 3,0 no muestra promedio negativo y marca yaAprobado', () => {
    // Supongamos notas excelentes en Cortes 1 y 2:
    // Corte 1: 5.0, 5.0 -> Aporte 1.75
    // Corte 2: 5.0, 5.0 -> Aporte 1.75
    // Acumulado = 3.50 > 3.0 (ya superó la nota aprobatoria antes del corte 3)
    const resultado = calcularNotas({
      1: { quices: 5.0, parcial: 5.0 },
      2: { quices: 5.0, parcial: 5.0 },
      3: { quices: null, parcial: null },
    })

    expect(resultado.cortesCompletadosCount).toBe(2)
    expect(resultado.aporteAcumulado).toBe(3.5)
    expect(resultado.yaAprobado).toBe(true)
    expect(resultado.promedioNecesarioSobre5).toBeNull()
    expect(resultado.haAprobado).toBe(true)
  })

  it('evalúa correctamente cuando el corte 3 está completo (caso final)', () => {
    const resultado = calcularNotas({
      1: { quices: 3.0, parcial: 3.0 },
      2: { quices: 3.0, parcial: 3.0 },
      3: { quices: 3.0, parcial: 3.0 },
    })

    expect(resultado.finalizado).toBe(true)
    expect(resultado.cortesCompletadosCount).toBe(3)
    expect(resultado.aporteAcumulado).toBeCloseTo(3.0, 4)
    expect(resultado.haAprobado).toBe(true)
  })

  it('formatea a tres decimales si el redondeo a dos decimales daría 3,00 pero está por debajo', () => {
    // 2.996 está por debajo de 3.0, pero toFixed(2) daría "3.00"
    const formateado = formatearNumero(2.996, true)
    expect(formateado).toBe('2,996')

    const conMax = formatearConMaximo(2.996, 5.0, true)
    expect(conMax).toBe('2,996 de 5,000')

    // Si ya es 3.0 o más, usa 2 decimales normales
    expect(formatearNumero(3.00, true)).toBe('3,00')
    expect(formatearNumero(2.85, true)).toBe('2,85')
  })
})
