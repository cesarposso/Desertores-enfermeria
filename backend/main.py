"""Servicio FastAPI para el Panel de Alerta Temprana en Deserción - Enfermería.

Universidad de Pamplona - Proyecto de Semillero de Investigación.
"""

import os
import json
from contextlib import asynccontextmanager
from typing import Optional, List, Dict, Any

from fastapi import FastAPI, HTTPException, Query, status
from fastapi.middleware.cors import CORSMiddleware
import joblib
import pandas as pd

from backend.schemas import (
    SimuladorInputRequest,
    SimuladorOutputResponse,
    ActualizarTutoriaRequest,
    EstudianteRiesgoItem,
    EstudiantesRiesgoResponse,
    MateriaCargaItem,
    MetricasModelosResponse,
    AVISO_SINTETICO
)
from backend.db import init_db, get_estudiantes_riesgo, actualizar_tutoria
from backend.explainability import calcular_explicabilidad_local


DB_PATH = os.path.join("backend", "data", "database.sqlite")
DATASET_PATH = os.path.join("backend", "data", "dataset_sintetico.csv")
MODELO_PATH = os.path.join("backend", "data", "mejor_modelo.joblib")
METRICAS_PATH = os.path.join("backend", "data", "metricas_modelos.json")
CARGA_PATH = os.path.join("backend", "data", "carga_materias.json")

# Cache en memoria del modelo cargado
_MODELO_BUNDLE = None


def get_modelo_bundle():
    global _MODELO_BUNDLE
    if _MODELO_BUNDLE is None:
        if not os.path.exists(MODELO_PATH):
            from backend.train import generar_dataset_sintetico, entrenar_y_evaluar_modelos
            df = generar_dataset_sintetico(n=150, seed=42)
            entrenar_y_evaluar_modelos(df, output_dir=os.path.dirname(MODELO_PATH))
        _MODELO_BUNDLE = joblib.load(MODELO_PATH)
    return _MODELO_BUNDLE


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Asegurar que base de datos y artefactos estén inicializados
    init_db(
        db_path=DB_PATH,
        dataset_path=DATASET_PATH,
        model_bundle_path=MODELO_PATH
    )
    get_modelo_bundle()
    yield


app = FastAPI(
    title="Panel de Alerta Temprana - Enfermería (UniPamplona)",
    description="API REST para monitoreo formativo y preventivo de deserción estudiantil en Enfermería.",
    version="1.0.0",
    lifespan=lifespan
)

# Habilitar CORS para integración con React / Vite (localhost:5173 u otros)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get(
    "/api/estudiantes/riesgo",
    response_model=EstudiantesRiesgoResponse,
    summary="Listar estudiantes con probabilidad orientadora de riesgo"
)
def listar_estudiantes_riesgo(
    asignatura: Optional[str] = None,
    nivel_riesgo: Optional[str] = None,
    estado_tutoria: Optional[str] = None
):
    """Retorna los estudiantes priorizados de mayor a menor riesgo con desglose de factores."""
    estudiantes_raw = get_estudiantes_riesgo(
        db_path=DB_PATH,
        asignatura=asignatura,
        nivel_riesgo=nivel_riesgo,
        estado_tutoria=estado_tutoria
    )
    
    return EstudiantesRiesgoResponse(
        datos_sinteticos=True,
        aviso_etico=AVISO_SINTETICO,
        total=len(estudiantes_raw),
        estudiantes=estudiantes_raw
    )


@app.patch(
    "/api/estudiantes/{codigo}/tutoria",
    response_model=EstudianteRiesgoItem,
    summary="Actualizar estado de citación a tutoría de un estudiante"
)
def actualizar_estado_tutoria(
    codigo: str,
    payload: ActualizarTutoriaRequest
):
    """Actualiza el estado (pendiente / citado) y fecha opcional en SQLite."""
    actualizado = actualizar_tutoria(
        db_path=DB_PATH,
        codigo=codigo,
        estado=payload.estado,
        fecha=payload.fecha
    )
    if not actualizado:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Estudiante con código '{codigo}' no encontrado."
        )
    return actualizado


@app.get(
    "/api/materias/carga",
    response_model=List[MateriaCargaItem],
    summary="Consultar sobrecarga académica percibida por asignatura"
)
def consultar_carga_materias():
    """Retorna métricas consolidadas de carga percibida y tasa de riesgo por materia."""
    if not os.path.exists(CARGA_PATH):
        get_modelo_bundle()
    with open(CARGA_PATH, "r", encoding="utf-8") as f:
        carga_datos = json.load(f)
    return carga_datos


@app.get(
    "/api/modelo/metricas",
    response_model=MetricasModelosResponse,
    summary="Comparativa de validación cruzada de los 3 modelos de Machine Learning"
)
def consultar_metricas_modelos():
    """Retorna las métricas (accuracy, f1, precision, recall, roc_auc) de los 3 modelos."""
    if not os.path.exists(METRICAS_PATH):
        get_modelo_bundle()
    with open(METRICAS_PATH, "r", encoding="utf-8") as f:
        metricas = json.load(f)
    
    return MetricasModelosResponse(
        mejor_modelo=metricas.get("mejor_modelo", "bosque_aleatorio"),
        regresion_logistica=metricas.get("regresion_logistica", {}),
        arbol_decision=metricas.get("arbol_decision", {}),
        bosque_aleatorio=metricas.get("bosque_aleatorio", {}),
        datos_sinteticos=True,
        aviso_etico=AVISO_SINTETICO
    )


@app.post(
    "/api/predecir",
    response_model=SimuladorOutputResponse,
    summary="Simulador interactivo de riesgo por estudiante"
)
def simular_riesgo_estudiante(payload: SimuladorInputRequest):
    """Calcula la probabilidad orientadora de deserción y descompone los factores de mayor impacto."""
    bundle = get_modelo_bundle()
    model = bundle["model"]
    feature_names = bundle["feature_names"]
    base_prob = bundle.get("base_prob", 0.5)

    data_dict = payload.model_dump()
    row_df = pd.DataFrame([data_dict])
    X = row_df[feature_names]

    prob_riesgo = float(model.predict_proba(X)[0, 1] * 100)
    prob_riesgo = round(prob_riesgo, 1)

    if prob_riesgo >= 60.0:
        nivel = "alto"
        mensaje = "Se recomienda acompañamiento prioritario y citación temprana a tutoría pedagógica."
    elif prob_riesgo >= 35.0:
        nivel = "medio"
        mensaje = "Se sugiere seguimiento preventivo y monitoreo en el siguiente corte evaluativo."
    else:
        nivel = "bajo"
        mensaje = "Situación académica estable. Mantener acompañamiento ordinario de la asignatura."

    factores = calcular_explicabilidad_local(model, row_df, feature_names, base_prob)

    return SimuladorOutputResponse(
        probabilidad_riesgo=prob_riesgo,
        nivel_riesgo=nivel,
        mensaje_orientador=mensaje,
        factores_criticos=factores,
        datos_sinteticos=True,
        aviso_etico=AVISO_SINTETICO
    )
