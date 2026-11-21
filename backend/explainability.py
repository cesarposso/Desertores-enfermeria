"""Módulo de explicabilidad local para modelos de alerta temprana de deserción.

Implementa descomposición de trayectorias en árboles de decisión y bosques aleatorios
(Tree Decision Path Attribution), calculando el impacto de cada variable en la probabilidad
de riesgo de un estudiante particular.
"""

from typing import List, Dict, Any
import numpy as np
import pandas as pd


ETIQUETAS_FACTORES = {
    "nota_primer_parcial": {
        "critico": "Nota de primer parcial baja ({val:.1f} / 5.0)",
        "normal": "Nota de primer parcial ({val:.1f} / 5.0)"
    },
    "promedio_acumulado_cortes": {
        "critico": "Bajo promedio acumulado de cortes ({val:.1f} / 5.0)",
        "normal": "Promedio acumulado de cortes ({val:.1f} / 5.0)"
    },
    "asistencia_pct": {
        "critico": "Inasistencia acumulada preocupante ({inasistencia:.0f}% ausencias)",
        "normal": "Asistencia a clases ({val:.0f}%)"
    },
    "repitente": {
        "critico": "Estudiante repitente de la asignatura",
        "normal": "Primera matrícula en la asignatura"
    },
    "semestre": {
        "critico": "Semestre inicial crítico (Semestre {val:.0f})",
        "normal": "Semestre de formación ({val:.0f})"
    },
    "carga_percibida": {
        "critico": "Alta sobrecarga académica percibida ({val:.1f} / 5.0)",
        "normal": "Carga académica percibida ({val:.1f} / 5.0)"
    },
    "horas_estudio_semana": {
        "critico": "Dedicación de estudio semanal insuficiente ({val:.0f}h / sem)",
        "normal": "Horas de estudio semanal ({val:.0f}h)"
    },
    "horas_sueno": {
        "critico": "Horas de sueño reducidas por fatiga ({val:.0f}h / noche)",
        "normal": "Horas de descanso ({val:.0f}h / noche)"
    },
    "apoyo_economico_familiar": {
        "critico": "Carencia de red de apoyo económico o familiar",
        "normal": "Cuenta con soporte económico y familiar"
    },
    "trabajo_remunerado": {
        "critico": "Jornada laboral remunerada simultánea a estudios",
        "normal": "Dedicación exclusiva al programa"
    },
    "intencion_seguir": {
        "critico": "Duda o desmotivación sobre continuar en enfermería",
        "normal": "Intención firme de permanencia en la carrera"
    }
}


def _describir_factor(factor: str, valor: float) -> str:
    """Genera una descripción pedagógica y empática del factor."""
    cfg = ETIQUETAS_FACTORES.get(factor)
    if not cfg:
        return f"{factor}: {valor}"

    if factor == "nota_primer_parcial":
        return cfg["critico"].format(val=valor) if valor < 3.0 else cfg["normal"].format(val=valor)
    elif factor == "promedio_acumulado_cortes":
        return cfg["critico"].format(val=valor) if valor < 3.0 else cfg["normal"].format(val=valor)
    elif factor == "asistencia_pct":
        return cfg["critico"].format(inasistencia=100 - valor) if valor < 75.0 else cfg["normal"].format(val=valor)
    elif factor == "repitente":
        return cfg["critico"] if valor == 1 else cfg["normal"]
    elif factor == "carga_percibida":
        return cfg["critico"].format(val=valor) if valor >= 3.5 else cfg["normal"].format(val=valor)
    elif factor == "horas_estudio_semana":
        return cfg["critico"].format(val=valor) if valor < 8.0 else cfg["normal"].format(val=valor)
    elif factor == "horas_sueno":
        return cfg["critico"].format(val=valor) if valor < 6.0 else cfg["normal"].format(val=valor)
    elif factor == "apoyo_economico_familiar":
        return cfg["critico"] if valor == 0 else cfg["normal"]
    elif factor == "trabajo_remunerado":
        return cfg["critico"] if valor == 1 else cfg["normal"]
    elif factor == "intencion_seguir":
        return cfg["critico"] if valor == 0 else cfg["normal"]
    else:
        return cfg["normal"].format(val=valor)


def descomponer_trayectoria_arbol(dt_model, X_sample: np.ndarray, feature_names: List[str]) -> np.ndarray:
    """Calcula las contribuciones de cada variable a lo largo del árbol de decisión.
    
    Retorna vector 1D con la variación de probabilidad atribuida a cada feature.
    """
    indicator = dt_model.decision_path(X_sample)
    node_indices = indicator.indices
    
    tree = dt_model.tree_
    n_features = len(feature_names)
    contribuciones = np.zeros(n_features)
    
    for i in range(len(node_indices) - 1):
        parent = node_indices[i]
        child = node_indices[i + 1]
        
        feat = tree.feature[parent]
        if feat >= 0:
            val_parent = tree.value[parent][0]
            val_child = tree.value[child][0]
            
            prob_parent = val_parent[1] / np.sum(val_parent) if np.sum(val_parent) > 0 else 0.0
            prob_child = val_child[1] / np.sum(val_child) if np.sum(val_child) > 0 else 0.0
            
            delta_prob = prob_child - prob_parent
            contribuciones[feat] += delta_prob
            
    return contribuciones


def calcular_explicabilidad_local(
    modelo: Any,
    X_sample: pd.DataFrame,
    feature_names: List[str],
    base_prob: float = 0.5
) -> List[Dict[str, Any]]:
    """Calcula la explicabilidad local desglosando los factores que más pesan en un estudiante.
    
    Usa Descomposición de Trayectorias de Decisión para Random Forest y Árboles,
    o contribuciones marginales si el modelo es Regresión Logística.
    """
    X_mat = X_sample[feature_names].to_numpy()
    if X_mat.ndim == 1:
        X_mat = X_mat.reshape(1, -1)
        
    n_features = len(feature_names)
    contribuciones = np.zeros(n_features)
    
    # 1. Random Forest Classifier
    if hasattr(modelo, "estimators_"):
        for estimator in modelo.estimators_:
            contribuciones += descomponer_trayectoria_arbol(estimator, X_mat, feature_names)
        contribuciones /= len(modelo.estimators_)
    
    # 2. Decision Tree Classifier
    elif hasattr(modelo, "tree_"):
        contribuciones = descomponer_trayectoria_arbol(modelo, X_mat, feature_names)
        
    # 3. Logistic Regression
    elif hasattr(modelo, "coef_"):
        coefs = modelo.coef_[0]
        # Efecto local frente a valor medio estándar
        contribuciones = coefs * X_mat[0] * 0.1
    else:
        contribuciones = np.ones(n_features) * (1.0 / n_features)

    # Convertir a lista estructurada
    factores = []
    valores_estudiante = X_sample.iloc[0].to_dict()
    
    for idx, feat in enumerate(feature_names):
        peso = contribuciones[idx]
        val = float(valores_estudiante.get(feat, 0.0))
        factores.append({
            "factor": feat,
            "peso_neto": float(peso),
            "impacto_pct": round(float(peso * 100), 1),
            "valor_actual": val,
            "descripcion": _describir_factor(feat, val)
        })

    # Ordenar por impacto positivo (los que más empujan el riesgo hacia arriba)
    factores.sort(key=lambda x: x["peso_neto"], reverse=True)
    
    # Si ningún factor es positivo, tomar los de menor efecto protector
    top_factores = [f for f in factores if f["peso_neto"] > 0]
    if len(top_factores) < 3:
        top_factores = factores[:4]
    else:
        top_factores = top_factores[:4]
        
    return top_factores
