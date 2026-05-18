import re

from app.ai.provider import AIProvider, ResumeAnalysis


SKILL_WORDS = {
    "atendimento", "informatica", "informática", "excel", "word", "vendas", "organização", "organizacao",
    "comunicação", "comunicacao", "liderança", "lideranca", "logística", "logistica", "administrativo",
    "recepcao", "recepção", "operador", "produção", "producao", "estoque", "caixa",
}
EDUCATION_PATTERNS = ["ensino fundamental", "ensino medio", "ensino médio", "superior", "tecnico", "técnico", "graduação", "graduacao"]
ROLE_PATTERNS = ["auxiliar administrativo", "recepcionista", "vendedor", "operador de caixa", "atendente", "estoquista", "motorista", "assistente"]


def normalize(text: str) -> str:
    return re.sub(r"\s+", " ", text.lower()).strip()


class LocalAIProvider(AIProvider):
    def analyze_resume(self, text: str, job: dict | None = None) -> ResumeAnalysis:
        clean = normalize(text)
        skills = sorted({word for word in SKILL_WORDS if word in clean})
        education = sorted({word for word in EDUCATION_PATTERNS if word in clean})
        roles = sorted({role for role in ROLE_PATTERNS if role in clean})
        keywords = sorted(set(skills + education + roles))[:20]
        first_role = roles[0] if roles else "rotinas operacionais"
        summary = f"Profissional com indicios de experiencia em {first_role}."
        if skills:
            summary += f" Principais competencias identificadas: {', '.join(skills[:5])}."
        analysis = ResumeAnalysis(
            summary=summary,
            skills=skills,
            education=education,
            previous_roles=roles,
            keywords=keywords,
            interview_questions=[
                "Voce possui disponibilidade para inicio imediato?",
                "Conte sobre uma experiencia profissional relevante para esta vaga.",
            ],
            resume_improvements=[
                "Detalhar datas de entrada e saida das experiencias.",
                "Adicionar resultados concretos obtidos em trabalhos anteriores.",
            ],
        )
        if job:
            return self.match_candidate_to_job(text, job)
        return analysis

    def match_candidate_to_job(self, resume_text: str, job: dict) -> ResumeAnalysis:
        base = self.analyze_resume(resume_text)
        job_text = normalize(" ".join(str(v or "") for v in job.values()))
        matches = [kw for kw in base.keywords if kw in job_text]
        score = min(95, 35 + len(matches) * 12 + (10 if base.education else 0))
        explanation = "Aderencia estimada por palavras-chave e sinais do curriculo. "
        explanation += f"Termos coincidentes: {', '.join(matches)}." if matches else "Poucos termos explicitos coincidem com a vaga."
        base.match_score = score
        base.match_explanation = explanation + " A analise automatica e apenas uma sugestao; a decisao final e do colaborador responsavel."
        return base


def get_ai_provider() -> AIProvider:
    return LocalAIProvider()
