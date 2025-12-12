import { useState } from "react";
import { NavLink, Route, Routes } from "react-router-dom";
import { usePrograms } from "./api/programs";
import { useCourses } from "./api/courses";
import { useDegreePlan } from "./api/degreePlans";
import { usePlanningContext } from "./planning/PlanningContext";

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
  const { state, setSelectedProgramId } = usePlanningContext();

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
              value={state.selectedProgramId ?? ""}
              onChange={(event) => {
                const value = event.target.value;
                setSelectedProgramId(value || null);
              }}
              className="w-full rounded-md border px-3 py-2 text-sm"
            >
              <option value="">Select a program</option>
              {programs.map((program) => (
                <option key={program.id} value={program.id}>
                  {program.name}
                </option>
              ))}
            </select>
            {state.selectedProgramId && (
              <div className="rounded-md border bg-gray-50 px-3 py-2 text-sm text-gray-700">
                Selected program: {state.selectedProgramId}
              </div>
            )}
          </div>
        )}
      </div>
      <p className="text-gray-700">
        Use the navigation above to move through the planner steps. The next page lets you review the course catalog and
        later mark completed courses.
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
  const { state, setLastDegreePlan } = usePlanningContext();
  const [allowedTermsInput, setAllowedTermsInput] = useState("2026-F, 2027-W, 2027-F, 2028-W");
  const [minCreditsInput, setMinCreditsInput] = useState("0.5");
  const [maxCreditsInput, setMaxCreditsInput] = useState("1.5");
  const [maxTermsInput, setMaxTermsInput] = useState("");
  const [localError, setLocalError] = useState<string | null>(null);

  const degreePlanMutation = useDegreePlan();

  const handleGenerate = () => {
    if (!state.selectedProgramId) {
      setLocalError("Select a program on the Home page before generating a plan.");
      return;
    }

    const allowedTerms = allowedTermsInput
      .split(",")
      .map((term) => term.trim())
      .filter((term) => term.length > 0);

    if (allowedTerms.length === 0) {
      setLocalError("Enter at least one allowed term.");
      return;
    }

    const minCredits = parseFloat(minCreditsInput);
    const maxCredits = parseFloat(maxCreditsInput);
    const maxTerms = maxTermsInput.trim().length > 0 ? parseInt(maxTermsInput, 10) : null;

    if (!Number.isFinite(minCredits) || !Number.isFinite(maxCredits) || maxCredits <= 0) {
      setLocalError("Enter valid numeric values for minimum and maximum credits.");
      return;
    }

    setLocalError(null);

    degreePlanMutation.mutate(
      {
        program_id: state.selectedProgramId,
        completed_courses: [],
        target_grad_term: null,
        allowed_terms: allowedTerms,
        min_credits_per_term: minCredits,
        max_credits_per_term: maxCredits,
        max_terms: maxTerms
      },
      {
        onSuccess: (plan) => {
          setLastDegreePlan(plan);
        }
      }
    );
  };

  return (
    <main className="mx-auto max-w-4xl px-4 py-8">
      <h2 className="mb-4 text-xl font-semibold">Planning Constraints</h2>
      <p className="mb-6 text-gray-700">
        Configure allowed terms and load constraints. For now, completed courses are treated as empty; later this will
        include your selections from the Completed Courses page.
      </p>
      <div className="mb-4 rounded-lg border bg-white p-4">
        <div className="mb-3 text-sm text-gray-700">
          Selected program:{" "}
          {state.selectedProgramId ? (
            <span className="font-medium text-gray-900">{state.selectedProgramId}</span>
          ) : (
            <span className="text-red-600">none selected</span>
          )}
        </div>
        <div className="mb-4 flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">Allowed terms</label>
            <input
              type="text"
              value={allowedTermsInput}
              onChange={(event) => setAllowedTermsInput(event.target.value)}
              className="w-full rounded-md border px-3 py-2 text-sm"
              placeholder="2026-F, 2027-W, 2027-F, 2028-W"
            />
            <p className="text-xs text-gray-500">
              Comma-separated list of term identifiers such as 2026-F, 2027-W.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700">Minimum credits per term</label>
              <input
                type="number"
                step="0.5"
                value={minCreditsInput}
                onChange={(event) => setMinCreditsInput(event.target.value)}
                className="w-full rounded-md border px-3 py-2 text-sm"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700">Maximum credits per term</label>
              <input
                type="number"
                step="0.5"
                value={maxCreditsInput}
                onChange={(event) => setMaxCreditsInput(event.target.value)}
                className="w-full rounded-md border px-3 py-2 text-sm"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700">Maximum number of terms</label>
              <input
                type="number"
                min="1"
                value={maxTermsInput}
                onChange={(event) => setMaxTermsInput(event.target.value)}
                className="w-full rounded-md border px-3 py-2 text-sm"
                placeholder="leave blank for no limit"
              />
            </div>
          </div>
        </div>
        {localError && <div className="mb-3 text-sm text-red-600">{localError}</div>}
        {degreePlanMutation.isError && (
          <div className="mb-3 text-sm text-red-600">Failed to generate plan. Check backend logs.</div>
        )}
        <button
          type="button"
          onClick={handleGenerate}
          disabled={degreePlanMutation.isPending}
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white disabled:bg-blue-300"
        >
          {degreePlanMutation.isPending ? "Generating plan" : "Generate degree plan"}
        </button>
      </div>
      {degreePlanMutation.isSuccess && (
        <div className="rounded-lg border bg-gray-50 p-4 text-sm text-gray-700">
          Latest plan has been generated. Open the Degree Plan page to view details.
        </div>
      )}
    </main>
  );
}

function DegreePlanPage() {
  const { state } = usePlanningContext();
  const plan = state.lastDegreePlan;

  return (
    <main className="mx-auto max-w-5xl px-4 py-8">
      <h2 className="mb-4 text-xl font-semibold">Degree Plan</h2>
      {!state.selectedProgramId && (
        <p className="text-gray-700">
          Select a program on the Home page and generate a plan on the Constraints page to see results here.
        </p>
      )}
      {state.selectedProgramId && !plan && (
        <p className="text-gray-700">
          No plan has been generated yet. Configure constraints and generate a plan on the Constraints page.
        </p>
      )}
      {state.selectedProgramId && plan && (
        <div className="flex flex-col gap-4">
          <div className="rounded-lg border bg-white p-4">
            <div className="mb-2 text-sm text-gray-700">
              Program:{" "}
              <span className="font-medium text-gray-900">
                {state.selectedProgramId}
              </span>
            </div>
            <div className="text-sm text-gray-700">
              Solver status:{" "}
              <span className="font-medium text-gray-900">
                {plan.objective.status}
              </span>
            </div>
          </div>
          {plan.warnings.length > 0 && (
            <div className="rounded-lg border border-yellow-300 bg-yellow-50 p-4 text-sm text-yellow-900">
              <div className="mb-1 font-semibold">Warnings</div>
              <ul className="list-disc pl-5">
                {plan.warnings.map((warning, index) => (
                  <li key={index}>{warning}</li>
                ))}
              </ul>
            </div>
          )}
          <div className="grid gap-4 md:grid-cols-2">
            {plan.terms.map((term) => (
              <div key={term.term_id} className="rounded-lg border bg-white p-4">
                <div className="mb-2 flex items-center justify-between text-sm">
                  <div className="font-semibold text-gray-900">{term.term_id}</div>
                  <div className="text-gray-700">
                    Total credits:{" "}
                    <span className="font-medium">{term.total_credits.toFixed(1)}</span>
                  </div>
                </div>
                <ul className="mt-2 space-y-1 text-sm text-gray-800">
                  {term.course_codes.map((code) => (
                    <li key={code}>{code}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      )}
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
