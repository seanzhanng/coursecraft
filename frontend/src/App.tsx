import { useMemo, useState } from "react";
import { NavLink, Route, Routes } from "react-router-dom";
import { usePrograms } from "./api/programs";
import { useCourses } from "./api/courses";
import { useDegreePlan } from "./api/degreePlans";
import { useTimetablePlan } from "./api/timetables";
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
        mark completed courses.
      </p>
    </main>
  );
}

function CompletedCoursesPage() {
  const { data: courses, isLoading, isError } = useCourses();
  const { state, setCompletedCourseCodes } = usePlanningContext();

  const handleToggleCourse = (courseCode: string) => {
    const current = state.completedCourseCodes;
    if (current.includes(courseCode)) {
      const updated = current.filter((code) => code !== courseCode);
      setCompletedCourseCodes(updated);
    } else {
      const updated = [...current, courseCode];
      setCompletedCourseCodes(updated);
    }
  };

  return (
    <main className="mx-auto max-w-5xl px-4 py-8">
      <h2 className="mb-4 text-xl font-semibold">Completed Courses</h2>
      <p className="mb-4 text-gray-700">
        Select the courses you have already completed. The degree planner will treat these as finished and only schedule
        the remaining requirements.
      </p>
      {isLoading && <div className="text-gray-600">Loading courses.</div>}
      {isError && <div className="text-red-600">Failed to load courses.</div>}
      {!isLoading && !isError && courses && courses.length === 0 && (
        <div className="text-gray-600">No courses found.</div>
      )}
      {!isLoading && !isError && courses && courses.length > 0 && (
        <>
          <div className="mb-3 text-sm text-gray-700">
            Selected completed courses:{" "}
            <span className="font-medium">
              {state.completedCourseCodes.length}
            </span>
          </div>
          <div className="overflow-x-auto rounded-lg border bg-white">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b bg-gray-50">
                <tr>
                  <th className="px-4 py-2 font-medium text-gray-700">Completed</th>
                  <th className="px-4 py-2 font-medium text-gray-700">Code</th>
                  <th className="px-4 py-2 font-medium text-gray-700">Name</th>
                  <th className="px-4 py-2 font-medium text-gray-700">Credits</th>
                </tr>
              </thead>
              <tbody>
                {courses.map((course) => {
                  const checked = state.completedCourseCodes.includes(course.code);
                  return (
                    <tr key={course.code} className="border-b last:border-b-0">
                      <td className="px-4 py-2">
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => handleToggleCourse(course.code)}
                          className="h-4 w-4"
                        />
                      </td>
                      <td className="px-4 py-2 text-gray-900">{course.code}</td>
                      <td className="px-4 py-2 text-gray-900">{course.name}</td>
                      <td className="px-4 py-2 text-gray-900">{course.credits.toFixed(1)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </main>
  );
}

function ConstraintsPage() {
  const { state, setLastDegreePlan } = usePlanningContext();
  const [allowedTermsInput, setAllowedTermsInput] = useState("2026-F, 2027-W, 2027-F, 2028-W");
  const [targetGradTermInput, setTargetGradTermInput] = useState("");
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

    const targetGradTerm =
      targetGradTermInput.trim().length > 0 ? targetGradTermInput.trim() : null;

    setLocalError(null);

    degreePlanMutation.mutate(
      {
        program_id: state.selectedProgramId,
        completed_courses: state.completedCourseCodes,
        target_grad_term: targetGradTerm,
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
        Configure allowed terms and load constraints. Completed courses are taken from the Completed Courses page and
        will not be scheduled again.
      </p>
      <div className="mb-4 rounded-lg border bg-white p-4">
        <div className="mb-2 text-sm text-gray-700">
          Selected program:{" "}
          {state.selectedProgramId ? (
            <span className="font-medium text-gray-900">{state.selectedProgramId}</span>
          ) : (
            <span className="text-red-600">none selected</span>
          )}
        </div>
        <div className="mb-4 text-sm text-gray-700">
          Completed courses selected:{" "}
          <span className="font-medium">{state.completedCourseCodes.length}</span>
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
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">
              Target graduation term (optional)
            </label>
            <input
              type="text"
              value={targetGradTermInput}
              onChange={(event) => setTargetGradTermInput(event.target.value)}
              className="w-full rounded-md border px-3 py-2 text-sm"
              placeholder="e.g., 2027-F"
            />
            <p className="text-xs text-gray-500">
              If provided and included in the allowed terms, the planner will try to finish by this term.
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
          Latest plan has been generated. Open the Degree Plan page to view details and build timetables.
        </div>
      )}
    </main>
  );
}

function formatTimeLabel(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const minutesPart = minutes % 60;
  const paddedMinutes = minutesPart.toString().padStart(2, "0");
  return `${hours}:${paddedMinutes}`;
}

function parseTimeToMinutes(time: string): number | null {
  const parts = time.split(":");
  if (parts.length !== 2) {
    return null;
  }
  const hours = Number(parts[0]);
  const minutes = Number(parts[1]);
  if (!Number.isInteger(hours) || !Number.isInteger(minutes)) {
    return null;
  }
  if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
    return null;
  }
  return hours * 60 + minutes;
}

function DegreePlanPage() {
  const { state } = usePlanningContext();
  const plan = state.lastDegreePlan;

  const timetableMutation = useTimetablePlan();
  const [selectedTermId, setSelectedTermId] = useState<string | null>(null);
  const [loadingTermId, setLoadingTermId] = useState<string | null>(null);

  const [latestTimetableTermId, setLatestTimetableTermId] = useState<string | null>(null);
  const [timetableOptions, setTimetableOptions] = useState<
    {
      sections: {
        section_id: string;
        course_code: string;
        kind: string;
        day_of_week: string;
        start_time_minutes: number;
        end_time_minutes: number;
      }[];
      objective: {
        status: string;
        total_penalty: number | null;
      };
    }[]
  >([]);
  const [selectedTimetableIndex, setSelectedTimetableIndex] = useState<number | null>(null);

  const [avoidFridays, setAvoidFridays] = useState<boolean>(false);
  const [earliestTimeInput, setEarliestTimeInput] = useState("09:00");
  const [latestTimeInput, setLatestTimeInput] = useState("18:00");
  const [timingError, setTimingError] = useState<string | null>(null);

  const { data: allCourses } = useCourses();

  const courseByCode: Record<
    string,
    {
      code: string;
      name: string;
      credits: number;
    }
  > = {};
  if (allCourses) {
    for (const course of allCourses) {
      courseByCode[course.code] = {
        code: course.code,
        name: course.name,
        credits: course.credits
      };
    }
  }

  const fallbackEarliestMinutes = 540;
  const fallbackLatestMinutes = 1080;

  const parsedEarliest = parseTimeToMinutes(earliestTimeInput);
  const parsedLatest = parseTimeToMinutes(latestTimeInput);

  const earliestTimeMinutes = parsedEarliest !== null ? parsedEarliest : fallbackEarliestMinutes;
  const latestTimeMinutes = parsedLatest !== null ? parsedLatest : fallbackLatestMinutes;

  const activeSections = useMemo(() => {
    if (selectedTimetableIndex === null) {
      return [];
    }
    if (selectedTimetableIndex < 0 || selectedTimetableIndex >= timetableOptions.length) {
      return [];
    }
    return timetableOptions[selectedTimetableIndex].sections;
  }, [selectedTimetableIndex, timetableOptions]);

  const activePenalty = useMemo(() => {
    if (selectedTimetableIndex === null) {
      return null;
    }
    if (selectedTimetableIndex < 0 || selectedTimetableIndex >= timetableOptions.length) {
      return null;
    }
    return timetableOptions[selectedTimetableIndex].objective.total_penalty;
  }, [selectedTimetableIndex, timetableOptions]);

  const handleGenerateTimetable = (termId: string, courseCodes: string[]) => {
    if (!courseCodes.length) {
      return;
    }

    const earliest = parseTimeToMinutes(earliestTimeInput);
    const latest = parseTimeToMinutes(latestTimeInput);

    if (earliest === null || latest === null) {
      setTimingError("Enter valid times in HH:MM format.");
      return;
    }

    if (earliest >= latest) {
      setTimingError("Earliest time must be before latest time.");
      return;
    }

    setTimingError(null);
    setLoadingTermId(termId);
    setSelectedTermId(termId);

    setLatestTimetableTermId(null);
    setTimetableOptions([]);
    setSelectedTimetableIndex(null);

    timetableMutation.mutate(
      {
        term_id: termId,
        course_codes: courseCodes,
        preferences: {
          earliest_time_minutes: earliest,
          latest_time_minutes: latest,
          avoid_friday: avoidFridays
        },
        max_solutions: 50
      },
      {
        onSuccess: (timetable) => {
          setLatestTimetableTermId(termId);
          setTimetableOptions(timetable.options);
          setSelectedTimetableIndex(timetable.options.length > 0 ? 0 : null);
        },
        onSettled: () => {
          setLoadingTermId(null);
        }
      }
    );
  };

  const handleExportPlanJson = () => {
    if (!plan) {
      return;
    }
    const json = JSON.stringify(plan, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "coursecraft-degree-plan.json";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleExportSelectedTimetableJson = () => {
    if (!latestTimetableTermId) {
      return;
    }
    if (selectedTimetableIndex === null) {
      return;
    }
    if (selectedTimetableIndex < 0 || selectedTimetableIndex >= timetableOptions.length) {
      return;
    }
    const payload = {
      term_id: latestTimetableTermId,
      option_index: selectedTimetableIndex,
      objective: timetableOptions[selectedTimetableIndex].objective,
      sections: timetableOptions[selectedTimetableIndex].sections
    };
    const json = JSON.stringify(payload, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    const safeTerm = latestTimetableTermId.replace(/[^a-zA-Z0-9_-]/g, "_");
    link.download = `coursecraft-timetable-${safeTerm}-option-${selectedTimetableIndex + 1}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const days = ["MON", "TUE", "WED", "THU", "FRI"];

  const sectionsByDay: Record<string, typeof activeSections> = {};
  for (const day of days) {
    sectionsByDay[day] = [];
  }
  for (const section of activeSections) {
    if (!sectionsByDay[section.day_of_week]) {
      sectionsByDay[section.day_of_week] = [];
    }
    sectionsByDay[section.day_of_week].push(section);
  }
  for (const day of days) {
    sectionsByDay[day].sort((a, b) => a.start_time_minutes - b.start_time_minutes);
  }

  const plannedGraduationTermId =
    plan && plan.terms.length > 0 ? plan.terms[plan.terms.length - 1].term_id : null;

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
        <div className="flex flex-col gap-6">
          <div className="rounded-lg border bg-white p-4">
            <div className="mb-2 text-sm text-gray-700">
              Program:{" "}
              <span className="font-medium text-gray-900">
                {state.selectedProgramId}
              </span>
            </div>
            <div className="mb-2 text-sm text-gray-700">
              Solver status:{" "}
              <span className="font-medium text-gray-900">
                {plan.objective.status}
              </span>
            </div>
            <div className="mb-3 text-sm text-gray-700">
              Planned graduation term:{" "}
              <span className="font-medium text-gray-900">
                {plannedGraduationTermId ?? "not determined"}
              </span>
            </div>
            <div className="flex flex-wrap gap-3 text-xs">
              <button
                type="button"
                onClick={handleExportPlanJson}
                className="rounded-md border border-blue-600 px-3 py-1.5 font-medium text-blue-600 hover:bg-blue-50"
              >
                Download degree plan JSON
              </button>
              <button
                type="button"
                onClick={handleExportSelectedTimetableJson}
                disabled={!latestTimetableTermId || selectedTimetableIndex === null || timetableOptions.length === 0}
                className="rounded-md border px-3 py-1.5 font-medium disabled:border-gray-300 disabled:text-gray-400 border-blue-600 text-blue-600 hover:bg-blue-50 disabled:hover:bg-transparent"
              >
                Download selected timetable JSON
              </button>
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
          <div className="flex flex-col gap-3 rounded-lg border bg-white p-4 text-sm text-gray-700">
            <div className="mb-1 font-semibold text-gray-900">Timetable preferences</div>
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex flex-col gap-1 text-xs text-gray-700">
                <span>Earliest time</span>
                <input
                  type="time"
                  value={earliestTimeInput}
                  onChange={(event) => setEarliestTimeInput(event.target.value)}
                  className="rounded-md border px-2 py-1 text-xs"
                />
              </div>
              <div className="flex flex-col gap-1 text-xs text-gray-700">
                <span>Latest time</span>
                <input
                  type="time"
                  value={latestTimeInput}
                  onChange={(event) => setLatestTimeInput(event.target.value)}
                  className="rounded-md border px-2 py-1 text-xs"
                />
              </div>
              <label className="mt-4 flex items-center gap-2 text-xs text-gray-800">
                <input
                  type="checkbox"
                  className="h-4 w-4"
                  checked={avoidFridays}
                  onChange={(event) => setAvoidFridays(event.target.checked)}
                />
                <span>Avoid Fridays if possible</span>
              </label>
            </div>
            {timingError && (
              <div className="text-xs text-red-600">
                {timingError}
              </div>
            )}
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {plan.terms.map((term) => (
              <div
                key={term.term_id}
                className={`rounded-lg border bg-white p-4 ${
                  selectedTermId === term.term_id ? "ring-2 ring-blue-500" : ""
                }`}
              >
                <div className="mb-2 flex items-center justify-between text-sm">
                  <div className="font-semibold text-gray-900">{term.term_id}</div>
                  <div className="text-gray-700">
                    Total credits:{" "}
                    <span className="font-medium">{term.total_credits.toFixed(1)}</span>
                  </div>
                </div>
                <ul className="mt-2 space-y-1 text-sm text-gray-800">
                  {term.course_codes.map((code) => {
                    const course = courseByCode[code];
                    const label = course ? `${code} – ${course.name}` : code;
                    return <li key={code}>{label}</li>;
                  })}
                </ul>
                <button
                  type="button"
                  onClick={() => handleGenerateTimetable(term.term_id, term.course_codes)}
                  disabled={loadingTermId === term.term_id || term.course_codes.length === 0}
                  className="mt-3 rounded-md bg-blue-600 px-3 py-1.5 text-xs font-medium text-white disabled:bg-blue-300"
                >
                  {loadingTermId === term.term_id ? "Building timetables" : "Generate timetables"}
                </button>
              </div>
            ))}
          </div>
          {timetableMutation.isError && (
            <div className="rounded-lg border border-red-300 bg-red-50 p-4 text-sm text-red-800">
              Failed to build timetables. Check backend logs.
            </div>
          )}
          {latestTimetableTermId && timetableOptions.length > 0 && (
            <div className="rounded-lg border bg-white p-4">
              <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div className="text-sm font-semibold text-gray-900">
                  Timetables for {latestTimetableTermId}
                </div>
                <div className="text-xs text-gray-600">
                  Time window: {formatTimeLabel(earliestTimeMinutes)} to {formatTimeLabel(latestTimeMinutes)}
                </div>
              </div>
              <div className="mb-4 flex flex-wrap items-center gap-2">
                {timetableOptions.map((option, index) => {
                  const isActive = selectedTimetableIndex === index;
                  const penalty = option.objective.total_penalty;
                  const label = penalty === null ? `Option ${index + 1}` : `Option ${index + 1} (penalty ${penalty})`;
                  return (
                    <button
                      key={index}
                      type="button"
                      onClick={() => setSelectedTimetableIndex(index)}
                      className={`rounded-md border px-3 py-1.5 text-xs font-medium ${
                        isActive ? "border-blue-600 bg-blue-50 text-blue-700" : "border-gray-300 text-gray-700 hover:bg-gray-50"
                      }`}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
              {selectedTimetableIndex !== null && (
                <div className="mb-3 text-xs text-gray-700">
                  Viewing option {selectedTimetableIndex + 1} of {timetableOptions.length}
                  {activePenalty !== null ? (
                    <span className="ml-2">Penalty: <span className="font-medium">{activePenalty}</span></span>
                  ) : null}
                </div>
              )}
              <div className="grid gap-4 md:grid-cols-5">
                {days.map((day) => (
                  <div key={day} className="border-t pt-2 text-sm">
                    <div className="mb-2 text-xs font-semibold text-gray-700">
                      {day}
                    </div>
                    {sectionsByDay[day].length === 0 && (
                      <div className="text-xs text-gray-400">No classes</div>
                    )}
                    <div className="space-y-2">
                      {sectionsByDay[day].map((section) => {
                        const course = courseByCode[section.course_code];
                        const label = course
                          ? `${section.course_code} – ${course.name}`
                          : section.course_code;
                        return (
                          <div
                            key={section.section_id}
                            className="rounded-md border bg-blue-50 px-2 py-1 text-xs text-blue-900"
                          >
                            <div className="font-semibold">
                              {label}
                            </div>
                            <div>
                              {formatTimeLabel(section.start_time_minutes)}{" "}
                              to {formatTimeLabel(section.end_time_minutes)}
                            </div>
                            <div className="uppercase">
                              {section.kind}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          {latestTimetableTermId && timetableOptions.length === 0 && (
            <div className="rounded-lg border bg-gray-50 p-4 text-sm text-gray-700">
              No timetables could be generated for {latestTimetableTermId}.
            </div>
          )}
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
