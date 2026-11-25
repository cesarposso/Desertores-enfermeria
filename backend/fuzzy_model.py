"""Motor de Inferencia Difusa tipo Mamdani para alerta temprana de deserción.

Implementado en Python puro + NumPy (sin dependencias externas como scikit-fuzzy)
como alternativa interpretable y auditable para cohortes pequeñas.
"""

from typing import Any, Dict, List, Mapping, Tuple, Union
import numpy as np
import pandas as pd

NumberOrArray = Union[float, np.ndarray]


def trimf(x: NumberOrArray, a: float, b: float, c: float) -> NumberOrArray:
    """Función de pertenencia triangular sobre [a, b, c]."""
    arr = np.asarray(x, dtype=float)
    y = np.zeros_like(arr, dtype=float)

    if b > a:
        mask_izq = (arr > a) & (arr < b)
        y = np.where(mask_izq, (arr - a) / (b - a), y)
    if c > b:
        mask_der = (arr > b) & (arr < c)
        y = np.where(mask_der, (c - arr) / (c - b), y)
    y = np.where(arr == b, 1.0, y)
    y = np.clip(y, 0.0, 1.0)

    return float(y) if np.isscalar(x) else y


def trapmf(x: NumberOrArray, a: float, b: float, c: float, d: float) -> NumberOrArray:
    """Función de pertenencia trapezoidal sobre [a, b, c, d]."""
    arr = np.asarray(x, dtype=float)
    y = np.zeros_like(arr, dtype=float)

    if b > a:
        mask_sub = (arr > a) & (arr < b)
        y = np.where(mask_sub, (arr - a) / (b - a), y)
    if d > c:
        mask_baj = (arr > c) & (arr < d)
        y = np.where(mask_baj, (d - arr) / (d - c), y)
    y = np.where((arr >= b) & (arr <= c), 1.0, y)
    y = np.clip(y, 0.0, 1.0)

    return float(y) if np.isscalar(x) else y


UNIVERSO_RIESGO: np.ndarray = np.linspace(0.0, 1.0, 201)

_CONJUNTOS_SALIDA: Dict[str, np.ndarray] = {
    "bajo": trapmf(UNIVERSO_RIESGO, 0.0, 0.0, 0.15, 0.38),
    "medio": trimf(UNIVERSO_RIESGO, 0.30, 0.475, 0.65),
    "alto": trapmf(UNIVERSO_RIESGO, 0.58, 0.78, 1.0, 1.0),
}

REGLAS_DIFUSAS: List[Dict[str, str]] = [
    {
        "id": "R1",
        "consecuente": "alto",
        "descripcion": (
            "SI el rendimiento académico es bajo Y la asignatura se cursa como repitente, "
            "ENTONCES se recomienda acompañamiento prioritario."
        ),
    },
    {
        "id": "R2",
        "consecuente": "alto",
        "descripcion": (
            "SI la asistencia a clases es baja Y coincide con rendimiento académico bajo o jornada laboral simultánea, "
            "ENTONCES se recomienda acompañamiento prioritario."
        ),
    },
    {
        "id": "R3",
        "consecuente": "alto",
        "descripcion": (
            "SI existen dudas sobre continuar el programa Y se combinan con señales académicas, "
            "baja asistencia o falta de red de apoyo, ENTONCES se recomienda acompañamiento prioritario."
        ),
    },
    {
        "id": "R4",
        "consecuente": "alto",
        "descripcion": (
            "SI la sobrecarga percibida es alta Y el descanso nocturno es reducido junto con poco estudio autónomo, "
            "rendimiento bajo o sin apoyo familiar, ENTONCES se recomienda acompañamiento prioritario."
        ),
    },
    {
        "id": "R5",
        "consecuente": "medio",
        "descripcion": (
            "SI el rendimiento académico es bajo en primera matrícula, "
            "ENTONCES se sugiere seguimiento preventivo y refuerzo temprano."
        ),
    },
    {
        "id": "R6",
        "consecuente": "medio",
        "descripcion": (
            "SI el rendimiento es intermedio o el primer parcial fue bajo junto con asistencia moderada, "
            "carga alta, pocas horas de estudio o falta de apoyo económico, ENTONCES se sugiere seguimiento preventivo."
        ),
    },
    {
        "id": "R7",
        "consecuente": "medio",
        "descripcion": (
            "SI se presenta baja asistencia a clases sin jornada laboral simultánea ni rendimiento académico bajo, "
            "ENTONCES se sugiere seguimiento preventivo para identificar barreras a tiempo."
        ),
    },
    {
        "id": "R8",
        "consecuente": "bajo",
        "descripcion": (
            "SI el rendimiento académico es sólido Y la asistencia a clases es constante, "
            "ENTONCES la situación se proyecta estable con acompañamiento ordinario."
        ),
    },
    {
        "id": "R9",
        "consecuente": "bajo",
        "descripcion": (
            "SI el rendimiento es adecuado o sólido con intención firme de continuar, apoyo económico familiar "
            "y hábitos favorables de estudio o descanso, ENTONCES la situación favorece la permanencia estable."
        ),
    },
]


def defuzzificar_centroide(universo: np.ndarray, agregado: np.ndarray) -> float:
    """Calcula el centroide de un conjunto difuso agregado en [0, 1]."""
    area = float(np.sum(agregado))
    if area <= 0.0:
        return 0.5
    return float(np.clip(np.sum(universo * agregado) / area, 0.0, 1.0))


def _fuzzificar_variables(datos: Mapping[str, Any]) -> Dict[str, float]:
    """Convierte las variables socioacadémicas del estudiante a grados de pertenencia."""
    nota_p1 = float(np.clip(float(datos["nota_primer_parcial"]), 0.0, 5.0))
    promedio = float(np.clip(float(datos["promedio_acumulado_cortes"]), 0.0, 5.0))
    rendimiento = 0.4 * nota_p1 + 0.6 * promedio

    asistencia = float(np.clip(float(datos["asistencia_pct"]), 0.0, 100.0))
    carga = float(np.clip(float(datos["carga_percibida"]), 1.0, 5.0))
    estudio = float(np.clip(float(datos["horas_estudio_semana"]), 0.0, 60.0))
    sueno = float(np.clip(float(datos["horas_sueno"]), 0.0, 24.0))

    return {
        "nota_p1_baja": float(trapmf(nota_p1, 0.0, 0.0, 2.5, 3.2)),
        "rend_bajo": float(trapmf(rendimiento, 0.0, 0.0, 2.5, 3.2)),
        "rend_medio": float(trimf(rendimiento, 2.7, 3.35, 4.0)),
        "rend_alto": float(trapmf(rendimiento, 3.6, 4.1, 5.0, 5.0)),
        "asist_baja": float(trapmf(asistencia, 0.0, 0.0, 68.0, 78.0)),
        "asist_media": float(trimf(asistencia, 72.0, 81.0, 90.0)),
        "asist_alta": float(trapmf(asistencia, 85.0, 92.0, 100.0, 100.0)),
        "carga_alta": float(trapmf(carga, 3.8, 4.4, 5.0, 5.0)),
        "estudio_bajo": float(trapmf(estudio, 0.0, 0.0, 6.0, 10.0)),
        "estudio_alto": float(trapmf(estudio, 13.0, 18.0, 60.0, 60.0)),
        "sueno_bajo": float(trapmf(sueno, 0.0, 0.0, 5.0, 6.2)),
        "sueno_alto": float(trapmf(sueno, 6.5, 7.5, 24.0, 24.0)),
        "repitente": float(np.clip(float(datos["repitente"]), 0.0, 1.0)),
        "apoyo": float(np.clip(float(datos["apoyo_economico_familiar"]), 0.0, 1.0)),
        "trabajo": float(np.clip(float(datos["trabajo_remunerado"]), 0.0, 1.0)),
        "intencion": float(np.clip(float(datos["intencion_seguir"]), 0.0, 1.0)),
    }


def _activaciones_reglas(m: Dict[str, float]) -> Dict[str, float]:
    """Evalúa los antecedentes Mamdani (AND=min, OR=max) de las 9 reglas."""
    return {
        "R1": min(m["rend_bajo"], m["repitente"]),
        "R2": min(m["asist_baja"], max(m["rend_bajo"], m["trabajo"])),
        "R3": min(1.0 - m["intencion"], max(m["rend_bajo"], m["rend_medio"], m["asist_baja"], 1.0 - m["apoyo"])),
        "R4": min(m["carga_alta"], m["sueno_bajo"], max(m["estudio_bajo"], m["rend_bajo"], 1.0 - m["apoyo"])),
        "R5": min(m["rend_bajo"], 1.0 - m["repitente"]),
        "R6": min(
            max(m["rend_medio"], m["nota_p1_baja"]),
            max(m["asist_media"], m["carga_alta"], m["estudio_bajo"], 1.0 - m["apoyo"]),
        ),
        # Excluye trabajo y rendimiento bajo para no diluir el consecuente alto de R2
        "R7": min(m["asist_baja"], 1.0 - m["trabajo"], 1.0 - m["rend_bajo"]),
        "R8": min(m["rend_alto"], m["asist_alta"]),
        "R9": min(max(m["rend_alto"], m["rend_medio"]), m["intencion"], m["apoyo"], max(m["estudio_alto"], m["sueno_alto"])),
    }


def evaluar_estudiante_difuso(datos: Mapping[str, Any]) -> Dict[str, Any]:
    """Evalúa un estudiante con el sistema difuso Mamdani y retorna riesgo y reglas activas."""
    pertenencias = _fuzzificar_variables(datos)
    activaciones = _activaciones_reglas(pertenencias)

    agregado = np.zeros_like(UNIVERSO_RIESGO)
    reglas_activas: List[Dict[str, Any]] = []

    for regla in REGLAS_DIFUSAS:
        alpha = float(activaciones[regla["id"]])
        if alpha > 1e-6:
            implicado = np.minimum(alpha, _CONJUNTOS_SALIDA[regla["consecuente"]])
            agregado = np.maximum(agregado, implicado)
            reglas_activas.append({
                "id": regla["id"],
                "descripcion": regla["descripcion"],
                "activacion": round(alpha, 3),
                "consecuente": regla["consecuente"],
            })

    reglas_activas.sort(key=lambda r: r["activacion"], reverse=True)

    indice_riesgo = defuzzificar_centroide(UNIVERSO_RIESGO, agregado)
    probabilidad_difusa = round(indice_riesgo * 100.0, 1)

    if probabilidad_difusa >= 60.0:
        nivel_riesgo = "alto"
    elif probabilidad_difusa >= 35.0:
        nivel_riesgo = "medio"
    else:
        nivel_riesgo = "bajo"

    return {
        "indice_riesgo": round(indice_riesgo, 4),
        "probabilidad_difusa": probabilidad_difusa,
        "nivel_riesgo": nivel_riesgo,
        "reglas_activas": reglas_activas,
    }


def predecir_dataset_difuso(df: pd.DataFrame, umbral: float = 0.5) -> Tuple[np.ndarray, np.ndarray]:
    """Evalúa un DataFrame completo sin entrenamiento; retorna (y_prob, y_pred)."""
    probs = np.array(
        [evaluar_estudiante_difuso(row.to_dict())["indice_riesgo"] for _, row in df.iterrows()],
        dtype=float,
    )
    preds = (probs >= umbral).astype(int)
    return probs, preds
