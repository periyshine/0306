# PWA Icons

This directory should contain the following icon files:

## Required Icons

| Filename | Size | Description |
|----------|------|-------------|
| `favicon-16x16.png` | 16x16 | Small favicon |
| `favicon-32x32.png` | 32x32 | Standard favicon |
| `icon-192x192.png` | 192x192 | Android icon |
| `icon-512x512.png` | 512x512 | iOS/Android icon |
| `apple-touch-icon.png` | 180x180 | Apple touch icon |

## How to Generate Icons

### Option 1: Online Tools

1. [PWA Asset Generator](https://www.pwabuilder.com/imageGenerator)
   - Upload a single high-resolution image
   - Download all required sizes

2. [RealFaviconGenerator](https://realfavicongenerator.net/)
   - Comprehensive favicon generator
   - Supports multiple platforms

3. [Favicon.io](https://favicon.io/)
   - Simple PNG favicon generator
   - Text or image-based icons

### Option 2: Command Line with ImageMagick

```bash
# Install ImageMagick first
# then run:
convert input.png -resize 16x16 favicon-16x16.png
convert input.png -resize 32x32 favicon-32x32.png
convert input.png -resize 192x192 icon-192x192.png
convert input.png -resize 512x512 icon-512x512.png
convert input.png -resize 180x180 apple-touch-icon.png
```

### Option 3: Use a Design Tool

1. Create an icon in:
   - Figma
   - Adobe Illustrator
   - Canva
   - Inkscape

2. Export in required sizes

## Icon Design Guidelines

### Recommended Design
- Simple, recognizable fitness-related symbol
- Works well at small sizes (16x16)
- Contrasting colors for visibility
- No text (or minimal text)

### Color Suggestions
- Primary: #4F46E5 (Indigo)
- Accent: #10B981 (Green)
- Background: White or transparent

### Theme Ideas
- Dumbbell
- Running person
- Heartbeat/ECG line
- Flexed arm
- Scale/weight
- Stopwatch

### File Format
- PNG format
- Transparent background recommended
- 32-bit color with alpha channel

## Temporary Placeholder

While testing, you can use any image as a placeholder. The app will still function, but the icons won't look professional.

---

**Tip:** For the best results, start with a 1024x1024 or larger source image and scale down.
