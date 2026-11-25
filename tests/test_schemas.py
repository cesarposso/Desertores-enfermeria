import pytest
from pydantic import ValidationError
from backend.schemas import (
    SimuladorInputRequest,
    SimuladorOutputResponse,
    EvaluacionDifusa,
    ReglaDifusaActiva,
    ActualizarTutoriaRequest,
    EstudiantesRiesgoResponse,
    MateriaCargaItem,
    MetricasModelosResponse
)

def test_simulador_input_exact_variables_valid():
    valid = SimuladorInputRequest(
        asignatura="Farmacología Clínica",
        nota_primer_parcial=2.4,
        promedio_acumulado_cortes=2.8,
        asistencia_pct=75.0,
        repitente=0,
        semestre=4,
        carga_percibida=4.2,
        horas_estudio_semana=8.0,
        horas_sueno=6.0,
        apoyo_economico_familiar=1,
        trabajo_remunerado=0,
        intencion_seguir=1
    )
    assert valid.nota_primer_parcial == 2.4
    assert valid.asignatura == "Farmacología Clínica"

def test_simulador_input_bounds_validation():
    # nota_primer_parcial > 5.0
    with pytest.raises(ValidationError):
        SimuladorInputRequest(
            asignatura="Bioquímica Médica",
            nota_primer_parcial=5.5,
            promedio_acumulado_cortes=3.0,
            asistencia_pct=80.0,
            repitente=0,
            semestre=2,
            carga_percibida=3.0,
            horas_estudio_semana=10.0,
            horas_sueno=7.0,
            apoyo_economico_familiar=1,
            trabajo_remunerado=0,
            intencion_seguir=1
        )
        
    # asistencia_pct < 0
    with pytest.raises(ValidationError):
        SimuladorInputRequest(
            asignatura="Bioquímica Médica",
            nota_primer_parcial=3.0,
            promedio_acumulado_cortes=3.0,
            asistencia_pct=-5.0,
            repitente=0,
            semestre=2,
            carga_percibida=3.0,
            horas_estudio_semana=10.0,
            horas_sueno=7.0,
            apoyo_economico_familiar=1,
            trabajo_remunerado=0,
            intencion_seguir=1
        )

def test_actualizar_tutoria_schema():
    req = ActualizarTutoriaRequest(estado="citado", fecha="2026-11-30")
    assert req.estado == "citado"
    assert req.fecha == "2026-11-30"

    with pytest.raises(ValidationError):
        ActualizarTutoriaRequest(estado="expulsado") # Not allowed


def test_simulador_output_retrocompatible_y_con_difusa():
    sin_difusa = SimuladorOutputResponse(
        probabilidad_riesgo=42.0,
        nivel_riesgo="medio",
        mensaje_orientador="Seguimiento preventivo sugerido.",
    )
    assert sin_difusa.evaluacion_difusa is None

    con_difusa = SimuladorOutputResponse(
        probabilidad_riesgo=68.0,
        nivel_riesgo="alto",
        mensaje_orientador="Acompañamiento prioritario sugerido.",
        evaluacion_difusa=EvaluacionDifusa(
            probabilidad_difusa=72.5,
            nivel_riesgo="alto",
            reglas_activas=[
                ReglaDifusaActiva(
                    id="R1",
                    descripcion="SI el rendimiento académico es bajo Y la asignatura se cursa como repitente, ENTONCES se recomienda acompañamiento prioritario.",
                    activacion=0.85,
                    consecuente="alto",
                )
            ],
        ),
    )
    assert con_difusa.evaluacion_difusa is not None
    assert con_difusa.evaluacion_difusa.probabilidad_difusa == 72.5
    assert con_difusa.evaluacion_difusa.nivel_riesgo == "alto"
    assert len(con_difusa.evaluacion_difusa.reglas_activas) == 1
