import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { MonitorImportPreview } from "@/app/actions/user";
import { importReducer, initialState } from "./reducer";

const file = new File(["email,class,role,name"], "roster.csv", {
  type: "text/csv",
});

const preview: MonitorImportPreview = {
  importResult: {
    rows: [
      {
        row: 2,
        email: "monitor@gs.hs.ntnu.edu.tw",
        class: "1364",
        role: "monitor",
        name: "小明",
      },
    ],
    warnings: [],
    errors: [],
  },
  diff: {
    create: [],
    update: [],
    unchanged: [],
    remove: [],
  },
};

const previewWithRemoval: MonitorImportPreview = {
  ...preview,
  diff: {
    ...preview.diff!,
    remove: [
      {
        email: "old-monitor@gs.hs.ntnu.edu.tw",
        name: "舊風紀",
        role: "monitor",
        class: "1365",
      },
    ],
  },
};

function createReviewState(
  reviewPreview: MonitorImportPreview = preview,
) {
  const selected = importReducer(initialState, {
    type: "FILE_SELECTED",
    file,
  });
  const loading = importReducer(selected, { type: "PREVIEW_STARTED" });
  return importReducer(loading, {
    type: "PREVIEW_SUCCEEDED",
    preview: reviewPreview,
  });
}

function createConfirmationState(
  confirmationPreview: MonitorImportPreview = preview,
) {
  const review = createReviewState(confirmationPreview);
  return importReducer(review, { type: "SYNC_CONFIRMATION_REQUESTED" });
}

function deepFreeze<T>(value: T): T {
  if (value && typeof value === "object" && !Object.isFrozen(value)) {
    Object.freeze(value);
    for (const nested of Object.values(value)) deepFreeze(nested);
  }
  return value;
}

describe("importReducer", () => {
  it("provides the initial select-stage state", () => {
    assert.deepEqual(importReducer(initialState, { type: "RESET" }), initialState);
    assert.equal(initialState.stage, "select");
    assert.equal(initialState.previewStatus, "idle");
    assert.equal(initialState.saveStatus, "idle");
    assert.equal(initialState.diffFilter, "all");
    assert.equal(initialState.currentPage, 1);
  });

  it("clears the previous import when a new file is selected", () => {
    const newFile = new File([], "new-roster.csv");
    const previous = {
      ...createReviewState(previewWithRemoval),
      saveStatus: "error" as const,
      previewError: "old preview error",
      saveError: "old sync error",
      removalAcknowledged: true,
      searchQuery: "old query",
      diffFilter: "remove" as const,
      currentPage: 4,
      closeError: "old close error",
    };

    assert.deepEqual(
      importReducer(previous, { type: "FILE_SELECTED", file: newFile }),
      { ...initialState, selectedFile: newFile },
    );
  });

  it("moves from file selection through preview to review", () => {
    const selected = importReducer(initialState, {
      type: "FILE_SELECTED",
      file,
    });
    const started = importReducer(selected, { type: "PREVIEW_STARTED" });
    assert.equal(started.stage, "select");
    assert.equal(started.preview, null);
    assert.equal(started.previewStatus, "loading");

    const succeeded = importReducer(started, {
      type: "PREVIEW_SUCCEEDED",
      preview,
    });
    assert.equal(succeeded.stage, "review");
    assert.equal(succeeded.preview, preview);
    assert.equal(succeeded.previewStatus, "complete");
  });

  it("keeps the selected file after preview failure and allows a retry", () => {
    const selected = importReducer(initialState, {
      type: "FILE_SELECTED",
      file,
    });
    const started = importReducer(selected, { type: "PREVIEW_STARTED" });
    const failed = importReducer(started, {
      type: "PREVIEW_FAILED",
      error: "驗證失敗",
    });

    assert.equal(failed.stage, "select");
    assert.equal(failed.previewStatus, "error");
    assert.equal(failed.previewError, "驗證失敗");
    assert.equal(failed.selectedFile, file);
    assert.equal(importReducer(failed, { type: "PREVIEW_STARTED" }).previewStatus, "loading");
  });

  it("resets the page when search or filter changes and preserves other fields", () => {
    const state = {
      ...createReviewState(),
      currentPage: 3,
    };
    const searched = importReducer(state, {
      type: "SEARCH_CHANGED",
      query: "小明",
    });
    assert.equal(searched.searchQuery, "小明");
    assert.equal(searched.currentPage, 1);

    const filtered = importReducer(searched, {
      type: "FILTER_CHANGED",
      filter: "update",
    });
    assert.equal(filtered.diffFilter, "update");
    assert.equal(filtered.currentPage, 1);

    const paged = importReducer(filtered, { type: "PAGE_CHANGED", page: 2 });
    assert.equal(paged.currentPage, 2);
    assert.equal(paged.searchQuery, "小明");
    assert.equal(paged.diffFilter, "update");
    assert.equal(paged.preview, preview);
  });

  it("blocks confirmation until a valid preview exists", () => {
    const blocked = importReducer(initialState, {
      type: "SYNC_CONFIRMATION_REQUESTED",
    });
    assert.equal(blocked, initialState);

    const unsafePreview = {
      ...preview,
      importResult: {
        ...preview.importResult,
        errors: [{ row: 2, message: "驗證錯誤" }],
      },
    };
    const unsafeReview = createReviewState(unsafePreview);
    assert.equal(
      importReducer(unsafeReview, { type: "SYNC_CONFIRMATION_REQUESTED" }),
      unsafeReview,
    );
  });

  it("requires deletion acknowledgement before starting sync", () => {
    const confirmation = createConfirmationState(previewWithRemoval);
    assert.equal(confirmation.stage, "confirm");

    const blocked = importReducer(confirmation, { type: "SYNC_STARTED" });
    assert.equal(blocked, confirmation);

    const acknowledged = importReducer(confirmation, {
      type: "REMOVAL_ACKNOWLEDGED",
      acknowledged: true,
    });
    const started = importReducer(acknowledged, { type: "SYNC_STARTED" });
    assert.equal(started.stage, "syncing");
    assert.equal(started.saveStatus, "loading");
    assert.equal(started.preview, previewWithRemoval);
  });

  it("preserves the preview after sync failure, allows retry, and records success", () => {
    const started = importReducer(
      createConfirmationState(previewWithRemoval),
      { type: "REMOVAL_ACKNOWLEDGED", acknowledged: true },
    );
    const syncing = importReducer(started, { type: "SYNC_STARTED" });
    const failed = importReducer(syncing, {
      type: "SYNC_FAILED",
      error: "同步失敗",
    });
    assert.equal(failed.stage, "result");
    assert.equal(failed.saveStatus, "error");
    assert.equal(failed.saveError, "同步失敗");
    assert.equal(failed.preview, previewWithRemoval);

    const retried = importReducer(failed, { type: "SYNC_STARTED" });
    assert.equal(retried.stage, "syncing");
    assert.equal(retried.saveStatus, "loading");

    const succeeded = importReducer(retried, { type: "SYNC_SUCCEEDED" });
    assert.equal(succeeded.stage, "result");
    assert.equal(succeeded.saveStatus, "success");
    assert.equal(succeeded.saveError, null);
    assert.equal(succeeded.preview, previewWithRemoval);

    const refreshFailed = importReducer(succeeded, {
      type: "SYNC_REFRESH_FAILED",
      error: "刷新失敗",
    });
    assert.equal(refreshFailed.saveStatus, "success");
    assert.equal(refreshFailed.saveError, "刷新失敗");
  });

  it("allows reviewing a result and returning without enabling duplicate sync", () => {
    const syncing = importReducer(
      createConfirmationState(),
      { type: "SYNC_STARTED" },
    );
    const succeeded = importReducer(syncing, { type: "SYNC_SUCCEEDED" });
    const review = importReducer(succeeded, { type: "REVIEW_FROM_RESULT" });
    assert.equal(review.stage, "review");
    assert.equal(review.saveStatus, "success");
    assert.equal(
      importReducer(review, { type: "SYNC_CONFIRMATION_REQUESTED" }),
      review,
    );

    const result = importReducer(review, { type: "RETURN_TO_RESULT" });
    assert.equal(result.stage, "result");
  });

  it("ignores invalid transitions and stale async outcomes", () => {
    const idleWithFile = importReducer(initialState, {
      type: "FILE_SELECTED",
      file,
    });
    assert.equal(
      importReducer(idleWithFile, {
        type: "PREVIEW_SUCCEEDED",
        preview,
      }),
      idleWithFile,
    );

    const review = createReviewState();
    assert.equal(
      importReducer(review, { type: "SYNC_SUCCEEDED" }),
      review,
    );
    assert.equal(
      importReducer(review, { type: "SYNC_FAILED", error: "舊請求" }),
      review,
    );
    assert.equal(
      importReducer(idleWithFile, {
        type: "SEARCH_CHANGED",
        query: "ignored",
      }).searchQuery,
      "",
    );
  });

  it("resets every workflow field without mutating the previous frozen state", () => {
    const previous = deepFreeze({
      ...createReviewState(previewWithRemoval),
      saveStatus: "error" as const,
      previewError: "preview error",
      saveError: "sync error",
      removalAcknowledged: true,
      searchQuery: "monitor",
      diffFilter: "create" as const,
      currentPage: 5,
      closeError: "close error",
    });

    assert.deepEqual(importReducer(previous, { type: "RESET" }), initialState);
    assert.equal(previous.preview, previewWithRemoval);
    assert.equal(previous.currentPage, 5);
    assert.equal(previous.stage, "review");
  });
});
