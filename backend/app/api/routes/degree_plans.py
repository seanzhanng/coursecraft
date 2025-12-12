from collections.abc import Sequence

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db import get_db
from app.models import Program, ProgramRequirement, Course
from app.planner.degree_planner import CatalogSnapshot, RequiredCourse, compute_degree_plan
from app.schemas.planning import DegreePlanRequest, DegreePlanResponse


router = APIRouter(prefix="/plan/degree", tags=["degree-planning"])


@router.post("/", response_model=DegreePlanResponse)
def plan_degree(request: DegreePlanRequest, db: Session = Depends(get_db)) -> DegreePlanResponse:
    program = db.get(Program, request.program_id)
    if program is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Program not found",
        )

    statement = (
        select(Course.code, Course.credits)
        .join(ProgramRequirement, ProgramRequirement.course_code == Course.code)
        .where(ProgramRequirement.program_id == request.program_id)
        .where(ProgramRequirement.requirement_type == "REQUIRED")
        .order_by(Course.code)
    )
    result = db.execute(statement)
    rows: Sequence[tuple[str, float]] = result.all()

    completed_set = set(request.completed_courses)
    required_courses: list[RequiredCourse] = []
    seen_codes: set[str] = set()

    for course_code, credits in rows:
        if course_code in completed_set:
            continue
        if course_code in seen_codes:
            continue
        seen_codes.add(course_code)
        required_courses.append(
            RequiredCourse(
                code=course_code,
                credits=credits,
            )
        )

    catalog = CatalogSnapshot(required_courses=required_courses)
    response = compute_degree_plan(request, catalog)
    return response
