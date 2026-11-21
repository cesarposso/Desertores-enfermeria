import pytest
from fastapi import HTTPException
from backend.main import (
    listar_estudiantes_riesgo,
    actualizar_estado_tutoria,
    consultar_carga_materias,
    consultar_metricas_modelos,
    simular_riesgo_estudiante
)
from backend.schemas import ActualizarTutoriaRequest, SimuladorInputRequest

def test_get_estudiantes_riesgo_general():
    data = listar_estudiantes_riesgo()
    assert data.datos_sinteticos is True
    assert data.total == 150
    assert len(data.estudiantes) == 150
    
    # Must be sorted descending by probabilidad_riesgo
    probs = [e.probabilidad_riesgo for e in data.estudiantes]
    assert probs == sorted(probs, reverse=True)
    
    primer_est = data.estudiantes[0]
    assert primer_est.codigo_estudiante.startswith("ENF-")
    assert primer_est.nivel_riesgo in ("alto", "medio", "bajo")
    assert len(primer_est.factores_detalle) >= 3

def test_get_estudiantes_riesgo_filtros():
    # Filter by nivel_riesgo
    altos = listar_estudiantes_riesgo(nivel_riesgo="alto")
    assert altos.total > 0
    for est in altos.estudiantes:
        assert est.nivel_riesgo == "alto"

    # Filter by estado_tutoria
    pendientes = listar_estudiantes_riesgo(estado_tutoria="pendiente")
    for est in pendientes.estudiantes:
        assert est.estado_tutoria == "pendiente"

def test_actualizar_tutoria():
    # Patch first student
    req = ActualizarTutoriaRequest(estado="citado", fecha="2026-11-28")
    actualizado = actualizar_estado_tutoria("ENF-001", req)
    assert actualizado["codigo_estudiante"] == "ENF-001"
    assert actualizado["estado_tutoria"] == "citado"
    assert actualizado["fecha_tutoria"] == "2026-11-28"

    # Non-existent student raises 404
    with pytest.raises(HTTPException) as exc_info:
        actualizar_estado_tutoria("ENF-999", req)
    assert exc_info.value.status_code == 404

def test_get_materias_carga():
    materias = consultar_carga_materias()
    assert isinstance(materias, list)
    assert len(materias) > 0
    materia = materias[0]
    assert "asignatura" in materia
    assert "carga_promedio" in materia
    assert "tasa_riesgo_pct" in materia

def test_get_modelo_metricas():
    res = consultar_metricas_modelos()
    assert res.mejor_modelo == "bosque_aleatorio"
    assert "accuracy" in res.bosque_aleatorio
    assert "f1" in res.bosque_aleatorio
    assert res.datos_sinteticos is True

def test_simular_riesgo_estudiante_tree_path():
    payload = SimuladorInputRequest(
        asignatura="Farmacología Clínica",
        nota_primer_parcial=2.0,
        promedio_acumulado_cortes=2.3,
        asistencia_pct=58.0,
        repitente=1,
        semestre=3,
        carga_percibida=4.6,
        horas_estudio_semana=5.0,
        horas_sueno=5.0,
        apoyo_economico_familiar=0,
        trabajo_remunerado=1,
        intencion_seguir=0
    )
    res = simular_riesgo_estudiante(payload)
    assert res.probabilidad_riesgo >= 50.0 # High risk profile
    assert res.nivel_riesgo in ("alto", "medio")
    assert len(res.factores_criticos) >= 3
    assert res.datos_sinteticos is True
