import os
import json
import pytest
from backend.db import init_db, get_estudiantes_riesgo, actualizar_tutoria

def test_sqlite_db_lifecycle(tmp_path):
    db_path = str(tmp_path / "test.sqlite")
    records = [{
        "codigo_estudiante": "ENF-001",
        "asignatura": "Farmacología Clínica",
        "semestre": 3,
        "probabilidad_riesgo": 82.4,
        "nivel_riesgo": "alto",
        "factor_principal": "Nota de primer parcial baja (1.9 / 5.0)",
        "factores_detalle": json.dumps([
            {"factor": "nota_primer_parcial", "impacto_pct": 18.2, "descripcion": "Nota de primer parcial baja (1.9 / 5.0)"},
            {"factor": "asistencia_pct", "impacto_pct": 14.1, "descripcion": "Inasistencia acumulada preocupante (38% ausencias)"},
            {"factor": "apoyo_economico_familiar", "impacto_pct": 9.5, "descripcion": "Carencia de red de apoyo económico o familiar"}
        ]),
        "estado_tutoria": "pendiente",
        "fecha_tutoria": None
    }, {
        "codigo_estudiante": "ENF-002",
        "asignatura": "Anatomía Humana",
        "semestre": 1,
        "probabilidad_riesgo": 25.0,
        "nivel_riesgo": "bajo",
        "factor_principal": "Primera matrícula en la asignatura",
        "factores_detalle": json.dumps([]),
        "estado_tutoria": "pendiente",
        "fecha_tutoria": None
    }]
    
    init_db(db_path=db_path, seed_records=records)
    
    # Query all
    rows = get_estudiantes_riesgo(db_path)
    assert len(rows) == 2
    assert rows[0]["codigo_estudiante"] == "ENF-001" # Highest risk first
    assert rows[0]["nivel_riesgo"] == "alto"
    assert isinstance(rows[0]["factores_detalle"], list)
    assert len(rows[0]["factores_detalle"]) == 3
    
    # Filter by nivel_riesgo
    altos = get_estudiantes_riesgo(db_path, nivel_riesgo="alto")
    assert len(altos) == 1
    assert altos[0]["codigo_estudiante"] == "ENF-001"
    
    # Filter by asignatura
    anatomia = get_estudiantes_riesgo(db_path, asignatura="Anatomía Humana")
    assert len(anatomia) == 1
    assert anatomia[0]["codigo_estudiante"] == "ENF-002"
    
    # Update tutoria
    updated = actualizar_tutoria(db_path, "ENF-001", "citado", "2026-11-28")
    assert updated is not None
    assert updated["estado_tutoria"] == "citado"
    assert updated["fecha_tutoria"] == "2026-11-28"
    
    # Filter by estado_tutoria
    citados = get_estudiantes_riesgo(db_path, estado_tutoria="citado")
    assert len(citados) == 1
    pendientes = get_estudiantes_riesgo(db_path, estado_tutoria="pendiente")
    assert len(pendientes) == 1
    assert pendientes[0]["codigo_estudiante"] == "ENF-002"
