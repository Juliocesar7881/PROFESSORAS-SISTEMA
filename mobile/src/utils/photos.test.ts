import assert from "node:assert/strict";
import test from "node:test";

import { constrainedSize } from "./photo-size";

test("constrainedSize preserves a landscape aspect ratio", () => {
  assert.deepEqual(constrainedSize(4032, 3024, 1440), { width: 1440, height: 1080 });
});

test("constrainedSize preserves a portrait aspect ratio", () => {
  assert.deepEqual(constrainedSize(3024, 4032, 1440), { width: 1080, height: 1440 });
});

test("constrainedSize does not enlarge a small image", () => {
  assert.deepEqual(constrainedSize(800, 600, 1440), { width: 800, height: 600 });
});
