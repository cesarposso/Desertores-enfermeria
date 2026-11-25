"""Esquemas Pydantic v2 para validación de datos del dominio y endpoints de la API.
"""

from typing import List, Optional, Literal, Dict, Any
from pydantic import BaseModel, Field


AVISO_SINTETICO = (
    "Datos sintéticos generados para el proyecto de semillero de investigación (Universidad de Pamplona). "
    "Uso estrictamente pedagógico y orientador para acompañamiento y prevención; no sancionatorio ni punitivo."
)


class FactorCritico(BaseModel):
    factor: str = Field(..., description="Nombre técnico de la variable")
    peso_neto: float = Field(..., description="Aporte neto a la probabilidad")
    impacto_pct: float = Field(..., description="Porcentaje de impacto relativo")
    valor_actual: float = Field(..., description="Valor registrado del estudiante")
    descripcion: str = Field(..., description="Explicación empática y comprensible para el docente")


class SimuladorInputRequest(BaseModel):
    asignatura: str = Field(..., description="Nombre de la asignatura de Enfermería")
    nota_primer_parcial: float = Field(..., ge=0.0, le=5.0, description="Nota del primer parcial (0.0 a 5.0)")
    promedio_acumulado_cortes: float = Field(..., ge=0.0, le=5.0, description="Promedio acumulado de cortes (0.0 a 5.0)")
    asistencia_pct: float = Field(..., ge=0.0, le=100.0, description="Porcentaje de asistencia acumulada (0% a 100%)")
    repitente: int = Field(..., ge=0, le=1, description="Condición de repitente (0: No, 1: Sí)")
    semestre: int = Field(..., ge=1, le=10, description="Semestre actual (1 a 10)")
    carga_percibida: float = Field(..., ge=1.0, le=5.0, description="Nivel de sobrecarga académica percibida (1 a 5)")
    horas_estudio_semana: float = Field(..., ge=0.0, le=60.0, description="Horas de estudio autónomo por semana (0 a 60)")
    horas_sueno: float = Field(..., ge=0.0, le=24.0, description="Horas de sueño promedio diarias (0 a 24)")
    apoyo_economico_familiar: int = Field(..., ge=0, le=1, description="Cuenta con apoyo económico y familiar (0: No, 1: Sí)")
    trabajo_remunerado: int = Field(..., ge=0, le=1, description="Tiene empleo remunerado simultáneo (0: No, 1: Sí)")
    intencion_seguir: int = Field(..., ge=0, le=1, description="Intención firme de continuar la carrera (0: No, 1: Sí)")


class ReglaDifusaActiva(BaseModel):
    id: str = Field(..., description="Identificador de la regla difusa (R1-R9)")
    descripcion: str = Field(..., description="Regla pedagógica SI–ENTONCES en lenguaje de acompañamiento")
    activacion: float = Field(..., ge=0.0, le=1.0, description="Grado de activación α en [0, 1]")
    consecuente: Literal["bajo", "medio", "alto"] = Field(..., description="Nivel consecuente de la regla")


class EvaluacionDifusa(BaseModel):
    probabilidad_difusa: float = Field(..., ge=0.0, le=100.0, description="Índice difuso orientador (0 a 100%)")
    nivel_riesgo: Literal["bajo", "medio", "alto"] = Field(..., description="Nivel equivalente al sistema")
    reglas_activas: List[ReglaDifusaActiva] = Field(default_factory=list, description="Reglas activadas ordenadas por α")


class SimuladorOutputResponse(BaseModel):
    probabilidad_riesgo: float = Field(..., description="Probabilidad orientadora estimada (0 a 100%)")
    nivel_riesgo: str = Field(..., description="Nivel: alto (Acompañamiento prioritario), medio (Seguimiento preventivo), bajo (Estable)")
    mensaje_orientador: str = Field(..., description="Recomendación pedagógica sugerida")
    factores_criticos: List[FactorCritico] = Field(default_factory=list, description="Top factores de mayor impacto")
    evaluacion_difusa: Optional[EvaluacionDifusa] = Field(
        default=None,
        description="Evaluación complementaria mediante Sistema de Inferencia Difusa Mamdani",
    )
    datos_sinteticos: bool = Field(default=True, description="Indica origen de datos sintéticos")
    aviso_etico: str = Field(default=AVISO_SINTETICO, description="Aviso de confidencialidad y propósito orientador")


class ActualizarTutoriaRequest(BaseModel):
    estado: Literal["pendiente", "citado"] = Field(..., description="Nuevo estado de la tutoría")
    fecha: Optional[str] = Field(None, description="Fecha programada en formato YYYY-MM-DD")


class EstudianteRiesgoItem(BaseModel):
    codigo_estudiante: str
    asignatura: str
    semestre: int
    probabilidad_riesgo: float
    nivel_riesgo: str
    factor_principal: str
    factores_detalle: List[FactorCritico]
    estado_tutoria: str
    fecha_tutoria: Optional[str] = None
    actualizado_en: Optional[str] = None


class EstudiantesRiesgoResponse(BaseModel):
    datos_sinteticos: bool = True
    aviso_etico: str = AVISO_SINTETICO
    total: int
    estudiantes: List[EstudianteRiesgoItem]


class MateriaCargaItem(BaseModel):
    asignatura: str
    semestre: int
    estudiantes_matriculados: int
    carga_promedio: float
    tasa_riesgo_pct: float
    asistencia_promedio_pct: float
    horas_estudio_promedio: float


class MetricasModelosResponse(BaseModel):
    mejor_modelo: str
    regresion_logistica: Dict[str, Any]
    arbol_decision: Dict[str, Any]
    bosque_aleatorio: Dict[str, Any]
    logica_difusa: Optional[Dict[str, Any]] = None
    datos_sinteticos: bool = True
    aviso_etico: str = AVISO_SINTETICO
