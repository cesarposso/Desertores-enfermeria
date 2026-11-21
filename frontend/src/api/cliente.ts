// Cliente de API — Panel de Alerta Temprana
// Conecta con backend FastAPI en http://localhost:8000

const BASE_URL = 'http://localhost:8000'

// ── Tipos ──────────────────────────────────────────────────────────────────

export type NivelRiesgo = 'alto' | 'medio' | 'bajo'
export type EstadoTutoria = 'pendiente' | 'citado'

export interface FactorCritico {
  factor: string
  peso_neto: number
  impacto_pct: number
  valor_actual: number
  descripcion: string
}

export interface EstudianteRiesgo {
  codigo_estudiante: string
  asignatura: string
  semestre: number
  probabilidad_riesgo: number
  nivel_riesgo: NivelRiesgo
  factor_principal: string
  factores_detalle: FactorCritico[]
  estado_tutoria: EstadoTutoria
  fecha_tutoria: string | null
  actualizado_en?: string | null
}

export interface EstudiantesRiesgoResponse {
  datos_sinteticos: boolean
  aviso_etico: string
  total: number
  estudiantes: EstudianteRiesgo[]
}

export interface MateriaCarga {
  asignatura: string
  semestre: number
  estudiantes_matriculados: number
  carga_promedio: number
  tasa_riesgo_pct: number
  asistencia_promedio_pct: number
  horas_estudio_promedio: number
}

export interface MetricaValor {
  mean: number
  std: number
}

export interface MetricasModeloDetalle {
  accuracy: MetricaValor
  f1: MetricaValor
  precision: MetricaValor
  recall: MetricaValor
  roc_auc: MetricaValor
}

export interface MetricasModelos {
  mejor_modelo: string
  regresion_logistica: MetricasModeloDetalle
  arbol_decision: MetricasModeloDetalle
  bosque_aleatorio: MetricasModeloDetalle
  datos_sinteticos: boolean
  aviso_etico: string
}

export interface SimuladorInput {
  asignatura: string
  nota_primer_parcial: number
  promedio_acumulado_cortes: number
  asistencia_pct: number
  repitente: number
  semestre: number
  carga_percibida: number
  horas_estudio_semana: number
  horas_sueno: number
  apoyo_economico_familiar: number
  trabajo_remunerado: number
  intencion_seguir: number
}

export interface SimuladorOutput {
  probabilidad_riesgo: number
  nivel_riesgo: NivelRiesgo
  mensaje_orientador: string
  factores_criticos: FactorCritico[]
  datos_sinteticos: boolean
  aviso_etico: string
}

export interface FiltrosRiesgo {
  asignatura?: string
  nivel_riesgo?: NivelRiesgo
  estado_tutoria?: EstadoTutoria
}

export interface ActualizarTutoriaPayload {
  estado: EstadoTutoria
  fecha?: string
}

// ── Fetch interno ──────────────────────────────────────────────────────────

async function fetchApi<T>(url: string, opciones?: RequestInit): Promise<T> {
  const response = await fetch(BASE_URL + url, {
    headers: { 'Content-Type': 'application/json' },
    ...opciones,
  })
  if (!response.ok) {
    const texto = await response.text()
    throw new Error(`Error ${response.status}: ${texto}`)
  }
  return response.json() as Promise<T>
}

// ── Funciones públicas ─────────────────────────────────────────────────────

export async function obtenerEstudiantesRiesgo(
  filtros?: FiltrosRiesgo,
): Promise<EstudianteRiesgo[]> {
  const params = new URLSearchParams()
  if (filtros?.asignatura) params.set('asignatura', filtros.asignatura)
  if (filtros?.nivel_riesgo) params.set('nivel_riesgo', filtros.nivel_riesgo)
  if (filtros?.estado_tutoria) params.set('estado_tutoria', filtros.estado_tutoria)
  const query = params.toString() ? `?${params.toString()}` : ''
  const data = await fetchApi<EstudiantesRiesgoResponse>(`/api/estudiantes/riesgo${query}`)
  return data.estudiantes
}

export async function actualizarTutoria(
  codigo: string,
  payload: ActualizarTutoriaPayload,
): Promise<EstudianteRiesgo> {
  return fetchApi<EstudianteRiesgo>(`/api/estudiantes/${codigo}/tutoria`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  })
}

export async function obtenerCargaMaterias(): Promise<MateriaCarga[]> {
  return fetchApi<MateriaCarga[]>('/api/materias/carga')
}

export async function obtenerMetricasModelos(): Promise<MetricasModelos> {
  return fetchApi<MetricasModelos>('/api/modelo/metricas')
}

export async function simularRiesgo(input: SimuladorInput): Promise<SimuladorOutput> {
  return fetchApi<SimuladorOutput>('/api/predecir', {
    method: 'POST',
    body: JSON.stringify(input),
  })
}

// ── Helpers de UI ──────────────────────────────────────────────────────────

/** Devuelve clases Tailwind de texto, fondo y borde según nivel de riesgo.
 *  Nunca incluye clases con "red-". */
export function nivelRiesgoClase(nivel: NivelRiesgo): string {
  const mapa: Record<NivelRiesgo, string> = {
    alto: 'text-riesgo-alto bg-amber-50 border-amber-300',
    medio: 'text-riesgo-medio bg-slate-100 border-slate-300',
    bajo: 'text-riesgo-bajo bg-emerald-50 border-emerald-300',
  }
  return mapa[nivel] || 'text-slate-600 bg-slate-100 border-slate-300'
}

/** Etiqueta legible para el nivel de riesgo (no alarmista). */
export function nivelRiesgoEtiqueta(nivel: NivelRiesgo): string {
  const mapa: Record<NivelRiesgo, string> = {
    alto: 'Acompañamiento prioritario',
    medio: 'Seguimiento preventivo',
    bajo: 'Estable',
  }
  return mapa[nivel] || nivel
}

/** Formateo amigable del nombre de modelo */
export function formatearNombreModelo(modelo: string): string {
  const mapa: Record<string, string> = {
    bosque_aleatorio: 'Bosque Aleatorio (Random Forest)',
    regresion_logistica: 'Regresión Logística',
    arbol_decision: 'Árbol de Decisión',
  }
  return mapa[modelo] || modelo
}
