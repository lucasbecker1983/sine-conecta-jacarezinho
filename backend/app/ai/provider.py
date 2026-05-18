from abc import ABC, abstractmethod
from dataclasses import dataclass


@dataclass
class ResumeAnalysis:
    summary: str
    skills: list[str]
    education: list[str]
    previous_roles: list[str]
    keywords: list[str]
    match_score: int | None = None
    match_explanation: str | None = None
    interview_questions: list[str] | None = None
    resume_improvements: list[str] | None = None


class AIProvider(ABC):
    @abstractmethod
    def analyze_resume(self, text: str, job: dict | None = None) -> ResumeAnalysis:
        raise NotImplementedError

    @abstractmethod
    def match_candidate_to_job(self, resume_text: str, job: dict) -> ResumeAnalysis:
        raise NotImplementedError
