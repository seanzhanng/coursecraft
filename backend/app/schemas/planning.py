from pydantic import BaseModel


class DegreePlanTerm(BaseModel):
    term_id: str
    course_codes: list[str]
    total_credits: float


class DegreePlanObjective(BaseModel):
    status: str
    max_term_used_index: int | None = None


class DegreePlanRequest(BaseModel):
    program_id: str
    completed_courses: list[str]
    target_grad_term: str | None = None
    allowed_terms: list[str]
    min_credits_per_term: float
    max_credits_per_term: float
    max_terms: int | None = None


class DegreePlanResponse(BaseModel):
    terms: list[DegreePlanTerm]
    objective: DegreePlanObjective
    warnings: list[str] = []
