/**
 * The material vocabulary the detector works in, plus the disposal guidance
 * shown for each one.
 *
 * The guidance deliberately comes from this table and *not* from the model:
 * SmolVLM-256M is small enough that free-text disposal advice from it would be
 * plausible-sounding and occasionally wrong, which is worse than generic advice
 * that is always right. The model is asked only to name the object and its
 * material; everything the UI asserts about recycling comes from here.
 */
export const MATERIALS = {
  plastic: {
    label: "Plastic",
    recyclable: true,
    guidance:
      "Empty and rinse it, leave the lid on, and put it in the plastics stream. Check the resin code — some kerbside schemes take only 1 (PET) and 2 (HDPE).",
  },
  paper: {
    label: "Paper / cardboard",
    recyclable: true,
    guidance:
      "Keep it dry and flatten boxes. Grease-soaked or food-stained paper belongs in general waste, not recycling.",
  },
  glass: {
    label: "Glass",
    recyclable: true,
    guidance:
      "Rinse it and remove metal lids (those go with metal). Broken glass, mirrors and ovenware are usually not accepted with bottles and jars.",
  },
  metal: {
    label: "Metal",
    recyclable: true,
    guidance:
      "Rinse cans and tins; foil should be balled up so it is large enough to be sorted. Aerosols must be completely empty.",
  },
  electronics: {
    label: "Electronics (e-waste)",
    recyclable: true,
    guidance:
      "Never put this in household recycling. Take it to a WEEE / e-waste drop-off point, and remove batteries first — they are a fire risk in collection trucks.",
  },
  textile: {
    label: "Textile",
    recyclable: true,
    guidance:
      "Clean, dry clothing and fabric go to a textile bank or charity, not the mixed-recycling bin.",
  },
  organic: {
    label: "Organic / food waste",
    recyclable: false,
    guidance:
      "Compost it or use the food-waste collection. It contaminates paper and plastic recycling.",
  },
  other: {
    label: "Not clearly recyclable",
    recyclable: false,
    guidance:
      "This does not match a common kerbside recycling stream. Check your local council's list before binning it.",
  },
};

/** Order matters: the first list to match wins. */
const MATERIAL_WORDS = [
  ["electronics", /\b(e-?waste|electronic|electrical|battery|batteries|circuit|charger|cable|laptop|phone|tablet|remote control|appliance)\b/],
  ["glass", /\bglass\b/],
  ["metal", /\b(metal|metallic|aluminium|aluminum|tin|steel|iron|foil|brass|copper)\b/],
  ["paper", /\b(paper|cardboard|card|carton|paperboard|newspaper|newsprint|magazine)\b/],
  ["plastic", /\b(plastic|polythene|polyethylene|polystyrene|styrofoam|pet|hdpe|pvc|acrylic|nylon)\b/],
  ["textile", /\b(textile|fabric|cloth|clothing|cotton|wool|denim|leather)\b/],
  ["organic", /\b(food|organic|compost|fruit|vegetable|peel|leftover|biodegradable)\b/],
];

/**
 * Object names that imply a material on their own. Ambiguous words are
 * deliberately absent: "bottle" and "cup" are the reason the old keyword
 * matcher filed the same object under both plastic and glass, so an object
 * whose material genuinely cannot be told from its name resolves to `null`
 * (reported as unclear) rather than to a confident guess.
 */
const OBJECT_WORDS = [
  ["electronics", /\b(computer|monitor|keyboard|mouse|headphone|earbud|charger|usb|printer|television|tv|camera|console)\b/],
  ["paper", /\b(book|magazine|newspaper|envelope|leaflet|flyer|receipt|box|carton|sheet of paper)\b/],
  ["metal", /\b(can|tin can|soda can|beer can|aerosol|cutlery|saucepan|pan|kettle)\b/],
  ["glass", /\b(jar|wine glass|drinking glass|window pane)\b/],
  ["plastic", /\b(bag|wrapper|packaging|punnet|tub|straw|cutlery tray|blister pack)\b/],
  ["textile", /\b(shirt|t-shirt|trousers|jeans|jumper|sock|shoe|towel|bedsheet)\b/],
  ["organic", /\b(apple|banana|orange peel|bread|leftovers|teabag|eggshell)\b/],
];

/** Every material a table matches in the text, not just the first. */
const matchesIn = (text, table) => {
  const found = new Set();
  for (const [material, pattern] of table) {
    if (pattern.test(text)) found.add(material);
  }
  return found;
};

/**
 * Maps free text from the model onto a material, and says where the answer
 * came from.
 *
 * `source: "material-word"` means the model itself used a material word
 * ("a plastic bottle"); `source: "object-word"` means only the object name was
 * recognised and the material comes from the table above ("a soda can" → metal),
 * which is a weaker claim the UI labels as such.
 *
 * Text naming several materials at once resolves to `null`. A 256M model asked
 * "what is this made of?" quite often answers by reciting the options back, and
 * picking the first one out of that list would be inventing an answer.
 *
 * @param {string|null|undefined} text
 * @returns {{material: string|null, source: "material-word"|"object-word"|null}}
 */
export const classifyMaterial = (text) => {
  if (!text) return { material: null, source: null };
  const lower = text.toLowerCase();

  // Explicit material words are trusted over object names, so "glass bottle"
  // resolves to glass even though "bottle" appears in it.
  const stated = matchesIn(lower, MATERIAL_WORDS);
  if (stated.size === 1) {
    return { material: [...stated][0], source: "material-word" };
  }
  if (stated.size > 1) return { material: null, source: null };

  const implied = matchesIn(lower, OBJECT_WORDS);
  if (implied.size === 1) {
    return { material: [...implied][0], source: "object-word" };
  }
  return { material: null, source: null };
};

/** Material key only, for callers that do not care where it came from. */
export const matchMaterial = (text) => classifyMaterial(text).material;

export const materialInfo = (key) => MATERIALS[key] ?? MATERIALS.other;

export const isRecyclable = (key) => materialInfo(key).recyclable === true;
