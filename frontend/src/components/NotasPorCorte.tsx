import { useState } from 'react'
import { CONFIG_NOTAS } from '../config/reglasNotas'
import {
  calcularNotas,
  type CorteInput,
  type ResultadoCalculoNotas,
} from '../utils/calculadoraNotas'
import {
  formatearConMaximo,
  formatearNumero,
  type EscalaVisualizacion,
} from '../utils/formateadorNotas'
import AvisoEtico from './AvisoEtico'
import {
  Calculator,
  RotateCcw,
  CheckCircle2,
  Lock,
  Clock,
  AlertCircle,
  TrendingUp,
  Award,
  Layers,
} from 'lucide-react'

export default function NotasPorCorte() {
  const [escala, setEscala] = useState<EscalaVisualizacion>('sobre5')

  // Estado de entradas canónicas (valores numéricos de 0,0 a 5,0 o null si vacío)
  const [entradas, setEntradas] = useState<Record<number, CorteInput>>({
    1: { quices: null, parcial: null },
    2: { quices: null, parcial: null },
    3: { quices: null, parcial: null },
  })

  // Estado de cadenas de texto para permitir tecleo natural de decimales sin cortes de foco
  const [textos, setTextos] = useState<Record<string, string>>({
    '1-quices': '',
    '1-parcial': '',
    '2-quices': '',
    '2-parcial': '',
    '3-quices': '',
    '3-parcial': '',
  })

  // Errores de validación por campo
  const [errores, setErrores] = useState<Record<string, string>>({})

  // Cálculo puro reactivo
  const resultado: ResultadoCalculoNotas = calcularNotas(entradas, CONFIG_NOTAS)

  const manejarCambioTexto = (
    corteId: number,
    campo: 'quices' | 'parcial',
    valorTexto: string,
  ) => {
    const key = `${corteId}-${campo}`
    setTextos((prev) => ({ ...prev, [key]: valorTexto }))

    const textoLimpio = valorTexto.trim().replace(',', '.')

    if (textoLimpio === '') {
      // Campo vacío: no cuenta como cero, queda como null
      setEntradas((prev) => ({
        ...prev,
        [corteId]: { ...prev[corteId], [campo]: null },
      }))
      setErrores((prev) => {
        const nuevo = { ...prev }
        delete nuevo[key]
        return nuevo
      })
      return
    }

    const num = parseFloat(textoLimpio)
    if (isNaN(num)) {
      setErrores((prev) => ({ ...prev, [key]: 'Debe ser un número válido' }))
      setEntradas((prev) => ({
        ...prev,
        [corteId]: { ...prev[corteId], [campo]: null },
      }))
    } else if (num < 0 || num > 5.0) {
      setErrores((prev) => ({ ...prev, [key]: 'Rango permitido: 0,0 a 5,0' }))
      setEntradas((prev) => ({
        ...prev,
        [corteId]: { ...prev[corteId], [campo]: null },
      }))
    } else {
      setErrores((prev) => {
        const nuevo = { ...prev }
        delete nuevo[key]
        return nuevo
      })
      setEntradas((prev) => ({
        ...prev,
        [corteId]: { ...prev[corteId], [campo]: num },
      }))
    }
  }

  const manejarRestablecer = () => {
    setEntradas({
      1: { quices: null, parcial: null },
      2: { quices: null, parcial: null },
      3: { quices: null, parcial: null },
    })
    setTextos({
      '1-quices': '',
      '1-parcial': '',
      '2-quices': '',
      '2-parcial': '',
      '3-quices': '',
      '3-parcial': '',
    })
    setErrores({})
  }

  return (
    <div className="space-y-6">
      {/* Barra de Controles: Título de Sección e Interruptor de Escala */}
      <div className="flex flex-col gap-4 rounded-lg border border-slate-200 bg-white p-5 sm:flex-row sm:items-center sm:justify-between shadow-xs">
        <div>
          <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
            <Calculator className="h-5 w-5 text-unipamplona-rojo" />
            Cálculo y Proyección de Calificaciones por Corte
          </h2>
          <p className="text-xs text-slate-600 mt-1">
            Simulación de notas en tres cortes (35 %, 35 %, 30 %) con nota aprobatoria de 3,0 ·
            Universidad de Pamplona.
          </p>
        </div>

        {/* Interruptor de Escala Segmentado */}
        <div className="flex flex-col sm:items-end gap-1.5 shrink-0">
          <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">
            Escala de visualización
          </span>
          <div
            role="radiogroup"
            aria-label="Escala de visualización de notas"
            className="inline-flex rounded-md border border-slate-300 bg-slate-100 p-0.5 text-xs font-medium"
          >
            <button
              type="button"
              role="radio"
              aria-checked={escala === 'sobre5'}
              onClick={() => setEscala('sobre5')}
              className={`rounded px-3 py-1.5 transition ${
                escala === 'sobre5'
                  ? 'bg-white text-slate-900 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Sobre 5,0
            </button>
            <button
              type="button"
              role="radio"
              aria-checked={escala === 'aporte'}
              onClick={() => setEscala('aporte')}
              className={`rounded px-3 py-1.5 transition ${
                escala === 'aporte'
                  ? 'bg-white text-slate-900 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Aporte a la nota final
            </button>
          </div>
        </div>
      </div>

      {/* Rejilla de los 3 Cortes (1 col móvil / 3 cols desktop) */}
      <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
        {resultado.cortes.map((corte, index) => {
          const keyQuices = `${corte.id}-quices`
          const keyParcial = `${corte.id}-parcial`
          const errorQuices = errores[keyQuices]
          const errorParcial = errores[keyParcial]
          const pesoCortePct = (corte.pesoTotal * 100).toFixed(0)
          const pesoQuicesPct = (corte.pesoQuices * 100).toFixed(0)
          const pesoParcialPct = (corte.pesoParcial * 100).toFixed(0)
          const maxAporteCorte = corte.pesoTotal * 5.0
          const maxAporteQuices = corte.pesoQuices * 5.0
          const maxAporteParcial = corte.pesoParcial * 5.0

          return (
            <div
              key={corte.id}
              className={`rounded-lg border transition-all duration-200 flex flex-col justify-between ${
                !corte.habilitado
                  ? 'border-slate-200 bg-slate-50/70 opacity-75'
                  : corte.cuentaParaCalculo
                  ? 'border-emerald-300 bg-white shadow-xs'
                  : 'border-slate-200 bg-white shadow-xs'
              }`}
            >
              {/* Cabecera del Corte */}
              <div className="p-4 border-b border-slate-100">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-800 text-sm">
                    {corte.nombre} ({pesoCortePct} %)
                  </span>

                  {/* Insignia de estado */}
                  {!corte.habilitado ? (
                    <span className="inline-flex items-center gap-1 rounded bg-slate-200/80 px-2 py-0.5 text-[11px] font-medium text-slate-700">
                      <Lock className="h-3 w-3 text-slate-500" />
                      Bloqueado
                    </span>
                  ) : corte.cuentaParaCalculo ? (
                    <span className="inline-flex items-center gap-1 rounded bg-emerald-50 border border-emerald-300 px-2 py-0.5 text-[11px] font-medium text-emerald-800">
                      <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                      Completo
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600">
                      <Clock className="h-3 w-3 text-slate-400" />
                      Pendiente
                    </span>
                  )}
                </div>

                {!corte.habilitado && (
                  <p className="mt-1 text-[11px] text-slate-500 italic">
                    Se habilitará al completar el Corte {index}.
                  </p>
                )}
              </div>

              {/* Formulario de Entrada (Siempre de 0,0 a 5,0) */}
              <div className="p-4 space-y-3.5 flex-1">
                {/* Campo Quices y Trabajos */}
                <div>
                  <div className="flex justify-between items-baseline mb-1">
                    <label
                      htmlFor={`input-${corte.id}-quices`}
                      className="text-xs font-medium text-slate-700"
                    >
                      Quices y trabajos ({pesoQuicesPct} %)
                    </label>
                    {escala === 'aporte' && corte.quices !== null && (
                      <span className="text-[11px] text-slate-500 tabular-nums font-medium">
                        Aporte: {formatearConMaximo(corte.aporteQuices, maxAporteQuices)}
                      </span>
                    )}
                  </div>
                  <div className="relative">
                    <input
                      id={`input-${corte.id}-quices`}
                      type="text"
                      inputMode="decimal"
                      disabled={!corte.habilitado}
                      value={textos[keyQuices]}
                      onChange={(e) =>
                        manejarCambioTexto(corte.id, 'quices', e.target.value)
                      }
                      placeholder="0,0 - 5,0"
                      className={`w-full rounded border px-3 py-1.5 text-sm tabular-nums transition focus:outline-none focus:ring-2 focus:ring-[#ebb21c] ${
                        !corte.habilitado
                          ? 'border-slate-200 bg-slate-100 text-slate-400 cursor-not-allowed'
                          : errorQuices
                          ? 'border-amber-400 bg-amber-50/50 text-slate-800'
                          : 'border-slate-300 bg-white text-slate-800 hover:border-slate-400'
                      }`}
                    />
                  </div>
                  {errorQuices && (
                    <p className="mt-1 text-[11px] text-amber-700 font-medium">
                      {errorQuices}
                    </p>
                  )}
                </div>

                {/* Campo Examen Parcial */}
                <div>
                  <div className="flex justify-between items-baseline mb-1">
                    <label
                      htmlFor={`input-${corte.id}-parcial`}
                      className="text-xs font-medium text-slate-700"
                    >
                      Examen parcial ({pesoParcialPct} %)
                    </label>
                    {escala === 'aporte' && corte.parcial !== null && (
                      <span className="text-[11px] text-slate-500 tabular-nums font-medium">
                        Aporte: {formatearConMaximo(corte.aporteParcial, maxAporteParcial)}
                      </span>
                    )}
                  </div>
                  <div className="relative">
                    <input
                      id={`input-${corte.id}-parcial`}
                      type="text"
                      inputMode="decimal"
                      disabled={!corte.habilitado}
                      value={textos[keyParcial]}
                      onChange={(e) =>
                        manejarCambioTexto(corte.id, 'parcial', e.target.value)
                      }
                      placeholder="0,0 - 5,0"
                      className={`w-full rounded border px-3 py-1.5 text-sm tabular-nums transition focus:outline-none focus:ring-2 focus:ring-[#ebb21c] ${
                        !corte.habilitado
                          ? 'border-slate-200 bg-slate-100 text-slate-400 cursor-not-allowed'
                          : errorParcial
                          ? 'border-amber-400 bg-amber-50/50 text-slate-800'
                          : 'border-slate-300 bg-white text-slate-800 hover:border-slate-400'
                      }`}
                    />
                  </div>
                  {errorParcial && (
                    <p className="mt-1 text-[11px] text-amber-700 font-medium">
                      {errorParcial}
                    </p>
                  )}
                </div>
              </div>

              {/* Pie de Tarjeta: Resumen del Corte */}
              <div className="p-3 bg-slate-50 border-t border-slate-100 rounded-b-lg">
                {corte.cuentaParaCalculo ? (
                  <div className="space-y-1">
                    {escala === 'sobre5' ? (
                      <>
                        <div className="flex justify-between text-xs">
                          <span className="text-slate-600 font-medium">Nota del corte:</span>
                          <span className="font-semibold text-slate-900 tabular-nums">
                            {formatearConMaximo(corte.notaCorteSobre5, 5.0)}
                          </span>
                        </div>
                        <div className="flex justify-between text-[11px] text-slate-500">
                          <span>Aporte a la nota final:</span>
                          <span className="tabular-nums font-medium">
                            {formatearConMaximo(corte.aporteTotalCorte, maxAporteCorte)}
                          </span>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="flex justify-between text-xs">
                          <span className="text-slate-600 font-medium">Aporte a nota final:</span>
                          <span className="font-semibold text-slate-900 tabular-nums">
                            {formatearConMaximo(corte.aporteTotalCorte, maxAporteCorte)}
                          </span>
                        </div>
                        <div className="flex justify-between text-[11px] text-slate-500">
                          <span>Equivalente sobre 5,0:</span>
                          <span className="tabular-nums font-medium">
                            {formatearConMaximo(corte.notaCorteSobre5, 5.0)}
                          </span>
                        </div>
                      </>
                    )}
                  </div>
                ) : (
                  <p className="text-[11px] text-slate-500 text-center italic py-1">
                    {!corte.habilitado
                      ? 'Corte bloqueado'
                      : 'Diligencie quices y parcial para computar'}
                  </p>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Tarjeta de Resumen y Proyección: Promedio Necesario como Elemento Dominante */}
      <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-base font-semibold text-slate-800">
              Proyección de Rendimiento y Meta Aprobatoria
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Cálculo acumulativo sobre la nota mínima aprobatoria (3,0) · Precisión completa de 64 bits.
            </p>
          </div>

          <button
            type="button"
            onClick={manejarRestablecer}
            className="inline-flex items-center gap-1.5 self-start sm:self-auto text-xs text-slate-500 hover:text-slate-800 transition"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Restablecer notas
          </button>
        </div>

        {/* ELEMENTO DOMINANTE DEL RESUMEN */}
        <div className="rounded-lg border border-slate-200 bg-slate-50/70 p-5">
          {resultado.finalizado ? (
            /* Caso 1: Los 3 cortes completos (Nota final definitiva) */
            <div className="space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-600">
                  Calificación Definitiva de la Asignatura
                </span>
                <span
                  className={`inline-flex items-center gap-1 rounded border px-3 py-1 text-xs font-semibold self-start sm:self-auto ${
                    resultado.haAprobado
                      ? 'border-emerald-300 bg-emerald-50 text-emerald-800'
                      : 'border-amber-300 bg-amber-50 text-amber-900'
                  }`}
                >
                  <Award className="h-3.5 w-3.5" />
                  {resultado.haAprobado ? 'Asignatura Aprobada' : 'Asignatura No Aprobada'}
                </span>
              </div>

              <div className="flex items-baseline gap-3">
                <span className="text-4xl font-bold tabular-nums text-slate-900">
                  {formatearConMaximo(resultado.aporteAcumulado, 5.0, true)}
                </span>
                <span className="text-xs text-slate-500">
                  (Mínimo aprobatorio institucional: 3,0)
                </span>
              </div>

              <p className="text-xs text-slate-700 leading-relaxed border-t border-slate-200/60 pt-2">
                {resultado.mensajeAcompanamiento}
              </p>
            </div>
          ) : resultado.yaAprobado ? (
            /* Caso 2: Acumulado ya alcanza o supera 3,0 antes del corte final */
            <div className="space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-600">
                  Estado de Aprobación
                </span>
                <span className="inline-flex items-center gap-1 rounded border border-emerald-300 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-800 self-start sm:self-auto">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                  Nota Mínima Aprobatoria Alcanzada
                </span>
              </div>

              <div className="flex items-baseline gap-3">
                <span className="text-3xl font-bold tabular-nums text-slate-900">
                  {formatearConMaximo(resultado.aporteAcumulado, 5.0, true)}
                </span>
                <span className="text-xs text-emerald-700 font-medium">
                  acumulado en {resultado.cortesCompletadosCount} corte(s)
                </span>
              </div>

              <p className="text-xs text-slate-700 leading-relaxed border-t border-slate-200/60 pt-2">
                {resultado.mensajeAcompanamiento}
              </p>
            </div>
          ) : !resultado.esPosibleAprobar ? (
            /* Caso 3: Imposible alcanzar 3,0 con las notas actuales */
            <div className="space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-600">
                  Situación de Acompañamiento Prioritario
                </span>
                <span className="inline-flex items-center gap-1 rounded border border-amber-300 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-900 self-start sm:self-auto">
                  <AlertCircle className="h-3.5 w-3.5 text-amber-700" />
                  Meta Aprobatoria No Alcanzable
                </span>
              </div>

              <div>
                <span className="text-xs text-slate-500 font-medium block mb-1">
                  Máximo puntaje alcanzable (obteniendo 5,0 en lo restante):
                </span>
                <span className="text-3xl font-bold tabular-nums text-slate-900">
                  {formatearConMaximo(resultado.maximoAlcanzable, 5.0, true)}
                </span>
                <span className="text-xs text-slate-500 ml-2">
                  (requeriría un promedio de {formatearNumero(resultado.promedioNecesarioSobre5 || 0)} sobre 5,0)
                </span>
              </div>

              <div className="rounded border border-amber-200 bg-amber-50/80 p-3 mt-2">
                <p className="text-xs text-amber-900 leading-relaxed">
                  {resultado.mensajeAcompanamiento}
                </p>
              </div>
            </div>
          ) : (
            /* Caso 4: En curso normal con promedio requerido alcanzable */
            <div className="space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-600">
                  Promedio Necesario para Aprobar (Meta: 3,0)
                </span>
                <span className="inline-flex items-center gap-1 rounded border border-slate-300 bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700 self-start sm:self-auto">
                  <TrendingUp className="h-3.5 w-3.5 text-slate-600" />
                  {resultado.cortesCompletadosCount === 0
                    ? 'Sin notas registradas'
                    : `Restan ${(resultado.pesoRestante * 100).toFixed(0)} % por evaluar`}
                </span>
              </div>

              <div className="flex items-baseline gap-3">
                <span className="text-4xl font-bold tabular-nums text-slate-900">
                  {formatearConMaximo(resultado.promedioNecesarioSobre5, 5.0, true)}
                </span>
                <span className="text-xs text-slate-500 font-medium">
                  promedio requerido en los cortes pendientes
                </span>
              </div>

              <p className="text-xs text-slate-700 leading-relaxed border-t border-slate-200/60 pt-2">
                {resultado.mensajeAcompanamiento}
              </p>
            </div>
          )}
        </div>

        {/* METADATOS DE APOYO EN SEGUNDO PLANO (Máximo alcanzable y Aporte acumulado) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
          {/* Aporte acumulado */}
          <div className="rounded border border-slate-200 bg-white p-3.5 flex items-start gap-3">
            <div className="rounded bg-slate-100 p-2 text-slate-600 mt-0.5">
              <Layers className="h-4 w-4" />
            </div>
            <div>
              <span className="text-xs font-medium text-slate-500 block">
                Aporte acumulado a la nota final
              </span>
              <span className="text-base font-semibold tabular-nums text-slate-800">
                {escala === 'sobre5'
                  ? `${formatearNumero(resultado.aporteAcumulado, true)} de 5,0`
                  : `${formatearNumero(resultado.aporteAcumulado, true)} de ${(
                      resultado.pesoEvaluado * 5.0
                    )
                      .toFixed(2)
                      .replace('.', ',')}`}
              </span>
              <span className="text-[11px] text-slate-400 block mt-0.5">
                Evaluado hasta ahora: {(resultado.pesoEvaluado * 100).toFixed(0)} % de la materia
              </span>
            </div>
          </div>

          {/* Máximo alcanzable */}
          <div className="rounded border border-slate-200 bg-white p-3.5 flex items-start gap-3">
            <div className="rounded bg-slate-100 p-2 text-slate-600 mt-0.5">
              <TrendingUp className="h-4 w-4" />
            </div>
            <div>
              <span className="text-xs font-medium text-slate-500 block">
                Máximo puntaje alcanzable
              </span>
              <span className="text-base font-semibold tabular-nums text-slate-800">
                {formatearConMaximo(resultado.maximoAlcanzable, 5.0, true)}
              </span>
              <span className="text-[11px] text-slate-400 block mt-0.5">
                Asumiendo 5,0 en el {(resultado.pesoRestante * 100).toFixed(0)} % restante
              </span>
            </div>
          </div>
        </div>

        {/* Aviso Ético Permanente */}
        <AvisoEtico />
      </div>
    </div>
  )
}
