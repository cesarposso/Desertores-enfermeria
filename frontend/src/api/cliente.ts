// Cliente de API — Panel de Alerta Temprana
// Conecta con backend FastAPI en http://localhost:8000

const BASE_URL = 'http://localhost:8000'

// ── Tipos ──────────────────────────────────────────────────────────────────

export type NivelRiesgo = 'alto' | 'medio' | 'bajo'
export type EstadoTutoria = 'pendiente' | 'citado'

export interface FactorCritico {
  variable: string
  etiqueta: string
  contribucion: number
  valor: number | string
  direccion: 'riesgo' | 'protector'
}

export interface EstudianteRiesgo {
  codigo: string
  nombre: string
  asignatura: string
  semestre: number
  probabilidad_riesgo: number
  nivel_riesgo: NivelRiesgo
  estado_tutoria: EstadoTutoria
  fecha_tutoria: string | null
  factores_criticos: FactorCritico[]
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
  n_estudiantes: number
  carga_percibida_promedio: number
  tasa_riesgo_alto: number
}

export interface MetricasModelo {
  accuracy: number
  f1: number
  precision: number
  recall: number
  roc_auc: number
}

export interface MetricasModelos {
  mejor_modelo: string
  regresion_logistica: MetricasModelo
  arbol_decision: MetricasModelo
  bosque_aleatorio: MetricasModelo
  datos_sinteticos: boolean
  aviso_etico: string
}

export interface SimuladorInput {
  nota_primer_parcial: number
  promedio_acumulado_cortes: number
  asistencia_pct: number
  repitente: 0 | 1
  semestre: number
  carga_percibida: number
  horas_estudio_semana: number
  horas_sueno: number
  apoyo_economico_familiar: 0 | 1
  trabajo_remunerado: 0 | 1
  intencion_seguir: 0 | 1
  asignatura: string
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
  return mapa[nivel]
}

/** Etiqueta legible para el nivel de riesgo (no alarmista). */
export function nivelRiesgoEtiqueta(nivel: NivelRiesgo): string {
  const mapa: Record<NivelRiesgo, string> = {
    alto: 'Acompañamiento prioritario',
    medio: 'Seguimiento preventivo',
    bajo: 'Estable',
  }
  return mapa[nivel]
}
