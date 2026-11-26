import { useEffect, useState } from 'react'
import { obtenerCargaMaterias, COLORES_TEMA } from '../api/cliente'
import type { MateriaCarga } from '../api/cliente'
import CargandoSpinner from '../components/CargandoSpinner'
import ErrorCartel from '../components/ErrorCartel'
import AvisoEtico from '../components/AvisoEtico'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
  CartesianGrid,
  ReferenceLine,
} from 'recharts'
import { BookOpen, Layers, AlertTriangle } from 'lucide-react'

export default function Materias() {
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [materias, setMaterias] = useState<MateriaCarga[]>([])
  const [barraHoverIdx, setBarraHoverIdx] = useState<number | null>(null)

  const cargarDatos = async () => {
    try {
      setCargando(true)
      setError(null)
      const data = await obtenerCargaMaterias()
      const ordenadas = [...data].sort((a, b) => b.carga_promedio - a.carga_promedio)
      setMaterias(ordenadas)
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : 'Error al cargar los datos de asignaturas'
      setError(msg)
    } finally {
      setCargando(false)
    }
  }

  useEffect(() => {
    void cargarDatos()
  }, [])

  if (cargando) {
    return <CargandoSpinner mensaje="Cargando análisis de carga académica por materia..." />
  }

  if (error) {
    return (
      <div className="max-w-2xl">
        <ErrorCartel mensaje={error} onReintentar={cargarDatos} />
      </div>
    )
  }

  const datosGrafico = materias.map((m, idx) => ({
    asignatura: m.asignatura,
    carga: Number(m.carga_promedio.toFixed(2)),
    semestre: m.semestre,
    tasaRiesgo: m.tasa_riesgo_pct,
    esPrincipal: idx === 0,
  }))

  const materiaMayorCarga = materias[0]
  const promedioGeneralCarga =
    materias.length > 0
      ? (materias.reduce((acc, m) => acc + m.carga_promedio, 0) / materias.length).toFixed(2)
      : '0.00'
  const materiasCriticas = materias.filter((m) => m.carga_promedio >= 4.2).length

  return (
    <div className="space-y-6">
      {/* Encabezado + chips métricos circulares */}
      <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-zinc-900 dark:text-[#F4F4F5]">
            Carga Académica por Materia
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-zinc-600 dark:text-[#A1A1AA]">
            Diagnóstico de sobrecarga académica percibida (escala 1.0 a 5.0) y su relación con la
            tasa de alerta preventiva · Universidad de Pamplona.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-5">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#B44B27] text-white shadow-2xs">
              <BookOpen className="h-4 w-4" aria-hidden="true" />
            </span>
            <div className="leading-tight">
              <p className="text-lg font-semibold tabular-nums text-zinc-900 dark:text-[#F4F4F5]">
                {materiaMayorCarga ? materiaMayorCarga.carga_promedio.toFixed(2) : '—'}{' '}
                <span className="text-xs font-normal text-zinc-600 dark:text-[#A1A1AA]">
                  / 5.0
                </span>
              </p>
              <p
                className="max-w-[160px] truncate text-xs text-zinc-600 dark:text-[#A1A1AA]"
                title={materiaMayorCarga?.asignatura}
              >
                {materiaMayorCarga ? materiaMayorCarga.asignatura : 'Mayor sobrecarga'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-black/5 bg-white text-zinc-700 shadow-2xs dark:border-white/10 dark:bg-[#18181B] dark:text-zinc-200">
              <Layers className="h-4 w-4" aria-hidden="true" />
            </span>
            <div className="leading-tight">
              <p className="text-lg font-semibold tabular-nums text-zinc-900 dark:text-[#F4F4F5]">
                {promedioGeneralCarga}{' '}
                <span className="text-xs font-normal text-zinc-600 dark:text-[#A1A1AA]">
                  / 5.0
                </span>
              </p>
              <p className="text-xs text-zinc-600 dark:text-[#A1A1AA]">
                Promedio ({materias.length} materias)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-amber-300 bg-amber-50 text-amber-800 shadow-2xs dark:border-amber-400/30 dark:bg-amber-500/15 dark:text-amber-300">
              <AlertTriangle className="h-4 w-4" aria-hidden="true" />
            </span>
            <div className="leading-tight">
              <p className="text-lg font-semibold tabular-nums text-zinc-900 dark:text-[#F4F4F5]">
                {materiasCriticas}
              </p>
              <p className="text-xs text-zinc-600 dark:text-[#A1A1AA]">Con carga ≥ 4.20</p>
            </div>
          </div>
        </div>
      </div>

      {/* Gráfico de Barras Rayadas + Barra Principal Encendida */}
      <section className="bento-card p-6">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-[#F4F4F5]">
              Comparativa de Carga Académica Percibida
            </h2>
            <p className="mt-0.5 text-xs text-zinc-600 dark:text-[#A1A1AA]">
              Puntaje promedio reportado por materia. Asignaturas ≥ 4.20 ameritan revisión formativa
              de talleres y tiempos de entrega.
            </p>
          </div>

          <div className="flex shrink-0 flex-wrap items-center gap-3 text-xs text-zinc-600 dark:text-[#A1A1AA]">
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-[#D96B43]" aria-hidden="true" />
              Mayor sobrecarga
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

        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={datosGrafico}
              layout="vertical"
              margin={{ top: 22, right: 24, left: 12, bottom: 10 }}
              onMouseLeave={() => setBarraHoverIdx(null)}
            >
              <defs>
                <pattern
                  id="patron-rayado-materias"
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
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="var(--chart-grid)" />
              <XAxis
                type="number"
                domain={[0, 5]}
                ticks={[1, 2, 3, 4, 4.2, 5]}
                tick={{ fontSize: 11, fill: 'var(--chart-axis)' }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                type="category"
                dataKey="asignatura"
                tick={{ fontSize: 12, fill: 'var(--chart-axis)' }}
                width={185}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                cursor={{ fill: 'var(--chart-cursor)' }}
                content={({ active, payload }) => {
                  if (!active || !payload?.length) return null
                  const item = payload[0].payload as (typeof datosGrafico)[number]
                  return (
                    <div className="rounded-2xl border border-white/10 bg-[#18181B] px-3.5 py-2.5 text-xs text-white shadow-lg dark:bg-[#27272A]">
                      <p className="font-semibold">{item.asignatura}</p>
                      <p className="mt-1 tabular-nums text-zinc-200">
                        Carga percibida:{' '}
                        <strong className="text-white">{item.carga.toFixed(2)} / 5.0</strong>
                      </p>
                      <p className="tabular-nums text-zinc-300">
                        Tasa de alerta: {item.tasaRiesgo.toFixed(1)}% · Sem. {item.semestre}
                      </p>
                    </div>
                  )
                }}
              />
              <ReferenceLine
                x={4.2}
                stroke="var(--chart-refline)"
                strokeDasharray="4 4"
                label={{
                  value: '4.20',
                  position: 'top',
                  fill: 'var(--chart-reflabel)',
                  fontSize: 11,
                  fontWeight: 600,
                }}
              />
              <Bar
                dataKey="carga"
                isAnimationActive={false}
                cursor="pointer"
                radius={[12, 12, 12, 12]}
                barSize={22}
                onMouseEnter={(_, index) =>
                  setBarraHoverIdx(typeof index === 'number' ? index : null)
                }
                onMouseLeave={() => setBarraHoverIdx(null)}
              >
                {datosGrafico.map((entry, index) => {
                  const iluminada = entry.esPrincipal || barraHoverIdx === index
                  return (
                    <Cell
                      key={`bar-materia-${index}`}
                      fill={
                        iluminada
                          ? COLORES_TEMA.riesgo.prioritarioVelocimetro
                          : 'url(#patron-rayado-materias)'
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
      </section>

      {/* Tabla Detallada por Materia */}
      <section className="bento-card overflow-hidden">
        <div className="border-b border-black/5 px-6 py-5 dark:border-white/10">
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-[#F4F4F5]">
            Detalle Académico por Asignatura
          </h2>
          <p className="mt-0.5 text-xs text-zinc-600 dark:text-[#A1A1AA]">
            Indicadores curriculares para la toma de decisiones docentes.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-black/5 bg-zinc-50/90 text-xs font-semibold uppercase tracking-wider text-zinc-600 dark:border-white/10 dark:bg-white/[0.03] dark:text-[#A1A1AA]">
              <tr>
                <th scope="col" className="px-6 py-3.5">
                  Asignatura
                </th>
                <th scope="col" className="px-4 py-3.5">
                  Semestre
                </th>
                <th scope="col" className="px-4 py-3.5 text-right">
                  Estudiantes
                </th>
                <th scope="col" className="px-4 py-3.5 text-right">
                  Carga percibida
                </th>
                <th scope="col" className="px-4 py-3.5 text-right">
                  Tasa alerta
                </th>
                <th scope="col" className="px-4 py-3.5 text-right">
                  Asistencia
                </th>
                <th scope="col" className="px-6 py-3.5 text-right">
                  Estudio autónomo
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/[0.04] dark:divide-white/[0.06]">
              {materias.map((m) => {
                const esSobrecarga = m.carga_promedio >= 4.2
                return (
                  <tr
                    key={m.asignatura}
                    className="transition-colors duration-150 hover:bg-zinc-50/80 dark:hover:bg-white/[0.03]"
                  >
                    <td className="px-6 py-3.5 font-medium text-zinc-900 dark:text-[#F4F4F5]">
                      {m.asignatura}
                    </td>
                    <td className="px-4 py-3.5 tabular-nums text-zinc-600 dark:text-[#A1A1AA]">
                      Sem. {m.semestre}
                    </td>
                    <td className="px-4 py-3.5 text-right tabular-nums text-zinc-700 dark:text-zinc-300">
                      {m.estudiantes_matriculados}
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <span
                        className={`inline-block rounded-full border px-2.5 py-0.5 text-xs font-semibold tabular-nums ${
                          esSobrecarga
                            ? 'border-amber-300 bg-amber-50 text-amber-900 dark:border-orange-400/30 dark:bg-orange-500/15 dark:text-orange-200'
                            : 'border-black/5 bg-zinc-100 text-zinc-700 dark:border-white/10 dark:bg-white/[0.06] dark:text-zinc-300'
                        }`}
                      >
                        {m.carga_promedio.toFixed(2)} / 5.0
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-right font-medium tabular-nums text-zinc-800 dark:text-zinc-200">
                      {m.tasa_riesgo_pct.toFixed(1)}%
                    </td>
                    <td className="px-4 py-3.5 text-right tabular-nums text-zinc-600 dark:text-[#A1A1AA]">
                      {m.asistencia_promedio_pct.toFixed(1)}%
                    </td>
                    <td className="px-6 py-3.5 text-right tabular-nums text-zinc-600 dark:text-[#A1A1AA]">
                      {m.horas_estudio_promedio.toFixed(1)} h/sem
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </section>

      <AvisoEtico />
    </div>
  )
}
