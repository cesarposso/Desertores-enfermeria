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

  const { mejor_modelo, regresion_logistica, arbol_decision, bosque_aleatorio, logica_difusa } = metricas

  // Modelos formateados para tabla
  const listaModelos: Array<{
    clave: string
    nombre: string
    descripcion: string
    detalle: MetricasModeloDetalle
    esMejor: boolean
    esExperto?: boolean
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
    ...(logica_difusa
      ? [
          {
            clave: 'logica_difusa',
            nombre: 'Lógica Difusa (Mamdani)',
            descripcion:
              'Sistema de 9 reglas pedagógicas SI–ENTONCES basado en conocimiento experto (evaluación directa sin pliegues ni entrenamiento).',
            detalle: logica_difusa,
            esMejor: false,
            esExperto: true,
          },
        ]
      : []),
  ]

  // Formato para gráfico comparativo (agrupado por métrica)
  const datosGrafico = [
    {
      metrica: 'Sensibilidad (Recall)',
      'Bosque Aleatorio': Number((bosque_aleatorio.recall.mean * 100).toFixed(1)),
      'Regresión Logística': Number((regresion_logistica.recall.mean * 100).toFixed(1)),
      'Árbol de Decisión': Number((arbol_decision.recall.mean * 100).toFixed(1)),
      ...(logica_difusa ? { 'Lógica Difusa': Number((logica_difusa.recall.mean * 100).toFixed(1)) } : {}),
    },
    {
      metrica: 'Precisión',
      'Bosque Aleatorio': Number((bosque_aleatorio.precision.mean * 100).toFixed(1)),
      'Regresión Logística': Number((regresion_logistica.precision.mean * 100).toFixed(1)),
      'Árbol de Decisión': Number((arbol_decision.precision.mean * 100).toFixed(1)),
      ...(logica_difusa ? { 'Lógica Difusa': Number((logica_difusa.precision.mean * 100).toFixed(1)) } : {}),
    },
    {
      metrica: 'F1-Score',
      'Bosque Aleatorio': Number((bosque_aleatorio.f1.mean * 100).toFixed(1)),
      'Regresión Logística': Number((regresion_logistica.f1.mean * 100).toFixed(1)),
      'Árbol de Decisión': Number((arbol_decision.f1.mean * 100).toFixed(1)),
      ...(logica_difusa ? { 'Lógica Difusa': Number((logica_difusa.f1.mean * 100).toFixed(1)) } : {}),
    },
    {
      metrica: 'AUC-ROC',
      'Bosque Aleatorio': Number((bosque_aleatorio.roc_auc.mean * 100).toFixed(1)),
      'Regresión Logística': Number((regresion_logistica.roc_auc.mean * 100).toFixed(1)),
      'Árbol de Decisión': Number((arbol_decision.roc_auc.mean * 100).toFixed(1)),
      ...(logica_difusa ? { 'Lógica Difusa': Number((logica_difusa.roc_auc.mean * 100).toFixed(1)) } : {}),
    },
    {
      metrica: 'Exactitud (Accuracy)',
      'Bosque Aleatorio': Number((bosque_aleatorio.accuracy.mean * 100).toFixed(1)),
      'Regresión Logística': Number((regresion_logistica.accuracy.mean * 100).toFixed(1)),
      'Árbol de Decisión': Number((arbol_decision.accuracy.mean * 100).toFixed(1)),
      ...(logica_difusa ? { 'Lógica Difusa': Number((logica_difusa.accuracy.mean * 100).toFixed(1)) } : {}),
    },
  ]

  const formatearM = (m?: { mean: number; std: number }, sinEntrenamiento?: boolean) => {
    if (!m) return '—'
    if (sinEntrenamiento) return `${(m.mean * 100).toFixed(1)}%`
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
                domain={[0, 100]}
                ticks={[0, 20, 40, 60, 80, 100]}
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
              {logica_difusa && (
                <Bar dataKey="Lógica Difusa" fill={COLORES_TEMA.modelos.difuso} radius={[3, 3, 0, 0]} />
              )}
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
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-slate-800 font-semibold">{m.nombre}</span>
                      {m.esMejor && (
                        <span className="rounded-full bg-unipamplona-rojo-light px-2 py-0.5 text-[10px] font-semibold text-unipamplona-rojo border border-unipamplona-rojo/30">
                          Recomendado
                        </span>
                      )}
                      {m.esExperto && (
                        <span className="rounded-full bg-teal-50 px-2 py-0.5 text-[10px] font-semibold text-teal-800 border border-teal-200">
                          Conocimiento experto
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5 max-w-md">{m.descripcion}</p>
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums text-slate-700">
                    {formatearM(m.detalle.recall, m.detalle.sin_entrenamiento)}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums text-slate-700">
                    {formatearM(m.detalle.precision, m.detalle.sin_entrenamiento)}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums text-slate-900 font-semibold">
                    {formatearM(m.detalle.f1, m.detalle.sin_entrenamiento)}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums text-slate-700">
                    {formatearM(m.detalle.roc_auc, m.detalle.sin_entrenamiento)}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums text-slate-700">
                    {formatearM(m.detalle.accuracy, m.detalle.sin_entrenamiento)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {logica_difusa && (
          <div className="mt-4 rounded-md border border-teal-200 bg-teal-50/60 p-3.5 text-xs text-teal-950 leading-relaxed">
            <p className="font-semibold text-teal-900">
              ¿Por qué incluir Lógica Difusa para cohortes pequeñas?
            </p>
            <p className="mt-1 text-teal-900/90">
              A diferencia de los modelos de Machine Learning supervisados, el motor difuso Mamdani no requiere
              entrenamiento por pliegues ni grandes volúmenes históricos: traduce directamente el criterio pedagógico
              en reglas SI–ENTONCES auditables, evitando el sobreajuste cuando el número de estudiantes es reducido.
              {logica_difusa.umbral_preventivo_35 && (
                <span className="block mt-1 tabular-nums">
                  Con el umbral preventivo institucional (≥ 35%), alcanza{' '}
                  <strong>{(logica_difusa.umbral_preventivo_35.recall * 100).toFixed(1)}%</strong> de sensibilidad y{' '}
                  <strong>{(logica_difusa.umbral_preventivo_35.f1 * 100).toFixed(1)}%</strong> de F1-Score
                  ({logica_difusa.umbral_preventivo_35.estudiantes_marcados} estudiantes priorizados).
                </span>
              )}
            </p>
          </div>
        )}
      </div>

      {/* Aviso ético permanente */}
      <AvisoEtico />
    </div>
  )
}
