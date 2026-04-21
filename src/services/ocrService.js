// src/services/ocrService.js
//
// OCR Service — on-device text recognition via @react-native-ml-kit/text-recognition
// No API key required. Runs entirely on the device using Google ML Kit.
//
// Exports:
//   extractDates(rawText)  — pure JS date parsing (no native deps)
//   scanProduct(imageUri)  — ML Kit scan + date extraction
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// DATE REGEX PATTERNS
// ---------------------------------------------------------------------------
const DATE_PATTERNS = [
  /\b(\d{4}[-/]\d{2}[-/]\d{2})\b/,                            // YYYY-MM-DD or YYYY/MM/DD
  /\b(\d{2}[\/\-\.]\d{2}[\/\-\.]\d{4})\b/,                   // DD/MM/YYYY or MM/DD/YYYY
  /\b(\d{2}[\/\-]\d{4})\b/,                                    // MM/YYYY or MM-YYYY
  /\b(\d{1,2}[- ]?(?:JAN|FEB|MAR|APR|MAY|JUN|JUL|AUG|SEP|OCT|NOV|DEC)[.A-Z]*[- ]?\d{2,4})\b/i,
  /\b((?:JAN|FEB|MAR|APR|MAY|JUN|JUL|AUG|SEP|OCT|NOV|DEC)[.A-Z]*[- ]?\d{2,4})\b/i,
];

const EXPIRY_KEYWORDS = [
  'EXP', 'EXPIRY', 'EXPIRY DATE', 'BEST BEFORE',
  'BEST BY', 'USE BEFORE', 'USE BY', 'BB',
];

const MFG_KEYWORDS = [
  'MFG', 'MFD', 'MFG DATE', 'MFD DATE', 'MANUFACTURED',
  'MANUFACTURED ON', 'MANUFACTURE DATE', 'DOM', 'DATE OF MFG',
];

const normalize = (text) =>
  text.replace(/\r?\n/g, ' ').replace(/\s+/g, ' ').toUpperCase().trim();

const extractDateFromSegment = (segment) => {
  for (const pattern of DATE_PATTERNS) {
    const match = segment.match(pattern);
    if (match) return match[1] || match[0];
  }
  return null;
};

const findDateNearKeyword = (text, keywords) => {
  for (const kw of keywords) {
    const idx = text.indexOf(kw);
    if (idx === -1) continue;
    // Look in a 60-char window after the keyword
    const slice = text.slice(idx + kw.length, idx + kw.length + 60);
    const date = extractDateFromSegment(slice);
    if (date) return date;
  }
  return null;
};

// ---------------------------------------------------------------------------
// PUBLIC: extractDates — pure JS, zero native dependencies
// ---------------------------------------------------------------------------
export const extractDates = (rawText) => {
  if (!rawText || rawText.trim() === '') {
    return { expiryDate: null, manufacturingDate: null };
  }
  const text = normalize(rawText);
  return {
    expiryDate: findDateNearKeyword(text, EXPIRY_KEYWORDS),
    manufacturingDate: findDateNearKeyword(text, MFG_KEYWORDS),
  };
};

// ---------------------------------------------------------------------------
// Lazy-load ML Kit (graceful fallback if package not yet linked)
// ---------------------------------------------------------------------------
const getMLKit = () => {
  try {
    const TextRecognition =
      require('@react-native-ml-kit/text-recognition').default;
    return TextRecognition;
  } catch {
    return null;
  }
};

// ---------------------------------------------------------------------------
// PUBLIC: scanProduct — ML Kit on-device OCR
//
// Returns: { rawText, expiryDate, manufacturingDate, notConfigured? }
//   notConfigured: true  → ML Kit package not linked (needs rebuild)
// ---------------------------------------------------------------------------
export const scanProduct = async (imageUri) => {
  const TextRecognition = getMLKit();

  if (!TextRecognition) {
    // Package installed but native module not yet linked (needs rebuild)
    return {
      rawText: '',
      expiryDate: null,
      manufacturingDate: null,
      notConfigured: true,
    };
  }

  try {
    const result = await TextRecognition.recognize(imageUri);
    const rawText = result?.text ?? '';
    const { expiryDate, manufacturingDate } = extractDates(rawText);
    return { rawText, expiryDate, manufacturingDate, notConfigured: false };
  } catch (err) {
    console.error('[ocrService] ML Kit recognition error:', err);
    throw err;
  }
};
