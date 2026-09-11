/**
 * searchUtils.ts - Levenshtein Fuzzy Search Engine (Backend)
 *
 * Implements the Levenshtein distance metric for fuzzy search matching across:
 * - Event Title
 * - Event Location
 * - Event Description
 */

export function levenshteinDistance(a: string, b: string): number {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;

  if (a.length > b.length) {
    const tmp = a;
    a = b;
    b = tmp;
  }

  const aLen = a.length;
  const bLen = b.length;

  const prevRow = new Array<number>(aLen + 1);
  const currRow = new Array<number>(aLen + 1);

  for (let i = 0; i <= aLen; i++) {
    prevRow[i] = i;
  }

  for (let j = 1; j <= bLen; j++) {
    currRow[0] = j;
    const bChar = b[j - 1];

    for (let i = 1; i <= aLen; i++) {
      const cost = a[i - 1] === bChar ? 0 : 1;
      currRow[i] = Math.min(
        currRow[i - 1] + 1,
        prevRow[i] + 1,
        prevRow[i - 1] + cost
      );
    }

    for (let i = 0; i <= aLen; i++) {
      prevRow[i] = currRow[i];
    }
  }

  return prevRow[aLen];
}

export function getMaxAllowedLevenshteinDistance(tokenLength: number): number {
  if (tokenLength <= 2) return 0;
  if (tokenLength <= 4) return 1;
  if (tokenLength <= 7) return 2;
  return 3;
}

export function tokenizeSearchText(text: string): string[] {
  if (!text) return [];
  return text
    .toLowerCase()
    .split(/[\s,.;:!?_/\-–—()[\]{}"'`~@#$%^&*+=|<>]+/)
    .filter((token) => token.length > 0);
}

export function fuzzyMatchToken(queryToken: string, targetWord: string): boolean {
  const q = queryToken.toLowerCase();
  const t = targetWord.toLowerCase();

  if (t === q || t.startsWith(q) || t.includes(q)) {
    return true;
  }

  if (q.startsWith(t) && t.length >= 3) {
    return true;
  }

  const maxDist = getMaxAllowedLevenshteinDistance(q.length);
  if (maxDist === 0) {
    return false;
  }

  const dist = levenshteinDistance(q, t);
  if (dist <= maxDist) {
    return true;
  }

  if (t.length > q.length) {
    const targetPrefix = t.slice(0, q.length + 1);
    if (levenshteinDistance(q, targetPrefix) <= maxDist) {
      return true;
    }
  }

  return false;
}

export function fuzzyMatchTextWithLevenshtein(targetText: string, query: string): boolean {
  if (!targetText || !query) return false;

  const cleanQuery = query.trim().toLowerCase();
  if (cleanQuery === "") return true;

  const cleanTarget = targetText.toLowerCase();

  if (cleanTarget.includes(cleanQuery)) {
    return true;
  }

  const queryTokens = tokenizeSearchText(cleanQuery);
  if (queryTokens.length === 0) return false;

  const targetTokens = tokenizeSearchText(cleanTarget);
  if (targetTokens.length === 0) return false;

  if (queryTokens.length > 1) {
    const windowSize = queryTokens.length;
    const maxPhraseDist = getMaxAllowedLevenshteinDistance(cleanQuery.length);

    for (let i = 0; i <= targetTokens.length - windowSize; i++) {
      const windowPhrase = targetTokens.slice(i, i + windowSize).join(" ");
      if (levenshteinDistance(cleanQuery, windowPhrase) <= maxPhraseDist) {
        return true;
      }
    }
  }

  return queryTokens.every((qToken) =>
    targetTokens.some((tToken) => fuzzyMatchToken(qToken, tToken))
  );
}

export interface SearchableEvent {
  title: string;
  location?: string | null;
  description?: string | null;
  tags?: string[];
}

export function matchEventByLevenshtein(event: SearchableEvent, query: string): boolean {
  if (!query || query.trim() === "") return true;
  const q = query.trim();

  if (event.title && fuzzyMatchTextWithLevenshtein(event.title, q)) {
    return true;
  }

  if (event.location && fuzzyMatchTextWithLevenshtein(event.location, q)) {
    return true;
  }

  if (event.description && fuzzyMatchTextWithLevenshtein(event.description, q)) {
    return true;
  }

  const combinedText = [
    event.title || "",
    event.location || "",
    event.description || "",
    ...(event.tags || []),
  ].join(" ");

  if (fuzzyMatchTextWithLevenshtein(combinedText, q)) {
    return true;
  }

  if (event.tags && event.tags.some((tag) => fuzzyMatchTextWithLevenshtein(tag, q))) {
    return true;
  }

  return false;
}

export function getEventLevenshteinScore(event: SearchableEvent, query: string): number {
  if (!query || query.trim() === "") return 0;
  const q = query.trim().toLowerCase();

  let score = 0;

  if (event.title) {
    const titleLower = event.title.toLowerCase();
    if (titleLower === q) {
      score += 120;
    } else if (titleLower.includes(q)) {
      score += 90;
    } else if (fuzzyMatchTextWithLevenshtein(event.title, q)) {
      const dist = levenshteinDistance(q, titleLower.slice(0, q.length + 2));
      score += Math.max(50, 80 - dist * 10);
    }
  }

  if (event.location) {
    const locLower = event.location.toLowerCase();
    if (locLower === q) {
      score += 70;
    } else if (locLower.includes(q)) {
      score += 55;
    } else if (fuzzyMatchTextWithLevenshtein(event.location, q)) {
      score += 40;
    }
  }

  if (event.description) {
    const descLower = event.description.toLowerCase();
    if (descLower.includes(q)) {
      score += 35;
    } else if (fuzzyMatchTextWithLevenshtein(event.description, q)) {
      score += 25;
    }
  }

  return score;
}

export function filterEventsByLevenshtein<T extends SearchableEvent>(
  events: T[],
  query: string
): T[] {
  if (!query || query.trim() === "") {
    return events;
  }

  const matched = events.filter((e) => matchEventByLevenshtein(e, query));

  return matched.sort((a, b) => {
    return getEventLevenshteinScore(b, query) - getEventLevenshteinScore(a, query);
  });
}

