from collections.abc import Sequence

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db import get_db
from app.models import Course, Section
from app.planner.timetable_planner import TimetableSectionInput, compute_timetable
from app.schemas.planning import TimetableRequest, TimetableResponse


router = APIRouter(prefix="/plan/timetable", tags=["timetable-planning"])


@router.post("/", response_model=TimetableResponse)
def plan_timetable(request: TimetableRequest, db: Session = Depends(get_db)) -> TimetableResponse:
    if not request.course_codes:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="At least one course code must be provided.",
        )

    course_statement = (
        select(Course.code)
        .where(Course.code.in_(request.course_codes))
        .order_by(Course.code)
    )
    course_result = db.execute(course_statement)
    existing_course_codes: Sequence[str] = [row[0] for row in course_result.all()]
    missing_courses = sorted(set(request.course_codes) - set(existing_course_codes))
    if missing_courses:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unknown course codes: {', '.join(missing_courses)}",
        )

    section_statement = (
        select(Section)
        .where(Section.term_id == request.term_id)
        .where(Section.course_code.in_(request.course_codes))
        .order_by(Section.course_code, Section.kind, Section.start_time_minutes)
    )
    section_result = db.execute(section_statement)
    section_models: Sequence[Section] = section_result.scalars().all()

    sections: list[TimetableSectionInput] = []
    for section_model in section_models:
        sections.append(
            TimetableSectionInput(
                section_id=str(section_model.id),
                course_code=section_model.course_code,
                kind=section_model.kind,
                day_of_week=section_model.day_of_week,
                start_time_minutes=section_model.start_time_minutes,
                end_time_minutes=section_model.end_time_minutes,
            )
        )

    response = compute_timetable(request, sections)
    return response
