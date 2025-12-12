from collections.abc import Sequence

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db import get_db
from app.models import Program
from app.schemas.programs import ProgramRead


router = APIRouter(prefix="/programs", tags=["programs"])


@router.get("/", response_model=list[ProgramRead])
def list_programs(db: Session = Depends(get_db)) -> list[ProgramRead]:
    statement = select(Program).order_by(Program.id)
    result = db.execute(statement)
    programs: Sequence[Program] = result.scalars().all()
    return [ProgramRead.model_validate(program) for program in programs]


@router.get("/{program_id}", response_model=ProgramRead)
def get_program(program_id: str, db: Session = Depends(get_db)) -> ProgramRead:
    program = db.get(Program, program_id)
    if program is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Program not found",
        )
    return ProgramRead.model_validate(program)
