import { useState, useRef } from 'react'
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

export default function Simulador() {
  const [valores, setValores] = useState<SimuladorInput>(VALORES_DEFECTO)
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [resultado, setResultado] = useState<SimuladorOutput | null>(null)

  // Control de pestañas accesibles (WAI-ARIA)
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

  // Validación de rangos
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
      {/* Encabezado */}
      <div>
        <h1 className="text-2xl font-semibold text-slate-800">
          Simulador Interactivo de Acompañamiento
        </h1>
        <p className="text-sm text-slate-600 mt-1">
          Ajuste las 11 variables socioacadémicas para estimar la probabilidad orientadora de deserción y
          descomponer los factores que más inciden en el estudiante · Universidad de Pamplona.
        </p>
      </div>

      {/* Pestañas de Navegación Accesibles (WAI-ARIA: tablist / tab / tabpanel con navegación por flechas) */}
      <div className="border-b border-slate-200">
        <div
          role="tablist"
          aria-label="Herramientas del Simulador Académico"
          className="-mb-px flex space-x-6"
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
            className={`inline-flex items-center gap-2 border-b-2 py-3 px-1 text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-unipamplona-dorado ${
              tabActiva === 'riesgo'
                ? 'border-unipamplona-rojo text-unipamplona-rojo font-semibold'
                : 'border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-700'
            }`}
          >
            <Activity className="h-4 w-4" />
            Simulador de Riesgo ML
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
            className={`inline-flex items-center gap-2 border-b-2 py-3 px-1 text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-unipamplona-dorado ${
              tabActiva === 'notas'
                ? 'border-unipamplona-rojo text-unipamplona-rojo font-semibold'
                : 'border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-700'
            }`}
          >
            <Calculator className="h-4 w-4" />
            Notas por Corte
          </button>
        </div>
      </div>

      {/* Contenido de Pestaña 1: Simulador de Riesgo ML */}
      <div
        id="panel-riesgo"
        role="tabpanel"
        aria-labelledby="tab-riesgo"
        hidden={tabActiva !== 'riesgo'}
        className={tabActiva !== 'riesgo' ? 'hidden' : 'space-y-6'}
      >
        {/* Layout de 2 columnas: Formulario y Panel de Resultados */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 items-start">
        {/* Columna Izquierda: Formulario (7 columnas en desktop) */}
        <form
          onSubmit={handleSimular}
          className="space-y-5 rounded-lg border border-slate-200 bg-white p-5 lg:col-span-7"
        >
          {/* Dimensión 1: Datos Curriculares y Calificaciones */}
          <div>
            <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
              <BookOpen className="h-4 w-4 text-unipamplona-rojo" />
              <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-700">
                1. Dimensión Académica y Asignatura
              </h2>
            </div>

            <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2">
              {/* Asignatura */}
              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Asignatura de Enfermería
                </label>
                <select
                  value={valores.asignatura}
                  onChange={(e) => actualizarCampo('asignatura', e.target.value)}
                  className="w-full rounded border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 focus:border-unipamplona-rojo focus:outline-none focus:ring-1 focus:ring-unipamplona-rojo"
                >
                  {ASIGNATURAS.map((asig) => (
                    <option key={asig} value={asig}>
                      {asig}
                    </option>
                  ))}
                </select>
              </div>

              {/* Semestre */}
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Semestre Actual (1 a 10)
                </label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={valores.semestre}
                  onChange={(e) => actualizarCampo('semestre', parseInt(e.target.value) || 1)}
                  className="w-full rounded border border-slate-300 px-3 py-2 text-sm tabular-nums text-slate-800 focus:border-unipamplona-rojo focus:outline-none focus:ring-1 focus:ring-unipamplona-rojo"
                />
                {erroresValidacion.semestre && (
                  <p className="mt-1 text-xs text-amber-700">{erroresValidacion.semestre}</p>
                )}
              </div>

              {/* Condición de Repitente */}
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  ¿Es Repitente en la Asignatura?
                </label>
                <select
                  value={valores.repitente}
                  onChange={(e) => actualizarCampo('repitente', parseInt(e.target.value))}
                  className="w-full rounded border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 focus:border-unipamplona-rojo focus:outline-none focus:ring-1 focus:ring-unipamplona-rojo"
                >
                  <option value={0}>No (Primera matrícula)</option>
                  <option value={1}>Sí (Repitente)</option>
                </select>
              </div>

              {/* Nota del Primer Parcial */}
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Nota del Primer Parcial (0.0 - 5.0)
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="5"
                  value={valores.nota_primer_parcial}
                  onChange={(e) =>
                    actualizarCampo('nota_primer_parcial', parseFloat(e.target.value) || 0)
                  }
                  className="w-full rounded border border-slate-300 px-3 py-2 text-sm tabular-nums text-slate-800 focus:border-unipamplona-rojo focus:outline-none focus:ring-1 focus:ring-unipamplona-rojo"
                />
                {erroresValidacion.nota_primer_parcial && (
                  <p className="mt-1 text-xs text-amber-700">{erroresValidacion.nota_primer_parcial}</p>
                )}
              </div>

              {/* Promedio Acumulado de Cortes */}
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Promedio Acumulado de Cortes (0.0 - 5.0)
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="5"
                  value={valores.promedio_acumulado_cortes}
                  onChange={(e) =>
                    actualizarCampo('promedio_acumulado_cortes', parseFloat(e.target.value) || 0)
                  }
                  className="w-full rounded border border-slate-300 px-3 py-2 text-sm tabular-nums text-slate-800 focus:border-unipamplona-rojo focus:outline-none focus:ring-1 focus:ring-unipamplona-rojo"
                />
                {erroresValidacion.promedio_acumulado_cortes && (
                  <p className="mt-1 text-xs text-amber-700">
                    {erroresValidacion.promedio_acumulado_cortes}
                  </p>
                )}
              </div>

              {/* Asistencia (%) */}
              <div className="sm:col-span-2">
                <div className="flex justify-between items-center mb-1">
                  <label className="text-xs font-medium text-slate-700">
                    Porcentaje de Asistencia a Clases
                  </label>
                  <span className="text-xs font-semibold tabular-nums text-slate-800">
                    {valores.asistencia_pct}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="1"
                  value={valores.asistencia_pct}
                  onChange={(e) => actualizarCampo('asistencia_pct', parseInt(e.target.value) || 0)}
                  className="w-full accent-unipamplona-rojo"
                />
              </div>
            </div>
          </div>

          {/* Dimensión 2: Carga, Dedicación y Descanso */}
          <div>
            <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
              <Activity className="h-4 w-4 text-unipamplona-rojo" />
              <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-700">
                2. Esfuerzo, Descanso y Sobrecarga
              </h2>
            </div>

            <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-3">
              {/* Carga Percibida (1 a 5) */}
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Carga Percibida (1.0 - 5.0)
                </label>
                <input
                  type="number"
                  step="0.5"
                  min="1"
                  max="5"
                  value={valores.carga_percibida}
                  onChange={(e) =>
                    actualizarCampo('carga_percibida', parseFloat(e.target.value) || 1)
                  }
                  className="w-full rounded border border-slate-300 px-3 py-2 text-sm tabular-nums text-slate-800 focus:border-unipamplona-rojo focus:outline-none focus:ring-1 focus:ring-unipamplona-rojo"
                />
                {erroresValidacion.carga_percibida && (
                  <p className="mt-1 text-xs text-amber-700">{erroresValidacion.carga_percibida}</p>
                )}
              </div>

              {/* Horas de Estudio Semana */}
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Horas Estudio Autónomo / Sem
                </label>
                <input
                  type="number"
                  min="0"
                  max="60"
                  value={valores.horas_estudio_semana}
                  onChange={(e) =>
                    actualizarCampo('horas_estudio_semana', parseFloat(e.target.value) || 0)
                  }
                  className="w-full rounded border border-slate-300 px-3 py-2 text-sm tabular-nums text-slate-800 focus:border-unipamplona-rojo focus:outline-none focus:ring-1 focus:ring-unipamplona-rojo"
                />
                {erroresValidacion.horas_estudio_semana && (
                  <p className="mt-1 text-xs text-amber-700">
                    {erroresValidacion.horas_estudio_semana}
                  </p>
                )}
              </div>

              {/* Horas de Sueño */}
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Horas de Sueño Diario
                </label>
                <input
                  type="number"
                  step="0.5"
                  min="0"
                  max="24"
                  value={valores.horas_sueno}
                  onChange={(e) => actualizarCampo('horas_sueno', parseFloat(e.target.value) || 0)}
                  className="w-full rounded border border-slate-300 px-3 py-2 text-sm tabular-nums text-slate-800 focus:border-unipamplona-rojo focus:outline-none focus:ring-1 focus:ring-unipamplona-rojo"
                />
                {erroresValidacion.horas_sueno && (
                  <p className="mt-1 text-xs text-amber-700">{erroresValidacion.horas_sueno}</p>
                )}
              </div>
            </div>
          </div>

          {/* Dimensión 3: Apoyo y Situación Laboral */}
          <div>
            <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
              <HeartHandshake className="h-4 w-4 text-unipamplona-rojo" />
              <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-700">
                3. Entorno Sociofamiliar y Compromiso
              </h2>
            </div>

            <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-3">
              {/* Apoyo Económico y Familiar */}
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Apoyo Económico / Familiar
                </label>
                <select
                  value={valores.apoyo_economico_familiar}
                  onChange={(e) =>
                    actualizarCampo('apoyo_economico_familiar', parseInt(e.target.value))
                  }
                  className="w-full rounded border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 focus:border-unipamplona-rojo focus:outline-none focus:ring-1 focus:ring-unipamplona-rojo"
                >
                  <option value={1}>Sí (Cuenta con apoyo)</option>
                  <option value={0}>No (Sin red de apoyo)</option>
                </select>
              </div>

              {/* Trabajo Remunerado */}
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Trabajo Remunerado
                </label>
                <select
                  value={valores.trabajo_remunerado}
                  onChange={(e) => actualizarCampo('trabajo_remunerado', parseInt(e.target.value))}
                  className="w-full rounded border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 focus:border-unipamplona-rojo focus:outline-none focus:ring-1 focus:ring-unipamplona-rojo"
                >
                  <option value={0}>No labora</option>
                  <option value={1}>Sí labora paralelamente</option>
                </select>
              </div>

              {/* Intención de Seguir */}
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Intención de Continuar
                </label>
                <select
                  value={valores.intencion_seguir}
                  onChange={(e) => actualizarCampo('intencion_seguir', parseInt(e.target.value))}
                  className="w-full rounded border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 focus:border-unipamplona-rojo focus:outline-none focus:ring-1 focus:ring-unipamplona-rojo"
                >
                  <option value={1}>Firme (Desea graduarse)</option>
                  <option value={0}>En duda / Desmotivación</option>
                </select>
              </div>
            </div>
          </div>

          {/* Botones de Acción */}
          <div className="flex items-center justify-between border-t border-slate-100 pt-4">
            <button
              type="button"
              onClick={handleRestablecer}
              className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800 transition"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Restablecer valores
            </button>

            <button
              type="submit"
              disabled={cargando || hayErrores}
              className="inline-flex items-center gap-2 rounded bg-unipamplona-rojo px-5 py-2 text-sm font-medium text-white shadow-xs transition hover:bg-unipamplona-rojo-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-unipamplona-dorado disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Calculator className="h-4 w-4" />
              <span>{cargando ? 'Calculando...' : 'Simular Riesgo de Deserción'}</span>
            </button>
          </div>
        </form>

        {/* Columna Derecha: Panel de Diagnóstico y Explicabilidad (5 columnas en desktop) */}
        <div className="space-y-5 lg:col-span-5">
          {cargando && (
            <div className="rounded-lg border border-slate-200 bg-white p-6 text-center">
              <CargandoSpinner mensaje="El modelo Bosque Aleatorio está analizando las variables..." />
            </div>
          )}

          {error && <ErrorCartel mensaje={error} />}

          {!cargando && !resultado && !error && (
            <div className="rounded-lg border border-dashed border-slate-300 bg-white p-8 text-center text-slate-500">
              <Sparkles className="mx-auto h-8 w-8 text-slate-400" />
              <h2 className="mt-3 text-sm font-semibold text-slate-700">Listo para Simular</h2>
              <p className="mt-1 text-xs text-slate-500 leading-relaxed max-w-xs mx-auto">
                Modifique los parámetros deseados a la izquierda y presione{' '}
                <strong>"Simular Riesgo de Deserción"</strong> para obtener la predicción orientadora.
              </p>
            </div>
          )}

          {!cargando && resultado && (
            <div className="space-y-4 rounded-lg border border-slate-200 bg-white p-5 shadow-xs">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Diagnóstico Predictivo
                </span>
                <span
                  className={`rounded border px-2.5 py-0.5 text-xs font-semibold ${nivelRiesgoClase(
                    resultado.nivel_riesgo as NivelRiesgo,
                  )}`}
                >
                  {nivelRiesgoEtiqueta(resultado.nivel_riesgo as NivelRiesgo)}
                </span>
              </div>

              {/* Probabilidad Orientadora */}
              <div>
                <div className="flex items-baseline justify-between">
                  <span className="text-xs text-slate-500 font-medium">
                    Probabilidad Orientadora
                  </span>
                  <span className="text-3xl font-bold tabular-nums text-slate-900">
                    {resultado.probabilidad_riesgo.toFixed(1)}%
                  </span>
                </div>

                {/* Barra de progreso */}
                <div className="mt-2 h-2.5 w-full rounded-full bg-slate-100 overflow-hidden">
                  <div
                    className={`h-full transition-all duration-500 ${
                      resultado.nivel_riesgo === 'alto'
                        ? 'bg-amber-600'
                        : resultado.nivel_riesgo === 'medio'
                        ? 'bg-slate-600'
                        : 'bg-emerald-600'
                    }`}
                    style={{ width: `${Math.min(100, Math.max(0, resultado.probabilidad_riesgo))}%` }}
                  />
                </div>
              </div>

              {/* Mensaje de Acompañamiento Formativo */}
              <div className="rounded bg-slate-50 p-3 border border-slate-200">
                <div className="flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 shrink-0 text-slate-700 mt-0.5" />
                  <p className="text-xs text-slate-700 leading-relaxed">
                    {resultado.mensaje_orientador}
                  </p>
                </div>
              </div>

              {/* Factores que más pesan (Explicabilidad Local) */}
              <div className="pt-2">
                <div className="flex items-center gap-1.5 mb-2">
                  <TrendingUp className="h-4 w-4 text-slate-600" />
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-700">
                    Factores que más pesan en esta estimación
                  </h3>
                </div>

                {resultado.factores_criticos && resultado.factores_criticos.length > 0 ? (
                  <div className="space-y-2.5">
                    {resultado.factores_criticos.map((fc, idx) => (
                      <div
                        key={idx}
                        className="rounded border border-slate-100 bg-slate-50/70 p-2.5 text-xs space-y-1.5"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-slate-800">{fc.descripcion}</span>
                          <span className="text-[11px] font-semibold tabular-nums text-slate-700">
                            {fc.impacto_pct.toFixed(1)}% impacto
                          </span>
                        </div>
                        {/* Barra de peso relativo */}
                        <div className="h-1.5 w-full rounded-full bg-slate-200 overflow-hidden">
                          <div
                            className="h-full bg-amber-600 rounded-full"
                            style={{ width: `${Math.min(100, Math.max(5, fc.impacto_pct))}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-500 italic">
                    Las variables se encuentran en rangos equilibrados de estabilidad.
                  </p>
                )}
              </div>

              <div className="pt-2 border-t border-slate-100 text-[11px] text-slate-400">
                Modelo: Bosque Aleatorio · Universidad de Pamplona
              </div>
            </div>
          )}

          {/* Aviso ético permanente en el panel */}
          <AvisoEtico />
        </div>
      </div>
      </div>

      {/* Contenido de Pestaña 2: Notas por Corte */}
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
