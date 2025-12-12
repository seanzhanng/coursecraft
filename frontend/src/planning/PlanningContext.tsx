import { ReactNode, createContext, useContext, useState } from "react";
import { DegreePlanResponse } from "../api/degreePlans";

type PlanningState = {
  selectedProgramId: string | null;
  completedCourseCodes: string[];
  lastDegreePlan: DegreePlanResponse | null;
};

type PlanningContextValue = {
  state: PlanningState;
  setSelectedProgramId: (programId: string | null) => void;
  setCompletedCourseCodes: (courseCodes: string[]) => void;
  setLastDegreePlan: (plan: DegreePlanResponse | null) => void;
  reset: () => void;
};

const PlanningContext = createContext<PlanningContextValue | undefined>(undefined);

type PlanningProviderProps = {
  children: ReactNode;
};

export function PlanningProvider(props: PlanningProviderProps) {
  const [selectedProgramId, setSelectedProgramIdState] = useState<string | null>(null);
  const [completedCourseCodes, setCompletedCourseCodesState] = useState<string[]>([]);
  const [lastDegreePlan, setLastDegreePlanState] = useState<DegreePlanResponse | null>(null);

  const value: PlanningContextValue = {
    state: {
      selectedProgramId,
      completedCourseCodes,
      lastDegreePlan
    },
    setSelectedProgramId: (programId) => {
      setSelectedProgramIdState(programId);
      setCompletedCourseCodesState([]);
      setLastDegreePlanState(null);
    },
    setCompletedCourseCodes: (courseCodes) => {
      setCompletedCourseCodesState(courseCodes);
      setLastDegreePlanState(null);
    },
    setLastDegreePlan: (plan) => {
      setLastDegreePlanState(plan);
    },
    reset: () => {
      setSelectedProgramIdState(null);
      setCompletedCourseCodesState([]);
      setLastDegreePlanState(null);
    }
  };

  return <PlanningContext.Provider value={value}>{props.children}</PlanningContext.Provider>;
}

export function usePlanningContext(): PlanningContextValue {
  const context = useContext(PlanningContext);
  if (!context) {
    throw new Error("usePlanningContext must be used within a PlanningProvider");
  }
  return context;
}
