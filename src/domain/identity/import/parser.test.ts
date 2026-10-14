import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { parseProfileCsv } from "./parser";

describe("parseProfileCsv", () => {
    it("maps trimmed headers and preserves source row numbers", () => {
        const result = parseProfileCsv(" email , class , role , name \nstudent@gs.hs.ntnu.edu.tw,1601,monitor,Student");
        assert.deepEqual(result.errors, []);
        assert.equal(result.rows[0]?.row, 2);
        assert.equal(result.rows[0]?.email, "student@gs.hs.ntnu.edu.tw");
        assert.equal(result.rows[0]?.class, "1601");
    });

    it("reports missing headers and empty datasets", () => {
        const missing = parseProfileCsv("email,role,name\na@gs.hs.ntnu.edu.tw,monitor,A");
        assert.equal(missing.errors[0]?.row, 1);
        assert.match(missing.errors[0]?.message ?? "", /class/);

        const emptyRows = parseProfileCsv("email,class,role,name\n");
        assert.equal(emptyRows.rows.length, 0);
        assert.equal(emptyRows.errors.length, 1);
    });

    it("returns all field errors and excludes invalid rows", () => {
        const result = parseProfileCsv("email,class,role,name\nbad,7xx,unknown,A\nvalid@gs.hs.ntnu.edu.tw,1064,monitor,B");
        assert.equal(result.rows.length, 1);
        assert.equal(result.rows[0]?.row, 3);
        assert.equal(result.errors.length, 3);
        assert.ok(result.errors.every((error) => error.row === 2));
    });

    it("returns serializable results for malformed CSV", () => {
        const result = parseProfileCsv('email,class,role,name\na@gs.hs.ntnu.edu.tw,7121,monitor,"unterminated');
        assert.ok(result.errors.length > 0);
        assert.doesNotThrow(() => JSON.stringify(result));
    });

    it("applies role/class and duplicate-email dataset validation", () => {
        const result = parseProfileCsv([
            "email,class,role,name",
            "same@gs.hs.ntnu.edu.tw,,monitor,A",
            "same@gs.hs.ntnu.edu.tw,,monitor,B",
        ].join("\n"));
        assert.ok(result.errors.some((error) => error.row === 2));
        assert.ok(result.errors.some((error) => error.row === 3));
    });
});
