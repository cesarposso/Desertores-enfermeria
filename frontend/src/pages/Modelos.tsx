import { useEffect, useState } from 'react'
import { obtenerMetricasModelos, formatearNombreModelo, COLORES_TEMA } from '../api/cliente'
import type { MetricasModelos, MetricasModeloDetalle } from '../api/cliente'
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
  Legend,
  CartesianGrid,
} from 'recharts'
import { Award, Info, ShieldCheck } from 'lucide-react'

export default function Modelos() {
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [metricas, setMetricas] = useState<MetricasModelos | null>(null)

  const cargarDatos = async () => {
    try {
      setCargando(true)
      setError(null)
      const data = await obtenerMetricasModelos()
      setMetricas(data)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al cargar las métricas de modelos'
      setError(msg)
    } finally {
      setCargando(false)
    }
  }

  useEffect(() => {
    cargarDatos()
  }, [])

  if (cargando) {
    return <CargandoSpinner mensaje="Cargando métricas de validación cruzada de modelos..." />
  }

  if (error || !metricas) {
    return (
      <div className="max-w-2xl">
        <ErrorCartel mensaje={error || 'No se pudieron recuperar las métricas'} onReintentar={cargarDatos} />
      </div>
    )
  }

  const { mejor_modelo, regresion_logistica, arbol_decision, bosque_aleatorio } = metricas

  // Modelos formateados para tabla
  const listaModelos: Array<{
    clave: string
    nombre: string
    descripcion: string
    detalle: MetricasModeloDetalle
    esMejor: boolean
  }> = [
    {
      clave: 'bosque_aleatorio',
      nombre: 'Bosque Aleatorio (Random Forest)',
      descripcion: 'Ensamble de múltiples árboles de decisión; reduce la varianza y captura interacciones no lineales complejas entre variables socioacadémicas.',
      detalle: bosque_aleatorio,
      esMejor: mejor_modelo === 'bosque_aleatorio',
    },
    {
      clave: 'regresion_logistica',
      nombre: 'Regresión Logística',
      descripcion: 'Modelo lineal probabilístico base; altamente interpretable a través de los coeficientes de momios (odds ratios).',
      detalle: regresion_logistica,
      esMejor: mejor_modelo === 'regresion_logistica',
    },
    {
      clave: 'arbol_decision',
      nombre: 'Árbol de Decisión (CART)',
      descripcion: 'Estructura jerárquica de reglas de corte; fácil de auditar pedagógicamente mediante umbrales condicionales paso a paso.',
      detalle: arbol_decision,
      esMejor: mejor_modelo === 'arbol_decision',
    },
  ]

  // Formato para gráfico comparativo (agrupado por métrica)
  const datosGrafico = [
    {
      metrica: 'Sensibilidad (Recall)',
      'Bosque Aleatorio': Number((bosque_aleatorio.recall.mean * 100).toFixed(1)),
      'Regresión Logística': Number((regresion_logistica.recall.mean * 100).toFixed(1)),
      'Árbol de Decisión': Number((arbol_decision.recall.mean * 100).toFixed(1)),
    },
    {
      metrica: 'Precisión',
      'Bosque Aleatorio': Number((bosque_aleatorio.precision.mean * 100).toFixed(1)),
      'Regresión Logística': Number((regresion_logistica.precision.mean * 100).toFixed(1)),
      'Árbol de Decisión': Number((arbol_decision.precision.mean * 100).toFixed(1)),
    },
    {
      metrica: 'F1-Score',
      'Bosque Aleatorio': Number((bosque_aleatorio.f1.mean * 100).toFixed(1)),
      'Regresión Logística': Number((regresion_logistica.f1.mean * 100).toFixed(1)),
      'Árbol de Decisión': Number((arbol_decision.f1.mean * 100).toFixed(1)),
    },
    {
      metrica: 'AUC-ROC',
      'Bosque Aleatorio': Number((bosque_aleatorio.roc_auc.mean * 100).toFixed(1)),
      'Regresión Logística': Number((regresion_logistica.roc_auc.mean * 100).toFixed(1)),
      'Árbol de Decisión': Number((arbol_decision.roc_auc.mean * 100).toFixed(1)),
    },
    {
      metrica: 'Exactitud (Accuracy)',
      'Bosque Aleatorio': Number((bosque_aleatorio.accuracy.mean * 100).toFixed(1)),
      'Regresión Logística': Number((regresion_logistica.accuracy.mean * 100).toFixed(1)),
      'Árbol de Decisión': Number((arbol_decision.accuracy.mean * 100).toFixed(1)),
    },
  ]

  const formatearM = (m?: { mean: number; std: number }) => {
    if (!m) return '—'
    return `${(m.mean * 100).toFixed(1)}% ± ${(m.std * 100).toFixed(1)}%`
  }

  return (
    <div className="space-y-6">
      {/* Encabezado */}
      <div>
        <h1 className="text-2xl font-semibold text-slate-800">
          Transparencia y Comparativa de Modelos
        </h1>
        <p className="text-sm text-slate-600 mt-1">
          Evaluación empírica mediante validación cruzada estratificada (5 pliegues) sobre el conjunto de
          150 estudiantes de Enfermería · Universidad de Pamplona.
        </p>
      </div>

      {/* Nota Metodológica de Datos Sintéticos */}
      <div className="rounded-lg border border-amber-200 bg-amber-50/80 p-4">
        <div className="flex items-start gap-3">
          <Info className="h-5 w-5 shrink-0 text-amber-800 mt-0.5" aria-hidden="true" />
          <div className="space-y-1">
            <h2 className="text-sm font-semibold text-amber-900">
              Marco de Validación con Datos Sintéticos
            </h2>
            <p className="text-xs text-amber-900/90 leading-relaxed">
              Las métricas presentadas a continuación fueron calculadas rigurosamente sobre el dataset
              sintético generado para este semillero de investigación. Los valores cercanos o iguales al 100%
              responden a la consistencia controlada de los patrones sintéticos simulados; en entornos con datos
              reales se espera una variabilidad y calibración superior. El propósito de este módulo es demostrar la
              trazabilidad y la interpretabilidad algorítmica para la toma de decisiones docentes.
            </p>
          </div>
        </div>
      </div>

      {/* Tarjeta de Modelo Ganador */}
      <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-xs">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-unipamplona-rojo-light p-2.5 text-unipamplona-rojo border border-unipamplona-rojo/20">
              <Award className="h-6 w-6" aria-hidden="true" />
            </div>
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-unipamplona-rojo">
                Modelo Institucional Recomendado
              </span>
              <h2 className="text-lg font-semibold text-slate-800">
                {formatearNombreModelo(mejor_modelo)}
              </h2>
            </div>
          </div>
          <div className="flex items-center gap-2 rounded-md bg-emerald-50 px-3 py-1.5 border border-emerald-200 text-xs text-emerald-800 font-medium">
            <ShieldCheck className="h-4 w-4 shrink-0 text-emerald-700" />
            <span>Mayor F1-Score en Validación Cruzada</span>
          </div>
        </div>
        <p className="mt-3 text-xs text-slate-600 leading-relaxed">
          Se seleccionó este modelo porque optimiza simultáneamente la <strong>Sensibilidad (Recall)</strong> —garantizando
          que ningún estudiante en riesgo real quede sin detección preventiva— y la <strong>Precisión</strong>,
          minimizando falsas alarmas que sobrecarguen el horario de tutorías docentes.
        </p>
      </div>

      {/* Gráfico Comparativo Agrupado */}
      <div className="rounded-lg border border-slate-200 bg-white p-5">
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-slate-800">
            Comparación Visual de Rendimiento (%)
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Desempeño medio en escala de 0 a 100% para cada métrica evaluada.
          </p>
        </div>

        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={datosGrafico}
              margin={{ top: 20, right: 20, left: 0, bottom: 10 }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={COLORES_TEMA.unipamplona.grid} />
              <XAxis
                dataKey="metrica"
                tick={{ fontSize: 11, fill: COLORES_TEMA.unipamplona.texto }}
                interval={0}
              />
              <YAxis
                domain={[85, 100]}
                ticks={[85, 90, 95, 100]}
                tick={{ fontSize: 11, fill: COLORES_TEMA.unipamplona.textoSecundario }}
              />
              <Tooltip
                formatter={(val: unknown) => [`${Number(val ?? 0).toFixed(1)}%`]}
                contentStyle={{
                  backgroundColor: COLORES_TEMA.unipamplona.blanco,
                  borderColor: COLORES_TEMA.unipamplona.borde,
                  borderRadius: '0.375rem',
                  fontSize: '0.75rem',
                }}
              />
              <Legend wrapperStyle={{ fontSize: '0.75rem', paddingTop: '10px' }} />
              <Bar dataKey="Bosque Aleatorio" fill={COLORES_TEMA.modelos.bosque} radius={[3, 3, 0, 0]} />
              <Bar dataKey="Regresión Logística" fill={COLORES_TEMA.modelos.regresion} radius={[3, 3, 0, 0]} />
              <Bar dataKey="Árbol de Decisión" fill={COLORES_TEMA.modelos.arbol} radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Tabla Comparativa Detallada */}
      <div className="rounded-lg border border-slate-200 bg-white p-5">
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-slate-800">
            Matriz de Métricas (Media ± Desviación Estándar)
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Promedios y variabilidad observados a lo largo de los 5 pliegues estratificados.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-xs font-semibold text-slate-600 uppercase tracking-wider">
              <tr>
                <th scope="col" className="px-4 py-3">Modelo</th>
                <th scope="col" className="px-4 py-3 text-right">Sensibilidad (Recall)</th>
                <th scope="col" className="px-4 py-3 text-right">Precisión</th>
                <th scope="col" className="px-4 py-3 text-right">F1-Score</th>
                <th scope="col" className="px-4 py-3 text-right">AUC-ROC</th>
                <th scope="col" className="px-4 py-3 text-right">Exactitud (Accuracy)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {listaModelos.map((m) => (
                <tr
                  key={m.clave}
                  className={`hover:bg-slate-50/80 transition ${
                    m.esMejor ? 'bg-unipamplona-rojo-light/40 font-medium' : ''
                  }`}
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className="text-slate-800 font-semibold">{m.nombre}</span>
                      {m.esMejor && (
                        <span className="rounded-full bg-unipamplona-rojo-light px-2 py-0.5 text-[10px] font-semibold text-unipamplona-rojo border border-unipamplona-rojo/30">
                          Recomendado
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5 max-w-md">{m.descripcion}</p>
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums text-slate-700">
                    {formatearM(m.detalle.recall)}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums text-slate-700">
                    {formatearM(m.detalle.precision)}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums text-slate-900 font-semibold">
                    {formatearM(m.detalle.f1)}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums text-slate-700">
                    {formatearM(m.detalle.roc_auc)}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums text-slate-700">
                    {formatearM(m.detalle.accuracy)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Aviso ético permanente */}
      <AvisoEtico />
    </div>
  )
}
