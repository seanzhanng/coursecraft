from uuid import uuid4

from sqlalchemy import Float, ForeignKey, Integer, String, Text, text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.db import Base


class Program(Base):
    __tablename__ = "programs"

    id: Mapped[str] = mapped_column(String, primary_key=True)
    name: Mapped[str] = mapped_column(Text, nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)


class Course(Base):
    __tablename__ = "courses"

    code: Mapped[str] = mapped_column(String, primary_key=True)
    name: Mapped[str] = mapped_column(Text, nullable=False)
    credits: Mapped[float] = mapped_column(Float, nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)


class CourseOffering(Base):
    __tablename__ = "course_offerings"

    id: Mapped[str] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        server_default=text("gen_random_uuid()"),
    )
    course_code: Mapped[str] = mapped_column(
        String,
        ForeignKey("courses.code", ondelete="CASCADE"),
        nullable=False,
    )
    term_id: Mapped[str] = mapped_column(String, nullable=False)


class Prerequisite(Base):
    __tablename__ = "prerequisites"

    id: Mapped[str] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        server_default=text("gen_random_uuid()"),
    )
    course_code: Mapped[str] = mapped_column(
        String,
        ForeignKey("courses.code", ondelete="CASCADE"),
        nullable=False,
    )
    prereq_code: Mapped[str] = mapped_column(
        String,
        ForeignKey("courses.code", ondelete="CASCADE"),
        nullable=False,
    )


class ProgramRequirement(Base):
    __tablename__ = "program_requirements"

    id: Mapped[str] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        server_default=text("gen_random_uuid()"),
    )
    program_id: Mapped[str] = mapped_column(
        String,
        ForeignKey("programs.id", ondelete="CASCADE"),
        nullable=False,
    )
    course_code: Mapped[str] = mapped_column(
        String,
        ForeignKey("courses.code", ondelete="CASCADE"),
        nullable=False,
    )
    requirement_type: Mapped[str] = mapped_column(
        String,
        nullable=False,
        default="REQUIRED",
        server_default=text("'REQUIRED'"),
    )


class Section(Base):
    __tablename__ = "sections"

    id: Mapped[str] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        server_default=text("gen_random_uuid()"),
    )
    course_code: Mapped[str] = mapped_column(
        String,
        ForeignKey("courses.code", ondelete="CASCADE"),
        nullable=False,
    )
    term_id: Mapped[str] = mapped_column(String, nullable=False)
    section_code: Mapped[str] = mapped_column(String, nullable=False)
    kind: Mapped[str] = mapped_column(String, nullable=False)
    day_of_week: Mapped[str] = mapped_column(String, nullable=False)
    start_time_minutes: Mapped[int] = mapped_column(Integer, nullable=False)
    end_time_minutes: Mapped[int] = mapped_column(Integer, nullable=False)
    location: Mapped[str | None] = mapped_column(Text, nullable=True)
