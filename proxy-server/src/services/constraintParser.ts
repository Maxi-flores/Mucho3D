export interface Constraints {
  size?: 'small' | 'medium' | 'large'
  mood?: 'warm' | 'cold' | 'neutral'
  style?: string
}

export interface ConstraintParseResult {
  constraints: Constraints
  isCorrection: boolean
}

const STYLE_KEYWORDS = [
  'modern',
  'minimalist',
  'industrial',
  'scandinavian',
  'rustic',
  'cozy',
  'futuristic',
  'vintage',
] as const

export function parseConstraints(input: string): ConstraintParseResult {
  const text = input.toLowerCase()
  const constraints: Constraints = {}

  if (/\bsmall(er)?\b/.test(text)) constraints.size = 'small'
  else if (/\bmedium\b/.test(text)) constraints.size = 'medium'
  else if (/\b(large|larger|big|bigger)\b/.test(text)) constraints.size = 'large'

  if (/\bwarm(er)?\b/.test(text)) constraints.mood = 'warm'
  else if (/\bcold(er)?\b/.test(text)) constraints.mood = 'cold'
  else if (/\bneutral\b/.test(text)) constraints.mood = 'neutral'

  const style = STYLE_KEYWORDS.find((keyword) =>
    new RegExp(`\\b${keyword}\\b`).test(text)
  )
  if (style) constraints.style = style

  const isCorrection =
    Object.keys(constraints).length > 0 ||
    /\b(make it|change|adjust|move|rotate|scale|instead|warmer|colder|smaller|larger|bigger)\b/.test(
      text
    )

  return {
    constraints,
    isCorrection,
  }
}
