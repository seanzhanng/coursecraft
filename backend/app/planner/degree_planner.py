from dataclasses import dataclass
from typing import Mapping

from ortools.sat.python import cp_model

from app.schemas.planning import DegreePlanRequest, DegreePlanResponse, DegreePlanTerm, DegreePlanObjective


@dataclass
class RequiredCourse:
    code: str
    credits: float


@dataclass
class CoursePrerequisite:
    course_code: str
    prerequisite_code: str


@dataclass
class CatalogSnapshot:
    required_courses: list[RequiredCourse]
    prerequisites: list[CoursePrerequisite]
    offered_term_indices_by_course: Mapping[str, set[int]]
    completed_courses: set[str]


def compute_degree_plan(request: DegreePlanRequest, catalog: CatalogSnapshot) -> DegreePlanResponse:
    allowed_terms = list(request.allowed_terms)
    if request.max_terms is not None and request.max_terms < len(allowed_terms):
        allowed_terms = allowed_terms[: request.max_terms]

    if not allowed_terms or not catalog.required_courses:
        terms: list[DegreePlanTerm] = []
        objective = DegreePlanObjective(status="NO_COURSES_OR_TERMS", max_term_used_index=None)
        warnings = []
        return DegreePlanResponse(terms=terms, objective=objective, warnings=warnings)

    model = cp_model.CpModel()

    term_indices = list(range(len(allowed_terms)))
    course_indices = list(range(len(catalog.required_courses)))

    x: dict[tuple[int, int], cp_model.IntVar] = {}
    for course_index in course_indices:
        for term_index in term_indices:
            x[(course_index, term_index)] = model.NewBoolVar(f"x_{course_index}_{term_index}")

    for course_index in course_indices:
        model.Add(sum(x[(course_index, term_index)] for term_index in term_indices) == 1)

    for course_index in course_indices:
        course = catalog.required_courses[course_index]
        allowed_term_indices_for_course = catalog.offered_term_indices_by_course.get(
            course.code, set(term_indices)
        )
        for term_index in term_indices:
            if term_index not in allowed_term_indices_for_course:
                model.Add(x[(course_index, term_index)] == 0)

    max_credits = request.max_credits_per_term
    for term_index in term_indices:
        term_load_expr = []
        for course_index in course_indices:
            course = catalog.required_courses[course_index]
            term_load_expr.append(int(course.credits * 10) * x[(course_index, term_index)])
        if term_load_expr:
            model.Add(sum(term_load_expr) <= int(max_credits * 10))

    course_term_indices: dict[int, cp_model.IntVar] = {}
    for course_index in course_indices:
        course_term_indices[course_index] = model.NewIntVar(0, len(term_indices) - 1, f"term_for_course_{course_index}")
        model.Add(
            course_term_indices[course_index]
            == sum(term_index * x[(course_index, term_index)] for term_index in term_indices)
        )

    code_to_index: dict[str, int] = {}
    for course_index, course in enumerate(catalog.required_courses):
        code_to_index[course.code] = course_index

    for relation in catalog.prerequisites:
        course_code = relation.course_code
        prerequisite_code = relation.prerequisite_code
        if course_code not in code_to_index:
            continue
        if prerequisite_code in catalog.completed_courses:
            continue
        if prerequisite_code not in code_to_index:
            continue
        course_index = code_to_index[course_code]
        prerequisite_index = code_to_index[prerequisite_code]
        model.Add(course_term_indices[course_index] >= course_term_indices[prerequisite_index] + 1)

    objective_expr = sum(course_term_indices.values())
    model.Minimize(objective_expr)

    solver = cp_model.CpSolver()
    solver_status = solver.Solve(model)

    if solver_status not in (cp_model.OPTIMAL, cp_model.FEASIBLE):
        terms: list[DegreePlanTerm] = []
        objective = DegreePlanObjective(status="INFEASIBLE", max_term_used_index=None)
        warnings = ["No feasible plan found with current constraints."]
        return DegreePlanResponse(terms=terms, objective=objective, warnings=warnings)

    courses_by_term_index: dict[int, list[RequiredCourse]] = {term_index: [] for term_index in term_indices}
    for course_index in course_indices:
        assigned_term_index = solver.Value(course_term_indices[course_index])
        if assigned_term_index in courses_by_term_index:
            courses_by_term_index[assigned_term_index].append(catalog.required_courses[course_index])

    terms: list[DegreePlanTerm] = []
    max_term_used_index: int | None = None
    for term_index in term_indices:
        assigned_courses = courses_by_term_index.get(term_index, [])
        if not assigned_courses:
            continue
        term_id = allowed_terms[term_index]
        course_codes = [course.code for course in assigned_courses]
        total_credits = float(sum(course.credits for course in assigned_courses))
        terms.append(
            DegreePlanTerm(
                term_id=term_id,
                course_codes=course_codes,
                total_credits=total_credits,
            )
        )
        if max_term_used_index is None or term_index > max_term_used_index:
            max_term_used_index = term_index

    terms.sort(key=lambda term: allowed_terms.index(term.term_id))

    warnings: list[str] = []
    if catalog.prerequisites:
        warnings.append("Prerequisites between program courses are enforced.")
    if catalog.offered_term_indices_by_course:
        warnings.append("Course offerings are enforced when available. Courses without offerings are assumed available in all allowed terms.")

    objective = DegreePlanObjective(
        status="OPTIMAL" if solver_status == cp_model.OPTIMAL else "FEASIBLE",
        max_term_used_index=max_term_used_index,
    )

    return DegreePlanResponse(terms=terms, objective=objective, warnings=warnings)
