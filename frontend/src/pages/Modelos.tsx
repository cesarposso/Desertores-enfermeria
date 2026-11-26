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
      const msg =
        err instanceof Error ? err.message : 'Error al cargar las métricas de modelos'
      setError(msg)
    } finally {
      setCargando(false)
    }
  }

  useEffect(() => {
    void cargarDatos()
  }, [])

  if (cargando) {
    return <CargandoSpinner mensaje="Cargando métricas de validación cruzada de modelos..." />
  }

  if (error || !metricas) {
    return (
      <div className="max-w-2xl">
        <ErrorCartel
          mensaje={error || 'No se pudieron recuperar las métricas'}
          onReintentar={cargarDatos}
        />
      </div>
    )
  }

  const { mejor_modelo, regresion_logistica, arbol_decision, bosque_aleatorio, logica_difusa } =
    metricas

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
      descripcion:
        'Ensamble de múltiples árboles de decisión; reduce la varianza y captura interacciones no lineales complejas entre variables socioacadémicas.',
      detalle: bosque_aleatorio,
      esMejor: mejor_modelo === 'bosque_aleatorio',
    },
    {
      clave: 'regresion_logistica',
      nombre: 'Regresión Logística',
      descripcion:
        'Modelo lineal probabilístico base; altamente interpretable a través de los coeficientes de momios (odds ratios).',
      detalle: regresion_logistica,
      esMejor: mejor_modelo === 'regresion_logistica',
    },
    {
      clave: 'arbol_decision',
      nombre: 'Árbol de Decisión (CART)',
      descripcion:
        'Estructura jerárquica de reglas de corte; fácil de auditar pedagógicamente mediante umbrales condicionales paso a paso.',
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

  const datosGrafico = [
    {
      metrica: 'Sensibilidad (Recall)',
      'Bosque Aleatorio': Number((bosque_aleatorio.recall.mean * 100).toFixed(1)),
      'Regresión Logística': Number((regresion_logistica.recall.mean * 100).toFixed(1)),
      'Árbol de Decisión': Number((arbol_decision.recall.mean * 100).toFixed(1)),
      ...(logica_difusa
        ? { 'Lógica Difusa': Number((logica_difusa.recall.mean * 100).toFixed(1)) }
        : {}),
    },
    {
      metrica: 'Precisión',
      'Bosque Aleatorio': Number((bosque_aleatorio.precision.mean * 100).toFixed(1)),
      'Regresión Logística': Number((regresion_logistica.precision.mean * 100).toFixed(1)),
      'Árbol de Decisión': Number((arbol_decision.precision.mean * 100).toFixed(1)),
      ...(logica_difusa
        ? { 'Lógica Difusa': Number((logica_difusa.precision.mean * 100).toFixed(1)) }
        : {}),
    },
    {
      metrica: 'F1-Score',
      'Bosque Aleatorio': Number((bosque_aleatorio.f1.mean * 100).toFixed(1)),
      'Regresión Logística': Number((regresion_logistica.f1.mean * 100).toFixed(1)),
      'Árbol de Decisión': Number((arbol_decision.f1.mean * 100).toFixed(1)),
      ...(logica_difusa
        ? { 'Lógica Difusa': Number((logica_difusa.f1.mean * 100).toFixed(1)) }
        : {}),
    },
    {
      metrica: 'AUC-ROC',
      'Bosque Aleatorio': Number((bosque_aleatorio.roc_auc.mean * 100).toFixed(1)),
      'Regresión Logística': Number((regresion_logistica.roc_auc.mean * 100).toFixed(1)),
      'Árbol de Decisión': Number((arbol_decision.roc_auc.mean * 100).toFixed(1)),
      ...(logica_difusa
        ? { 'Lógica Difusa': Number((logica_difusa.roc_auc.mean * 100).toFixed(1)) }
        : {}),
    },
    {
      metrica: 'Exactitud (Accuracy)',
      'Bosque Aleatorio': Number((bosque_aleatorio.accuracy.mean * 100).toFixed(1)),
      'Regresión Logística': Number((regresion_logistica.accuracy.mean * 100).toFixed(1)),
      'Árbol de Decisión': Number((arbol_decision.accuracy.mean * 100).toFixed(1)),
      ...(logica_difusa
        ? { 'Lógica Difusa': Number((logica_difusa.accuracy.mean * 100).toFixed(1)) }
        : {}),
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
        <h1 className="text-3xl font-semibold tracking-tight text-zinc-900 dark:text-[#F4F4F5]">
          Transparencia y Comparativa de Modelos
        </h1>
        <p className="mt-1 max-w-3xl text-sm text-zinc-600 dark:text-[#A1A1AA]">
          Evaluación empírica mediante validación cruzada estratificada (5 pliegues) sobre el
          conjunto de 150 estudiantes de Enfermería · Universidad de Pamplona.
        </p>
      </div>

      {/* Nota Metodológica */}
      <section className="rounded-[24px] border border-amber-300/70 bg-amber-50/90 p-5 dark:border-amber-400/25 dark:bg-amber-500/15">
        <div className="flex items-start gap-3">
          <Info
            className="mt-0.5 h-5 w-5 shrink-0 text-amber-800 dark:text-amber-300"
            aria-hidden="true"
          />
          <div className="space-y-1">
            <h2 className="text-sm font-semibold text-amber-950 dark:text-amber-200">
              Marco de Validación con Datos Sintéticos
            </h2>
            <p className="max-w-[60ch] text-xs leading-relaxed text-amber-900 dark:text-amber-100/90 text-pretty">
              Las métricas presentadas a continuación fueron calculadas rigurosamente sobre el
              dataset sintético generado para este semillero de investigación. Los valores cercanos
              o iguales al 100% responden a la consistencia controlada de los patrones sintéticos
              simulados; en entornos con datos reales se espera una variabilidad y calibración
              superior.
            </p>
          </div>
        </div>
      </section>

      {/* Tarjeta de Modelo Ganador */}
      <section className="bento-card p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3.5">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-unipamplona-rojo/20 bg-unipamplona-rojo-light text-unipamplona-rojo dark:border-unipamplona-rojo/35 dark:bg-unipamplona-rojo/20 dark:text-red-200">
              <Award className="h-6 w-6" aria-hidden="true" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-zinc-900 dark:text-[#F4F4F5]">
                {formatearNombreModelo(mejor_modelo)}
              </h2>
              <p className="text-xs font-medium text-unipamplona-rojo dark:text-red-300">
                Modelo institucional recomendado
              </p>
            </div>
          </div>

          <div className="inline-flex items-center gap-2 self-start rounded-full border border-emerald-200 bg-emerald-50 px-3.5 py-1.5 text-xs font-medium text-emerald-800 dark:border-emerald-400/30 dark:bg-emerald-500/15 dark:text-emerald-200 sm:self-auto">
            <ShieldCheck
              className="h-4 w-4 shrink-0 text-emerald-700 dark:text-emerald-300"
              aria-hidden="true"
            />
            <span>Mayor F1-Score en Validación Cruzada</span>
          </div>
        </div>

        <p className="mt-4 max-w-[60ch] text-xs leading-relaxed text-zinc-600 dark:text-[#A1A1AA] text-pretty">
          Se seleccionó este modelo porque optimiza simultáneamente la{' '}
          <strong className="text-zinc-900 dark:text-zinc-100">Sensibilidad (Recall)</strong>{' '}
          —garantizando que ningún estudiante en riesgo real quede sin detección preventiva— y la{' '}
          <strong className="text-zinc-900 dark:text-zinc-100">Precisión</strong>, minimizando
          falsas alarmas que sobrecarguen el horario de tutorías docentes.
        </p>
      </section>

      {/* Gráfico Comparativo Agrupado */}
      <section className="bento-card p-6">
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-[#F4F4F5]">
            Comparación Visual de Rendimiento (%)
          </h2>
          <p className="mt-0.5 text-xs text-zinc-600 dark:text-[#A1A1AA]">
            Desempeño medio en escala de 0 a 100% para cada métrica evaluada.
          </p>
        </div>

        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={datosGrafico} margin={{ top: 16, right: 16, left: -12, bottom: 8 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--chart-grid)" />
              <XAxis
                dataKey="metrica"
                tick={{ fontSize: 11, fill: 'var(--chart-axis)' }}
                interval={0}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                domain={[0, 100]}
                ticks={[0, 20, 40, 60, 80, 100]}
                tick={{ fontSize: 11, fill: 'var(--chart-axis)' }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                cursor={{ fill: 'var(--chart-cursor)' }}
                formatter={(val: unknown) => [`${Number(val ?? 0).toFixed(1)}%`]}
                contentStyle={{
                  backgroundColor: '#18181B',
                  borderColor: 'rgba(255,255,255,0.12)',
                  borderRadius: '1rem',
                  fontSize: '0.75rem',
                  color: '#FFFFFF',
                }}
                itemStyle={{ color: '#F4F4F5' }}
                labelStyle={{ color: '#FFFFFF', fontWeight: 600 }}
              />
              <Legend
                wrapperStyle={{ fontSize: '0.75rem', paddingTop: '12px' }}
                formatter={(value) => (
                  <span className="font-medium text-zinc-700 dark:text-zinc-300">{value}</span>
                )}
              />
              <Bar
                dataKey="Bosque Aleatorio"
                isAnimationActive={false}
                fill={COLORES_TEMA.modelos.bosque}
                radius={[8, 8, 0, 0]}
              />
              <Bar
                dataKey="Regresión Logística"
                isAnimationActive={false}
                fill={COLORES_TEMA.modelos.regresion}
                radius={[8, 8, 0, 0]}
              />
              <Bar
                dataKey="Árbol de Decisión"
                isAnimationActive={false}
                fill={COLORES_TEMA.modelos.arbol}
                radius={[8, 8, 0, 0]}
              />
              {logica_difusa && (
                <Bar
                  dataKey="Lógica Difusa"
                  isAnimationActive={false}
                  fill={COLORES_TEMA.modelos.difuso}
                  radius={[8, 8, 0, 0]}
                />
              )}
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      {/* Tabla Comparativa Detallada */}
      <section className="bento-card overflow-hidden">
        <div className="border-b border-black/5 px-6 py-5 dark:border-white/10">
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-[#F4F4F5]">
            Matriz de Métricas (Media ± Desviación Estándar)
          </h2>
          <p className="mt-0.5 text-xs text-zinc-600 dark:text-[#A1A1AA]">
            Promedios y variabilidad observados a lo largo de los 5 pliegues estratificados.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-black/5 bg-zinc-50/90 text-xs font-semibold uppercase tracking-wider text-zinc-600 dark:border-white/10 dark:bg-white/[0.03] dark:text-[#A1A1AA]">
              <tr>
                <th scope="col" className="px-6 py-3.5">
                  Modelo
                </th>
                <th scope="col" className="px-4 py-3.5 text-right">
                  Sensibilidad (Recall)
                </th>
                <th scope="col" className="px-4 py-3.5 text-right">
                  Precisión
                </th>
                <th scope="col" className="px-4 py-3.5 text-right">
                  F1-Score
                </th>
                <th scope="col" className="px-4 py-3.5 text-right">
                  AUC-ROC
                </th>
                <th scope="col" className="px-6 py-3.5 text-right">
                  Exactitud (Accuracy)
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/[0.04] dark:divide-white/[0.06]">
              {listaModelos.map((m) => (
                <tr
                  key={m.clave}
                  className={`transition-colors duration-150 hover:bg-zinc-50/80 dark:hover:bg-white/[0.03] ${
                    m.esMejor ? 'bg-unipamplona-rojo-light/40 dark:bg-unipamplona-rojo/15' : ''
                  }`}
                >
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-semibold text-zinc-900 dark:text-[#F4F4F5]">
                        {m.nombre}
                      </span>
                      {m.esMejor && (
                        <span className="rounded-full border border-unipamplona-rojo/30 bg-unipamplona-rojo-light px-2.5 py-0.5 text-xs font-semibold text-unipamplona-rojo dark:border-unipamplona-rojo/40 dark:bg-unipamplona-rojo/25 dark:text-red-200">
                          Recomendado
                        </span>
                      )}
                      {m.esExperto && (
                        <span className="rounded-full border border-teal-200 bg-teal-50 px-2.5 py-0.5 text-xs font-semibold text-teal-800 dark:border-teal-400/30 dark:bg-teal-500/15 dark:text-teal-200">
                          Conocimiento experto
                        </span>
                      )}
                    </div>
                    <p className="mt-1 max-w-md text-xs text-zinc-600 dark:text-[#A1A1AA] text-pretty">
                      {m.descripcion}
                    </p>
                  </td>
                  <td className="px-4 py-4 text-right tabular-nums text-zinc-700 dark:text-zinc-300">
                    {formatearM(m.detalle.recall, m.detalle.sin_entrenamiento)}
                  </td>
                  <td className="px-4 py-4 text-right tabular-nums text-zinc-700 dark:text-zinc-300">
                    {formatearM(m.detalle.precision, m.detalle.sin_entrenamiento)}
                  </td>
                  <td className="px-4 py-4 text-right font-semibold tabular-nums text-zinc-900 dark:text-[#F4F4F5]">
                    {formatearM(m.detalle.f1, m.detalle.sin_entrenamiento)}
                  </td>
                  <td className="px-4 py-4 text-right tabular-nums text-zinc-700 dark:text-zinc-300">
                    {formatearM(m.detalle.roc_auc, m.detalle.sin_entrenamiento)}
                  </td>
                  <td className="px-6 py-4 text-right tabular-nums text-zinc-700 dark:text-zinc-300">
                    {formatearM(m.detalle.accuracy, m.detalle.sin_entrenamiento)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {logica_difusa && (
          <div className="border-t border-teal-200/70 bg-teal-50/60 p-6 text-xs leading-relaxed text-teal-950 dark:border-teal-400/25 dark:bg-teal-500/10 dark:text-teal-100">
            <p className="font-semibold text-teal-900 dark:text-teal-200">
              ¿Por qué incluir Lógica Difusa para cohortes pequeñas?
            </p>
            <p className="mt-1 max-w-[60ch] text-teal-900/90 dark:text-teal-100/90 text-pretty">
              A diferencia de los modelos de Machine Learning supervisados, el motor difuso Mamdani
              no requiere entrenamiento por pliegues ni grandes volúmenes históricos: traduce
              directamente el criterio pedagógico en reglas SI–ENTONCES auditables, evitando el
              sobreajuste cuando el número de estudiantes es reducido.
              {logica_difusa.umbral_preventivo_35 && (
                <span className="mt-1.5 block tabular-nums">
                  Con el umbral preventivo institucional (≥ 35%), alcanza{' '}
                  <strong>{(logica_difusa.umbral_preventivo_35.recall * 100).toFixed(1)}%</strong>{' '}
                  de sensibilidad y{' '}
                  <strong>{(logica_difusa.umbral_preventivo_35.f1 * 100).toFixed(1)}%</strong> de
                  F1-Score ({logica_difusa.umbral_preventivo_35.estudiantes_marcados} estudiantes
                  priorizados).
                </span>
              )}
            </p>
          </div>
        )}
      </section>

      <AvisoEtico />
    </div>
  )
}
