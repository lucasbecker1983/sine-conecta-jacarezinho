import re
from dataclasses import dataclass

from app.ai.local_provider import get_ai_provider
from app.models import Job, Resume, Worker


DISCLAIMER = "A IA é apenas apoio à triagem. A decisão final é do colaborador do SINE."


@dataclass
class CandidateMatch:
    worker_id: str
    resume_id: str | None
    worker_name: str
    match_score: int
    match_level: str
    summary: str
    skills: list[str]
    strengths: list[str]
    gaps: list[str]
    match_explanation: str
    suggested_interview_questions: list[str]


def classify_score(score: int) -> str:
    if score >= 80:
        return "alta"
    if score >= 60:
        return "media"
    return "baixa"


def tokenize(text: str) -> set[str]:
    return {token for token in re.findall(r"[a-zA-ZÀ-ÿ0-9]{3,}", text.lower())}


def job_payload(job: Job) -> dict:
    return {
        "title": job.title,
        "description": job.description,
        "required_experience": job.required_experience,
        "minimum_education": job.minimum_education,
        "desired_courses": job.desired_courses,
        "cnh_required": job.cnh_required,
        "modality": job.modality,
        "workplace": job.workplace,
        "workday": job.workday,
    }


def analyze_candidate(
    job: Job, worker: Worker, resume: Resume | None
) -> CandidateMatch:
    resume_text = resume.extracted_text if resume and resume.extracted_text else ""
    worker_text = " ".join(
        str(value or "")
        for value in [
            worker.full_name,
            worker.education_level,
            worker.desired_role,
            worker.availability,
            worker.cnh,
            worker.notes,
        ]
    )
    combined_text = f"{resume_text}\n{worker_text}".strip()
    analysis = get_ai_provider().match_candidate_to_job(combined_text, job_payload(job))
    job_terms = tokenize(
        " ".join(str(value or "") for value in job_payload(job).values())
    )
    candidate_terms = tokenize(combined_text)
    overlap = sorted(job_terms.intersection(candidate_terms))
    score = int(analysis.match_score or 0)
    if job.cnh_required and not worker.cnh:
        score = max(0, score - 8)
    if (
        job.minimum_education
        and worker.education_level
        and job.minimum_education.lower() in worker.education_level.lower()
    ):
        score = min(100, score + 5)
    score = max(15, min(100, score))
    skills = list(dict.fromkeys([*(analysis.skills or []), *overlap[:8]]))[:12]
    strengths = []
    if overlap:
        strengths.append(
            f"Termos da vaga encontrados no perfil: {', '.join(overlap[:5])}."
        )
    if worker.availability:
        strengths.append(f"Disponibilidade informada: {worker.availability}.")
    if worker.education_level:
        strengths.append(f"Escolaridade informada: {worker.education_level}.")
    gaps = []
    if job.cnh_required and not worker.cnh:
        gaps.append(f"CNH {job.cnh_required} exigida, mas não informada no cadastro.")
    if job.desired_courses and not any(
        token in candidate_terms for token in tokenize(job.desired_courses)
    ):
        gaps.append("Cursos desejados não foram identificados claramente no currículo.")
    if not resume:
        gaps.append("Currículo PDF ainda não vinculado à candidatura.")
    if not worker.phone and not worker.whatsapp:
        gaps.append("Contato telefônico não informado.")
    questions = analysis.interview_questions or []
    if job.cnh_required:
        questions.append(
            f"Você possui CNH {job.cnh_required} ou disponibilidade para regularizar?"
        )
    if job.desired_courses:
        questions.append(
            "Quais cursos ou treinamentos relacionados à vaga você já concluiu?"
        )
    explanation = (
        analysis.match_explanation
        or "Compatibilidade estimada por sinais do currículo e requisitos da vaga."
    )
    explanation = f"{explanation} {DISCLAIMER}"
    return CandidateMatch(
        worker_id=str(worker.id),
        resume_id=str(resume.id) if resume else None,
        worker_name=worker.full_name,
        match_score=score,
        match_level=classify_score(score),
        summary=analysis.summary,
        skills=skills,
        strengths=strengths[:4],
        gaps=gaps[:4],
        match_explanation=explanation,
        suggested_interview_questions=list(dict.fromkeys(questions))[:5],
    )
