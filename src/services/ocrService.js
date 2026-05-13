// ---------------------------------------------------------------------------
// KEYWORDS
// ---------------------------------------------------------------------------
const EXPIRY_KEYWORDS = [
  'BEST BEFORE',
  'USE BEFORE',
  'USE BY',
  'EXPIRY',
  'EXPIRATION',
  'EXP DATE',
  'EXP.',
  'EXP:',
  'EXP',
  'BB',
];

const MFG_KEYWORDS = [
  'MANUFACTURING DATE',
  'MANUFACTURED ON',
  'MANUFACTURED',
  'PRODUCTION DATE',
  'PACKED ON',
  'PACKING DATE',
  'PACK DATE',
  'DATE OF MFG',
  'DATE OF MFD',
  'MFG DATE',
  'MFD DATE',
  'MFG.',
  'MFG:',
  'MFD.',
  'MFD:',
  'MFG',
  'MFD',
  'PKD.',
  'PKD:',
  'PKD',
  'DOM.',
  'DOM:',
  'DOM',
];

const DATE_REGEX =
  /(\d{1,2}[/.-]\d{1,2}[/.-]\d{2,4})|(\d{4}[/-]\d{1,2}[/-]\d{1,2})|(\d{1,2}[/-]\d{4})|(\d{1,2}[/-]\d{2}(?!\d))|(\d{1,2}\s*(?:JAN|FEB|MAR|APR|MAY|JUN|JUL|AUG|SEP|OCT|NOV|DEC)[A-Z]*\.?\s*\d{2,4})|((?:JAN|FEB|MAR|APR|MAY|JUN|JUL|AUG|SEP|OCT|NOV|DEC)[A-Z]*\.?\s*\d{1,2}[,\s]+\d{2,4})|((?:JAN|FEB|MAR|APR|MAY|JUN|JUL|AUG|SEP|OCT|NOV|DEC)[A-Z]*\.?\s*\d{2,4})/gi;

// ---------------------------------------------------------------------------
// MONTH MAP — for parsing month-name dates
// ---------------------------------------------------------------------------
const MONTH_MAP = {
  JAN: 1, JANUARY: 1,
  FEB: 2, FEBRUARY: 2,
  MAR: 3, MARCH: 3,
  APR: 4, APRIL: 4,
  MAY: 5,
  JUN: 6, JUNE: 6,
  JUL: 7, JULY: 7,
  AUG: 8, AUGUST: 8,
  SEP: 9, SEPTEMBER: 9, SEPT: 9,
  OCT: 10, OCTOBER: 10,
  NOV: 11, NOVEMBER: 11,
  DEC: 12, DECEMBER: 12,
};

// ---------------------------------------------------------------------------
// HELPERS
// ---------------------------------------------------------------------------

/**
 * Extract all date strings from a text segment using the DATE_REGEX.
 */
const extractDatesFromLine = (line) => {
  const matches = [];
  // Reset lastIndex for global regex
  DATE_REGEX.lastIndex = 0;
  let m;
  while ((m = DATE_REGEX.exec(line)) !== null) {
    // Pick whichever capture group matched
    const dateStr = (m[1] || m[2] || m[3] || m[4] || m[5] || m[6] || m[7] || '').trim();
    if (dateStr) {
      matches.push(dateStr);
    }
  }
  return matches;
};

/**
 * Expand 2-digit year → 4-digit year.
 */
const expandYear = (y) => {
  const n = parseInt(y, 10);
  if (y.length === 4) return n;
  return n > 50 ? 1900 + n : 2000 + n;
};

/**
 * Parse a raw date string into a JS Date object.
 * Returns null if unparseable.
 */
const parseToDate = (str) => {
  if (!str) return null;
  const s = str.trim().toUpperCase();

  // YYYY-MM-DD or YYYY/MM/DD
  const isoMatch = s.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})$/);
  if (isoMatch) {
    return new Date(
      parseInt(isoMatch[1], 10),
      parseInt(isoMatch[2], 10) - 1,
      parseInt(isoMatch[3], 10),
    );
  }

  // DD/MM/YYYY or DD-MM-YYYY or DD.MM.YYYY
  const dmyFull = s.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})$/);
  if (dmyFull) {
    return new Date(
      parseInt(dmyFull[3], 10),
      parseInt(dmyFull[2], 10) - 1,
      parseInt(dmyFull[1], 10),
    );
  }

  // DD/MM/YY or DD-MM-YY or DD.MM.YY (2-digit year)
  const dmyShort = s.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{2})$/);
  if (dmyShort) {
    return new Date(
      expandYear(dmyShort[3]),
      parseInt(dmyShort[2], 10) - 1,
      parseInt(dmyShort[1], 10),
    );
  }

  // MM/YYYY or MM-YYYY
  const myFull = s.match(/^(\d{1,2})[-/.](\d{4})$/);
  if (myFull) {
    return new Date(parseInt(myFull[2], 10), parseInt(myFull[1], 10) - 1, 1);
  }

  // MM/YY or MM-YY (2-digit year, only if month is valid 1-12)
  const myShort = s.match(/^(\d{1,2})[-/](\d{2})$/);
  if (myShort) {
    const mm = parseInt(myShort[1], 10);
    if (mm >= 1 && mm <= 12) {
      return new Date(expandYear(myShort[2]), mm - 1, 1);
    }
  }

  // DD MON YYYY / DD-MON-YYYY / DDMONYYYY
  const dMonY = s.match(/^(\d{1,2})\s*[-.]?\s*([A-Z]{3,9})\.?\s*[-.]?\s*(\d{2,4})$/);
  if (dMonY) {
    const monthNum = MONTH_MAP[dMonY[2].replace(/\./g, '')];
    if (monthNum) {
      return new Date(expandYear(dMonY[3]), monthNum - 1, parseInt(dMonY[1], 10));
    }
  }

  // MON DD, YYYY / MON DD YYYY
  const monDY = s.match(/^([A-Z]{3,9})\.?\s*(\d{1,2})[,\s]+(\d{2,4})$/);
  if (monDY) {
    const monthNum = MONTH_MAP[monDY[1].replace(/\./g, '')];
    if (monthNum) {
      return new Date(expandYear(monDY[3]), monthNum - 1, parseInt(monDY[2], 10));
    }
  }

  // MON YYYY / MON-YYYY / MON YY
  const monY = s.match(/^([A-Z]{3,9})\.?\s*[-/]?\s*(\d{2,4})$/);
  if (monY) {
    const monthNum = MONTH_MAP[monY[1].replace(/\./g, '')];
    if (monthNum) {
      return new Date(expandYear(monY[2]), monthNum - 1, 1);
    }
  }

  return null;
};

/**
 * Check if a line contains any of the given keywords (case-insensitive).
 */
const lineContainsKeyword = (lineUpper, keywords) => {
  for (const kw of keywords) {
    if (lineUpper.includes(kw)) {
      return true;
    }
  }
  return false;
};

// ---------------------------------------------------------------------------
// CORE: extractDatesFromText
//
// 1. Split text into lines
// 2. Keyword-based detection per line
// 3. Fallback: all dates sorted oldest→newest
// 4. Guard: never same value for both fields
//
// Returns { manufacturingDate: string|null, expiryDate: string|null }
// ---------------------------------------------------------------------------
export const extractDatesFromText = (rawText) => {
  if (!rawText || rawText.trim() === '') {
    return { manufacturingDate: null, expiryDate: null };
  }

  // ── STEP 1: Split into lines ─────────────────────────────────────────────
  const lines = rawText.split('\n').map((l) => l.trim()).filter(Boolean);

  let manufacturingDate = null;
  let expiryDate = null;

  // ── STEP 2: Keyword-based detection per line ─────────────────────────────
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lineUpper = line.toUpperCase();
    const datesInLine = extractDatesFromLine(lineUpper);

    if (datesInLine.length === 0) {
      // No date on this line — but keyword might be here with date on NEXT line
      if (i < lines.length - 1) {
        const nextLineUpper = lines[i + 1].toUpperCase();
        const datesInNextLine = extractDatesFromLine(nextLineUpper);

        if (datesInNextLine.length > 0) {
          if (!expiryDate && lineContainsKeyword(lineUpper, EXPIRY_KEYWORDS)) {
            expiryDate = datesInNextLine[0];
          }
          if (!manufacturingDate && lineContainsKeyword(lineUpper, MFG_KEYWORDS)) {
            manufacturingDate = datesInNextLine[0];
          }
        }
      }
      continue;
    }

    // Line has dates — check for keywords
    if (!expiryDate && lineContainsKeyword(lineUpper, EXPIRY_KEYWORDS)) {
      expiryDate = datesInLine[0];
    }

    if (!manufacturingDate && lineContainsKeyword(lineUpper, MFG_KEYWORDS)) {
      manufacturingDate = datesInLine[0];
    }

    // Early exit if both found
    if (manufacturingDate && expiryDate) break;
  }

  // ── STEP 3: Fallback — extract all dates, sort, assign ───────────────────
  if (!manufacturingDate || !expiryDate) {

    // Collect all dates from full text
    const fullTextUpper = rawText.toUpperCase();
    const allDateStrings = extractDatesFromLine(fullTextUpper);

    // Parse to Date objects and keep only valid ones
    const parsedDates = allDateStrings
      .map((ds) => ({ str: ds, date: parseToDate(ds) }))
      .filter((d) => d.date !== null && !isNaN(d.date.getTime()));

    // Sort oldest → newest
    parsedDates.sort((a, b) => a.date.getTime() - b.date.getTime());

    // Remove duplicates by timestamp
    const uniqueDates = parsedDates.filter(
      (d, i, arr) => i === 0 || d.date.getTime() !== arr[i - 1].date.getTime(),
    );

    if (uniqueDates.length === 1) {
      // ── STEP 7: Single date case → assign to expiryDate only ───────────
      if (!expiryDate) {
        expiryDate = uniqueDates[0].str;
      }
      // Do NOT assign to manufacturingDate — leave it empty
    } else if (uniqueDates.length >= 2) {
      // Oldest = MFG, newest = EXP
      if (!manufacturingDate) {
        manufacturingDate = uniqueDates[0].str;
      }
      if (!expiryDate) {
        expiryDate = uniqueDates[uniqueDates.length - 1].str;
      }
    }
  }

  // ── STEP 6: Guard — never assign the same value to both fields ───────────
  if (
    manufacturingDate &&
    expiryDate &&
    manufacturingDate === expiryDate
  ) {
    manufacturingDate = null;
  }

  // Double-check with parsed timestamps too (different strings, same date)
  if (manufacturingDate && expiryDate) {
    const mfgDate = parseToDate(manufacturingDate);
    const expDate = parseToDate(expiryDate);
    if (mfgDate && expDate && mfgDate.getTime() === expDate.getTime()) {
      manufacturingDate = null;
    }
  }

  return { manufacturingDate, expiryDate };
};

// ---------------------------------------------------------------------------
// Normalize image URI for ML Kit
// ---------------------------------------------------------------------------
const normalizeImageUri = (uri) => {
  if (!uri) return uri;
  let normalized = uri.trim();

  if (
    normalized.startsWith('file://') ||
    normalized.startsWith('content://') ||
    normalized.startsWith('http://') ||
    normalized.startsWith('https://')
  ) {
    return normalized;
  }

  if (normalized.startsWith('/')) {
    normalized = 'file://' + normalized;
  }

  return normalized;
};

// ---------------------------------------------------------------------------
// Lazy-load ML Kit
// ---------------------------------------------------------------------------
const getMLKit = () => {
  try {
    const MLKitModule = require('@react-native-ml-kit/text-recognition');
    const TextRecognition = MLKitModule.default || MLKitModule;

    if (TextRecognition && typeof TextRecognition.recognize === 'function') {
      return TextRecognition;
    }
    if (typeof MLKitModule.recognize === 'function') {
      return MLKitModule;
    }

    console.warn('[ocrService] ML Kit loaded but recognize() not found');
    return null;
  } catch (err) {
    console.warn('[ocrService] ML Kit not available:', err.message);
    return null;
  }
};

// ---------------------------------------------------------------------------
// PUBLIC: scanProduct
//
// @param  {string} imageUri — local file URI from image-picker
// @returns {Promise<{rawText, manufacturingDate, expiryDate, notConfigured}>}
// ---------------------------------------------------------------------------
export const scanProduct = async (imageUri) => {
  if (!imageUri) {
    throw new Error('imageUri is required');
  }

  const normalizedUri = normalizeImageUri(imageUri);

  const TextRecognition = getMLKit();

  if (!TextRecognition) {
    console.warn('[ocrService] ML Kit not configured');
    return {
      rawText: '',
      manufacturingDate: null,
      expiryDate: null,
      notConfigured: true,
    };
  }

  try {
    const result = await TextRecognition.recognize(normalizedUri);

    const rawText = result?.text ?? '';

    // Extract dates from the OCR text
    const { manufacturingDate, expiryDate } = extractDatesFromText(rawText);

    return { rawText, manufacturingDate, expiryDate, notConfigured: false };
  } catch (err) {
    console.error('[ocrService] Recognition error:', err?.message);
    throw new Error(
      'OCR failed: ' + (err?.message || 'Please try with a clearer image.'),
    );
  }
};


