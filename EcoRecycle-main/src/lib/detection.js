import { classifyMaterial } from "./materials.js";

/**
 * Two questions, asked in order of how reliably SmolVLM-256M answers them.
 *
 * A single prompt asking for a structured "Item: … / Material: …" answer was
 * tried first and the model never produced it — it paraphrases the instruction
 * or recites the option list back. Naming the object, on the other hand, it
 * does well, and its answer usually contains the material anyway ("a plastic
 * bottle"), so most photos need only the first question.
 */
export const NAME_PROMPT =
  "What is the main object in this photo? Answer with only the name of the object, in two or three words.";

export const MATERIAL_PROMPT =
  "What material is the main object in this photo made of? Answer with one word: plastic, paper, glass, metal, electronics, textile, or food.";

const MAX_NAME_TOKENS = 32;
const MAX_MATERIAL_TOKENS = 24;

// The model tends to answer in a full sentence however firmly it is told not
// to; the object name is what follows these openers.
const PREAMBLE =
  /^(the\s+(main\s+)?(object|item)[^.]*?\s+is|this\s+(image|photo)\s+shows|this\s+is|that\s+is|it\s+is|there\s+is|i\s+see)\s+/i;

// Where a name stops and scene description begins. "of" is deliberately absent:
// it belongs inside names like "sheet of paper" and "can of soda".
const TRAILING_CLAUSE = /\s+(on|in|at|near|next\s+to|inside|under|over|beside|sitting|standing|placed|resting|with|that|which|and)\s+.*$/i;

/** Turns whatever the model said into something short enough to use as a label. */
export const extractItemName = (value) => {
  if (!value) return null;
  let text = value
    .replace(/[<>*_`"]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(PREAMBLE, "")
    .replace(TRAILING_CLAUSE, "")
    .replace(/^(a|an|the)\s+/i, "")
    .replace(/[.,;:!?]+$/, "")
    .trim();

  if (!text || /^(unknown|none|n\/a|nothing|object|item)$/i.test(text)) return null;
  // Still a sentence? The model ignored the instruction; keep it short rather
  // than printing a paragraph as if it were a label.
  text = text.split(" ").slice(0, 5).join(" ").replace(/[.,;:!?]+$/, "");
  return text.toLowerCase();
};

/**
 * Runs the identification flow against a `generate(prompt, maxNewTokens)`
 * function supplied by the caller, so this module stays testable and free of
 * any model dependency.
 *
 * @param {(prompt: string, maxNewTokens: number) => Promise<string>} generate
 * @returns {Promise<{
 *   status: "identified" | "unparseable",
 *   item: string|null,
 *   material: string|null,
 *   certainty: "stated" | "inferred" | null,
 *   transcript: {prompt: string, response: string}[],
 * }>}
 */
export const analyseImage = async (generate) => {
  const transcript = [];

  const nameAnswer = await generate(NAME_PROMPT, MAX_NAME_TOKENS);
  transcript.push({ prompt: NAME_PROMPT, response: nameAnswer });

  const item = extractItemName(nameAnswer);
  let { material, source } = classifyMaterial(nameAnswer);

  // Only ask the follow-up when the name did not already settle it.
  if (!material) {
    const materialAnswer = await generate(MATERIAL_PROMPT, MAX_MATERIAL_TOKENS);
    transcript.push({ prompt: MATERIAL_PROMPT, response: materialAnswer });
    ({ material, source } = classifyMaterial(materialAnswer));
  }

  if (!item && !material) {
    return {
      status: "unparseable",
      item: null,
      material: null,
      certainty: null,
      transcript,
    };
  }

  return {
    status: "identified",
    item,
    material,
    // "stated" = the model used a material word itself; "inferred" = we mapped
    // the object name onto a material, which is our guess, not the model's.
    certainty: material ? (source === "material-word" ? "stated" : "inferred") : null,
    transcript,
  };
};
