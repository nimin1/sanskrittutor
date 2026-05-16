const VOWELS: Record<string, string> = {
  a: "അ",
  aa: "ആ",
  i: "ഇ",
  ii: "ഈ",
  ee: "ഈ",
  u: "ഉ",
  uu: "ഊ",
  oo: "ഊ",
  e: "എ",
  ee2: "ഏ",
  ai: "ഐ",
  o: "ഒ",
  oa: "ഓ",
  au: "ഔ",
};

const VOWEL_SIGNS: Record<string, string> = {
  a: "",
  aa: "ാ",
  i: "ി",
  ii: "ീ",
  ee: "ീ",
  u: "ു",
  uu: "ൂ",
  oo: "ൂ",
  e: "െ",
  ee2: "േ",
  ai: "ൈ",
  o: "ൊ",
  oa: "ോ",
  au: "ൗ",
};

const CONSONANTS: Record<string, string> = {
  kh: "ഖ",
  gh: "ഘ",
  ch: "ച",
  jh: "ഝ",
  nj: "ഞ",
  th: "ഥ",
  dh: "ധ",
  ph: "ഫ",
  bh: "ഭ",
  sh: "ശ",
  zh: "ഴ",
  ng: "ങ",
  k: "ക",
  g: "ഗ",
  c: "ക",
  j: "ജ",
  t: "ത",
  d: "ദ",
  n: "ന",
  p: "പ",
  b: "ബ",
  m: "മ",
  y: "യ",
  r: "ര",
  l: "ല",
  v: "വ",
  w: "വ",
  s: "സ",
  h: "ഹ",
};

const COMMON_WORDS = [
  "സംസ്കൃതം",
  "അർത്ഥം",
  "എന്താണ്",
  "എന്താ",
  "ഇതിന്റെ",
  "വിഭക്തി",
  "സന്ധി",
  "സമാസം",
  "ശ്ലോകം",
  "പദം",
  "വാക്യം",
  "വ്യാകരണം",
  "ലളിതമായി",
  "വിശദീകരിക്കൂ",
  "ഉദാഹരണം",
  "മനസ്സിലായില്ല",
  "വീണ്ടും",
  "പറയൂ",
];

const COMMON_PHRASES: Array<[string, string]> = [
  ["artham", "അർത്ഥം"],
  ["ithinte artham", "ഇതിന്റെ അർത്ഥം"],
  ["entha", "എന്താ"],
  ["enthanu", "എന്താണ്"],
  ["lalithamayi parayu", "ലളിതമായി പറയൂ"],
  ["vibhakthi", "വിഭക്തി"],
  ["sandhi", "സന്ധി"],
  ["samasam", "സമാസം"],
  ["slokam", "ശ്ലോകം"],
  ["samskritam", "സംസ്കൃതം"],
  ["manassilayilla", "മനസ്സിലായില്ല"],
];

const CONSONANT_KEYS = Object.keys(CONSONANTS).sort((a, b) => b.length - a.length);
const VOWEL_KEYS = ["ee2", "aa", "ii", "ee", "uu", "oo", "ai", "oa", "au", "a", "i", "u", "e", "o"];

export function getMalayalamSuggestions(text: string): string[] {
  const beforeCursor = text;
  const phrase = trailingRomanPhrase(beforeCursor);
  const word = trailingRomanWord(beforeCursor);
  const suggestions = new Set<string>();

  for (const [roman, malayalam] of COMMON_PHRASES) {
    if (phrase && roman.startsWith(phrase.toLowerCase())) suggestions.add(malayalam);
  }

  if (word) {
    const transliterated = transliterateMalayalam(word);
    if (transliterated) suggestions.add(transliterated);
    for (const common of COMMON_WORDS) {
      if (common.startsWith(transliterated.slice(0, 2))) suggestions.add(common);
    }
  }

  return Array.from(suggestions).slice(0, 6);
}

export function applyMalayalamSuggestion(text: string, suggestion: string) {
  const phrase = trailingRomanPhrase(text);
  if (phrase.includes(" ")) {
    return text.slice(0, text.length - phrase.length) + suggestion + " ";
  }
  const word = trailingRomanWord(text);
  return text.slice(0, text.length - word.length) + suggestion + " ";
}

export function transliterateMalayalam(input: string) {
  let text = input.toLowerCase().replace(/[^a-z]/g, "");
  let output = "";

  while (text) {
    const vowel = matchKey(text, VOWEL_KEYS);
    if (vowel) {
      output += VOWELS[vowel];
      text = text.slice(vowel === "ee2" ? 1 : vowel.length);
      continue;
    }

    const consonant = matchKey(text, CONSONANT_KEYS);
    if (!consonant) {
      output += text[0];
      text = text.slice(1);
      continue;
    }

    text = text.slice(consonant.length);
    const nextVowel = matchKey(text, VOWEL_KEYS);
    output += CONSONANTS[consonant];

    if (nextVowel) {
      output += VOWEL_SIGNS[nextVowel];
      text = text.slice(nextVowel === "ee2" ? 1 : nextVowel.length);
    } else if (text) {
      output += "്";
    }
  }

  return output;
}

function matchKey(text: string, keys: string[]) {
  return keys.find((key) => {
    const actual = key === "ee2" ? "e" : key;
    return text.startsWith(actual);
  }) || "";
}

function trailingRomanWord(text: string) {
  return text.match(/[a-zA-Z]+$/)?.[0] || "";
}

function trailingRomanPhrase(text: string) {
  return text.match(/[a-zA-Z]+(?: [a-zA-Z]+){0,2}$/)?.[0] || "";
}
