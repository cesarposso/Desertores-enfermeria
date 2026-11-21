import { useEffect, useState } from 'react'
import {
  obtenerEstudiantesRiesgo,
  obtenerCargaMaterias,
  obtenerMetricasModelos,
  formatearNombreModelo,
  COLORES_TEMA,
} from '../api/cliente'
import type {
  EstudianteRiesgo,
  MateriaCarga,
  MetricasModelos,
} from '../api/cliente'
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
} from 'recharts'
import { AlertTriangle, BookOpen, Brain, CalendarCheck } from 'lucide-react'

export default function Resumen() {
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [estudiantes, setEstudiantes] = useState<EstudianteRiesgo[]>([])
  const [materias, setMaterias] = useState<MateriaCarga[]>([])
  const [metricas, setMetricas] = useState<MetricasModelos | null>(null)

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
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error desconocido al conectar con el servidor'
      setError(msg)
    } finally {
      setCargando(false)
    }
  }

  useEffect(() => {
    cargarDatos()
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

  // Cálculos estadísticos
  const totalEstudiantes = estudiantes.length
  const totalAlto = estudiantes.filter((e) => e.nivel_riesgo === 'alto').length
  const totalMedio = estudiantes.filter((e) => e.nivel_riesgo === 'medio').length
  const totalBajo = estudiantes.filter((e) => e.nivel_riesgo === 'bajo').length

  const pctAlto = totalEstudiantes > 0 ? ((totalAlto / totalEstudiantes) * 100).toFixed(1) : '0'

  const totalCitados = estudiantes.filter((e) => e.estado_tutoria === 'citado').length
  const totalPendientes = totalEstudiantes - totalCitados
  const citadosPrioritarios = estudiantes.filter(
    (e) => e.nivel_riesgo === 'alto' && e.estado_tutoria === 'citado',
  ).length

  // Materia con mayor carga percibida
  const materiaPico = [...materias].sort((a, b) => b.carga_promedio - a.carga_promedio)[0]

  // F1 del mejor modelo
  const mejorModeloClave = metricas?.mejor_modelo || 'bosque_aleatorio'
  const f1MejorModelo =
    mejorModeloClave === 'bosque_aleatorio'
      ? metricas?.bosque_aleatorio?.f1?.mean
      : mejorModeloClave === 'arbol_decision'
      ? metricas?.arbol_decision?.f1?.mean
      : metricas?.regresion_logistica?.f1?.mean

  const f1Display = f1MejorModelo !== undefined ? `${(f1MejorModelo * 100).toFixed(1)}%` : '—'

  // Datos para gráfico de barras breve usando colores centralizados del tema
  const datosGrafico = [
    {
      categoria: 'Acompañamiento prioritario',
      cantidad: totalAlto,
      porcentaje: pctAlto,
      color: COLORES_TEMA.riesgo.alto, // Ámbar suave, distinguible del rojo institucional
    },
    {
      categoria: 'Seguimiento preventivo',
      cantidad: totalMedio,
      porcentaje: totalEstudiantes > 0 ? ((totalMedio / totalEstudiantes) * 100).toFixed(1) : '0',
      color: COLORES_TEMA.riesgo.medio, // Azul pizarra
    },
    {
      categoria: 'Situación estable',
      cantidad: totalBajo,
      porcentaje: totalEstudiantes > 0 ? ((totalBajo / totalEstudiantes) * 100).toFixed(1) : '0',
      color: COLORES_TEMA.riesgo.bajo, // Esmeralda
    },
  ]

  return (
    <div className="space-y-6">
      {/* Encabezado */}
      <div>
        <h1 className="text-2xl font-semibold text-slate-800">Resumen General</h1>
        <p className="text-sm text-slate-600 mt-1">
          Estado consolidado de alerta temprana y sobrecarga académica percibida para el programa de
          Enfermería · Universidad de Pamplona.
        </p>
      </div>

      {/* Grid de Tarjetas KPI */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Tarjeta 1: Acompañamiento Prioritario */}
        <div className="rounded-lg border border-amber-200 bg-amber-50/70 p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wider text-amber-900">
              Acompañamiento Prioritario
            </span>
            <AlertTriangle className="h-4 w-4 text-amber-800" aria-hidden="true" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-semibold tabular-nums text-amber-900">{totalAlto}</span>
            <span className="text-xs text-amber-800 tabular-nums">
              de {totalEstudiantes} ({pctAlto}%)
            </span>
          </div>
          <p className="mt-2 text-xs text-amber-900/90 leading-relaxed">
            Estudiantes con mayor probabilidad orientadora de requerir apoyo formativo.
          </p>
        </div>

        {/* Tarjeta 2: Materia con Mayor Carga */}
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wider text-slate-500">
              Mayor Carga Percibida
            </span>
            <BookOpen className="h-4 w-4 text-slate-600" aria-hidden="true" />
          </div>
          <div className="mt-2">
            <p className="text-base font-semibold text-slate-800 truncate" title={materiaPico?.asignatura}>
              {materiaPico ? materiaPico.asignatura : 'Sin datos'}
            </p>
            <div className="mt-1 flex items-baseline gap-1">
              <span className="text-2xl font-semibold tabular-nums text-slate-800">
                {materiaPico ? materiaPico.carga_promedio.toFixed(2) : '—'}
              </span>
              <span className="text-xs text-slate-500">/ 5.0 (Sem. {materiaPico?.semestre})</span>
            </div>
          </div>
          <p className="mt-2 text-xs text-slate-500">
            {materiaPico ? `${materiaPico.tasa_riesgo_pct}% con tasa de alerta` : '—'}
          </p>
        </div>

        {/* Tarjeta 3: Mejor Modelo */}
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wider text-slate-500">
              Modelo Predictor Activo
            </span>
            <Brain className="h-4 w-4 text-unipamplona-rojo" aria-hidden="true" />
          </div>
          <div className="mt-2">
            <p className="text-sm font-semibold text-slate-800 leading-snug">
              {formatearNombreModelo(mejorModeloClave)}
            </p>
            <div className="mt-1 flex items-baseline gap-1">
              <span className="text-2xl font-semibold tabular-nums text-slate-800">{f1Display}</span>
              <span className="text-xs text-slate-500">F1-score medio (CV 5-fold)</span>
            </div>
          </div>
          <p className="mt-2 text-xs text-slate-500">Validado sobre 150 registros sintéticos.</p>
        </div>

        {/* Tarjeta 4: Gestión de Tutorías */}
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wider text-slate-500">
              Gestión de Tutorías
            </span>
            <CalendarCheck className="h-4 w-4 text-emerald-700" aria-hidden="true" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-semibold tabular-nums text-slate-800">{totalCitados}</span>
            <span className="text-xs text-slate-500 tabular-nums">citados · {totalPendientes} pendientes</span>
          </div>
          <p className="mt-2 text-xs text-slate-500 leading-relaxed">
            Prioritarios: <strong className="tabular-nums text-slate-700">{citadosPrioritarios}</strong> de <strong className="tabular-nums text-slate-700">{totalAlto}</strong> convocados a tutoría.
          </p>
        </div>
      </div>

      {/* Gráfico Breve de Distribución */}
      <div className="rounded-lg border border-slate-200 bg-white p-5">
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-slate-800">
            Distribución de Estudiantes por Nivel de Acompañamiento
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Proporción orientadora del cohorte evaluado según probabilidad predictiva.
          </p>
        </div>

        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={datosGrafico}
              layout="vertical"
              margin={{ top: 10, right: 30, left: 20, bottom: 10 }}
            >
              <XAxis
                type="number"
                tick={{ fontSize: 12, fill: COLORES_TEMA.unipamplona.textoSecundario }}
                domain={[0, 'dataMax + 10']}
              />
              <YAxis
                type="category"
                dataKey="categoria"
                tick={{ fontSize: 12, fill: COLORES_TEMA.unipamplona.texto }}
                width={180}
              />
              <Tooltip
                formatter={(valor: unknown) => [
                  `${valor ?? 0} estudiantes`,
                  'Cantidad',
                ]}
                contentStyle={{
                  backgroundColor: COLORES_TEMA.unipamplona.blanco,
                  borderColor: COLORES_TEMA.unipamplona.borde,
                  borderRadius: '0.375rem',
                  fontSize: '0.75rem',
                }}
              />
              <Bar dataKey="cantidad" radius={[0, 4, 4, 0]} barSize={22}>
                {datosGrafico.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-2 border-t border-slate-100 pt-3 sm:grid-cols-3 text-xs">
          <div className="flex items-center gap-2">
            <span
              className="h-3 w-3 rounded-sm shrink-0"
              style={{ backgroundColor: COLORES_TEMA.riesgo.alto }}
            />
            <span className="text-slate-600">
              Acompañamiento prioritario: <strong className="tabular-nums text-slate-800">{totalAlto}</strong> ({pctAlto}%)
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span
              className="h-3 w-3 rounded-sm shrink-0"
              style={{ backgroundColor: COLORES_TEMA.riesgo.medio }}
            />
            <span className="text-slate-600">
              Seguimiento preventivo: <strong className="tabular-nums text-slate-800">{totalMedio}</strong> (
              {totalEstudiantes > 0 ? ((totalMedio / totalEstudiantes) * 100).toFixed(1) : 0}%)
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span
              className="h-3 w-3 rounded-sm shrink-0"
              style={{ backgroundColor: COLORES_TEMA.riesgo.bajo }}
            />
            <span className="text-slate-600">
              Situación estable: <strong className="tabular-nums text-slate-800">{totalBajo}</strong> (
              {totalEstudiantes > 0 ? ((totalBajo / totalEstudiantes) * 100).toFixed(1) : 0}%)
            </span>
          </div>
        </div>
      </div>

      {/* Aviso ético permanente */}
      <AvisoEtico />
    </div>
  )
}
