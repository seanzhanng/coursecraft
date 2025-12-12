from collections.abc import Sequence

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db import get_db
from app.models import Course
from app.schemas.courses import CourseRead


router = APIRouter(prefix="/courses", tags=["courses"])


@router.get("/", response_model=list[CourseRead])
def list_courses(db: Session = Depends(get_db)) -> list[CourseRead]:
    statement = select(Course).order_by(Course.code)
    result = db.execute(statement)
    courses: Sequence[Course] = result.scalars().all()
    return [CourseRead.model_validate(course) for course in courses]


@router.get("/{course_code}", response_model=CourseRead)
def get_course(course_code: str, db: Session = Depends(get_db)) -> CourseRead:
    course = db.get(Course, course_code)
    if course is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Course not found",
        )
    return CourseRead.model_validate(course)
