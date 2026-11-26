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

  const [entradas, setEntradas] = useState<Record<number, CorteInput>>({
    1: { quices: null, parcial: null },
    2: { quices: null, parcial: null },
    3: { quices: null, parcial: null },
  })

  const [textos, setTextos] = useState<Record<string, string>>({
    '1-quices': '',
    '1-parcial': '',
    '2-quices': '',
    '2-parcial': '',
    '3-quices': '',
    '3-parcial': '',
  })

  const [errores, setErrores] = useState<Record<string, string>>({})

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
      {/* Barra de Controles */}
      <div className="bento-card flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="flex items-center gap-2 text-lg font-semibold text-zinc-900 dark:text-[#F4F4F5]">
            <Calculator className="h-5 w-5 text-unipamplona-rojo" aria-hidden="true" />
            Cálculo y Proyección de Calificaciones por Corte
          </h2>
          <p className="mt-1 text-xs text-zinc-600 dark:text-[#A1A1AA]">
            Simulación de notas en tres cortes (35 %, 35 %, 30 %) con nota aprobatoria de 3,0 ·
            Universidad de Pamplona.
          </p>
        </div>

        {/* Interruptor de Escala Segmentado */}
        <div className="flex shrink-0 flex-col gap-1.5 sm:items-end">
          <span className="text-xs font-medium text-zinc-600 dark:text-[#A1A1AA]">
            Escala de visualización
          </span>
          <div
            role="radiogroup"
            aria-label="Escala de visualización de notas"
            className="inline-flex rounded-full border border-black/10 bg-zinc-100 p-1 text-xs font-medium dark:border-white/10 dark:bg-white/[0.06]"
          >
            <button
              type="button"
              role="radio"
              aria-checked={escala === 'sobre5'}
              onClick={() => setEscala('sobre5')}
              className={`pressable rounded-full px-3.5 py-1.5 ${
                escala === 'sobre5'
                  ? 'bg-[#18181B] font-semibold text-white shadow-xs dark:bg-white dark:text-[#18181B]'
                  : 'text-zinc-600 hover:text-zinc-900 dark:text-zinc-300 dark:hover:text-white'
              }`}
            >
              Sobre 5,0
            </button>
            <button
              type="button"
              role="radio"
              aria-checked={escala === 'aporte'}
              onClick={() => setEscala('aporte')}
              className={`pressable rounded-full px-3.5 py-1.5 ${
                escala === 'aporte'
                  ? 'bg-[#18181B] font-semibold text-white shadow-xs dark:bg-white dark:text-[#18181B]'
                  : 'text-zinc-600 hover:text-zinc-900 dark:text-zinc-300 dark:hover:text-white'
              }`}
            >
              Aporte a la nota final
            </button>
          </div>
        </div>
      </div>

      {/* Rejilla de los 3 Cortes */}
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
              className={`bento-card flex flex-col justify-between overflow-hidden transition-[opacity,border-color,box-shadow] duration-200 ${
                !corte.habilitado
                  ? 'opacity-70'
                  : corte.cuentaParaCalculo
                  ? 'border-emerald-300/80 dark:border-emerald-400/35'
                  : ''
              }`}
            >
              <div className="border-b border-black/5 p-5 dark:border-white/10">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-semibold text-zinc-900 dark:text-[#F4F4F5]">
                    {corte.nombre} ({pesoCortePct} %)
                  </span>

                  {!corte.habilitado ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-zinc-200/80 px-2.5 py-0.5 text-xs font-medium text-zinc-700 dark:bg-white/10 dark:text-zinc-300">
                      <Lock className="h-3 w-3 text-zinc-500 dark:text-zinc-400" aria-hidden="true" />
                      Bloqueado
                    </span>
                  ) : corte.cuentaParaCalculo ? (
                    <span className="inline-flex items-center gap-1 rounded-full border border-emerald-300 bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-800 dark:border-emerald-400/30 dark:bg-emerald-500/15 dark:text-emerald-200">
                      <CheckCircle2
                        className="h-3 w-3 text-emerald-600 dark:text-emerald-300"
                        aria-hidden="true"
                      />
                      Completo
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs font-medium text-zinc-600 dark:bg-white/[0.06] dark:text-zinc-300">
                      <Clock className="h-3 w-3 text-zinc-400" aria-hidden="true" />
                      Pendiente
                    </span>
                  )}
                </div>

                {!corte.habilitado && (
                  <p className="mt-1.5 text-xs italic text-zinc-600 dark:text-[#A1A1AA]">
                    Se habilitará al completar el Corte {index}.
                  </p>
                )}
              </div>

              <div className="flex-1 space-y-4 p-5">
                <div>
                  <div className="mb-1.5 flex items-baseline justify-between">
                    <label
                      htmlFor={`input-${corte.id}-quices`}
                      className="text-xs font-medium text-zinc-700 dark:text-zinc-300"
                    >
                      Quices y trabajos ({pesoQuicesPct} %)
                    </label>
                    {escala === 'aporte' && corte.quices !== null && (
                      <span className="text-xs font-medium tabular-nums text-zinc-600 dark:text-[#A1A1AA]">
                        Aporte: {formatearConMaximo(corte.aporteQuices, maxAporteQuices)}
                      </span>
                    )}
                  </div>
                  <input
                    id={`input-${corte.id}-quices`}
                    type="text"
                    inputMode="decimal"
                    disabled={!corte.habilitado}
                    value={textos[keyQuices]}
                    onChange={(e) => manejarCambioTexto(corte.id, 'quices', e.target.value)}
                    placeholder="0,0 - 5,0"
                    className={`w-full rounded-2xl border px-3.5 py-2 text-sm tabular-nums transition-colors focus:outline-none focus:ring-2 focus:ring-[#ebb21c] ${
                      !corte.habilitado
                        ? 'cursor-not-allowed border-black/5 bg-zinc-100 text-zinc-400 dark:border-white/5 dark:bg-white/[0.04] dark:text-zinc-500'
                        : errorQuices
                        ? 'border-amber-400 bg-amber-50/50 text-zinc-800 dark:border-amber-400/50 dark:bg-amber-500/10 dark:text-amber-100'
                        : 'border-black/10 bg-zinc-50/70 text-zinc-800 focus:bg-white dark:border-white/10 dark:bg-[#27272A] dark:text-zinc-100 dark:focus:bg-[#27272A]'
                    }`}
                  />
                  {errorQuices && (
                    <p className="mt-1 text-xs font-medium text-amber-800 dark:text-amber-300">
                      {errorQuices}
                    </p>
                  )}
                </div>

                <div>
                  <div className="mb-1.5 flex items-baseline justify-between">
                    <label
                      htmlFor={`input-${corte.id}-parcial`}
                      className="text-xs font-medium text-zinc-700 dark:text-zinc-300"
                    >
                      Examen parcial ({pesoParcialPct} %)
                    </label>
                    {escala === 'aporte' && corte.parcial !== null && (
                      <span className="text-xs font-medium tabular-nums text-zinc-600 dark:text-[#A1A1AA]">
                        Aporte: {formatearConMaximo(corte.aporteParcial, maxAporteParcial)}
                      </span>
                    )}
                  </div>
                  <input
                    id={`input-${corte.id}-parcial`}
                    type="text"
                    inputMode="decimal"
                    disabled={!corte.habilitado}
                    value={textos[keyParcial]}
                    onChange={(e) => manejarCambioTexto(corte.id, 'parcial', e.target.value)}
                    placeholder="0,0 - 5,0"
                    className={`w-full rounded-2xl border px-3.5 py-2 text-sm tabular-nums transition-colors focus:outline-none focus:ring-2 focus:ring-[#ebb21c] ${
                      !corte.habilitado
                        ? 'cursor-not-allowed border-black/5 bg-zinc-100 text-zinc-400 dark:border-white/5 dark:bg-white/[0.04] dark:text-zinc-500'
                        : errorParcial
                        ? 'border-amber-400 bg-amber-50/50 text-zinc-800 dark:border-amber-400/50 dark:bg-amber-500/10 dark:text-amber-100'
                        : 'border-black/10 bg-zinc-50/70 text-zinc-800 focus:bg-white dark:border-white/10 dark:bg-[#27272A] dark:text-zinc-100 dark:focus:bg-[#27272A]'
                    }`}
                  />
                  {errorParcial && (
                    <p className="mt-1 text-xs font-medium text-amber-800 dark:text-amber-300">
                      {errorParcial}
                    </p>
                  )}
                </div>
              </div>

              <div className="border-t border-black/5 bg-zinc-50/80 px-5 py-3.5 dark:border-white/10 dark:bg-white/[0.03]">
                {corte.cuentaParaCalculo ? (
                  <div className="space-y-1">
                    {escala === 'sobre5' ? (
                      <>
                        <div className="flex justify-between text-xs">
                          <span className="font-medium text-zinc-600 dark:text-[#A1A1AA]">
                            Nota del corte:
                          </span>
                          <span className="font-semibold tabular-nums text-zinc-900 dark:text-[#F4F4F5]">
                            {formatearConMaximo(corte.notaCorteSobre5, 5.0)}
                          </span>
                        </div>
                        <div className="flex justify-between text-xs text-zinc-600 dark:text-[#A1A1AA]">
                          <span>Aporte a la nota final:</span>
                          <span className="font-medium tabular-nums">
                            {formatearConMaximo(corte.aporteTotalCorte, maxAporteCorte)}
                          </span>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="flex justify-between text-xs">
                          <span className="font-medium text-zinc-600 dark:text-[#A1A1AA]">
                            Aporte a nota final:
                          </span>
                          <span className="font-semibold tabular-nums text-zinc-900 dark:text-[#F4F4F5]">
                            {formatearConMaximo(corte.aporteTotalCorte, maxAporteCorte)}
                          </span>
                        </div>
                        <div className="flex justify-between text-xs text-zinc-600 dark:text-[#A1A1AA]">
                          <span>Equivalente sobre 5,0:</span>
                          <span className="font-medium tabular-nums">
                            {formatearConMaximo(corte.notaCorteSobre5, 5.0)}
                          </span>
                        </div>
                      </>
                    )}
                  </div>
                ) : (
                  <p className="py-1 text-center text-xs italic text-zinc-600 dark:text-[#A1A1AA]">
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

      {/* Tarjeta de Resumen y Proyección */}
      <div className="bento-card space-y-6 p-6">
        <div className="flex flex-col gap-3 border-b border-black/5 pb-4 dark:border-white/10 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-lg font-semibold text-zinc-900 dark:text-[#F4F4F5]">
              Proyección de Rendimiento y Meta Aprobatoria
            </h3>
            <p className="mt-0.5 text-xs text-zinc-600 dark:text-[#A1A1AA]">
              Cálculo acumulativo sobre la nota mínima aprobatoria (3,0) · Precisión completa de 64
              bits.
            </p>
          </div>

          <button
            type="button"
            onClick={manejarRestablecer}
            className="pressable inline-flex items-center gap-1.5 self-start rounded-full bg-zinc-100 px-4 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-200 dark:bg-white/10 dark:text-zinc-200 dark:hover:bg-white/15 sm:self-auto focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-unipamplona-dorado"
          >
            <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Restablecer notas</span>
          </button>
        </div>

        <div className="rounded-3xl bg-zinc-50/80 p-5 dark:bg-white/[0.04]">
          {resultado.finalizado ? (
            <div className="space-y-3">
              <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
                <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                  Calificación definitiva de la asignatura
                </span>
                <span
                  className={`inline-flex items-center gap-1.5 self-start rounded-full border px-3 py-1 text-xs font-semibold sm:self-auto ${
                    resultado.haAprobado
                      ? 'border-emerald-300 bg-emerald-50 text-emerald-800 dark:border-emerald-400/30 dark:bg-emerald-500/15 dark:text-emerald-200'
                      : 'border-amber-300 bg-amber-50 text-amber-900 dark:border-orange-400/30 dark:bg-orange-500/15 dark:text-orange-200'
                  }`}
                >
                  <Award className="h-3.5 w-3.5" aria-hidden="true" />
                  {resultado.haAprobado ? 'Asignatura Aprobada' : 'Asignatura No Aprobada'}
                </span>
              </div>

              <div className="flex items-baseline gap-3">
                <span className="text-4xl font-bold tabular-nums text-zinc-900 dark:text-[#F4F4F5]">
                  {formatearConMaximo(resultado.aporteAcumulado, 5.0, true)}
                </span>
                <span className="text-xs text-zinc-600 dark:text-[#A1A1AA]">
                  (Mínimo aprobatorio institucional: 3,0)
                </span>
              </div>

              <p className="border-t border-black/5 pt-2.5 text-xs leading-relaxed text-zinc-700 dark:border-white/10 dark:text-zinc-300">
                {resultado.mensajeAcompanamiento}
              </p>
            </div>
          ) : resultado.yaAprobado ? (
            <div className="space-y-3">
              <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
                <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                  Estado de aprobación
                </span>
                <span className="inline-flex items-center gap-1.5 self-start rounded-full border border-emerald-300 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-800 dark:border-emerald-400/30 dark:bg-emerald-500/15 dark:text-emerald-200 sm:self-auto">
                  <CheckCircle2
                    className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-300"
                    aria-hidden="true"
                  />
                  Nota Mínima Aprobatoria Alcanzada
                </span>
              </div>

              <div className="flex items-baseline gap-3">
                <span className="text-3xl font-bold tabular-nums text-zinc-900 dark:text-[#F4F4F5]">
                  {formatearConMaximo(resultado.aporteAcumulado, 5.0, true)}
                </span>
                <span className="text-xs font-medium text-emerald-800 dark:text-emerald-300">
                  acumulado en {resultado.cortesCompletadosCount} corte(s)
                </span>
              </div>

              <p className="border-t border-black/5 pt-2.5 text-xs leading-relaxed text-zinc-700 dark:border-white/10 dark:text-zinc-300">
                {resultado.mensajeAcompanamiento}
              </p>
            </div>
          ) : !resultado.esPosibleAprobar ? (
            <div className="space-y-3">
              <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
                <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                  Situación de acompañamiento prioritario
                </span>
                <span className="inline-flex items-center gap-1.5 self-start rounded-full border border-amber-300 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-900 dark:border-orange-400/30 dark:bg-orange-500/15 dark:text-orange-200 sm:self-auto">
                  <AlertCircle
                    className="h-3.5 w-3.5 text-amber-700 dark:text-orange-300"
                    aria-hidden="true"
                  />
                  Meta Aprobatoria No Alcanzable
                </span>
              </div>

              <div>
                <span className="mb-1 block text-xs font-medium text-zinc-600 dark:text-[#A1A1AA]">
                  Máximo puntaje alcanzable (obteniendo 5,0 en lo restante):
                </span>
                <span className="text-3xl font-bold tabular-nums text-zinc-900 dark:text-[#F4F4F5]">
                  {formatearConMaximo(resultado.maximoAlcanzable, 5.0, true)}
                </span>
                <span className="ml-2 text-xs text-zinc-600 dark:text-[#A1A1AA]">
                  (requeriría un promedio de{' '}
                  {formatearNumero(resultado.promedioNecesarioSobre5 || 0)} sobre 5,0)
                </span>
              </div>

              <div className="mt-2 rounded-2xl border border-amber-200 bg-amber-50/80 p-3 dark:border-orange-400/30 dark:bg-orange-500/15">
                <p className="text-xs leading-relaxed text-amber-900 dark:text-orange-100">
                  {resultado.mensajeAcompanamiento}
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
                <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                  Promedio necesario para aprobar (Meta: 3,0)
                </span>
                <span className="inline-flex items-center gap-1.5 self-start rounded-full border border-black/10 bg-white px-3 py-1 text-xs font-semibold text-zinc-700 dark:border-white/10 dark:bg-[#27272A] dark:text-zinc-200 sm:self-auto">
                  <TrendingUp
                    className="h-3.5 w-3.5 text-zinc-600 dark:text-zinc-300"
                    aria-hidden="true"
                  />
                  {resultado.cortesCompletadosCount === 0
                    ? 'Sin notas registradas'
                    : `Restan ${(resultado.pesoRestante * 100).toFixed(0)} % por evaluar`}
                </span>
              </div>

              <div className="flex items-baseline gap-3">
                <span className="text-4xl font-bold tabular-nums text-zinc-900 dark:text-[#F4F4F5]">
                  {formatearConMaximo(resultado.promedioNecesarioSobre5, 5.0, true)}
                </span>
                <span className="text-xs font-medium text-zinc-600 dark:text-[#A1A1AA]">
                  promedio requerido en los cortes pendientes
                </span>
              </div>

              <p className="border-t border-black/5 pt-2.5 text-xs leading-relaxed text-zinc-700 dark:border-white/10 dark:text-zinc-300">
                {resultado.mensajeAcompanamiento}
              </p>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="flex items-start gap-3 rounded-2xl bg-zinc-50/70 p-4 dark:bg-white/[0.04]">
            <div className="mt-0.5 rounded-full bg-white p-2 text-zinc-600 shadow-2xs dark:bg-[#27272A] dark:text-zinc-300">
              <Layers className="h-4 w-4" aria-hidden="true" />
            </div>
            <div>
              <span className="block text-xs font-medium text-zinc-600 dark:text-[#A1A1AA]">
                Aporte acumulado a la nota final
              </span>
              <span className="text-base font-semibold tabular-nums text-zinc-900 dark:text-[#F4F4F5]">
                {escala === 'sobre5'
                  ? `${formatearNumero(resultado.aporteAcumulado, true)} de 5,0`
                  : `${formatearNumero(resultado.aporteAcumulado, true)} de ${(
                      resultado.pesoEvaluado * 5.0
                    )
                      .toFixed(2)
                      .replace('.', ',')}`}
              </span>
              <span className="mt-0.5 block text-xs text-zinc-600 dark:text-[#A1A1AA]">
                Evaluado hasta ahora: {(resultado.pesoEvaluado * 100).toFixed(0)} % de la materia
              </span>
            </div>
          </div>

          <div className="flex items-start gap-3 rounded-2xl bg-zinc-50/70 p-4 dark:bg-white/[0.04]">
            <div className="mt-0.5 rounded-full bg-white p-2 text-zinc-600 shadow-2xs dark:bg-[#27272A] dark:text-zinc-300">
              <TrendingUp className="h-4 w-4" aria-hidden="true" />
            </div>
            <div>
              <span className="block text-xs font-medium text-zinc-600 dark:text-[#A1A1AA]">
                Máximo puntaje alcanzable
              </span>
              <span className="text-base font-semibold tabular-nums text-zinc-900 dark:text-[#F4F4F5]">
                {formatearConMaximo(resultado.maximoAlcanzable, 5.0, true)}
              </span>
              <span className="mt-0.5 block text-xs text-zinc-600 dark:text-[#A1A1AA]">
                Asumiendo 5,0 en el {(resultado.pesoRestante * 100).toFixed(0)} % restante
              </span>
            </div>
          </div>
        </div>

        <AvisoEtico />
      </div>
    </div>
  )
}
