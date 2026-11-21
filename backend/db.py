"""Capa de persistencia SQLite para estudiantes en riesgo y gestión de tutorías preventivas.
"""

import os
import json
import sqlite3
from typing import List, Dict, Any, Optional
import pandas as pd
import joblib

from backend.explainability import calcular_explicabilidad_local


def _get_connection(db_path: str) -> sqlite3.Connection:
    conn = sqlite3.connect(db_path, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    return conn


def init_db(
    db_path: str,
    seed_records: Optional[List[Dict[str, Any]]] = None,
    dataset_path: Optional[str] = None,
    model_bundle_path: Optional[str] = None,
    force_reseed: bool = False
) -> None:
    """Inicializa la tabla estudiantes_riesgo y realiza el sembrado inicial si está vacía."""
    os.makedirs(os.path.dirname(os.path.abspath(db_path)), exist_ok=True)
    
    with _get_connection(db_path) as conn:
        cursor = conn.cursor()
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS estudiantes_riesgo (
                codigo_estudiante TEXT PRIMARY KEY,
                asignatura TEXT NOT NULL,
                semestre INTEGER NOT NULL,
                probabilidad_riesgo REAL NOT NULL,
                nivel_riesgo TEXT NOT NULL,
                factor_principal TEXT NOT NULL,
                factores_detalle TEXT NOT NULL,
                estado_tutoria TEXT NOT NULL DEFAULT 'pendiente',
                fecha_tutoria TEXT,
                actualizado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        """)
        conn.commit()

        if force_reseed:
            cursor.execute("DELETE FROM estudiantes_riesgo;")
            conn.commit()

        # Si se pasan registros directos (e.g. en tests)
        if seed_records:
            for r in seed_records:
                cursor.execute("""
                    INSERT OR REPLACE INTO estudiantes_riesgo
                    (codigo_estudiante, asignatura, semestre, probabilidad_riesgo, nivel_riesgo,
                     factor_principal, factores_detalle, estado_tutoria, fecha_tutoria)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);
                """, (
                    r["codigo_estudiante"],
                    r["asignatura"],
                    r["semestre"],
                    float(r["probabilidad_riesgo"]),
                    r["nivel_riesgo"],
                    r["factor_principal"],
                    r["factores_detalle"] if isinstance(r["factores_detalle"], str) else json.dumps(r["factores_detalle"]),
                    r.get("estado_tutoria", "pendiente"),
                    r.get("fecha_tutoria")
                ))
            conn.commit()
            return

        # Si no hay registros manuales, verificar si ya existen datos
        cursor.execute("SELECT COUNT(*) FROM estudiantes_riesgo;")
        count = cursor.fetchone()[0]
        if count > 0:
            return  # Ya sembrado

        # Si se especifican rutas de dataset y modelo para sembrar 150 estudiantes
        if dataset_path and model_bundle_path and os.path.exists(dataset_path) and os.path.exists(model_bundle_path):
            df = pd.read_csv(dataset_path)
            bundle = joblib.load(model_bundle_path)
            model = bundle["model"]
            feature_names = bundle["feature_names"]
            base_prob = bundle.get("base_prob", 0.5)

            X = df[feature_names]
            # Probabilidad de clase 1 (riesgo de deserción)
            probs = model.predict_proba(X)[:, 1]

            for idx, row in df.iterrows():
                prob_pct = round(float(probs[idx] * 100), 1)
                
                # Clasificación de nivel de riesgo no alarmista
                if prob_pct >= 60.0:
                    nivel = "alto"
                elif prob_pct >= 35.0:
                    nivel = "medio"
                else:
                    nivel = "bajo"

                # Explicabilidad local por descomposición de trayectorias
                sample_df = df.iloc[idx:idx+1]
                factores = calcular_explicabilidad_local(model, sample_df, feature_names, base_prob)
                factor_principal = factores[0]["descripcion"] if factores else "Sin alertas críticas inmediatas"

                cursor.execute("""
                    INSERT INTO estudiantes_riesgo
                    (codigo_estudiante, asignatura, semestre, probabilidad_riesgo, nivel_riesgo,
                     factor_principal, factores_detalle, estado_tutoria, fecha_tutoria)
                    VALUES (?, ?, ?, ?, ?, ?, ?, 'pendiente', NULL);
                """, (
                    row["codigo_estudiante"],
                    row["asignatura"],
                    int(row["semestre"]),
                    prob_pct,
                    nivel,
                    factor_principal,
                    json.dumps(factores, ensure_ascii=False)
                ))
            conn.commit()


def get_estudiantes_riesgo(
    db_path: str,
    asignatura: Optional[str] = None,
    nivel_riesgo: Optional[str] = None,
    estado_tutoria: Optional[str] = None
) -> List[Dict[str, Any]]:
    """Consulta la lista de estudiantes en riesgo con filtros opcionales y orden descendente."""
    query = "SELECT * FROM estudiantes_riesgo WHERE 1=1"
    params = []

    if asignatura:
        query += " AND asignatura = ?"
        params.append(asignatura)

    if nivel_riesgo:
        query += " AND nivel_riesgo = ?"
        params.append(nivel_riesgo)

    if estado_tutoria:
        query += " AND estado_tutoria = ?"
        params.append(estado_tutoria)

    query += " ORDER BY probabilidad_riesgo DESC, codigo_estudiante ASC;"

    with _get_connection(db_path) as conn:
        cursor = conn.cursor()
        cursor.execute(query, params)
        rows = cursor.fetchall()

    resultado = []
    for r in rows:
        d = dict(r)
        # Deserializar factores_detalle
        try:
            d["factores_detalle"] = json.loads(d["factores_detalle"])
        except Exception:
            d["factores_detalle"] = []
        resultado.append(d)

    return resultado


def actualizar_tutoria(
    db_path: str,
    codigo: str,
    estado: str,
    fecha: Optional[str] = None
) -> Optional[Dict[str, Any]]:
    """Actualiza el estado de tutoría (pendiente / citado) y fecha opcional de un estudiante."""
    if estado not in ("pendiente", "citado"):
        raise ValueError(f"Estado de tutoría inválido: {estado}")

    with _get_connection(db_path) as conn:
        cursor = conn.cursor()
        cursor.execute("""
            UPDATE estudiantes_riesgo
            SET estado_tutoria = ?,
                fecha_tutoria = ?,
                actualizado_en = CURRENT_TIMESTAMP
            WHERE codigo_estudiante = ?;
        """, (estado, fecha, codigo))
        conn.commit()

        cursor.execute("SELECT * FROM estudiantes_riesgo WHERE codigo_estudiante = ?;", (codigo,))
        row = cursor.fetchone()

    if not row:
        return None

    d = dict(row)
    try:
        d["factores_detalle"] = json.loads(d["factores_detalle"])
    except Exception:
        d["factores_detalle"] = []
    return d
