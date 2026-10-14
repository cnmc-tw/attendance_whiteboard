import type { MonitorImportPreview } from "@/app/actions/user";
import type {
  DiffFilter,
  ImportStage,
  PreviewStatus,
  SaveStatus,
} from "./types";

export interface ImportState {
  stage: ImportStage;
  selectedFile: File | null;
  preview: MonitorImportPreview | null;
  previewStatus: PreviewStatus;
  saveStatus: SaveStatus;
  previewError: string | null;
  saveError: string | null;
  removalAcknowledged: boolean;
  searchQuery: string;
  diffFilter: DiffFilter;
  currentPage: number;
  closeError: string | null;
}

export type ImportAction =
  | { type: "FILE_SELECTED"; file: File }
  | { type: "PREVIEW_STARTED" }
  | { type: "PREVIEW_SUCCEEDED"; preview: MonitorImportPreview }
  | { type: "PREVIEW_FAILED"; error: string }
  | { type: "SYNC_CONFIRMATION_REQUESTED" }
  | { type: "BACK_TO_SELECT" }
  | { type: "BACK_TO_REVIEW" }
  | { type: "REVIEW_FROM_RESULT" }
  | { type: "RETURN_TO_RESULT" }
  | { type: "REMOVAL_ACKNOWLEDGED"; acknowledged: boolean }
  | { type: "SEARCH_CHANGED"; query: string }
  | { type: "FILTER_CHANGED"; filter: DiffFilter }
  | { type: "PAGE_CHANGED"; page: number }
  | { type: "SYNC_STARTED" }
  | { type: "SYNC_FAILED"; error: string }
  | { type: "SYNC_SUCCEEDED" }
  | { type: "SYNC_REFRESH_FAILED"; error: string }
  | { type: "CLOSE_BLOCKED_DURING_SYNC" }
  | { type: "RESET" };

export const initialState: ImportState = {
  stage: "select",
  selectedFile: null,
  preview: null,
  previewStatus: "idle",
  saveStatus: "idle",
  previewError: null,
  saveError: null,
  removalAcknowledged: false,
  searchQuery: "",
  diffFilter: "all",
  currentPage: 1,
  closeError: null,
};

function hasSafePreview(state: ImportState): boolean {
  return (
    state.previewStatus === "complete" &&
    state.preview !== null &&
    state.preview.importResult.errors.length === 0 &&
    state.preview.importResult.rows.length > 0 &&
    state.preview.diff !== null
  );
}

function canStartSync(state: ImportState): boolean {
  const isConfirmationStage = state.stage === "confirm";
  const isRetryingFailedSync =
    state.stage === "result" && state.saveStatus === "error";
  const removeCount = state.preview?.diff?.remove.length ?? 0;

  return (
    hasSafePreview(state) &&
    (isConfirmationStage || isRetryingFailedSync) &&
    state.saveStatus !== "loading" &&
    state.saveStatus !== "success" &&
    (removeCount === 0 || state.removalAcknowledged)
  );
}

export function importReducer(
  state: ImportState,
  action: ImportAction,
): ImportState {
  switch (action.type) {
    case "FILE_SELECTED":
      if (state.stage === "syncing") return state;
      return {
        ...initialState,
        selectedFile: action.file,
      };
    case "PREVIEW_STARTED":
      if (state.stage !== "select" || !state.selectedFile) return state;
      return {
        ...state,
        preview: null,
        previewStatus: "loading",
        saveStatus: "idle",
        previewError: null,
        saveError: null,
        removalAcknowledged: false,
        currentPage: 1,
      };
    case "PREVIEW_SUCCEEDED":
      if (state.stage !== "select" || state.previewStatus !== "loading") {
        return state;
      }
      return {
        ...state,
        stage: "review",
        preview: action.preview,
        previewStatus: "complete",
      };
    case "PREVIEW_FAILED":
      if (state.stage !== "select" || state.previewStatus !== "loading") {
        return state;
      }
      return {
        ...state,
        previewStatus: "error",
        previewError: action.error,
      };
    case "SYNC_CONFIRMATION_REQUESTED":
      if (
        state.stage !== "review" ||
        state.saveStatus !== "idle" ||
        !hasSafePreview(state)
      ) {
        return state;
      }
      return { ...state, stage: "confirm", closeError: null };
    case "BACK_TO_SELECT":
      if (
        state.stage !== "review" &&
        state.stage !== "confirm" &&
        state.stage !== "result"
      ) {
        return state;
      }
      return {
        ...initialState,
        selectedFile: state.selectedFile,
      };
    case "BACK_TO_REVIEW":
      if (state.stage !== "confirm") return state;
      return {
        ...state,
        stage: "review",
        saveStatus: "idle",
        saveError: null,
        closeError: null,
      };
    case "REVIEW_FROM_RESULT":
      if (state.stage !== "result") return state;
      return { ...state, stage: "review" };
    case "RETURN_TO_RESULT":
      if (
        state.stage !== "review" ||
        (state.saveStatus !== "success" && state.saveStatus !== "error")
      ) {
        return state;
      }
      return { ...state, stage: "result" };
    case "REMOVAL_ACKNOWLEDGED":
      if (state.stage !== "confirm") return state;
      return { ...state, removalAcknowledged: action.acknowledged };
    case "SEARCH_CHANGED":
      if (state.stage !== "review") return state;
      return { ...state, searchQuery: action.query, currentPage: 1 };
    case "FILTER_CHANGED":
      if (state.stage !== "review") return state;
      return { ...state, diffFilter: action.filter, currentPage: 1 };
    case "PAGE_CHANGED":
      if (state.stage !== "review") return state;
      return { ...state, currentPage: action.page };
    case "SYNC_STARTED":
      if (!canStartSync(state)) return state;
      return {
        ...state,
        stage: "syncing",
        saveStatus: "loading",
        saveError: null,
        closeError: null,
      };
    case "SYNC_FAILED":
      if (state.stage !== "syncing" || state.saveStatus !== "loading") {
        return state;
      }
      return {
        ...state,
        stage: "result",
        saveStatus: "error",
        saveError: action.error,
      };
    case "SYNC_SUCCEEDED":
      if (state.stage !== "syncing" || state.saveStatus !== "loading") {
        return state;
      }
      return {
        ...state,
        stage: "result",
        saveStatus: "success",
        saveError: null,
      };
    case "SYNC_REFRESH_FAILED":
      if (state.stage !== "result" || state.saveStatus !== "success") {
        return state;
      }
      return { ...state, saveError: action.error };
    case "CLOSE_BLOCKED_DURING_SYNC":
      if (state.stage !== "syncing") return state;
      return {
        ...state,
        closeError: "同步進行中，完成前無法關閉視窗。",
      };
    case "RESET":
      return initialState;
  }
}
