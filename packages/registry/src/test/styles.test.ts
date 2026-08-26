import { readFileSync } from "node:fs"
import { resolve } from "node:path"
import { describe, expect, it } from "vitest"

const globals = readFileSync(
  resolve(process.cwd(), "src/styles/globals.css"),
  "utf8"
)

interface OklchColor {
  lightness: number
  chroma: number
  hue: number
}

function themeBlock(selector: ":root" | ".dark") {
  const escapedSelector = selector === ":root" ? ":root" : "\\.dark"
  const match = globals.match(
    new RegExp(`${escapedSelector}\\s*\\{([\\s\\S]*?)\\n\\}`, "u")
  )
  if (!match?.[1]) throw new Error(`Missing ${selector} theme block.`)
  return match[1]
}

function colorToken(block: string, name: string): OklchColor {
  const match = block.match(
    new RegExp(
      `--${name}:\\s*oklch\\(([\\d.]+)\\s+([\\d.]+)\\s+([\\d.]+)\\)`,
      "u"
    )
  )
  if (!match) throw new Error(`Missing --${name} OKLCH token.`)
  return {
    lightness: Number(match[1]),
    chroma: Number(match[2]),
    hue: Number(match[3]),
  }
}

function linearSrgb({ lightness, chroma, hue }: OklchColor) {
  const radians = (hue * Math.PI) / 180
  const a = chroma * Math.cos(radians)
  const b = chroma * Math.sin(radians)
  const lRoot = lightness + 0.3963377774 * a + 0.2158037573 * b
  const mRoot = lightness - 0.1055613458 * a - 0.0638541728 * b
  const sRoot = lightness - 0.0894841775 * a - 1.291485548 * b
  const l = lRoot ** 3
  const m = mRoot ** 3
  const s = sRoot ** 3
  return [
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
  ].map((channel) => Math.max(0, Math.min(1, channel)))
}

function relativeLuminance(color: OklchColor) {
  const [red = 0, green = 0, blue = 0] = linearSrgb(color)
  return 0.2126 * red + 0.7152 * green + 0.0722 * blue
}

function encodeSrgb(channel: number) {
  return channel <= 0.0031308
    ? 12.92 * channel
    : 1.055 * channel ** (1 / 2.4) - 0.055
}

function decodeSrgb(channel: number) {
  return channel <= 0.04045
    ? channel / 12.92
    : ((channel + 0.055) / 1.055) ** 2.4
}

function translucentContrast(
  foreground: OklchColor,
  background: OklchColor,
  alpha: number
) {
  const foregroundSrgb = linearSrgb(foreground).map(encodeSrgb)
  const backgroundSrgb = linearSrgb(background).map(encodeSrgb)
  const composite = foregroundSrgb.map((channel, index) =>
    decodeSrgb(alpha * channel + (1 - alpha) * (backgroundSrgb[index] ?? 0))
  )
  const compositeLuminance =
    0.2126 * (composite[0] ?? 0) +
    0.7152 * (composite[1] ?? 0) +
    0.0722 * (composite[2] ?? 0)
  const backgroundLuminance = relativeLuminance(background)
  const lighter = Math.max(compositeLuminance, backgroundLuminance)
  const darker = Math.min(compositeLuminance, backgroundLuminance)
  return (lighter + 0.05) / (darker + 0.05)
}

function contrastRatio(foreground: OklchColor, background: OklchColor) {
  const lighter = Math.max(
    relativeLuminance(foreground),
    relativeLuminance(background)
  )
  const darker = Math.min(
    relativeLuminance(foreground),
    relativeLuminance(background)
  )
  return (lighter + 0.05) / (darker + 0.05)
}

describe("global accessibility styles", () => {
  it("keeps syntax colors chromatic and above WCAG AA contrast", () => {
    const lightTheme = themeBlock(":root")
    const darkTheme = themeBlock(".dark")
    const syntaxTokens = [
      "aq-syntax-comment",
      "aq-syntax-keyword",
      "aq-syntax-meta",
      "aq-syntax-property",
      "aq-syntax-string",
      "aq-syntax-number",
      "aq-syntax-literal",
      "aq-syntax-type",
      "aq-syntax-title",
      "aq-syntax-variable",
    ]

    for (const token of syntaxTokens) {
      const lightColor = colorToken(lightTheme, token)
      const darkColor = colorToken(darkTheme, token)

      expect(lightColor.chroma, `${token} light chroma`).toBeGreaterThan(0.03)
      expect(darkColor.chroma, `${token} dark chroma`).toBeGreaterThan(0.03)
      expect(
        contrastRatio(lightColor, colorToken(lightTheme, "muted")),
        `${token} light contrast`
      ).toBeGreaterThanOrEqual(4.5)
      expect(
        contrastRatio(darkColor, colorToken(darkTheme, "muted")),
        `${token} dark contrast`
      ).toBeGreaterThanOrEqual(4.5)
    }

    expect(globals).toContain(".aq-code-highlight")
    expect(globals).toContain(".hljs-selector-pseudo")
    expect(globals).toContain(".hljs-params")
  })

  it("disables motion and smooth scrolling when reduced motion is requested", () => {
    const start = globals.indexOf("@media (prefers-reduced-motion: reduce)")
    const end = globals.indexOf("@layer base", start)
    const reducedMotion = globals.slice(start, end)

    expect(start).toBeGreaterThanOrEqual(0)
    expect(reducedMotion).toContain("animation-duration: 0.01ms !important")
    expect(reducedMotion).toContain("animation-iteration-count: 1 !important")
    expect(reducedMotion).toContain("transition-duration: 0.01ms !important")
    expect(reducedMotion).toContain("scroll-behavior: auto !important")
  })

  it("keeps destructive button tokens above WCAG AA text contrast", () => {
    const lightTheme = themeBlock(":root")
    const darkTheme = themeBlock(".dark")
    const lightContrast = contrastRatio(
      colorToken(lightTheme, "destructive-foreground"),
      colorToken(lightTheme, "destructive")
    )
    const darkContrast = contrastRatio(
      colorToken(darkTheme, "destructive-foreground"),
      colorToken(darkTheme, "destructive")
    )

    expect(lightContrast).toBeGreaterThanOrEqual(4.5)
    expect(darkContrast).toBeGreaterThanOrEqual(4.5)
  })

  it("keeps translucent focus rings above non-text contrast", () => {
    const lightTheme = themeBlock(":root")
    const darkTheme = themeBlock(".dark")

    expect(
      translucentContrast(
        colorToken(lightTheme, "ring"),
        colorToken(lightTheme, "background"),
        0.5
      )
    ).toBeGreaterThanOrEqual(3)
    expect(
      translucentContrast(
        colorToken(darkTheme, "ring"),
        colorToken(darkTheme, "background"),
        0.5
      )
    ).toBeGreaterThanOrEqual(3)
  })

  it("keeps destructive button focus rings above non-text contrast", () => {
    const lightTheme = themeBlock(":root")
    const darkTheme = themeBlock(".dark")

    expect(
      translucentContrast(
        colorToken(lightTheme, "destructive"),
        colorToken(lightTheme, "background"),
        0.7
      )
    ).toBeGreaterThanOrEqual(3)
    expect(
      translucentContrast(
        colorToken(darkTheme, "destructive"),
        colorToken(darkTheme, "background"),
        0.7
      )
    ).toBeGreaterThanOrEqual(3)
  })
})
