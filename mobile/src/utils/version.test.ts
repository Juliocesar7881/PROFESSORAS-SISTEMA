import assert from "node:assert/strict";
import test from "node:test";

import { compareVersions } from "./version";

test("compares semantic app versions", () => {
  assert.equal(compareVersions("1.1.0", "1.0.3") > 0, true);
  assert.equal(compareVersions("1.1", "1.1.0"), 0);
  assert.equal(compareVersions("1.0.9", "1.1.0") < 0, true);
});
