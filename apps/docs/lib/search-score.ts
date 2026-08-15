const fieldSeparator = "\u001f"

function normalizeSearchText(value: string) {
  return value
    .normalize("NFKD")
    .replace(/\p{Mark}/gu, "")
    .toLocaleLowerCase("en")
    .replace(/[-_/]+/gu, " ")
    .replace(/\s+/gu, " ")
    .trim()
}

export function createSearchValue(...fields: string[]) {
  return fields.join(fieldSeparator)
}

function isSingleEditMatch(candidate: string, query: string) {
  if (query.length < 4 || Math.abs(candidate.length - query.length) > 1) {
    return false
  }

  if (candidate.length === query.length) {
    const differences = []
    for (let index = 0; index < candidate.length; index += 1) {
      if (candidate[index] !== query[index]) differences.push(index)
      if (differences.length > 2) return false
    }
    if (differences.length <= 1) return true
    const [first, second] = differences
    if (first === undefined || second === undefined) return false
    return (
      second === first + 1 &&
      candidate[first] === query[second] &&
      candidate[second] === query[first]
    )
  }

  const shorter = candidate.length < query.length ? candidate : query
  const longer = candidate.length < query.length ? query : candidate
  let shorterIndex = 0
  let longerIndex = 0
  let skipped = false

  while (shorterIndex < shorter.length && longerIndex < longer.length) {
    if (shorter[shorterIndex] === longer[longerIndex]) {
      shorterIndex += 1
      longerIndex += 1
      continue
    }
    if (skipped) return false
    skipped = true
    longerIndex += 1
  }

  return true
}

export function scoreSearchResult(
  value: string,
  search: string,
  keywords: string[] = []
) {
  const query = normalizeSearchText(search)
  if (!query) return 1

  const primaryFields = value
    .split(fieldSeparator)
    .map(normalizeSearchText)
    .filter(Boolean)
  const keywordFields = keywords.map(normalizeSearchText).filter(Boolean)

  if (primaryFields.some((field) => field === query)) return 1
  if (primaryFields.some((field) => field.startsWith(query))) return 0.95

  const primaryWords = primaryFields.flatMap((field) => field.split(" "))
  if (primaryWords.some((word) => word.startsWith(query))) return 0.9

  const initialisms = primaryFields.map((field) =>
    field
      .split(" ")
      .map((word) => word[0])
      .join("")
  )
  if (
    query.length >= 2 &&
    initialisms.some((initialism) => initialism.startsWith(query))
  ) {
    return 0.88
  }

  if (
    query.length >= 4 &&
    primaryFields.some((field) => field.includes(query))
  ) {
    return 0.85
  }

  const terms = query.split(" ").filter(Boolean)
  const primaryText = primaryFields.join(" ")
  if (terms.length > 1 && terms.every((term) => primaryText.includes(term))) {
    return 0.8
  }

  if (primaryWords.some((word) => isSingleEditMatch(word, query))) return 0.7

  const searchableWords = [
    ...primaryWords,
    ...keywordFields.flatMap((field) => field.split(" ")),
  ]
  if (
    terms.every((term) =>
      searchableWords.some(
        (word) =>
          word.startsWith(term) || (term.length >= 4 && word.includes(term))
      )
    )
  ) {
    return 0.55
  }

  return 0
}
