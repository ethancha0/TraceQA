export interface AnalysisItem {
  description: string;
  file?: string;
  severity?: "high" | "medium" | "low";
}

export interface SuggestedPlaywrightTest {
  title: string;
  description: string;
  steps: string[];
  relatedFiles: string[];
}

export interface FileInspectionNote {
  file: string;
  reason: string;
}

export interface PullRequestAnalysis {
  likelyBugs: AnalysisItem[];
  missingEdgeCases: AnalysisItem[];
  affectedUserFlows: AnalysisItem[];
  suggestedPlaywrightTests: SuggestedPlaywrightTest[];
  filesNeedingDeeperInspection: FileInspectionNote[];
  summary: string;
}

export const EMPTY_PULL_REQUEST_ANALYSIS: PullRequestAnalysis = {
  likelyBugs: [],
  missingEdgeCases: [],
  affectedUserFlows: [],
  suggestedPlaywrightTests: [],
  filesNeedingDeeperInspection: [],
  summary: "No analysis produced.",
};
