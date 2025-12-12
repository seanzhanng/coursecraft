import { useState } from "react";
import { NavLink, Route, Routes } from "react-router-dom";
import { usePrograms } from "./api/programs";
import { useCourses } from "./api/courses";

function NavigationBar() {
  return (
    <header className="border-b bg-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <div className="text-lg font-semibold">CourseCraft</div>
        <nav className="flex gap-4 text-sm">
          <NavLink
            to="/"
            className={({ isActive }) =>
              isActive ? "font-semibold text-blue-600" : "text-gray-700"
            }
          >
            Home
          </NavLink>
          <NavLink
            to="/completed-courses"
            className={({ isActive }) =>
              isActive ? "font-semibold text-blue-600" : "text-gray-700"
            }
          >
            Completed Courses
          </NavLink>
          <NavLink
            to="/constraints"
            className={({ isActive }) =>
              isActive ? "font-semibold text-blue-600" : "text-gray-700"
            }
          >
            Constraints
          </NavLink>
          <NavLink
            to="/plan"
            className={({ isActive }) =>
              isActive ? "font-semibold text-blue-600" : "text-gray-700"
            }
          >
            Degree Plan
          </NavLink>
        </nav>
      </div>
    </header>
  );
}

function HomePage() {
  const { data: programs, isLoading, isError } = usePrograms();
  const [selectedProgramId, setSelectedProgramId] = useState<string | null>(null);

  return (
    <main className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="mb-4 text-2xl font-semibold">Welcome to CourseCraft</h1>
      <p className="mb-6 text-gray-700">
        Start by selecting your program. Later steps will let you mark completed courses, configure constraints, and
        generate a multi-term plan and conflict-free timetables.
      </p>
      <div className="mb-6 rounded-lg border bg-white p-4">
        <h2 className="mb-3 text-lg font-semibold">Select program</h2>
        {isLoading && <div className="text-gray-600">Loading programs.</div>}
        {isError && <div className="text-red-600">Failed to load programs.</div>}
        {!isLoading && !isError && programs && programs.length === 0 && (
          <div className="text-gray-600">
            No programs found. Make sure the backend seed script has been run.
          </div>
        )}
        {!isLoading && !isError && programs && programs.length > 0 && (
          <div className="flex flex-col gap-3">
            <select
              value={selectedProgramId ?? ""}
              onChange={(event) => setSelectedProgramId(event.target.value || null)}
              className="w-full rounded-md border px-3 py-2 text-sm"
            >
              <option value="">Select a program</option>
              {programs.map((program) => (
                <option key={program.id} value={program.id}>
                  {program.name}
                </option>
              ))}
            </select>
            {selectedProgramId && (
              <div className="rounded-md border bg-gray-50 px-3 py-2 text-sm text-gray-700">
                Selected program: {selectedProgramId}
              </div>
            )}
          </div>
        )}
      </div>
      <p className="text-gray-700">
        Use the navigation above to move through the planner steps. The next page lets you review the course catalog and
        mark completed courses.
      </p>
    </main>
  );
}

function CompletedCoursesPage() {
  const { data: courses, isLoading, isError } = useCourses();

  return (
    <main className="mx-auto max-w-5xl px-4 py-8">
      <h2 className="mb-4 text-xl font-semibold">Completed Courses</h2>
      <p className="mb-4 text-gray-700">
        This page will show the course catalog and eventually allow you to mark which courses you have already
        completed. For now, it lists the catalog from the backend.
      </p>
      {isLoading && <div className="text-gray-600">Loading courses.</div>}
      {isError && <div className="text-red-600">Failed to load courses.</div>}
      {!isLoading && !isError && courses && courses.length === 0 && (
        <div className="text-gray-600">No courses found.</div>
      )}
      {!isLoading && !isError && courses && courses.length > 0 && (
        <div className="overflow-x-auto rounded-lg border bg-white">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b bg-gray-50">
              <tr>
                <th className="px-4 py-2 font-medium text-gray-700">Code</th>
                <th className="px-4 py-2 font-medium text-gray-700">Name</th>
                <th className="px-4 py-2 font-medium text-gray-700">Credits</th>
              </tr>
            </thead>
            <tbody>
              {courses.map((course) => (
                <tr key={course.code} className="border-b last:border-b-0">
                  <td className="px-4 py-2 text-gray-900">{course.code}</td>
                  <td className="px-4 py-2 text-gray-900">{course.name}</td>
                  <td className="px-4 py-2 text-gray-900">{course.credits.toFixed(1)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}

function ConstraintsPage() {
  return (
    <main className="mx-auto max-w-4xl px-4 py-8">
      <h2 className="mb-4 text-xl font-semibold">Planning Constraints</h2>
      <p className="text-gray-700">
        Configure allowed terms, target graduation term, and load constraints such as minimum and maximum courses or
        credits per term. This page will be wired to the degree planning endpoint later.
      </p>
    </main>
  );
}

function DegreePlanPage() {
  return (
    <main className="mx-auto max-w-4xl px-4 py-8">
      <h2 className="mb-4 text-xl font-semibold">Degree Plan</h2>
      <p className="text-gray-700">
        Once the degree planner is integrated, this page will display a term-by-term breakdown of your plan and allow
        you to generate timetables for individual terms.
      </p>
    </main>
  );
}

function App() {
  return (
    <div className="min-h-screen bg-gray-50">
      <NavigationBar />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/completed-courses" element={<CompletedCoursesPage />} />
        <Route path="/constraints" element={<ConstraintsPage />} />
        <Route path="/plan" element={<DegreePlanPage />} />
      </Routes>
    </div>
  );
}

export default App;
