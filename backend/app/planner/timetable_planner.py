from dataclasses import dataclass
from typing import Sequence

from ortools.sat.python import cp_model

from app.schemas.planning import (
    TimetableRequest,
    TimetablePreferences,
    ScheduledSection,
    TimetableResponse,
    TimetableObjective,
)


@dataclass
class TimetableSectionInput:
    section_id: str
    course_code: str
    kind: str
    day_of_week: str
    start_time_minutes: int
    end_time_minutes: int


def sections_overlap(section_a: TimetableSectionInput, section_b: TimetableSectionInput) -> bool:
    if section_a.day_of_week != section_b.day_of_week:
        return False
    latest_start = max(section_a.start_time_minutes, section_b.start_time_minutes)
    earliest_end = min(section_a.end_time_minutes, section_b.end_time_minutes)
    return latest_start < earliest_end


def compute_timetable(
    request: TimetableRequest,
    sections: Sequence[TimetableSectionInput],
) -> TimetableResponse:
    if not request.course_codes:
        objective = TimetableObjective(status="NO_COURSES", total_penalty=0.0)
        return TimetableResponse(sections=[], objective=objective, warnings=[])

    sections_for_course: dict[str, list[int]] = {}
    for index, section in enumerate(sections):
        if section.course_code not in sections_for_course:
            sections_for_course[section.course_code] = []
        sections_for_course[section.course_code].append(index)

    missing_courses = [code for code in request.course_codes if code not in sections_for_course]
    if missing_courses:
        objective = TimetableObjective(status="NO_SECTIONS_FOR_COURSE", total_penalty=None)
        warning_text = "No sections found for courses: " + ", ".join(sorted(missing_courses))
        return TimetableResponse(sections=[], objective=objective, warnings=[warning_text])

    model = cp_model.CpModel()

    num_sections = len(sections)
    section_indices = list(range(num_sections))

    y: dict[int, cp_model.IntVar] = {}
    for index in section_indices:
        y[index] = model.NewBoolVar(f"y_{index}")

    for course_code in request.course_codes:
        indices = sections_for_course.get(course_code, [])
        model.Add(sum(y[index] for index in indices) == 1)

    overlapping_pairs: list[tuple[int, int]] = []
    for i in section_indices:
        for j in section_indices:
            if j <= i:
                continue
            if sections_overlap(sections[i], sections[j]):
                overlapping_pairs.append((i, j))

    for i, j in overlapping_pairs:
        model.Add(y[i] + y[j] <= 1)

    preferences: TimetablePreferences = request.preferences
    earliest_time = preferences.earliest_time_minutes
    latest_time = preferences.latest_time_minutes
    avoid_friday = preferences.avoid_friday is True

    penalty_coefficients: dict[int, int] = {}
    for index in section_indices:
        section = sections[index]
        penalty = 0
        if earliest_time is not None and section.start_time_minutes < earliest_time:
            penalty += 1
        if latest_time is not None and section.end_time_minutes > latest_time:
            penalty += 1
        if avoid_friday and section.day_of_week.upper() == "FRI":
            penalty += 1
        penalty_coefficients[index] = penalty

    total_penalty_expr = []
    for index in section_indices:
        coefficient = penalty_coefficients[index]
        if coefficient > 0:
            total_penalty_expr.append(coefficient * y[index])

    if total_penalty_expr:
        model.Minimize(sum(total_penalty_expr))
    else:
        model.Minimize(0)

    solver = cp_model.CpSolver()
    solver_status = solver.Solve(model)

    if solver_status not in (cp_model.OPTIMAL, cp_model.FEASIBLE):
        objective = TimetableObjective(status="INFEASIBLE", total_penalty=None)
        warnings = ["No feasible timetable found for the requested sections and preferences."]
        return TimetableResponse(sections=[], objective=objective, warnings=warnings)

    selected_sections: list[ScheduledSection] = []
    total_penalty_value = 0
    for index in section_indices:
        if solver.Value(y[index]) == 1:
            section = sections[index]
            selected_sections.append(
                ScheduledSection(
                    section_id=section.section_id,
                    course_code=section.course_code,
                    kind=section.kind,
                    day_of_week=section.day_of_week,
                    start_time_minutes=section.start_time_minutes,
                    end_time_minutes=section.end_time_minutes,
                )
            )
            total_penalty_value += penalty_coefficients[index]

    objective_status = "OPTIMAL" if solver_status == cp_model.OPTIMAL else "FEASIBLE"
    objective = TimetableObjective(status=objective_status, total_penalty=float(total_penalty_value))

    warnings: list[str] = []
    if overlapping_pairs:
        warnings.append("Time conflicts between chosen sections are avoided.")
    if earliest_time is not None or latest_time is not None:
        warnings.append("Sections outside preferred time bounds are penalized in the objective.")
    if avoid_friday:
        warnings.append("Friday sections are penalized in the objective when alternatives exist.")

    return TimetableResponse(sections=selected_sections, objective=objective, warnings=warnings)
