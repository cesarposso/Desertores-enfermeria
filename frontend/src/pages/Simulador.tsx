import { useState, useRef } from 'react'
import { LayoutGroup, motion } from 'motion/react'
import {
  simularRiesgo,
  nivelRiesgoClase,
  nivelRiesgoEtiqueta,
} from '../api/cliente'
import type {
  SimuladorInput,
  SimuladorOutput,
  NivelRiesgo,
} from '../api/cliente'
import CargandoSpinner from '../components/CargandoSpinner'
import ErrorCartel from '../components/ErrorCartel'
import AvisoEtico from '../components/AvisoEtico'
import NotasPorCorte from '../components/NotasPorCorte'
import MedidorVelocimetro from '../components/MedidorVelocimetro'
import {
  Calculator,
  RotateCcw,
  Sparkles,
  BookOpen,
  HeartHandshake,
  Activity,
  AlertCircle,
  TrendingUp,
} from 'lucide-react'

const ASIGNATURAS = [
  'Fisiología Humana',
  'Farmacología Clínica',
  'Anatomía Humana',
  'Bioquímica Médica',
  'Microbiología y Parasitología',
  'Cuidado Básico de Enfermería',
]

const VALORES_DEFECTO: SimuladorInput = {
  asignatura: 'Fisiología Humana',
  nota_primer_parcial: 3.2,
  promedio_acumulado_cortes: 3.4,
  asistencia_pct: 85,
  repitente: 0,
  semestre: 3,
  carga_percibida: 3.0,
  horas_estudio_semana: 14,
  horas_sueno: 7.0,
  apoyo_economico_familiar: 1,
  trabajo_remunerado: 0,
  intencion_seguir: 1,
}

const INPUT_CLASE =
  'w-full rounded-2xl border border-black/10 bg-zinc-50/70 px-3.5 py-2 text-sm text-zinc-800 transition-colors focus:border-unipamplona-rojo focus:bg-white focus:outline-none focus:ring-2 focus:ring-unipamplona-dorado dark:border-white/10 dark:bg-[#27272A] dark:text-zinc-100 dark:focus:bg-[#27272A]'

export default function Simulador() {
  const [valores, setValores] = useState<SimuladorInput>(VALORES_DEFECTO)
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [resultado, setResultado] = useState<SimuladorOutput | null>(null)

  const [tabActiva, setTabActiva] = useState<'riesgo' | 'notas'>('riesgo')
  const tabRiesgoRef = useRef<HTMLButtonElement>(null)
  const tabNotasRef = useRef<HTMLButtonElement>(null)

  const handleTabKeyDown = (e: React.KeyboardEvent, tabActual: 'riesgo' | 'notas') => {
    if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
      e.preventDefault()
      if (tabActual === 'riesgo') {
        setTabActiva('notas')
        tabNotasRef.current?.focus()
      } else {
        setTabActiva('riesgo')
        tabRiesgoRef.current?.focus()
      }
    } else if (e.key === 'Home') {
      e.preventDefault()
      setTabActiva('riesgo')
      tabRiesgoRef.current?.focus()
    } else if (e.key === 'End') {
      e.preventDefault()
      setTabActiva('notas')
      tabNotasRef.current?.focus()
    }
  }

  const actualizarCampo = <K extends keyof SimuladorInput>(
    campo: K,
    valor: SimuladorInput[K],
  ) => {
    setValores((prev) => ({ ...prev, [campo]: valor }))
  }

  const erroresValidacion: Partial<Record<keyof SimuladorInput, string>> = {}
  if (valores.nota_primer_parcial < 0 || valores.nota_primer_parcial > 5) {
    erroresValidacion.nota_primer_parcial = 'Debe estar entre 0.0 y 5.0'
  }
  if (valores.promedio_acumulado_cortes < 0 || valores.promedio_acumulado_cortes > 5) {
    erroresValidacion.promedio_acumulado_cortes = 'Debe estar entre 0.0 y 5.0'
  }
  if (valores.asistencia_pct < 0 || valores.asistencia_pct > 100) {
    erroresValidacion.asistencia_pct = 'Debe estar entre 0% y 100%'
  }
  if (valores.semestre < 1 || valores.semestre > 10) {
    erroresValidacion.semestre = 'Semestre entre 1 y 10'
  }
  if (valores.carga_percibida < 1 || valores.carga_percibida > 5) {
    erroresValidacion.carga_percibida = 'Escala de 1.0 a 5.0'
  }
  if (valores.horas_estudio_semana < 0 || valores.horas_estudio_semana > 60) {
    erroresValidacion.horas_estudio_semana = 'Entre 0 y 60 horas'
  }
  if (valores.horas_sueno < 0 || valores.horas_sueno > 24) {
    erroresValidacion.horas_sueno = 'Entre 0 y 24 horas'
  }

  const hayErrores = Object.keys(erroresValidacion).length > 0

  const handleSimular = async (e: React.FormEvent) => {
    e.preventDefault()
    if (hayErrores) return

    try {
      setCargando(true)
      setError(null)
      const res = await simularRiesgo(valores)
      setResultado(res)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al procesar la simulación'
      setError(msg)
    } finally {
      setCargando(false)
    }
  }

  const handleRestablecer = () => {
    setValores(VALORES_DEFECTO)
    setResultado(null)
    setError(null)
  }

  return (
    <div className="space-y-6">
      {/* Encabezado + píldora segmentada */}
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-zinc-900 dark:text-[#F4F4F5]">
            Simulador Interactivo de Acompañamiento
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-zinc-600 dark:text-[#A1A1AA]">
            Ajuste las 11 variables socioacadémicas para estimar la probabilidad orientadora de
            deserción y descomponer los factores que más inciden · Universidad de Pamplona.
          </p>
        </div>

        {/* Pestañas en isla flotante con inversión en modo oscuro */}
        <LayoutGroup id="simulador-tabs">
          <div
            role="tablist"
            aria-label="Herramientas del Simulador Académico"
            className="inline-flex self-start rounded-full border border-black/5 bg-white px-2 py-1.5 shadow-xs dark:border-white/10 dark:bg-[#18181B]"
          >
            <button
              ref={tabRiesgoRef}
              id="tab-riesgo"
              type="button"
              role="tab"
              aria-selected={tabActiva === 'riesgo'}
              aria-controls="panel-riesgo"
              tabIndex={tabActiva === 'riesgo' ? 0 : -1}
              onClick={() => setTabActiva('riesgo')}
              onKeyDown={(e) => handleTabKeyDown(e, 'riesgo')}
              className={`pressable relative inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-medium whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-unipamplona-dorado ${
                tabActiva === 'riesgo'
                  ? 'text-white dark:text-[#18181B]'
                  : 'text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100'
              }`}
            >
              {tabActiva === 'riesgo' && (
                <motion.span
                  layoutId="simulador-tab-activa"
                  transition={{ type: 'spring', duration: 0.3, bounce: 0.12 }}
                  className="absolute inset-0 rounded-full bg-[#18181B] dark:bg-white"
                  aria-hidden="true"
                />
              )}
              <Activity className="relative z-10 h-3.5 w-3.5" aria-hidden="true" />
              <span className="relative z-10">Simulador de Riesgo ML</span>
            </button>

            <button
              ref={tabNotasRef}
              id="tab-notas"
              type="button"
              role="tab"
              aria-selected={tabActiva === 'notas'}
              aria-controls="panel-notas"
              tabIndex={tabActiva === 'notas' ? 0 : -1}
              onClick={() => setTabActiva('notas')}
              onKeyDown={(e) => handleTabKeyDown(e, 'notas')}
              className={`pressable relative inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-medium whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-unipamplona-dorado ${
                tabActiva === 'notas'
                  ? 'text-white dark:text-[#18181B]'
                  : 'text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100'
              }`}
            >
              {tabActiva === 'notas' && (
                <motion.span
                  layoutId="simulador-tab-activa"
                  transition={{ type: 'spring', duration: 0.3, bounce: 0.12 }}
                  className="absolute inset-0 rounded-full bg-[#18181B] dark:bg-white"
                  aria-hidden="true"
                />
              )}
              <Calculator className="relative z-10 h-3.5 w-3.5" aria-hidden="true" />
              <span className="relative z-10">Notas por Corte</span>
            </button>
          </div>
        </LayoutGroup>
      </div>

      {/* Pestaña 1: Simulador de Riesgo ML */}
      <div
        id="panel-riesgo"
        role="tabpanel"
        aria-labelledby="tab-riesgo"
        hidden={tabActiva !== 'riesgo'}
        className={tabActiva !== 'riesgo' ? 'hidden' : 'space-y-6'}
      >
        <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-12">
          {/* Formulario */}
          <form onSubmit={handleSimular} className="bento-card space-y-6 p-6 lg:col-span-7">
            <div>
              <div className="flex items-center gap-2 border-b border-black/5 pb-2.5 dark:border-white/10">
                <BookOpen className="h-4 w-4 text-unipamplona-rojo" aria-hidden="true" />
                <h2 className="text-base font-semibold text-zinc-900 dark:text-[#F4F4F5]">
                  Dimensión Académica y Asignatura
                </h2>
              </div>

              <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label
                    htmlFor="sim-asignatura"
                    className="mb-1.5 block text-xs font-medium text-zinc-700 dark:text-zinc-300"
                  >
                    Asignatura de Enfermería
                  </label>
                  <select
                    id="sim-asignatura"
                    value={valores.asignatura}
                    onChange={(e) => actualizarCampo('asignatura', e.target.value)}
                    className={INPUT_CLASE}
                  >
                    {ASIGNATURAS.map((asig) => (
                      <option key={asig} value={asig}>
                        {asig}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="sim-semestre"
                    className="mb-1.5 block text-xs font-medium text-zinc-700 dark:text-zinc-300"
                  >
                    Semestre actual (1 a 10)
                  </label>
                  <input
                    id="sim-semestre"
                    type="number"
                    min="1"
                    max="10"
                    value={valores.semestre}
                    onChange={(e) => actualizarCampo('semestre', parseInt(e.target.value) || 1)}
                    className={`${INPUT_CLASE} tabular-nums`}
                  />
                  {erroresValidacion.semestre && (
                    <p className="mt-1 text-xs text-amber-800 dark:text-amber-300">
                      {erroresValidacion.semestre}
                    </p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="sim-repitente"
                    className="mb-1.5 block text-xs font-medium text-zinc-700 dark:text-zinc-300"
                  >
                    ¿Es repitente en la asignatura?
                  </label>
                  <select
                    id="sim-repitente"
                    value={valores.repitente}
                    onChange={(e) => actualizarCampo('repitente', parseInt(e.target.value))}
                    className={INPUT_CLASE}
                  >
                    <option value={0}>No (Primera matrícula)</option>
                    <option value={1}>Sí (Repitente)</option>
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="sim-parcial"
                    className="mb-1.5 block text-xs font-medium text-zinc-700 dark:text-zinc-300"
                  >
                    Nota del primer parcial (0.0 - 5.0)
                  </label>
                  <input
                    id="sim-parcial"
                    type="number"
                    step="0.1"
                    min="0"
                    max="5"
                    value={valores.nota_primer_parcial}
                    onChange={(e) =>
                      actualizarCampo('nota_primer_parcial', parseFloat(e.target.value) || 0)
                    }
                    className={`${INPUT_CLASE} tabular-nums`}
                  />
                  {erroresValidacion.nota_primer_parcial && (
                    <p className="mt-1 text-xs text-amber-800 dark:text-amber-300">
                      {erroresValidacion.nota_primer_parcial}
                    </p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="sim-acumulado"
                    className="mb-1.5 block text-xs font-medium text-zinc-700 dark:text-zinc-300"
                  >
                    Promedio acumulado de cortes (0.0 - 5.0)
                  </label>
                  <input
                    id="sim-acumulado"
                    type="number"
                    step="0.1"
                    min="0"
                    max="5"
                    value={valores.promedio_acumulado_cortes}
                    onChange={(e) =>
                      actualizarCampo('promedio_acumulado_cortes', parseFloat(e.target.value) || 0)
                    }
                    className={`${INPUT_CLASE} tabular-nums`}
                  />
                  {erroresValidacion.promedio_acumulado_cortes && (
                    <p className="mt-1 text-xs text-amber-800 dark:text-amber-300">
                      {erroresValidacion.promedio_acumulado_cortes}
                    </p>
                  )}
                </div>

                <div className="sm:col-span-2">
                  <div className="mb-1.5 flex items-center justify-between">
                    <label
                      htmlFor="sim-asistencia"
                      className="text-xs font-medium text-zinc-700 dark:text-zinc-300"
                    >
                      Porcentaje de asistencia a clases
                    </label>
                    <span className="rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs font-semibold tabular-nums text-zinc-900 dark:bg-white/10 dark:text-zinc-100">
                      {valores.asistencia_pct}%
                    </span>
                  </div>
                  <input
                    id="sim-asistencia"
                    type="range"
                    min="0"
                    max="100"
                    step="1"
                    value={valores.asistencia_pct}
                    onChange={(e) =>
                      actualizarCampo('asistencia_pct', parseInt(e.target.value) || 0)
                    }
                    className="w-full accent-unipamplona-rojo"
                  />
                </div>
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2 border-b border-black/5 pb-2.5 dark:border-white/10">
                <Activity className="h-4 w-4 text-unipamplona-rojo" aria-hidden="true" />
                <h2 className="text-base font-semibold text-zinc-900 dark:text-[#F4F4F5]">
                  Esfuerzo, Descanso y Sobrecarga
                </h2>
              </div>

              <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div>
                  <label
                    htmlFor="sim-carga"
                    className="mb-1.5 block text-xs font-medium text-zinc-700 dark:text-zinc-300"
                  >
                    Carga percibida (1.0 - 5.0)
                  </label>
                  <input
                    id="sim-carga"
                    type="number"
                    step="0.5"
                    min="1"
                    max="5"
                    value={valores.carga_percibida}
                    onChange={(e) =>
                      actualizarCampo('carga_percibida', parseFloat(e.target.value) || 1)
                    }
                    className={`${INPUT_CLASE} tabular-nums`}
                  />
                  {erroresValidacion.carga_percibida && (
                    <p className="mt-1 text-xs text-amber-800 dark:text-amber-300">
                      {erroresValidacion.carga_percibida}
                    </p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="sim-estudio"
                    className="mb-1.5 block text-xs font-medium text-zinc-700 dark:text-zinc-300"
                  >
                    Estudio autónomo (h/sem)
                  </label>
                  <input
                    id="sim-estudio"
                    type="number"
                    min="0"
                    max="60"
                    value={valores.horas_estudio_semana}
                    onChange={(e) =>
                      actualizarCampo('horas_estudio_semana', parseFloat(e.target.value) || 0)
                    }
                    className={`${INPUT_CLASE} tabular-nums`}
                  />
                  {erroresValidacion.horas_estudio_semana && (
                    <p className="mt-1 text-xs text-amber-800 dark:text-amber-300">
                      {erroresValidacion.horas_estudio_semana}
                    </p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="sim-sueno"
                    className="mb-1.5 block text-xs font-medium text-zinc-700 dark:text-zinc-300"
                  >
                    Horas de sueño diario
                  </label>
                  <input
                    id="sim-sueno"
                    type="number"
                    step="0.5"
                    min="0"
                    max="24"
                    value={valores.horas_sueno}
                    onChange={(e) =>
                      actualizarCampo('horas_sueno', parseFloat(e.target.value) || 0)
                    }
                    className={`${INPUT_CLASE} tabular-nums`}
                  />
                  {erroresValidacion.horas_sueno && (
                    <p className="mt-1 text-xs text-amber-800 dark:text-amber-300">
                      {erroresValidacion.horas_sueno}
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2 border-b border-black/5 pb-2.5 dark:border-white/10">
                <HeartHandshake className="h-4 w-4 text-unipamplona-rojo" aria-hidden="true" />
                <h2 className="text-base font-semibold text-zinc-900 dark:text-[#F4F4F5]">
                  Entorno Sociofamiliar y Compromiso
                </h2>
              </div>

              <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div>
                  <label
                    htmlFor="sim-apoyo"
                    className="mb-1.5 block text-xs font-medium text-zinc-700 dark:text-zinc-300"
                  >
                    Apoyo económico / familiar
                  </label>
                  <select
                    id="sim-apoyo"
                    value={valores.apoyo_economico_familiar}
                    onChange={(e) =>
                      actualizarCampo('apoyo_economico_familiar', parseInt(e.target.value))
                    }
                    className={INPUT_CLASE}
                  >
                    <option value={1}>Sí (Cuenta con apoyo)</option>
                    <option value={0}>No (Sin red de apoyo)</option>
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="sim-trabajo"
                    className="mb-1.5 block text-xs font-medium text-zinc-700 dark:text-zinc-300"
                  >
                    Trabajo remunerado
                  </label>
                  <select
                    id="sim-trabajo"
                    value={valores.trabajo_remunerado}
                    onChange={(e) =>
                      actualizarCampo('trabajo_remunerado', parseInt(e.target.value))
                    }
                    className={INPUT_CLASE}
                  >
                    <option value={0}>No labora</option>
                    <option value={1}>Sí labora paralelamente</option>
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="sim-intencion"
                    className="mb-1.5 block text-xs font-medium text-zinc-700 dark:text-zinc-300"
                  >
                    Intención de continuar
                  </label>
                  <select
                    id="sim-intencion"
                    value={valores.intencion_seguir}
                    onChange={(e) =>
                      actualizarCampo('intencion_seguir', parseInt(e.target.value))
                    }
                    className={INPUT_CLASE}
                  >
                    <option value={1}>Firme (Desea graduarse)</option>
                    <option value={0}>En duda / Desmotivación</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-black/5 pt-4 dark:border-white/10">
              <button
                type="button"
                onClick={handleRestablecer}
                className="pressable inline-flex items-center gap-1.5 rounded-full bg-zinc-100 px-4 py-2 text-xs font-medium text-zinc-700 hover:bg-zinc-200 dark:bg-white/10 dark:text-zinc-200 dark:hover:bg-white/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-unipamplona-dorado"
              >
                <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Restablecer valores</span>
              </button>

              <button
                type="submit"
                disabled={cargando || hayErrores}
                className="pressable inline-flex items-center gap-2 rounded-full bg-unipamplona-rojo px-6 py-2.5 text-sm font-medium text-white shadow-xs hover:bg-[#962929] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-unipamplona-dorado disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Calculator className="h-4 w-4" aria-hidden="true" />
                <span>{cargando ? 'Calculando...' : 'Simular riesgo de deserción'}</span>
              </button>
            </div>
          </form>

          {/* Panel de Diagnóstico */}
          <div className="space-y-5 lg:col-span-5">
            {cargando && (
              <CargandoSpinner mensaje="El modelo Bosque Aleatorio está analizando las variables..." />
            )}

            {error && <ErrorCartel mensaje={error} />}

            {!cargando && !resultado && !error && (
              <div className="bento-card p-8 text-center text-zinc-600 dark:text-[#A1A1AA]">
                <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-zinc-100 text-zinc-600 dark:bg-white/10 dark:text-zinc-300">
                  <Sparkles className="h-5 w-5" aria-hidden="true" />
                </span>
                <h2 className="mt-4 text-base font-semibold text-zinc-900 dark:text-[#F4F4F5]">
                  Listo para simular
                </h2>
                <p className="mx-auto mt-1.5 max-w-xs text-xs leading-relaxed text-zinc-600 dark:text-[#A1A1AA]">
                  Modifique los parámetros deseados a la izquierda y presione{' '}
                  <strong className="text-zinc-900 dark:text-zinc-100">
                    "Simular riesgo de deserción"
                  </strong>{' '}
                  para obtener la predicción orientadora.
                </p>
              </div>
            )}

            {!cargando && resultado && (
              <div className="bento-card space-y-5 p-6">
                <div className="flex items-center justify-between gap-2 border-b border-black/5 pb-3.5 dark:border-white/10">
                  <div>
                    <h2 className="text-base font-semibold text-zinc-900 dark:text-[#F4F4F5]">
                      Diagnóstico Predictivo (ML)
                    </h2>
                    <p className="text-xs text-zinc-600 dark:text-[#A1A1AA]">
                      Bosque Aleatorio · Tree Path
                    </p>
                  </div>
                  <span
                    className={`rounded-full border px-3 py-1 text-xs font-semibold ${nivelRiesgoClase(
                      resultado.nivel_riesgo as NivelRiesgo,
                    )}`}
                  >
                    {nivelRiesgoEtiqueta(resultado.nivel_riesgo as NivelRiesgo)}
                  </span>
                </div>

                <MedidorVelocimetro
                  porcentaje={resultado.probabilidad_riesgo}
                  nivel={resultado.nivel_riesgo}
                  etiquetaSecundaria="probabilidad orientadora ML"
                  tamano="md"
                  mostrarDecimales
                  ariaLabel={`Probabilidad orientadora ML: ${resultado.probabilidad_riesgo.toFixed(1)}%`}
                />

                <div className="rounded-2xl bg-zinc-50 p-3.5 dark:bg-white/[0.04]">
                  <div className="flex items-start gap-2.5">
                    <AlertCircle
                      className="mt-0.5 h-4 w-4 shrink-0 text-zinc-700 dark:text-zinc-300"
                      aria-hidden="true"
                    />
                    <p className="text-xs leading-relaxed text-zinc-700 dark:text-zinc-300">
                      {resultado.mensaje_orientador}
                    </p>
                  </div>
                </div>

                <div>
                  <div className="mb-2.5 flex items-center gap-2">
                    <TrendingUp
                      className="h-4 w-4 text-zinc-700 dark:text-zinc-300"
                      aria-hidden="true"
                    />
                    <h3 className="text-sm font-semibold text-zinc-900 dark:text-[#F4F4F5]">
                      Factores que más pesan
                    </h3>
                  </div>

                  {resultado.factores_criticos && resultado.factores_criticos.length > 0 ? (
                    <div className="space-y-2.5">
                      {resultado.factores_criticos.map((fc, idx) => (
                        <div
                          key={idx}
                          className="space-y-1.5 rounded-2xl bg-zinc-50/80 p-3 text-xs dark:bg-white/[0.04]"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-medium text-zinc-800 dark:text-zinc-200">
                              {fc.descripcion}
                            </span>
                            <span className="shrink-0 text-xs font-semibold tabular-nums text-zinc-700 dark:text-zinc-300">
                              {fc.impacto_pct.toFixed(1)}% impacto
                            </span>
                          </div>
                          <div className="h-1.5 w-full overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800">
                            <div
                              className="h-full rounded-full bg-[#D96B43]"
                              style={{ width: `${Math.min(100, Math.max(5, fc.impacto_pct))}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs italic text-zinc-600 dark:text-[#A1A1AA]">
                      Las variables se encuentran en rangos equilibrados de estabilidad.
                    </p>
                  )}
                </div>
              </div>
            )}

            {!cargando && resultado?.evaluacion_difusa && (
              <div className="bento-card space-y-5 border-teal-200/80 p-6 dark:border-teal-400/25">
                <div className="flex items-start justify-between gap-3 border-b border-black/5 pb-3.5 dark:border-white/10">
                  <div>
                    <h2 className="text-base font-semibold text-zinc-900 dark:text-[#F4F4F5]">
                      Evaluación por Reglas Difusas
                    </h2>
                    <p className="mt-0.5 text-xs text-zinc-600 dark:text-[#A1A1AA]">
                      Inferencia Mamdani · Conocimiento experto
                    </p>
                  </div>
                  <span
                    className={`shrink-0 rounded-full border px-3 py-1 text-xs font-semibold ${nivelRiesgoClase(
                      resultado.evaluacion_difusa.nivel_riesgo,
                    )}`}
                  >
                    {nivelRiesgoEtiqueta(resultado.evaluacion_difusa.nivel_riesgo)}
                  </span>
                </div>

                <MedidorVelocimetro
                  porcentaje={resultado.evaluacion_difusa.probabilidad_difusa}
                  nivel={resultado.evaluacion_difusa.nivel_riesgo}
                  etiquetaSecundaria="índice orientador difuso"
                  tamano="md"
                  mostrarDecimales
                  ariaLabel={`Índice orientador difuso: ${resultado.evaluacion_difusa.probabilidad_difusa.toFixed(1)}%`}
                />

                <div>
                  <h3 className="mb-2.5 text-sm font-semibold text-zinc-900 dark:text-[#F4F4F5]">
                    Reglas SI–ENTONCES activadas
                  </h3>
                  {resultado.evaluacion_difusa.reglas_activas.length > 0 ? (
                    <div className="space-y-2.5">
                      {resultado.evaluacion_difusa.reglas_activas.map((regla) => (
                        <div
                          key={regla.id}
                          className="space-y-1.5 rounded-2xl bg-zinc-50/80 p-3 text-xs dark:bg-white/[0.04]"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <span className="rounded-full border border-teal-200 bg-teal-50 px-2 py-0.5 text-xs font-semibold tabular-nums text-teal-800 dark:border-teal-400/30 dark:bg-teal-500/15 dark:text-teal-200">
                                {regla.id}
                              </span>
                              <span className="text-xs font-medium text-zinc-600 dark:text-zinc-300">
                                {nivelRiesgoEtiqueta(regla.consecuente)}
                              </span>
                            </div>
                            <span className="text-xs font-semibold tabular-nums text-zinc-700 dark:text-zinc-300">
                              α = {regla.activacion.toFixed(2)} (
                              {Math.round(regla.activacion * 100)}%)
                            </span>
                          </div>
                          <div className="h-1.5 w-full overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800">
                            <div
                              className="h-full rounded-full bg-teal-600"
                              style={{
                                width: `${Math.min(100, Math.max(4, regla.activacion * 100))}%`,
                              }}
                            />
                          </div>
                          <p className="leading-relaxed text-zinc-700 dark:text-zinc-300">
                            {regla.descripcion}
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-zinc-600 dark:text-[#A1A1AA]">
                      Ninguna regla alcanzó un grado de activación significativo para este perfil.
                    </p>
                  )}
                </div>
              </div>
            )}

            <AvisoEtico />
          </div>
        </div>
      </div>

      {/* Pestaña 2: Notas por Corte */}
      <div
        id="panel-notas"
        role="tabpanel"
        aria-labelledby="tab-notas"
        hidden={tabActiva !== 'notas'}
        className={tabActiva !== 'notas' ? 'hidden' : 'space-y-6'}
      >
        <NotasPorCorte />
      </div>
    </div>
  )
}
