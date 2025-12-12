from app.db import SessionLocal
from app.models import Program, Course, Prerequisite, ProgramRequirement


def seed_database() -> None:
    database_session = SessionLocal()
    try:
        existing_program = database_session.get(Program, "uw-cs-honours")
        if existing_program is not None:
            return

        program = Program(
            id="uw-cs-honours",
            name="Honours Computer Science",
            description="Sample CS honours program for CourseCraft demo",
        )
        database_session.add(program)

        course_definitions = [
            {
                "code": "CS135",
                "name": "Designing Functional Programs",
                "credits": 0.5,
                "description": "Introduction to functional programming and problem solving.",
            },
            {
                "code": "CS136",
                "name": "Elementary Algorithm Design and Data Abstraction",
                "credits": 0.5,
                "description": "Introduction to imperative programming and basic data structures.",
            },
            {
                "code": "CS240",
                "name": "Data Structures and Data Management",
                "credits": 0.5,
                "description": "Data structures, algorithms, and basic data management concepts.",
            },
            {
                "code": "CS241",
                "name": "Foundations of Sequential Programs",
                "credits": 0.5,
                "description": "Machine-level representation of programs and basic systems concepts.",
            },
            {
                "code": "CS245",
                "name": "Logic and Computation",
                "credits": 0.5,
                "description": "Propositional logic, predicate logic, and reasoning about programs.",
            },
            {
                "code": "CS246",
                "name": "Object-Oriented Software Development",
                "credits": 0.5,
                "description": "Object-oriented programming, design, and implementation techniques.",
            },
            {
                "code": "MATH135",
                "name": "Algebra for Honours Mathematics",
                "credits": 0.5,
                "description": "Linear algebra and algebraic structures for honours students.",
            },
            {
                "code": "MATH136",
                "name": "Linear Algebra 1",
                "credits": 0.5,
                "description": "Vectors, matrices, and linear transformations.",
            },
            {
                "code": "MATH239",
                "name": "Introduction to Combinatorics",
                "credits": 0.5,
                "description": "Counting, graph theory, and discrete structures.",
            },
            {
                "code": "STAT230",
                "name": "Probability",
                "credits": 0.5,
                "description": "Probability theory with applications.",
            },
        ]

        course_models: list[Course] = []
        for course_definition in course_definitions:
            course_model = Course(
                code=course_definition["code"],
                name=course_definition["name"],
                credits=course_definition["credits"],
                description=course_definition["description"],
            )
            course_models.append(course_model)

        database_session.add_all(course_models)
        database_session.flush()

        prerequisite_pairs = [
            ("CS136", "CS135"),
            ("CS240", "CS136"),
            ("CS241", "CS136"),
            ("CS245", "CS136"),
            ("CS246", "CS136"),
            ("MATH136", "MATH135"),
            ("MATH239", "MATH136"),
            ("STAT230", "MATH135"),
        ]

        prerequisite_models: list[Prerequisite] = []
        for course_code, prerequisite_code in prerequisite_pairs:
            prerequisite_model = Prerequisite(
                course_code=course_code,
                prereq_code=prerequisite_code,
            )
            prerequisite_models.append(prerequisite_model)

        database_session.add_all(prerequisite_models)

        program_requirement_models: list[ProgramRequirement] = []
        for course_model in course_models:
            program_requirement_model = ProgramRequirement(
                program_id=program.id,
                course_code=course_model.code,
                requirement_type="REQUIRED",
            )
            program_requirement_models.append(program_requirement_model)

        database_session.add_all(program_requirement_models)

        database_session.commit()
    finally:
        database_session.close()


if __name__ == "__main__":
    seed_database()
