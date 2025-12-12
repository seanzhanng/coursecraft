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
        warnings: list[str] = []
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

    total_credits = sum(course.credits for course in catalog.required_courses)
    scaled_total_credits = int(total_credits * 10)
    min_credits = request.min_credits_per_term
    max_credits = request.max_credits_per_term
    scaled_min_credits = int(min_credits * 10)
    scaled_max_credits = int(max_credits * 10)

    term_used: dict[int, cp_model.IntVar] = {}
    term_load_scaled: dict[int, cp_model.IntVar] = {}

    for term_index in term_indices:
        term_used[term_index] = model.NewBoolVar(f"term_used_{term_index}")
        load_expression_terms: list[cp_model.LinearExpr] = []
        for course_index in course_indices:
            course = catalog.required_courses[course_index]
            load_expression_terms.append(int(course.credits * 10) * x[(course_index, term_index)])
            model.Add(x[(course_index, term_index)] <= term_used[term_index])
        if load_expression_terms:
            load_var = model.NewIntVar(0, scaled_total_credits, f"load_scaled_{term_index}")
            model.Add(load_var == sum(load_expression_terms))
            term_load_scaled[term_index] = load_var
            model.Add(load_var <= scaled_max_credits * term_used[term_index])
            if scaled_min_credits > 0:
                model.Add(load_var + scaled_total_credits * (1 - term_used[term_index]) >= scaled_min_credits)
        else:
            load_var = model.NewIntVar(0, 0, f"load_scaled_{term_index}")
            term_load_scaled[term_index] = load_var
            model.Add(load_var == 0)

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

    max_term_used = model.NewIntVar(0, len(term_indices) - 1, "max_term_used")
    for course_index in course_indices:
        model.Add(max_term_used >= course_term_indices[course_index])

    target_term_index: int | None = None
    if request.target_grad_term is not None and request.target_grad_term in allowed_terms:
        target_term_index = allowed_terms.index(request.target_grad_term)
        lateness = model.NewIntVar(0, len(term_indices) - 1, "lateness")
        model.Add(lateness >= max_term_used - target_term_index)
        model.Add(lateness >= 0)
        large_weight = len(term_indices) + 1
        model.Minimize(large_weight * lateness + max_term_used)
    else:
        model.Minimize(max_term_used)

    solver = cp_model.CpSolver()
    solver_status = solver.Solve(model)

    if solver_status not in (cp_model.OPTIMAL, cp_model.FEASIBLE):
        terms = []
        objective = DegreePlanObjective(status="INFEASIBLE", max_term_used_index=None)
        warnings = ["No feasible plan found with current constraints."]
        return DegreePlanResponse(terms=terms, objective=objective, warnings=warnings)

    courses_by_term_index: dict[int, list[RequiredCourse]] = {term_index: [] for term_index in term_indices}
    for course_index in course_indices:
        assigned_term_index = solver.Value(course_term_indices[course_index])
        if assigned_term_index in courses_by_term_index:
            courses_by_term_index[assigned_term_index].append(catalog.required_courses[course_index])

    terms: list[DegreePlanTerm] = []
    for term_index in term_indices:
        assigned_courses = courses_by_term_index.get(term_index, [])
        if not assigned_courses:
            continue
        term_id = allowed_terms[term_index]
        course_codes = [course.code for course in assigned_courses]
        total_credits_for_term = float(sum(course.credits for course in assigned_courses))
        terms.append(
            DegreePlanTerm(
                term_id=term_id,
                course_codes=course_codes,
                total_credits=total_credits_for_term,
            )
        )

    terms.sort(key=lambda term: allowed_terms.index(term.term_id))

    computed_max_term_used_index: int | None = solver.Value(max_term_used)

    warnings: list[str] = []
    if catalog.prerequisites:
        warnings.append("Prerequisites between program courses are enforced.")
    if catalog.offered_term_indices_by_course:
        warnings.append(
            "Course offerings are enforced when available. Courses without offerings are assumed available in all allowed terms."
        )
    warnings.append("Minimum and maximum credits per populated term are enforced when possible.")
    if target_term_index is not None and computed_max_term_used_index is not None:
        if computed_max_term_used_index > target_term_index:
            warnings.append("The computed plan finishes after the target graduation term.")

    objective = DegreePlanObjective(
        status="OPTIMAL" if solver_status == cp_model.OPTIMAL else "FEASIBLE",
        max_term_used_index=computed_max_term_used_index,
    )

    return DegreePlanResponse(terms=terms, objective=objective, warnings=warnings)
