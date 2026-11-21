"""Generación de datos sintéticos y pipeline de entrenamiento de Machine Learning.

Entrena y compara 3 modelos (Regresión Logística, Árbol de Decisión y Random Forest)
mediante validación cruzada estratificada sobre 150 matrículas sintéticas de Enfermería.
"""

import os
import json
from typing import Dict, Any, List
import numpy as np
import pandas as pd
import joblib

from sklearn.model_selection import StratifiedKFold
from sklearn.metrics import accuracy_score, f1_score, precision_score, recall_score, roc_auc_score
from sklearn.linear_model import LogisticRegression
from sklearn.tree import DecisionTreeClassifier
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import StandardScaler


ASIGNATURAS_ENFERMERIA = [
    {"nombre": "Anatomía Humana", "semestre": 1, "carga_base": 4.5},
    {"nombre": "Bioquímica Médica", "semestre": 2, "carga_base": 4.2},
    {"nombre": "Fisiología Humana", "semestre": 2, "carga_base": 4.6},
    {"nombre": "Cuidado Básico de Enfermería", "semestre": 3, "carga_base": 3.8},
    {"nombre": "Microbiología y Parasitología", "semestre": 3, "carga_base": 4.0},
    {"nombre": "Farmacología Clínica", "semestre": 4, "carga_base": 4.7},
]

FEATURE_COLUMNS = [
    "nota_primer_parcial",
    "promedio_acumulado_cortes",
    "asistencia_pct",
    "repitente",
    "semestre",
    "carga_percibida",
    "horas_estudio_semana",
    "horas_sueno",
    "apoyo_economico_familiar",
    "trabajo_remunerado",
    "intencion_seguir"
]


def generar_dataset_sintetico(n: int = 150, seed: int = 42) -> pd.DataFrame:
    """Genera 150 registros sintéticos de matrículas de Enfermería con variables realistas."""
    np.random.seed(seed)
    
    registros: List[Dict[str, Any]] = []
    
    for i in range(1, n + 1):
        codigo = f"ENF-{i:03d}"
        asig_info = ASIGNATURAS_ENFERMERIA[i % len(ASIGNATURAS_ENFERMERIA)]
        asignatura = asig_info["nombre"]
        semestre = asig_info["semestre"]
        carga_base = asig_info["carga_base"]
        
        # Probabilidad de pertenecer a perfil en riesgo latente (35% de la cohorte)
        es_perfil_riesgo = np.random.rand() < 0.35
        
        if es_perfil_riesgo:
            nota_primer_parcial = np.clip(np.random.normal(2.2, 0.5), 1.0, 3.4)
            promedio_acumulado = np.clip(np.random.normal(2.5, 0.4), 1.5, 3.5)
            asistencia_pct = np.clip(np.random.normal(68.0, 10.0), 45.0, 85.0)
            repitente = int(np.random.rand() < 0.55)
            carga_percibida = np.clip(np.random.normal(carga_base + 0.3, 0.4), 3.0, 5.0)
            horas_estudio_semana = np.clip(np.random.normal(6.0, 3.0), 1.0, 15.0)
            horas_sueno = np.clip(np.random.normal(5.0, 1.0), 3.5, 7.5)
            apoyo_economico_familiar = int(np.random.rand() < 0.30)
            trabajo_remunerado = int(np.random.rand() < 0.70)
            intencion_seguir = int(np.random.rand() < 0.40)
            riesgo_real = 1
        else:
            nota_primer_parcial = np.clip(np.random.normal(3.8, 0.6), 2.8, 5.0)
            promedio_acumulado = np.clip(np.random.normal(3.9, 0.5), 3.0, 5.0)
            asistencia_pct = np.clip(np.random.normal(90.0, 6.0), 75.0, 100.0)
            repitente = int(np.random.rand() < 0.12)
            carga_percibida = np.clip(np.random.normal(carga_base - 0.4, 0.5), 1.5, 4.2)
            horas_estudio_semana = np.clip(np.random.normal(16.0, 5.0), 8.0, 35.0)
            horas_sueno = np.clip(np.random.normal(7.0, 1.0), 5.5, 9.5)
            apoyo_economico_familiar = int(np.random.rand() < 0.85)
            trabajo_remunerado = int(np.random.rand() < 0.25)
            intencion_seguir = int(np.random.rand() < 0.92)
            riesgo_real = 0

        registros.append({
            "codigo_estudiante": codigo,
            "asignatura": asignatura,
            "semestre": int(semestre),
            "nota_primer_parcial": round(float(nota_primer_parcial), 2),
            "promedio_acumulado_cortes": round(float(promedio_acumulado), 2),
            "asistencia_pct": round(float(asistencia_pct), 1),
            "repitente": int(repitente),
            "carga_percibida": round(float(carga_percibida), 1),
            "horas_estudio_semana": round(float(horas_estudio_semana), 1),
            "horas_sueno": round(float(horas_sueno), 1),
            "apoyo_economico_familiar": int(apoyo_economico_familiar),
            "trabajo_remunerado": int(trabajo_remunerado),
            "intencion_seguir": int(intencion_seguir),
            "desercion_riesgo": int(riesgo_real)
        })

    df = pd.DataFrame(registros)
    return df


def entrenar_y_evaluar_modelos(df: pd.DataFrame, output_dir: str = "backend/data") -> Dict[str, Any]:
    """Entrena 3 modelos con validación cruzada estratificada k=5 y guarda los artefactos."""
    os.makedirs(output_dir, exist_ok=True)
    
    X = df[FEATURE_COLUMNS]
    y = df["desercion_riesgo"]
    base_prob = float(y.mean())
    
    cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)
    
    modelos = {
        "regresion_logistica": LogisticRegression(max_iter=1000, random_state=42),
        "arbol_decision": DecisionTreeClassifier(max_depth=4, min_samples_leaf=3, random_state=42),
        "bosque_aleatorio": RandomForestClassifier(n_estimators=60, max_depth=5, min_samples_leaf=2, random_state=42)
    }
    
    metricas_resumen: Dict[str, Any] = {}
    
    for nombre, modelo in modelos.items():
        acc_list, f1_list, prec_list, rec_list, auc_list = [], [], [], [], []
        
        for train_idx, val_idx in cv.split(X, y):
            X_tr, X_val = X.iloc[train_idx], X.iloc[val_idx]
            y_tr, y_val = y.iloc[train_idx], y.iloc[val_idx]
            
            modelo.fit(X_tr, y_tr)
            y_pred = modelo.predict(X_val)
            y_prob = modelo.predict_proba(X_val)[:, 1]
            
            acc_list.append(accuracy_score(y_val, y_pred))
            f1_list.append(f1_score(y_val, y_pred, zero_division=0))
            prec_list.append(precision_score(y_val, y_pred, zero_division=0))
            rec_list.append(recall_score(y_val, y_pred, zero_division=0))
            auc_list.append(roc_auc_score(y_val, y_prob))
            
        metricas_resumen[nombre] = {
            "accuracy": {"mean": round(float(np.mean(acc_list)), 4), "std": round(float(np.std(acc_list)), 4)},
            "f1": {"mean": round(float(np.mean(f1_list)), 4), "std": round(float(np.std(f1_list)), 4)},
            "precision": {"mean": round(float(np.mean(prec_list)), 4), "std": round(float(np.std(prec_list)), 4)},
            "recall": {"mean": round(float(np.mean(rec_list)), 4), "std": round(float(np.std(rec_list)), 4)},
            "roc_auc": {"mean": round(float(np.mean(auc_list)), 4), "std": round(float(np.std(auc_list)), 4)},
        }

    # Seleccionar mejor modelo según F1
    mejor_nombre = max(metricas_resumen.keys(), key=lambda k: metricas_resumen[k]["f1"]["mean"])
    mejor_modelo = modelos[mejor_nombre]
    mejor_modelo.fit(X, y)
    
    metricas_resumen["mejor_modelo"] = mejor_nombre
    
    # 1. Guardar dataset CSV
    csv_path = os.path.join(output_dir, "dataset_sintetico.csv")
    df.to_csv(csv_path, index=False)
    
    # 2. Guardar métricas JSON
    metricas_path = os.path.join(output_dir, "metricas_modelos.json")
    with open(metricas_path, "w", encoding="utf-8") as f:
        json.dump(metricas_resumen, f, indent=2, ensure_ascii=False)
        
    # 3. Guardar mejor modelo Joblib
    modelo_bundle = {
        "model": mejor_modelo,
        "feature_names": FEATURE_COLUMNS,
        "base_prob": base_prob,
        "best_model_name": mejor_nombre
    }
    joblib_path = os.path.join(output_dir, "mejor_modelo.joblib")
    joblib.dump(modelo_bundle, joblib_path)
    
    # 4. Guardar resumen de carga por materias
    resumen_materias = []
    for asig, group in df.groupby("asignatura"):
        resumen_materias.append({
            "asignatura": str(asig),
            "semestre": int(group["semestre"].iloc[0]),
            "estudiantes_matriculados": int(len(group)),
            "carga_promedio": round(float(group["carga_percibida"].mean()), 2),
            "tasa_riesgo_pct": round(float(group["desercion_riesgo"].mean() * 100), 1),
            "asistencia_promedio_pct": round(float(group["asistencia_pct"].mean()), 1),
            "horas_estudio_promedio": round(float(group["horas_estudio_semana"].mean()), 1)
        })
    # Ordenar por carga promedio desc
    resumen_materias.sort(key=lambda m: m["carga_promedio"], reverse=True)
    carga_path = os.path.join(output_dir, "carga_materias.json")
    with open(carga_path, "w", encoding="utf-8") as f:
        json.dump(resumen_materias, f, indent=2, ensure_ascii=False)
        
    return metricas_resumen


if __name__ == "__main__":
    print("Generando dataset sintético y entrenando modelos...")
    df_sintetico = generar_dataset_sintetico(n=150, seed=42)
    resultados = entrenar_y_evaluar_modelos(df_sintetico, output_dir="backend/data")
    print(f"Mejor modelo: {resultados['mejor_modelo']}")
    print(f"F1-Score: {resultados[resultados['mejor_modelo']]['f1']['mean']:.4f}")
    print("Artefactos guardados con éxito en backend/data/")
