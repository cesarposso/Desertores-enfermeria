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
} from 'recharts'
import { BookOpen, Layers } from 'lucide-react'

export default function Materias() {
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [materias, setMaterias] = useState<MateriaCarga[]>([])

  const cargarDatos = async () => {
    try {
      setCargando(true)
      setError(null)
      const data = await obtenerCargaMaterias()
      // Ordenar por carga percibida descendente
      const ordenadas = [...data].sort((a, b) => b.carga_promedio - a.carga_promedio)
      setMaterias(ordenadas)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al cargar los datos de asignaturas'
      setError(msg)
    } finally {
      setCargando(false)
    }
  }

  useEffect(() => {
    cargarDatos()
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

  // Prepara datos para el gráfico usando colores centralizados
  const datosGrafico = materias.map((m) => ({
    asignatura: m.asignatura,
    carga: m.carga_promedio,
    semestre: m.semestre,
    tasaRiesgo: m.tasa_riesgo_pct,
    color: m.carga_promedio >= 4.2 ? COLORES_TEMA.riesgo.alto : COLORES_TEMA.riesgo.medio,
  }))

  const materiaMayorCarga = materias[0]
  const promedioGeneralCarga =
    materias.length > 0
      ? (materias.reduce((acc, m) => acc + m.carga_promedio, 0) / materias.length).toFixed(2)
      : '0.00'

  return (
    <div className="space-y-6">
      {/* Encabezado */}
      <div>
        <h1 className="text-2xl font-semibold text-slate-800">Carga Académica por Materia</h1>
        <p className="text-sm text-slate-600 mt-1">
          Diagnóstico de sobrecarga académica percibida (escala 1.0 a 5.0) y su relación con la tasa de
          alerta preventiva en el plan de estudios de Enfermería · Universidad de Pamplona.
        </p>
      </div>

      {/* Métricas Rápidas */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wider text-slate-500">
              Materia de Mayor Sobrecarga
            </span>
            <BookOpen className="h-4 w-4 text-amber-800" aria-hidden="true" />
          </div>
          <p className="mt-2 text-base font-semibold text-slate-800 truncate" title={materiaMayorCarga?.asignatura}>
            {materiaMayorCarga ? materiaMayorCarga.asignatura : '—'}
          </p>
          <div className="mt-1 flex items-baseline gap-1">
            <span className="text-2xl font-semibold tabular-nums text-amber-900">
              {materiaMayorCarga ? materiaMayorCarga.carga_promedio.toFixed(2) : '—'}
            </span>
            <span className="text-xs text-slate-500">/ 5.0 (Sem. {materiaMayorCarga?.semestre})</span>
          </div>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wider text-slate-500">
              Promedio General del Programa
            </span>
            <Layers className="h-4 w-4 text-slate-600" aria-hidden="true" />
          </div>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="text-2xl font-semibold tabular-nums text-slate-800">
              {promedioGeneralCarga}
            </span>
            <span className="text-xs text-slate-500">/ 5.0 sobre {materias.length} asignaturas</span>
          </div>
          <p className="mt-2 text-xs text-slate-500">Nivel de esfuerzo estimado por los estudiantes.</p>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-4 sm:col-span-2 lg:col-span-1">
          <span className="text-xs font-medium uppercase tracking-wider text-slate-500">
            Criterio Pedagógico
          </span>
          <p className="mt-2 text-xs text-slate-600 leading-relaxed">
            Asignaturas con promedio ≥ <strong className="tabular-nums text-slate-800">4.20</strong> (en ámbar cálido)
            ameritan revisión formativa de talleres, tiempos de entrega y carga de estudio autónomo.
          </p>
        </div>
      </div>

      {/* Gráfico de Barras de Carga Percibida */}
      <div className="rounded-lg border border-slate-200 bg-white p-5">
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-slate-800">
            Comparativa de Carga Académica Percibida
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Puntaje promedio reportado por materia (ordenado de mayor a menor sobrecarga).
          </p>
        </div>

        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={datosGrafico}
              layout="vertical"
              margin={{ top: 10, right: 30, left: 30, bottom: 10 }}
            >
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke={COLORES_TEMA.unipamplona.grid} />
              <XAxis
                type="number"
                domain={[0, 5]}
                ticks={[1, 2, 3, 4, 5]}
                tick={{ fontSize: 12, fill: COLORES_TEMA.unipamplona.textoSecundario }}
              />
              <YAxis
                type="category"
                dataKey="asignatura"
                tick={{ fontSize: 12, fill: COLORES_TEMA.unipamplona.texto }}
                width={190}
              />
              <Tooltip
                formatter={(valor: unknown) => [
                  `${Number(valor ?? 0).toFixed(2)} / 5.0`,
                  'Carga percibida',
                ]}
                contentStyle={{
                  backgroundColor: COLORES_TEMA.unipamplona.blanco,
                  borderColor: COLORES_TEMA.unipamplona.borde,
                  borderRadius: '0.375rem',
                  fontSize: '0.75rem',
                }}
              />
              <Bar dataKey="carga" radius={[0, 4, 4, 0]} barSize={20}>
                {datosGrafico.map((entry, index) => (
                  <Cell key={`bar-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-4 border-t border-slate-100 pt-3 text-xs text-slate-600">
          <div className="flex items-center gap-2">
            <span
              className="h-3 w-3 rounded-sm shrink-0"
              style={{ backgroundColor: COLORES_TEMA.riesgo.alto }}
            />
            <span>Sobrecarga alta (≥ 4.20)</span>
          </div>
          <div className="flex items-center gap-2">
            <span
              className="h-3 w-3 rounded-sm shrink-0"
              style={{ backgroundColor: COLORES_TEMA.riesgo.medio }}
            />
            <span>Carga moderada (&lt; 4.20)</span>
          </div>
        </div>
      </div>

      {/* Tabla Detallada por Materia */}
      <div className="rounded-lg border border-slate-200 bg-white p-5">
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-slate-800">
            Detalle Académico por Asignatura
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Indicadores curriculares para la toma de decisiones docentes.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-xs font-semibold text-slate-600 uppercase tracking-wider">
              <tr>
                <th scope="col" className="px-4 py-3">Asignatura</th>
                <th scope="col" className="px-4 py-3">Semestre</th>
                <th scope="col" className="px-4 py-3 text-right">Estudiantes</th>
                <th scope="col" className="px-4 py-3 text-right">Carga Percibida</th>
                <th scope="col" className="px-4 py-3 text-right">Tasa Alerta</th>
                <th scope="col" className="px-4 py-3 text-right">Asistencia</th>
                <th scope="col" className="px-4 py-3 text-right">Estudio Autónomo</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {materias.map((m) => {
                const esSobrecarga = m.carga_promedio >= 4.2
                return (
                  <tr key={m.asignatura} className="hover:bg-slate-50/80 transition">
                    <td className="px-4 py-3 font-medium text-slate-800">{m.asignatura}</td>
                    <td className="px-4 py-3 tabular-nums text-slate-600">Sem. {m.semestre}</td>
                    <td className="px-4 py-3 tabular-nums text-right text-slate-700">
                      {m.estudiantes_matriculados}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span
                        className={`inline-block rounded px-2 py-0.5 text-xs font-semibold tabular-nums ${
                          esSobrecarga
                            ? 'bg-amber-100 text-amber-900 border border-amber-300'
                            : 'bg-slate-100 text-slate-700 border border-slate-200'
                        }`}
                      >
                        {m.carga_promedio.toFixed(2)} / 5.0
                      </span>
                    </td>
                    <td className="px-4 py-3 tabular-nums text-right text-slate-700 font-medium">
                      {m.tasa_riesgo_pct.toFixed(1)}%
                    </td>
                    <td className="px-4 py-3 tabular-nums text-right text-slate-600">
                      {m.asistencia_promedio_pct.toFixed(1)}%
                    </td>
                    <td className="px-4 py-3 tabular-nums text-right text-slate-600">
                      {m.horas_estudio_promedio.toFixed(1)} h/sem
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Aviso ético permanente */}
      <AvisoEtico />
    </div>
  )
}
