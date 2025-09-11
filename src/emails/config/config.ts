import { pixelBasedPreset, TailwindConfig } from "@react-email/components"
import dotenv from "dotenv"
import dotenvExpand from "dotenv-expand"
dotenvExpand.expand(dotenv.config({ quiet: true }))

export const brandName = process.env.EMAIL_BRAND_NAME
export const brandLogoUrl = process.env.EMAIL_BRAND_LOGO_URL
export const brandIconUrl = process.env.EMAIL_BRAND_ICON_URL
export const unsubscribeUrl = process.env.EMAIL_UNSUBSCRIBE_URL
export const welcomeEmailPreview = process.env.WELCOME_EMAIL_PREVIEW

let fontFamily = {}
const fontFamilies = process.env.EMAIL_FONT_FAMILY?.trim().split(",")
if (fontFamilies && fontFamilies.length >= 1) {
  fontFamilies.map((ff) => {
    if (!ff) return
    const key = ff.trim().toLocaleLowerCase().split(" ").join("-")
    const value = ff.trim()
    fontFamily[key] = [value, "sans-serif"]
  })
}
export { fontFamily }

export const tailwindConfig: TailwindConfig = {
  presets: [pixelBasedPreset],
  theme: {
    extend: {
      fontFamily,
      colors: {
        background: process.env.EMAIL_BACKGROUND_COLOR!,
        foreground: process.env.EMAIL_FOREGROUND_COLOR!,
        "accent-foreground": process.env.EMAIL_ACCENT_FOREGROUND_COLOR!,
        "muted-foreground": process.env.EMAIL_MUTED_FOREGROUND_COLOR!,
        "primary-background": process.env.EMAIL_PRIMARY_BACKGROUND_COLOR!,
        "primary-foreground": process.env.EMAIL_PRIMARY_FOREGROUND_COLOR!,
      },
    },
  },
}
