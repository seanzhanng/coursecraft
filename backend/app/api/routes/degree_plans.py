from collections.abc import Sequence

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db import get_db
from app.models import Program, ProgramRequirement, Course, Prerequisite, CourseOffering
from app.planner.degree_planner import (
    CatalogSnapshot,
    RequiredCourse,
    CoursePrerequisite,
    compute_degree_plan,
)
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

    course_statement = (
        select(Course.code, Course.credits)
        .join(ProgramRequirement, ProgramRequirement.course_code == Course.code)
        .where(ProgramRequirement.program_id == request.program_id)
        .where(ProgramRequirement.requirement_type == "REQUIRED")
        .order_by(Course.code)
    )
    course_result = db.execute(course_statement)
    course_rows: Sequence[tuple[str, float]] = course_result.all()

    completed_set = set(request.completed_courses)
    required_courses: list[RequiredCourse] = []
    required_course_codes: set[str] = set()

    for course_code, credits in course_rows:
        if course_code in completed_set:
            continue
        if course_code in required_course_codes:
            continue
        required_course_codes.add(course_code)
        required_courses.append(
            RequiredCourse(
                code=course_code,
                credits=credits,
            )
        )

    prerequisite_statement = (
        select(Prerequisite.course_code, Prerequisite.prereq_code)
        .where(Prerequisite.course_code.in_(required_course_codes))
        .order_by(Prerequisite.course_code)
    )
    prerequisite_result = db.execute(prerequisite_statement)
    prerequisite_rows: Sequence[tuple[str, str]] = prerequisite_result.all()

    prerequisites: list[CoursePrerequisite] = []
    for course_code, prereq_code in prerequisite_rows:
        prerequisites.append(
            CoursePrerequisite(
                course_code=course_code,
                prerequisite_code=prereq_code,
            )
        )

    term_index_by_id: dict[str, int] = {term_id: index for index, term_id in enumerate(request.allowed_terms)}

    offering_statement = (
        select(CourseOffering.course_code, CourseOffering.term_id)
        .where(CourseOffering.course_code.in_(required_course_codes))
        .where(CourseOffering.term_id.in_(request.allowed_terms))
        .order_by(CourseOffering.course_code)
    )
    offering_result = db.execute(offering_statement)
    offering_rows: Sequence[tuple[str, str]] = offering_result.all()

    offered_term_indices_by_course: dict[str, set[int]] = {}
    for course_code, term_id in offering_rows:
        term_index = term_index_by_id.get(term_id)
        if term_index is None:
            continue
        if course_code not in offered_term_indices_by_course:
            offered_term_indices_by_course[course_code] = set()
        offered_term_indices_by_course[course_code].add(term_index)

    catalog = CatalogSnapshot(
        required_courses=required_courses,
        prerequisites=prerequisites,
        offered_term_indices_by_course=offered_term_indices_by_course,
        completed_courses=completed_set,
    )

    response = compute_degree_plan(request, catalog)
    return response
