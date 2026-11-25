import os
import json
import joblib
import pandas as pd
import pytest

from backend.train import generar_dataset_sintetico, entrenar_y_evaluar_modelos
from backend.explainability import calcular_explicabilidad_local

def test_generar_dataset_sintetico_variables_exactas():
    df = generar_dataset_sintetico(n=150, seed=42)
    assert len(df) == 150
    assert df["codigo_estudiante"].iloc[0] == "ENF-001"
    assert df["codigo_estudiante"].iloc[-1] == "ENF-150"
    
    variables_esperadas = [
        "nota_primer_parcial", "promedio_acumulado_cortes", "asistencia_pct",
        "repitente", "semestre", "carga_percibida", "horas_estudio_semana",
        "horas_sueno", "apoyo_economico_familiar", "trabajo_remunerado",
        "intencion_seguir", "desercion_riesgo"
    ]
    for var in variables_esperadas:
        assert var in df.columns, f"Variable {var} no encontrada en dataset"
    
    # Must NOT have creditos or estrato
    assert "creditos" not in df.columns
    assert "carga_creditos" not in df.columns
    assert "estrato" not in df.columns
    assert "estrato_socioeconomico" not in df.columns

def test_entrenar_y_evaluar_modelos_y_explicabilidad(tmp_path):
    df = generar_dataset_sintetico(n=150, seed=42)
    resultados = entrenar_y_evaluar_modelos(df, output_dir=str(tmp_path))
    
    assert "regresion_logistica" in resultados
    assert "arbol_decision" in resultados
    assert "bosque_aleatorio" in resultados
    assert "logica_difusa" in resultados
    assert "mejor_modelo" in resultados
    assert resultados["mejor_modelo"] in (
        "regresion_logistica",
        "arbol_decision",
        "bosque_aleatorio",
    )

    for modelo in ["regresion_logistica", "arbol_decision", "bosque_aleatorio"]:
        metricas = resultados[modelo]
        for m in ["accuracy", "f1", "precision", "recall", "roc_auc"]:
            assert "mean" in metricas[m]
            assert "std" in metricas[m]
            assert 0.0 <= metricas[m]["mean"] <= 1.0

    difusa = resultados["logica_difusa"]
    for m in ["accuracy", "f1", "precision", "recall", "roc_auc"]:
        assert 0.0 <= difusa[m]["mean"] <= 1.0
        assert difusa[m]["std"] == 0.0
    assert difusa["sin_entrenamiento"] is True
    assert difusa["tipo"] == "conocimiento_experto"
    assert isinstance(difusa["nota_metodologica"], str) and difusa["nota_metodologica"]

    u35 = difusa["umbral_preventivo_35"]
    assert u35["umbral"] == 0.35
    for m in ["recall", "precision", "f1", "accuracy"]:
        assert 0.0 <= u35[m] <= 1.0
    assert 0 <= u35["estudiantes_marcados"] <= len(df)

    assert os.path.exists(tmp_path / "dataset_sintetico.csv")
    assert os.path.exists(tmp_path / "metricas_modelos.json")
    assert os.path.exists(tmp_path / "mejor_modelo.joblib")
    assert os.path.exists(tmp_path / "carga_materias.json")
    
    # Test local explainability
    bundle = joblib.load(tmp_path / "mejor_modelo.joblib")
    sample = df.iloc[0:1]
    feature_names = bundle["feature_names"]
    
    explicacion = calcular_explicabilidad_local(
        bundle["model"],
        sample[feature_names],
        feature_names,
        base_prob=bundle.get("base_prob", 0.5)
    )
    assert isinstance(explicacion, list)
    assert len(explicacion) >= 3
    assert "factor" in explicacion[0]
    assert "impacto_pct" in explicacion[0]
    assert "descripcion" in explicacion[0]
