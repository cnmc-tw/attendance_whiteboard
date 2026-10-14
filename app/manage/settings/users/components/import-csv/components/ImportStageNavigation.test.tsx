import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import {
  ImportStageNavigation,
  ImportStagePanel,
} from "./ImportStageNavigation";
import type { ImportStage } from "../types";

const contentByStage: Record<ImportStage, string> = {
  select: "選擇檔案內容",
  review: "檢視預覽內容",
  confirm: "確認同步內容",
  syncing: "同步中內容",
  result: "同步結果內容",
};

describe("ImportStageNavigation", () => {
  for (const stage of Object.keys(contentByStage) as ImportStage[]) {
    it(`marks ${stage} as current and renders only its panel content`, () => {
      const content = Object.fromEntries(
        Object.entries(contentByStage).map(([key, value]) => [
          key,
          <div key={key}>{value}</div>,
        ]),
      ) as Record<ImportStage, ReactNode>;

      const html = renderToStaticMarkup(
        <>
          <ImportStageNavigation stage={stage} />
          <ImportStagePanel stage={stage} panelRef={() => {}}>
            {content[stage]}
          </ImportStagePanel>
        </>,
      );

      assert.match(html, /aria-label="匯入步驟"/);
      assert.match(html, /aria-current="step"/);
      assert.equal((html.match(/role="region"/g) ?? []).length, 1);
      assert.ok(html.includes(contentByStage[stage]));

      for (const [otherStage, otherContent] of Object.entries(contentByStage)) {
        if (otherStage !== stage) assert.ok(!html.includes(otherContent));
      }
    });
  }
});
