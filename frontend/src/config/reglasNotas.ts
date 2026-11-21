export interface ReglaCorte {
  readonly id: number
  readonly nombre: string
  readonly pesoTotal: number // e.g. 0.35 para 35%
  readonly pesoQuices: number // e.g. 0.15 para 15%
  readonly pesoParcial: number // e.g. 0.20 para 20%
}

export interface ReglasNotasConfig {
  readonly notaAprobatoria: number
  readonly notaMaxima: number
  readonly cortes: readonly ReglaCorte[]
}

/**
 * Reglas de notas oficiales definidas en un único archivo de configuración.
 * 
 * - Tres cortes: 35 %, 35 % y 30 %
 * - Corte 1 y 2: quices y trabajos 15 %, parcial 20 %
 * - Corte 3: quices y trabajos 10 %, parcial 20 %
 * - Nota aprobatoria: 3,0 sobre 5,0
 */
export const CONFIG_NOTAS: ReglasNotasConfig = {
  notaAprobatoria: 3.0,
  notaMaxima: 5.0,
  cortes: [
    {
      id: 1,
      nombre: 'Corte 1',
      pesoTotal: 0.35,
      pesoQuices: 0.15,
      pesoParcial: 0.20,
    },
    {
      id: 2,
      nombre: 'Corte 2',
      pesoTotal: 0.35,
      pesoQuices: 0.15,
      pesoParcial: 0.20,
    },
    {
      id: 3,
      nombre: 'Corte 3',
      pesoTotal: 0.30,
      pesoQuices: 0.10,
      pesoParcial: 0.20,
    },
  ],
} as const
