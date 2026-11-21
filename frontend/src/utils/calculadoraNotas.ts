import { CONFIG_NOTAS, type ReglasNotasConfig } from '../config/reglasNotas'

export interface CorteInput {
  quices: number | null
  parcial: number | null
}

export interface EstadoCorteCalculado {
  id: number
  nombre: string
  pesoTotal: number
  pesoQuices: number
  pesoParcial: number
  habilitado: boolean
  completo: boolean
  cuentaParaCalculo: boolean
  quices: number | null
  parcial: number | null
  aporteQuices: number | null
  aporteParcial: number | null
  aporteTotalCorte: number | null
  notaCorteSobre5: number | null
}

export interface ResultadoCalculoNotas {
  cortes: EstadoCorteCalculado[]
  cortesCompletadosCount: number
  aporteAcumulado: number
  pesoEvaluado: number
  pesoRestante: number
  maximoAlcanzable: number
  promedioNecesarioSobre5: number | null
  yaAprobado: boolean
  esPosibleAprobar: boolean
  finalizado: boolean
  haAprobado: boolean | null
  mensajeAcompanamiento: string
}

const EPSILON = 1e-9

/**
 * Valida si un valor numérico es una calificación válida de 0,0 a 5,0.
 */
export function esNotaValida(val: number | null): val is number {
  return typeof val === 'number' && !isNaN(val) && val >= 0 && val <= 5.0
}

/**
 * Función pura que procesa las calificaciones por corte y proyecta la nota final.
 * 
 * Reglas de negocio:
 * 1. Campos vacíos no cuentan como cero (representan 'sin nota todavía').
 * 2. Un corte solo se considera completo cuando sus dos notas están diligenciadas.
 * 3. Desbloqueo progresivo: Corte 2 depende de Corte 1; Corte 3 de Corte 2.
 * 4. Si un corte anterior se edita y queda incompleto, los siguientes conservan
 *    sus valores pero quedan bloqueados y no se computan.
 * 5. Se compara con la nota aprobatoria (3,0) con precisión completa de 64 bits.
 */
export function calcularNotas(
  entradas: Record<number, CorteInput>,
  config: ReglasNotasConfig = CONFIG_NOTAS,
): ResultadoCalculoNotas {
  const cortesCalculados: EstadoCorteCalculado[] = []
  let cortePrevioCompleto = true
  let aporteAcumulado = 0
  let pesoEvaluado = 0
  let cortesCompletadosCount = 0

  for (const regla of config.cortes) {
    const entrada = entradas[regla.id] || { quices: null, parcial: null }
    const quicesValido = esNotaValida(entrada.quices)
    const parcialValido = esNotaValida(entrada.parcial)
    const completo = quicesValido && parcialValido

    // Habilitación secuencial: solo si el corte anterior estuvo completo
    const habilitado: boolean = cortePrevioCompleto

    // Cuenta para el cálculo solo si está habilitado y completo
    const cuentaParaCalculo: boolean = habilitado && completo

    let aporteQuices: number | null = null
    let aporteParcial: number | null = null
    let aporteTotalCorte: number | null = null
    let notaCorteSobre5: number | null = null

    if (cuentaParaCalculo && entrada.quices !== null && entrada.parcial !== null) {
      aporteQuices = entrada.quices * regla.pesoQuices
      aporteParcial = entrada.parcial * regla.pesoParcial
      aporteTotalCorte = aporteQuices + aporteParcial
      notaCorteSobre5 = aporteTotalCorte / regla.pesoTotal

      aporteAcumulado += aporteTotalCorte
      pesoEvaluado += regla.pesoTotal
      cortesCompletadosCount += 1
    }

    cortesCalculados.push({
      id: regla.id,
      nombre: regla.nombre,
      pesoTotal: regla.pesoTotal,
      pesoQuices: regla.pesoQuices,
      pesoParcial: regla.pesoParcial,
      habilitado,
      completo,
      cuentaParaCalculo,
      quices: entrada.quices,
      parcial: entrada.parcial,
      aporteQuices,
      aporteParcial,
      aporteTotalCorte,
      notaCorteSobre5,
    })

    // Si este corte no está completo y habilitado, los siguientes no podrán habilitarse
    cortePrevioCompleto = cuentaParaCalculo
  }

  const pesoRestante = Math.max(0, 1.0 - pesoEvaluado)
  const maximoAlcanzable = aporteAcumulado + config.notaMaxima * pesoRestante

  let promedioNecesarioSobre5: number | null = null
  let yaAprobado = false
  let esPosibleAprobar = true
  const finalizado = cortesCompletadosCount === config.cortes.length
  let haAprobado: boolean | null = null
  let mensajeAcompanamiento = ''

  if (cortesCompletadosCount === 0) {
    // Ningún corte completado aún
    promedioNecesarioSobre5 = config.notaAprobatoria
    mensajeAcompanamiento =
      'Ingrese las calificaciones de quices y parcial para simular la proyección académica.'
  } else if (finalizado) {
    // Los tres cortes están evaluados
    haAprobado = aporteAcumulado >= config.notaAprobatoria - EPSILON
    if (haAprobado) {
      mensajeAcompanamiento =
        'Calificaciones completadas. El caso cumple con el criterio de aprobación de la asignatura.'
    } else {
      mensajeAcompanamiento =
        'Calificaciones completadas. El caso no alcanza la nota mínima aprobatoria (3,0).'
    }
  } else {
    // 1 o 2 cortes completados
    const puntosFaltantes = config.notaAprobatoria - aporteAcumulado

    if (puntosFaltantes <= EPSILON) {
      // Con lo acumulado ya se alcanza o supera 3,0
      yaAprobado = true
      promedioNecesarioSobre5 = null
      haAprobado = true
      mensajeAcompanamiento =
        'Con las calificaciones acumuladas ya se alcanza la nota mínima aprobatoria (3,0) de la asignatura.'
    } else {
      // Falta puntaje por alcanzar
      const necesario = puntosFaltantes / pesoRestante
      promedioNecesarioSobre5 = necesario
      esPosibleAprobar = necesario <= config.notaMaxima + EPSILON

      if (!esPosibleAprobar) {
        mensajeAcompanamiento =
          'Con las calificaciones registradas, el máximo alcanzable no permite alcanzar la nota mínima aprobatoria (3,0). Se sugiere orientar al estudiante hacia tutoría pedagógica y acompañamiento académico institucional.'
      } else {
        mensajeAcompanamiento =
          'Se presenta el promedio requerido en los cortes restantes para alcanzar la nota mínima aprobatoria (3,0).'
      }
    }
  }

  return {
    cortes: cortesCalculados,
    cortesCompletadosCount,
    aporteAcumulado,
    pesoEvaluado,
    pesoRestante,
    maximoAlcanzable,
    promedioNecesarioSobre5,
    yaAprobado,
    esPosibleAprobar,
    finalizado,
    haAprobado,
    mensajeAcompanamiento,
  }
}
