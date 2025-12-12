from app.db import SessionLocal
from app.models import Program, Course, Prerequisite, ProgramRequirement, CourseOffering, Section


def seed_database() -> None:
    database_session = SessionLocal()
    try:
        program_id = "uw-cs-honours"

        program = database_session.get(Program, program_id)
        if program is None:
            program = Program(
                id=program_id,
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
            code = course_definition["code"]
            course = database_session.get(Course, code)
            if course is None:
                course = Course(
                    code=code,
                    name=course_definition["name"],
                    credits=course_definition["credits"],
                    description=course_definition["description"],
                )
                database_session.add(course)
            else:
                course.name = course_definition["name"]
                course.credits = course_definition["credits"]
                course.description = course_definition["description"]
            course_models.append(course)

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

        existing_prerequisites = database_session.query(Prerequisite).all()
        existing_prereq_pairs = {(p.course_code, p.prereq_code) for p in existing_prerequisites}

        for course_code, prereq_code in prerequisite_pairs:
            if (course_code, prereq_code) in existing_prereq_pairs:
                continue
            prerequisite_model = Prerequisite(
                course_code=course_code,
                prereq_code=prereq_code,
            )
            database_session.add(prerequisite_model)

        existing_requirements = database_session.query(ProgramRequirement).all()
        existing_requirement_keys = {
            (r.program_id, r.course_code, r.requirement_type) for r in existing_requirements
        }

        for course_model in course_models:
            key = (program.id, course_model.code, "REQUIRED")
            if key in existing_requirement_keys:
                continue
            program_requirement_model = ProgramRequirement(
                program_id=program.id,
                course_code=course_model.code,
                requirement_type="REQUIRED",
            )
            database_session.add(program_requirement_model)

        course_offering_definitions = [
            ("CS135", "2026-F"),
            ("CS135", "2027-F"),
            ("CS136", "2027-W"),
            ("CS136", "2028-W"),
            ("CS240", "2027-F"),
            ("CS241", "2027-F"),
            ("CS245", "2028-W"),
            ("CS246", "2028-W"),
            ("MATH135", "2026-F"),
            ("MATH136", "2027-W"),
            ("MATH239", "2027-F"),
            ("STAT230", "2027-W"),
        ]

        existing_offerings = database_session.query(CourseOffering).all()
        existing_offering_pairs = {(o.course_code, o.term_id) for o in existing_offerings}

        for course_code, term_id in course_offering_definitions:
            if (course_code, term_id) in existing_offering_pairs:
                continue
            course_offering = CourseOffering(
                course_code=course_code,
                term_id=term_id,
            )
            database_session.add(course_offering)

        section_definitions = [
            (
                "CS240",
                "2027-F",
                "CS240-LEC-001",
                "LEC",
                "MON",
                570,
                650,
                "MC 2066",
            ),
            (
                "CS240",
                "2027-F",
                "CS240-LEC-002",
                "LEC",
                "TUE",
                780,
                860,
                "MC 2066",
            ),
            (
                "CS241",
                "2027-F",
                "CS241-LEC-001",
                "LEC",
                "MON",
                660,
                740,
                "MC 2067",
            ),
            (
                "CS241",
                "2027-F",
                "CS241-LEC-002",
                "LEC",
                "WED",
                900,
                980,
                "MC 2067",
            ),
            (
                "MATH239",
                "2027-F",
                "MATH239-LEC-001",
                "LEC",
                "TUE",
                600,
                680,
                "RCH 101",
            ),
            (
                "MATH239",
                "2027-F",
                "MATH239-LEC-002",
                "LEC",
                "THU",
                840,
                920,
                "RCH 101",
            ),
            (
                "CS136",
                "2027-W",
                "CS136-LEC-001",
                "LEC",
                "MON",
                570,
                650,
                "MC 2065",
            ),
            (
                "CS136",
                "2027-W",
                "CS136-LEC-002",
                "LEC",
                "WED",
                780,
                860,
                "MC 2065",
            ),
            (
                "STAT230",
                "2027-W",
                "STAT230-LEC-001",
                "LEC",
                "TUE",
                600,
                680,
                "DWE 1501",
            ),
            (
                "STAT230",
                "2027-W",
                "STAT230-LEC-002",
                "LEC",
                "THU",
                900,
                980,
                "DWE 1501",
            ),
        ]

        existing_sections = database_session.query(Section).all()
        existing_section_keys = {(s.course_code, s.term_id, s.section_code) for s in existing_sections}

        for (
            course_code,
            term_id,
            section_code,
            kind,
            day_of_week,
            start_time_minutes,
            end_time_minutes,
            location,
        ) in section_definitions:
            key = (course_code, term_id, section_code)
            if key in existing_section_keys:
                continue
            section = Section(
                course_code=course_code,
                term_id=term_id,
                section_code=section_code,
                kind=kind,
                day_of_week=day_of_week,
                start_time_minutes=start_time_minutes,
                end_time_minutes=end_time_minutes,
                location=location,
            )
            database_session.add(section)

        database_session.commit()
    finally:
        database_session.close()


if __name__ == "__main__":
    seed_database()
