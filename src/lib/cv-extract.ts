/**
 * Extract plain text from CV/resume files (PDF or TXT).
 * Used by Wizard and CareerTools. Normalizes whitespace and preserves section structure.
 */
import * as pdfjsLib from 'pdfjs-dist';
import pdfWorkerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

if (typeof window !== 'undefined') {
  pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;
}

/** PDF text items have transform for position; sort by y (desc) then x for reading order. */
function sortTextItems(
  items: Array<{ str?: string; transform?: number[] }>
): Array<{ str?: string; transform?: number[] }> {
  return [...items].sort((a, b) => {
    const yA = a.transform?.[5] ?? 0;
    const yB = b.transform?.[5] ?? 0;
    if (Math.abs(yA - yB) > 2) return yB - yA; // higher y first (top of page)
    const xA = a.transform?.[4] ?? 0;
    const xB = b.transform?.[4] ?? 0;
    return xA - xB;
  });
}

export async function extractTextFromPdf(file: File): Promise<string> {
  const buf = await file.arrayBuffer();
  const doc = await pdfjsLib.getDocument(buf).promise;
  const texts: string[] = [];
  for (let i = 1; i <= doc.numPages; i++) {
    const page = await doc.getPage(i);
    const content = await page.getTextContent();
    const items = content.items as Array<{ str?: string; transform?: number[] }>;
    const sorted = sortTextItems(items);
    const pageText = sorted.map((item) => ('str' in item ? item.str : '')).join(' ');
    texts.push(pageText);
  }
  return normalizeCvText(texts.join('\n\n'));
}

/** Common CV section headers (case-insensitive) to detect and preserve structure. */
const CV_SECTION_HEADERS = [
  'experience', 'work experience', 'employment', 'professional experience',
  'education', 'academic', 'qualifications', 'certifications', 'skills',
  'technical skills', 'summary', 'profile', 'objective', 'achievements',
  'projects', 'languages', 'references', 'contact', 'awards', 'honors',
];

function normalizeCvText(raw: string): string {
  let s = raw
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .replace(/\t/g, ' ')
    .replace(/\u00A0/g, ' ');
  // Collapse multiple spaces
  s = s.replace(/[ \t]+/g, ' ');
  // Ensure newline before common section headers so AI can see structure
  for (const header of CV_SECTION_HEADERS) {
    const re = new RegExp(`([^\n])(\\s*${escapeRe(header)}\\s*[:\\.]?)`, 'gi');
    s = s.replace(re, (_, before, rest) => {
      if (before.trim().length > 0) return `${before}\n\n${rest}`;
      return rest;
    });
  }
  // Collapse 3+ newlines to double
  s = s.replace(/\n{3,}/g, '\n\n');
  return s.trim();
}

function escapeRe(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

const MAX_CV_CHARS = 30_000;

/**
 * Extract text from a CV file (PDF or TXT). Normalizes whitespace and section breaks; truncates to MAX_CV_CHARS for API safety.
 */
export async function extractTextFromCvFile(file: File): Promise<string> {
  let text: string;
  if (file.type === 'application/pdf') {
    text = await extractTextFromPdf(file);
  } else if (file.type === 'text/plain' || file.name.endsWith('.txt')) {
    text = await file.text();
    text = normalizeCvText(text);
  } else {
    throw new Error('Unsupported format. Use PDF or TXT.');
  }
  return text.length > MAX_CV_CHARS ? text.slice(0, MAX_CV_CHARS) : text;
}
