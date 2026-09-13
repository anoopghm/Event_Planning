/**
 * searchUtils.ts - Levenshtein Fuzzy Search Engine
 *
 * Implements the Levenshtein distance metric for fuzzy search matching across:
 * - Event Title
 * - Event Location
 * - Event Description
 * - (and Event Tags)
 */

/**
 * Calculates the Levenshtein edit distance between two strings using dynamic programming.
 * Complexity: O(m * n) time, O(min(m, n)) space.
 * Represents the minimum single-character operations (insertions, deletions, substitutions)
 * needed to transform string `a` into string `b`.
 */
export function levenshteinDistance(a: string, b: string): number {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;

  // Optimize space by making 'a' the shorter string
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
        currRow[i - 1] + 1,      // insertion
        prevRow[i] + 1,          // deletion
        prevRow[i - 1] + cost    // substitution
      );
    }

    for (let i = 0; i <= aLen; i++) {
      prevRow[i] = currRow[i];
    }
  }

  return prevRow[aLen];
}

/**
 * Determines maximum allowed Levenshtein edit distance for a token based on its length.
 * - Length <= 2: 0 (exact / substring only)
 * - Length 3-4: 1 edit (e.g. "met" -> "meet", "prty" -> "party")
 * - Length 5-7: 2 edits (e.g. "anual" -> "annual", "wrkshop" -> "workshop")
 * - Length >= 8: 3 edits (e.g. "conferance" -> "conference", "infrastructre" -> "infrastructure")
 */
export function getMaxAllowedLevenshteinDistance(tokenLength: number): number {
  if (tokenLength <= 2) return 0;
  if (tokenLength <= 4) return 1;
  if (tokenLength <= 7) return 2;
  return 3;
}

/**
 * Splits text into lowercase alphanumeric tokens.
 */
export function tokenizeSearchText(text: string): string[] {
  if (!text) return [];
  return text
    .toLowerCase()
    .split(/[\s,.;:!?_/\-–—()[\]{}"'`~@#$%^&*+=|<>]+/)
    .filter((token) => token.length > 0);
}

/**
 * Checks if a single query token fuzzy matches a target word using Levenshtein distance.
 */
export function fuzzyMatchToken(queryToken: string, targetWord: string): boolean {
  const q = queryToken.toLowerCase();
  const t = targetWord.toLowerCase();

  // 1. Exact match or direct substring/prefix match
  if (t === q || t.startsWith(q) || t.includes(q)) {
    return true;
  }

  // If query starts with target word (for short word stems e.g. target "dev", query "development")
  if (q.startsWith(t) && t.length >= 3) {
    return true;
  }

  const maxDist = getMaxAllowedLevenshteinDistance(q.length);
  if (maxDist === 0) {
    return false;
  }

  // 2. Full word Levenshtein distance
  const dist = levenshteinDistance(q, t);
  if (dist <= maxDist) {
    return true;
  }

  // 3. Prefix Levenshtein distance for longer target words
  if (t.length > q.length) {
    const targetPrefix = t.slice(0, q.length + 1);
    if (levenshteinDistance(q, targetPrefix) <= maxDist) {
      return true;
    }
  }

  return false;
}

/**
 * Checks if a multi-word or single-word query matches a text string using Levenshtein distance.
 */
export function fuzzyMatchTextWithLevenshtein(targetText: string, query: string): boolean {
  if (!targetText || !query) return false;

  const cleanQuery = query.trim().toLowerCase();
  if (cleanQuery === "") return true;

  const cleanTarget = targetText.toLowerCase();

  // 1. Direct fast substring match
  if (cleanTarget.includes(cleanQuery)) {
    return true;
  }

  const queryTokens = tokenizeSearchText(cleanQuery);
  if (queryTokens.length === 0) return false;

  const targetTokens = tokenizeSearchText(cleanTarget);
  if (targetTokens.length === 0) return false;

  // 2. Multi-word phrase sliding window Levenshtein match
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

  // 3. Token-by-token fuzzy match: all query tokens must match a word in target
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

export const MIN_SEARCH_QUERY_LENGTH = 3;

/**
 * Searches an event by checking title, location, or description
 * using the Levenshtein search algorithm. Requires at least 3 letters.
 */
export function matchEventByLevenshtein(event: SearchableEvent, query: string): boolean {
  if (!query || query.trim().length < MIN_SEARCH_QUERY_LENGTH) return true;
  const q = query.trim();

  // 1. Check Title
  if (event.title && fuzzyMatchTextWithLevenshtein(event.title, q)) {
    return true;
  }

  // 2. Check Location
  if (event.location && fuzzyMatchTextWithLevenshtein(event.location, q)) {
    return true;
  }

  // 3. Check Description
  if (event.description && fuzzyMatchTextWithLevenshtein(event.description, q)) {
    return true;
  }

  // 4. Combined text check (handles multi-token queries spanning multiple fields)
  // e.g. query "conference san francisco" where "conference" is in title and "san francisco" is in location
  const combinedText = [
    event.title || "",
    event.location || "",
    event.description || "",
    ...(event.tags || []),
  ].join(" ");

  if (fuzzyMatchTextWithLevenshtein(combinedText, q)) {
    return true;
  }

  // 5. Check Tags
  if (event.tags && event.tags.some((tag) => fuzzyMatchTextWithLevenshtein(tag, q))) {
    return true;
  }

  return false;
}

/**
 * Computes a relevance score for an event matching a search query.
 * Higher score means a closer and more relevant match.
 * Exact title match gives highest score, followed by Levenshtein title, location, description.
 */
export function getEventLevenshteinScore(event: SearchableEvent, query: string): number {
  if (!query || query.trim().length < MIN_SEARCH_QUERY_LENGTH) return 0;
  const q = query.trim().toLowerCase();

  let score = 0;

  // Title scores
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

  // Location scores
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

  // Description scores
  if (event.description) {
    const descLower = event.description.toLowerCase();
    if (descLower.includes(q)) {
      score += 35;
    } else if (fuzzyMatchTextWithLevenshtein(event.description, q)) {
      score += 25;
    }
  }

  // Tags scores
  if (event.tags) {
    if (event.tags.some((t) => t.toLowerCase() === q)) {
      score += 30;
    } else if (event.tags.some((t) => fuzzyMatchTextWithLevenshtein(t, q))) {
      score += 20;
    }
  }

  return score;
}

/**
 * Filters and ranks a list of events based on Levenshtein search across
 * title, location, and description.
 */
export function filterEventsByLevenshtein<T extends SearchableEvent>(
  events: T[],
  query: string
): T[] {
  if (!query || query.trim().length < MIN_SEARCH_QUERY_LENGTH) {
    return events;
  }

  const matched = events.filter((e) => matchEventByLevenshtein(e, query));

  // Sort matched events by relevance score descending
  return matched.sort((a, b) => {
    return getEventLevenshteinScore(b, query) - getEventLevenshteinScore(a, query);
  });
}

