import test from "node:test";
import assert from "node:assert/strict";

import {
  classifyMaterial,
  isRecyclable,
  matchMaterial,
  materialInfo,
} from "../src/lib/materials.js";
import { analyseImage, extractItemName } from "../src/lib/detection.js";

test("explicit material words are read straight out of the text", () => {
  assert.equal(matchMaterial("plastic"), "plastic");
  assert.equal(matchMaterial("It is made of cardboard."), "paper");
  assert.equal(matchMaterial("aluminium"), "metal");
  assert.equal(matchMaterial("an old laptop charger"), "electronics");
});

test("an explicit material beats an object name suggesting another", () => {
  // The old keyword matcher filed this under plastic, because "bottle" came
  // first in its list.
  assert.equal(matchMaterial("a glass bottle"), "glass");
  assert.equal(matchMaterial("a plastic jar"), "plastic");
});

test("an object whose material is genuinely ambiguous stays unknown", () => {
  assert.equal(matchMaterial("a bottle"), null);
  assert.equal(matchMaterial("a cup"), null);
});

test("text naming several materials is refused, not resolved to the first", () => {
  // What the model actually answers when it recites the options back.
  assert.equal(
    matchMaterial("Plastic, paper, glass, metal, electronics, textile, or food."),
    null
  );
  assert.equal(matchMaterial("a small, plastic, glass container"), null);
});

test("object names are used only when no material word is present", () => {
  assert.deepEqual(classifyMaterial("a soda can"), {
    material: "metal",
    source: "object-word",
  });
  assert.deepEqual(classifyMaterial("a plastic bottle"), {
    material: "plastic",
    source: "material-word",
  });
});

test("classifyMaterial tolerates empty input", () => {
  for (const value of ["", null, undefined]) {
    assert.deepEqual(classifyMaterial(value), { material: null, source: null });
  }
});

test("materialInfo falls back to the catch-all entry", () => {
  assert.equal(materialInfo("nonsense"), materialInfo("other"));
  assert.equal(isRecyclable("plastic"), true);
  assert.equal(isRecyclable("organic"), false);
  assert.equal(isRecyclable(null), false);
});

test("extractItemName strips the sentence the model wraps the name in", () => {
  assert.equal(
    extractItemName("The main object in this photo is a plastic bottle on top of a black table."),
    "plastic bottle"
  );
  assert.equal(extractItemName("This is a small glass jar with a lid."), "small glass jar");
  assert.equal(extractItemName("Can."), "can");
  assert.equal(extractItemName("**A laptop**"), "laptop");
});

test("extractItemName keeps names that legitimately contain 'of'", () => {
  assert.equal(extractItemName("a can of soda"), "can of soda");
});

test("extractItemName refuses non-answers", () => {
  for (const value of ["", "  ", "unknown", "None", "object", null, undefined]) {
    assert.equal(extractItemName(value), null);
  }
});

test("extractItemName truncates a rambling answer instead of printing it", () => {
  const name = extractItemName(
    "A very long winded description that just keeps going without ever stopping"
  );
  assert.ok(name.split(" ").length <= 5, name);
});

test("one question is enough when the name carries the material", async () => {
  const prompts = [];
  const result = await analyseImage(async (prompt) => {
    prompts.push(prompt);
    return "The main object in this photo is a plastic bottle.";
  });

  assert.equal(prompts.length, 1, "no follow-up should be needed");
  assert.equal(result.status, "identified");
  assert.equal(result.item, "plastic bottle");
  assert.equal(result.material, "plastic");
  assert.equal(result.certainty, "stated");
});

test("the material question is asked when the name does not settle it", async () => {
  const responses = ["A bottle.", "Glass."];
  const result = await analyseImage(async () => responses.shift());

  assert.equal(result.item, "bottle");
  assert.equal(result.material, "glass");
  assert.equal(result.certainty, "stated");
  assert.equal(result.transcript.length, 2);
});

test("a material read from the object name is marked as inferred", async () => {
  const responses = ["A soda can.", "It is shiny."];
  const result = await analyseImage(async () => responses.shift());

  assert.equal(result.material, "metal");
  assert.equal(result.certainty, "inferred");
});

test("an identified object with no material is reported without one", async () => {
  const responses = ["A bottle.", "Plastic, paper, glass, metal."];
  const result = await analyseImage(async () => responses.shift());

  assert.equal(result.status, "identified");
  assert.equal(result.item, "bottle");
  assert.equal(result.material, null);
  assert.equal(result.certainty, null);
});

test("analyseImage reports unparseable rather than guessing", async () => {
  const result = await analyseImage(async () => "   ");

  assert.equal(result.status, "unparseable");
  assert.equal(result.item, null);
  assert.equal(result.material, null);
  assert.equal(result.transcript.length, 2);
});
