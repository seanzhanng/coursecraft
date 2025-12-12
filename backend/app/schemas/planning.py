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


class TimetablePreferences(BaseModel):
    earliest_time_minutes: int | None = None
    latest_time_minutes: int | None = None


class TimetableRequest(BaseModel):
    term_id: str
    course_codes: list[str]
    preferences: TimetablePreferences


class ScheduledSection(BaseModel):
    section_id: str
    course_code: str
    kind: str
    day_of_week: str
    start_time_minutes: int
    end_time_minutes: int


class TimetableObjective(BaseModel):
    status: str
    total_penalty: float | None = None


class TimetableResponse(BaseModel):
    sections: list[ScheduledSection]
    objective: TimetableObjective
    warnings: list[str] = []
