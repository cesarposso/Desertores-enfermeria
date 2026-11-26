import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, useReducedMotion } from 'motion/react'
import {
  obtenerEstudiantesRiesgo,
  obtenerCargaMaterias,
  obtenerMetricasModelos,
  COLORES_TEMA,
} from '../api/cliente'
import type {
  EstudianteRiesgo,
  MateriaCarga,
  MetricasModelos,
  NivelRiesgo,
} from '../api/cliente'
import { useEstadoPanel } from '../context/EstadoPanelContext'
import CargandoSpinner from '../components/CargandoSpinner'
import ErrorCartel from '../components/ErrorCartel'
import AvisoEtico from '../components/AvisoEtico'
import MedidorVelocimetro from '../components/MedidorVelocimetro'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
  ReferenceLine,
  CartesianGrid,
} from 'recharts'
import {
  Users,
  AlertTriangle,
  BookOpen,
  Brain,
  CalendarCheck,
  ArrowUpRight,
  CheckCircle2,
} from 'lucide-react'

const NOMBRES_CORTOS_MODELO: Record<string, string> = {
  bosque_aleatorio: 'Bosque Aleatorio',
  regresion_logistica: 'Regresión Logística',
  arbol_decision: 'Árbol de Decisión',
  logica_difusa: 'Lógica Difusa',
}

function acortarAsignatura(nombre: string): string {
  const mapa: Record<string, string> = {
    'Fisiología Humana': 'Fisiología',
    'Farmacología Clínica': 'Farmacología',
    'Anatomía Humana': 'Anatomía',
    'Bioquímica Médica': 'Bioquímica',
    'Microbiología y Parasitología': 'Microbiología',
    'Cuidado Básico de Enfermería': 'Cuidado Básico',
  }
  return mapa[nombre] || (nombre.length > 14 ? `${nombre.slice(0, 13)}…` : nombre)
}

export default function Resumen() {
  const navigate = useNavigate()
  const reducirMovimiento = useReducedMotion()
  const { actualizarPendientesDesdeLista } = useEstadoPanel()

  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [estudiantes, setEstudiantes] = useState<EstudianteRiesgo[]>([])
  const [materias, setMaterias] = useState<MateriaCarga[]>([])
  const [metricas, setMetricas] = useState<MetricasModelos | null>(null)
  const [categoriaActiva, setCategoriaActiva] = useState<NivelRiesgo>('bajo')
  const [barraHoverIdx, setBarraHoverIdx] = useState<number | null>(null)

  const cargarDatos = async () => {
    try {
      setCargando(true)
      setError(null)
      const [resEstudiantes, resMaterias, resMetricas] = await Promise.all([
        obtenerEstudiantesRiesgo(),
        obtenerCargaMaterias(),
        obtenerMetricasModelos(),
      ])
      setEstudiantes(resEstudiantes)
      setMaterias(resMaterias)
      setMetricas(resMetricas)
      actualizarPendientesDesdeLista(resEstudiantes)
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : 'Error desconocido al conectar con el servidor'
      setError(msg)
    } finally {
      setCargando(false)
    }
  }

  useEffect(() => {
    void cargarDatos()
  }, [])

  if (cargando) {
    return <CargandoSpinner mensaje="Cargando resumen de alerta temprana..." />
  }

  if (error) {
    return (
      <div className="max-w-2xl">
        <ErrorCartel mensaje={error} onReintentar={cargarDatos} />
      </div>
    )
  }

  const totalEstudiantes = estudiantes.length
  const totalAlto = estudiantes.filter((e) => e.nivel_riesgo === 'alto').length
  const totalMedio = estudiantes.filter((e) => e.nivel_riesgo === 'medio').length
  const totalBajo = estudiantes.filter((e) => e.nivel_riesgo === 'bajo').length

  const pctAltoNum = totalEstudiantes > 0 ? (totalAlto / totalEstudiantes) * 100 : 0
  const pctMedioNum = totalEstudiantes > 0 ? (totalMedio / totalEstudiantes) * 100 : 0
  const pctBajoNum = totalEstudiantes > 0 ? (totalBajo / totalEstudiantes) * 100 : 0

  const totalCitados = estudiantes.filter((e) => e.estado_tutoria === 'citado').length
  const totalPendientes = totalEstudiantes - totalCitados
  const citadosPrioritarios = estudiantes.filter(
    (e) => e.nivel_riesgo === 'alto' && e.estado_tutoria === 'citado',
  ).length
  const coberturaTutoriasPct =
    totalEstudiantes > 0 ? Math.round((totalCitados / totalEstudiantes) * 100) : 0

  const materiaPico = [...materias].sort((a, b) => b.carga_promedio - a.carga_promedio)[0]

  const mejorModeloClave = metricas?.mejor_modelo || 'bosque_aleatorio'
  const f1MejorModelo =
    mejorModeloClave === 'bosque_aleatorio'
      ? metricas?.bosque_aleatorio?.f1?.mean
      : mejorModeloClave === 'arbol_decision'
      ? metricas?.arbol_decision?.f1?.mean
      : metricas?.regresion_logistica?.f1?.mean
  const f1Display = f1MejorModelo !== undefined ? `${(f1MejorModelo * 100).toFixed(1)}%` : '—'

  const prioritariosPendientesLista = estudiantes
    .filter((e) => e.nivel_riesgo === 'alto' && e.estado_tutoria === 'pendiente')
    .sort((a, b) => b.probabilidad_riesgo - a.probabilidad_riesgo)
  const topParaCitar = prioritariosPendientesLista.slice(0, 4)

  const categoriasCohorte: Array<{
    nivel: NivelRiesgo
    etiqueta: string
    etiquetaVelocimetro: string
    cantidad: number
    pct: number
    color: string
    badgeClase: string
  }> = [
    {
      nivel: 'alto',
      etiqueta: 'Acompañamiento prioritario',
      etiquetaVelocimetro: 'en acompañamiento prioritario',
      cantidad: totalAlto,
      pct: pctAltoNum,
      color: COLORES_TEMA.riesgo.prioritarioVelocimetro,
      badgeClase:
        'border-amber-300/80 bg-amber-50 text-amber-950 dark:border-orange-400/30 dark:bg-orange-500/15 dark:text-orange-200',
    },
    {
      nivel: 'medio',
      etiqueta: 'Seguimiento preventivo',
      etiquetaVelocimetro: 'en seguimiento preventivo',
      cantidad: totalMedio,
      pct: pctMedioNum,
      color: COLORES_TEMA.riesgo.preventivoVelocimetro,
      badgeClase:
        'border-amber-300/80 bg-amber-50 text-amber-950 dark:border-amber-400/30 dark:bg-amber-500/15 dark:text-amber-200',
    },
    {
      nivel: 'bajo',
      etiqueta: 'Situación estable',
      etiquetaVelocimetro: 'en situación estable',
      cantidad: totalBajo,
      pct: pctBajoNum,
      color: COLORES_TEMA.riesgo.estableVelocimetro,
      badgeClase:
        'border-emerald-200/80 bg-emerald-50 text-emerald-900 dark:border-emerald-400/30 dark:bg-emerald-500/15 dark:text-emerald-200',
    },
  ]
  const seleccionCohorte =
    categoriasCohorte.find((c) => c.nivel === categoriaActiva) ?? categoriasCohorte[2]

  const materiasOrdenadas = [...materias].sort((a, b) => b.tasa_riesgo_pct - a.tasa_riesgo_pct)
  const datosMaterias = materiasOrdenadas.map((m, idx) => ({
    asignatura: m.asignatura,
    etiquetaCorta: acortarAsignatura(m.asignatura),
    tasa: Number(m.tasa_riesgo_pct.toFixed(1)),
    carga: m.carga_promedio,
    esPrincipal: idx === 0,
  }))
  const promedioAlertaMaterias =
    materias.length > 0
      ? (materias.reduce((acc, m) => acc + m.tasa_riesgo_pct, 0) / materias.length).toFixed(1)
      : '0.0'
  const materiaMayorAlerta = materiasOrdenadas[0]

  const bloqueAnimacion = (delayS: number) =>
    reducirMovimiento
      ? { initial: { opacity: 0 }, animate: { opacity: 1 }, transition: { duration: 0.16 } }
      : {
          initial: { opacity: 0, y: 8 },
          animate: { opacity: 1, y: 0 },
          transition: { duration: 0.22, delay: delayS, ease: [0.23, 1, 0.32, 1] as const },
        }

  return (
    <div className="space-y-6">
      {/* Cabecera institucional + 4 chips métricos circulares */}
      <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-zinc-900 dark:text-[#F4F4F5]">
            Resumen General
          </h1>
          <p className="mt-1 text-sm text-zinc-600 dark:text-[#A1A1AA] text-pretty">
            Pulso preventivo del cohorte de Enfermería · Universidad de Pamplona
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4 sm:flex sm:flex-wrap sm:items-center sm:gap-6">
          {/* Chip 1: Total cohorte */}
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-black/5 bg-white text-zinc-700 shadow-2xs dark:border-white/10 dark:bg-[#18181B] dark:text-zinc-200">
              <Users className="h-4 w-4" aria-hidden="true" />
            </span>
            <div className="leading-tight">
              <p className="text-lg font-semibold tabular-nums text-zinc-900 dark:text-[#F4F4F5]">
                {totalEstudiantes}
              </p>
              <p className="text-xs text-zinc-600 dark:text-[#A1A1AA]">Total cohorte</p>
            </div>
          </div>

          {/* Chip 2: Prioritarios */}
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#B44B27] text-white shadow-2xs">
              <AlertTriangle className="h-4 w-4" aria-hidden="true" />
            </span>
            <div className="leading-tight">
              <p className="text-lg font-semibold tabular-nums text-zinc-900 dark:text-[#F4F4F5]">
                {totalAlto}{' '}
                <span className="text-xs font-normal text-zinc-600 dark:text-[#A1A1AA]">
                  ({pctAltoNum.toFixed(0)}%)
                </span>
              </p>
              <p className="text-xs text-zinc-600 dark:text-[#A1A1AA]">Prioritarios</p>
            </div>
          </div>

          {/* Chip 3: Materia más cargada */}
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-black/5 bg-white text-zinc-700 shadow-2xs dark:border-white/10 dark:bg-[#18181B] dark:text-zinc-200">
              <BookOpen className="h-4 w-4" aria-hidden="true" />
            </span>
            <div className="min-w-0 leading-tight">
              <p className="text-lg font-semibold tabular-nums text-zinc-900 dark:text-[#F4F4F5]">
                {materiaPico ? materiaPico.carga_promedio.toFixed(2) : '—'}{' '}
                <span className="text-xs font-normal text-zinc-600 dark:text-[#A1A1AA]">
                  / 5.0
                </span>
              </p>
              <p
                className="max-w-[140px] truncate text-xs text-zinc-600 dark:text-[#A1A1AA]"
                title={materiaPico?.asignatura}
              >
                {materiaPico ? acortarAsignatura(materiaPico.asignatura) : 'Sin datos'}
              </p>
            </div>
          </div>

          {/* Chip 4: Mejor modelo */}
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-unipamplona-rojo/20 bg-unipamplona-rojo-light text-unipamplona-rojo shadow-2xs dark:border-unipamplona-rojo/35 dark:bg-unipamplona-rojo/20 dark:text-red-200">
              <Brain className="h-4 w-4" aria-hidden="true" />
            </span>
            <div className="leading-tight">
              <p className="text-lg font-semibold tabular-nums text-zinc-900 dark:text-[#F4F4F5]">
                {f1Display}
              </p>
              <p className="text-xs text-zinc-600 dark:text-[#A1A1AA]">
                {NOMBRES_CORTOS_MODELO[mejorModeloClave] || mejorModeloClave}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Fila Bento 1: Velocímetro interactivo + Gráfico de barras rayadas */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
        {/* Tarjeta Izquierda: Velocímetro interactivo */}
        <motion.section
          {...bloqueAnimacion(0)}
          className="bento-card flex flex-col justify-between p-6 lg:col-span-5"
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-zinc-900 dark:text-[#F4F4F5]">
                Estado del cohorte
              </h2>
              <p className="mt-0.5 text-xs text-zinc-600 dark:text-[#A1A1AA] text-pretty">
                Selecciona una categoría inferior para inspeccionar su proporción
              </p>
            </div>
            <span
              className={`rounded-full border px-3 py-1 text-xs font-medium tabular-nums ${seleccionCohorte.badgeClase}`}
            >
              {seleccionCohorte.cantidad} / {totalEstudiantes}
            </span>
          </div>

          <div className="my-4 flex flex-col items-center">
            <MedidorVelocimetro
              porcentaje={seleccionCohorte.pct}
              nivel={seleccionCohorte.nivel}
              etiquetaSecundaria={seleccionCohorte.etiquetaVelocimetro}
              tamano="lg"
              ariaLabel={`${seleccionCohorte.pct.toFixed(1)}% del cohorte ${seleccionCohorte.etiquetaVelocimetro}`}
            />

            <div className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-zinc-100 px-3.5 py-1.5 text-xs text-zinc-700 dark:bg-white/10 dark:text-zinc-200">
              <CalendarCheck
                className="h-3.5 w-3.5 text-emerald-700 dark:text-emerald-400"
                aria-hidden="true"
              />
              <span className="tabular-nums">
                <strong>{citadosPrioritarios}</strong> de <strong>{totalAlto}</strong> prioritarios
                citados a tutoría
              </span>
            </div>
          </div>

          <div
            role="group"
            aria-label="Seleccionar categoría de cohorte en el velocímetro"
            className="space-y-1.5 border-t border-black/5 pt-3.5 dark:border-white/10"
          >
            {categoriasCohorte.map((fila) => {
              const esActiva = fila.nivel === categoriaActiva
              return (
                <button
                  key={fila.nivel}
                  type="button"
                  aria-pressed={esActiva}
                  onClick={() => setCategoriaActiva(fila.nivel)}
                  className={`pressable w-full cursor-pointer rounded-2xl px-3 py-2 text-left text-xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-unipamplona-dorado ${
                    esActiva
                      ? 'bg-zinc-100 ring-1 ring-black/10 dark:bg-white/10 dark:ring-white/15'
                      : 'hover:bg-zinc-50 dark:hover:bg-white/[0.04]'
                  }`}
                >
                  <div className="space-y-1 sm:grid sm:grid-cols-12 sm:items-center sm:gap-3 sm:space-y-0">
                    <div className="flex items-center justify-between gap-2 sm:col-span-7">
                      <span className="flex items-center gap-2">
                        <span
                          className={`h-2 w-2 shrink-0 rounded-full transition-opacity ${
                            esActiva ? 'opacity-100' : 'opacity-45'
                          }`}
                          style={{ backgroundColor: fila.color }}
                          aria-hidden="true"
                        />
                        <span
                          className={
                            esActiva
                              ? 'font-semibold text-zinc-900 dark:text-[#F4F4F5]'
                              : 'font-medium text-zinc-700 dark:text-zinc-300'
                          }
                        >
                          {fila.etiqueta}
                        </span>
                      </span>
                      <span className="shrink-0 tabular-nums text-zinc-600 dark:text-[#A1A1AA]">
                        {fila.cantidad} ({fila.pct.toFixed(0)}%)
                      </span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-zinc-200/80 dark:bg-zinc-800 sm:col-span-5">
                      <div
                        className="h-full rounded-full transition-[width] duration-500 ease-out"
                        style={{
                          width: `${Math.max(fila.pct > 0 ? 4 : 0, Math.min(100, fila.pct))}%`,
                          backgroundColor: fila.color,
                        }}
                      />
                    </div>
                  </div>
                </button>
              )
            })}
          </div>
        </motion.section>

        {/* Tarjeta Derecha: Gráfico con barras rayadas + barra principal encendida */}
        <motion.section
          {...bloqueAnimacion(0.045)}
          className="bento-card flex flex-col justify-between p-6 lg:col-span-7"
        >
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-zinc-900 dark:text-[#F4F4F5]">
                Tasa de alerta por asignatura
              </h2>
              <p className="mt-0.5 text-xs text-zinc-600 dark:text-[#A1A1AA] text-pretty">
                Porcentaje de alerta por materia frente al umbral preventivo institucional del 35%
              </p>
            </div>

            <div className="flex shrink-0 items-center gap-3 text-xs text-zinc-600 dark:text-[#A1A1AA]">
              <span className="inline-flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-[#D96B43]" aria-hidden="true" />
                Mayor alerta
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span
                  className="h-2.5 w-2.5 rounded-full border border-zinc-300 bg-zinc-200 dark:border-zinc-600 dark:bg-zinc-700"
                  aria-hidden="true"
                />
                Otras asignaturas
              </span>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-3 gap-4 border-b border-black/5 pb-4 dark:border-white/10">
            <div>
              <p className="text-xs text-zinc-600 dark:text-[#A1A1AA]">Promedio materias</p>
              <p className="mt-0.5 text-xl font-semibold tabular-nums text-zinc-900 dark:text-[#F4F4F5]">
                {promedioAlertaMaterias}%
              </p>
            </div>
            <div>
              <p className="text-xs text-zinc-600 dark:text-[#A1A1AA]">Mayor alerta</p>
              <p className="mt-0.5 text-xl font-semibold tabular-nums text-[#B44B27] dark:text-[#F49D7C]">
                {materiaMayorAlerta ? `${materiaMayorAlerta.tasa_riesgo_pct.toFixed(1)}%` : '—'}
              </p>
            </div>
            <div>
              <p className="text-xs text-zinc-600 dark:text-[#A1A1AA]">Umbral institucional</p>
              <p className="mt-0.5 text-xl font-semibold tabular-nums text-zinc-900 dark:text-[#F4F4F5]">
                35.0%
              </p>
            </div>
          </div>

          <div className="mt-4 h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={datosMaterias}
                margin={{ top: 14, right: 16, left: -16, bottom: 4 }}
                onMouseLeave={() => setBarraHoverIdx(null)}
              >
                <defs>
                  <pattern
                    id="patron-rayado-resumen"
                    width="8"
                    height="8"
                    patternUnits="userSpaceOnUse"
                    patternTransform="rotate(45)"
                  >
                    <rect width="8" height="8" fill="var(--chart-stripe-bg)" />
                    <line
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="8"
                      stroke="var(--chart-stripe-line)"
                      strokeWidth="2.5"
                    />
                  </pattern>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--chart-grid)" />
                <XAxis
                  dataKey="etiquetaCorta"
                  tick={{ fontSize: 11, fill: 'var(--chart-axis)' }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  domain={[0, 100]}
                  ticks={[0, 25, 35, 50, 75, 100]}
                  tickFormatter={(v) => `${v}%`}
                  tick={{ fontSize: 11, fill: 'var(--chart-axis)' }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  cursor={{ fill: 'var(--chart-cursor)', radius: 12 }}
                  content={({ active, payload }) => {
                    if (!active || !payload?.length) return null
                    const item = payload[0].payload as (typeof datosMaterias)[number]
                    return (
                      <div className="rounded-2xl border border-white/10 bg-[#18181B] px-3.5 py-2.5 text-xs text-white shadow-lg dark:bg-[#27272A]">
                        <p className="font-semibold">{item.asignatura}</p>
                        <p className="mt-1 tabular-nums text-zinc-200">
                          Tasa de alerta: <strong className="text-white">{item.tasa}%</strong>
                        </p>
                        <p className="tabular-nums text-zinc-300">
                          Carga percibida: {item.carga.toFixed(2)} / 5.0
                        </p>
                      </div>
                    )
                  }}
                />
                <ReferenceLine
                  y={35}
                  stroke="var(--chart-refline)"
                  strokeDasharray="5 5"
                  label={{
                    value: '35%',
                    position: 'insideTopRight',
                    fill: 'var(--chart-reflabel)',
                    fontSize: 11,
                    fontWeight: 600,
                  }}
                />
                <Bar
                  dataKey="tasa"
                  isAnimationActive={false}
                  cursor="pointer"
                  radius={[14, 14, 14, 14]}
                  maxBarSize={44}
                  onMouseEnter={(_, index) =>
                    setBarraHoverIdx(typeof index === 'number' ? index : null)
                  }
                  onMouseLeave={() => setBarraHoverIdx(null)}
                >
                  {datosMaterias.map((entry, idx) => {
                    const iluminada = entry.esPrincipal || barraHoverIdx === idx
                    return (
                      <Cell
                        key={`bar-resumen-${idx}`}
                        fill={
                          iluminada
                            ? COLORES_TEMA.riesgo.prioritarioVelocimetro
                            : 'url(#patron-rayado-resumen)'
                        }
                        stroke={iluminada ? 'none' : 'var(--chart-bar-stroke)'}
                        strokeWidth={iluminada ? 0 : 1}
                      />
                    )
                  })}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.section>
      </div>

      {/* Fila Bento 2: Tarjeta oscura "Para citar primero" + Gestión de Tutorías */}
      <motion.div
        {...bloqueAnimacion(0.08)}
        className="grid grid-cols-1 gap-5 lg:grid-cols-12"
      >
        <section className="bento-card-dark flex flex-col justify-between p-6 text-white lg:col-span-5">
          <div>
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-lg font-semibold text-white">Para citar primero</h2>
              <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-medium tabular-nums text-zinc-100">
                {prioritariosPendientesLista.length} pendientes
              </span>
            </div>
            <p className="mt-1 text-xs text-zinc-300 text-pretty">
              Estudiantes prioritarios sin tutoría agendada para abrir su ficha formativa.
            </p>

            {topParaCitar.length === 0 ? (
              <div className="mt-5 flex items-center gap-3 rounded-2xl bg-emerald-500/15 p-4 text-xs text-emerald-200">
                <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-300" aria-hidden="true" />
                <span>
                  Todos los estudiantes prioritarios cuentan actualmente con citación registrada.
                </span>
              </div>
            ) : (
              <div className="mt-4 divide-y divide-white/10">
                {topParaCitar.map((est) => (
                  <button
                    key={est.codigo_estudiante}
                    type="button"
                    onClick={() =>
                      navigate(`/alumnos?estudiante=${encodeURIComponent(est.codigo_estudiante)}`)
                    }
                    className="pressable group -mx-2 flex w-full items-center justify-between gap-3 rounded-xl px-2 py-3 text-left transition-colors first:pt-1 last:pb-1 hover:bg-white/[0.05] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-unipamplona-dorado"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white text-xs font-bold tabular-nums text-zinc-900">
                        {est.codigo_estudiante.replace('ENF-', '')}
                      </span>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold tabular-nums text-white">
                          {est.codigo_estudiante}{' '}
                          <span className="font-normal text-zinc-300">· {est.asignatura}</span>
                        </p>
                        <p className="truncate text-xs text-zinc-300">{est.factor_principal}</p>
                      </div>
                    </div>

                    <div className="flex shrink-0 items-center gap-2">
                      <span className="rounded-full bg-[#B44B27] px-2.5 py-0.5 text-xs font-semibold tabular-nums text-white">
                        {est.probabilidad_riesgo.toFixed(0)}%
                      </span>
                      <ArrowUpRight
                        className="h-4 w-4 text-zinc-300 transition-transform duration-150 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                        aria-hidden="true"
                      />
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="mt-5 flex items-center justify-between border-t border-white/10 pt-4 text-xs">
            <span className="text-zinc-300">Acción preventiva sugerida</span>
            <button
              type="button"
              onClick={() => navigate('/alumnos?nivel=alto&estado=pendiente')}
              className="pressable rounded-full bg-white px-4 py-1.5 font-medium text-zinc-900 hover:bg-zinc-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-unipamplona-dorado"
            >
              Ver todos los prioritarios
            </button>
          </div>
        </section>

        <section className="bento-card flex flex-col justify-between gap-5 p-6 lg:col-span-7">
          <div>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-lg font-semibold text-zinc-900 dark:text-[#F4F4F5]">
                  Gestión de tutorías
                </h2>
                <p className="mt-0.5 text-xs text-zinc-600 dark:text-[#A1A1AA] text-pretty">
                  Avance de citaciones formativas sobre el total de 150 registros sintéticos
                </p>
              </div>
              <button
                type="button"
                onClick={() => navigate('/alumnos')}
                className="pressable inline-flex items-center justify-center gap-2 self-start rounded-full bg-unipamplona-rojo px-4 py-2 text-xs font-medium text-white shadow-xs hover:bg-[#962929] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-unipamplona-dorado"
              >
                <span>Abrir listado de seguimiento</span>
                <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
              </button>
            </div>

            <div className="mt-5 grid grid-cols-1 divide-y divide-black/5 rounded-2xl bg-zinc-50/80 dark:divide-white/10 dark:bg-white/[0.04] sm:grid-cols-3 sm:divide-x sm:divide-y-0">
              <div className="p-4">
                <p className="text-xs text-zinc-600 dark:text-[#A1A1AA]">Citados a tutoría</p>
                <p className="mt-1 text-2xl font-semibold tabular-nums text-zinc-900 dark:text-[#F4F4F5]">
                  {totalCitados}
                </p>
                <p className="mt-0.5 text-xs font-medium tabular-nums text-emerald-800 dark:text-emerald-300">
                  {coberturaTutoriasPct}% del cohorte
                </p>
              </div>

              <div className="p-4">
                <p className="text-xs text-zinc-600 dark:text-[#A1A1AA]">Pendientes por citar</p>
                <p className="mt-1 text-2xl font-semibold tabular-nums text-zinc-900 dark:text-[#F4F4F5]">
                  {totalPendientes}
                </p>
                <p className="mt-0.5 text-xs tabular-nums text-zinc-600 dark:text-[#A1A1AA]">
                  Incluye {prioritariosPendientesLista.length} prioritarios
                </p>
              </div>

              <div className="p-4">
                <p className="text-xs text-zinc-600 dark:text-[#A1A1AA]">
                  Cobertura en prioritarios
                </p>
                <p className="mt-1 text-2xl font-semibold tabular-nums text-zinc-900 dark:text-[#F4F4F5]">
                  {totalAlto > 0 ? Math.round((citadosPrioritarios / totalAlto) * 100) : 0}%
                </p>
                <p className="mt-0.5 text-xs tabular-nums text-zinc-600 dark:text-[#A1A1AA]">
                  {citadosPrioritarios} de {totalAlto} convocados
                </p>
              </div>
            </div>

            <div className="mt-4">
              <div className="mb-1.5 flex items-center justify-between text-xs text-zinc-600 dark:text-[#A1A1AA]">
                <span>Progreso general de convocatorias</span>
                <span className="font-semibold tabular-nums text-zinc-900 dark:text-[#F4F4F5]">
                  {totalCitados} / {totalEstudiantes}
                </span>
              </div>
              <div className="h-2.5 w-full overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
                <div
                  className="h-full rounded-full bg-[#059669] transition-[width] duration-500 ease-out"
                  style={{ width: `${coberturaTutoriasPct}%` }}
                />
              </div>
            </div>
          </div>

          <AvisoEtico />
        </section>
      </motion.div>
    </div>
  )
}
