# Interactive Cursor Component

## Overview
Premium dual-ring interactive cursor with smooth animations and morphing capabilities.

## Cursor Behavior Rules

### 1. Surround Mode
- **Trigger**: `[data-cursor="surround"]` + element must be clickable
- **Behavior**: Cursor morphs to the element's rounded rectangle with `--cursor-pad-card` padding
- **Minimum radius**: `--cursor-radius-min` (16px by default)
- **Use for**: Large clickable cards, interactive tiles
- **Smart Detection**: Only activates if element has click handlers, pointer cursor, or is naturally clickable

### 2. Hover Mode  
- **Trigger**: `button`, `a`, `[role="button"]`, `[data-cursor="button"]` + element must be clickable
- **Behavior**: Cursor morphs tightly to button with `--cursor-pad-button` padding
- **Use for**: Buttons, links, CTAs
- **Smart Detection**: Automatically detects disabled elements and skips them

### 3. Native Cursor Mode
- **Trigger**: `input`, `textarea`, `[contenteditable]`, `[data-native-cursor]`
- **Behavior**: Interactive cursor hides, native cursor shows
- **Use for**: Text inputs, editable content

### 4. Smart Clickability Detection
The cursor now intelligently detects if elements are actually clickable by checking:
- Presence of click event handlers
- CSS `cursor: pointer` style
- Naturally clickable elements (buttons, links)
- Disabled state (skips disabled elements)
- ARIA disabled state

## CSS Variables

```css
:root {
  --cursor-accent: #0A84FF;          /* Primary cursor color */
  --cursor-ring: rgba(10,132,255,0.75);  /* Ring border color */
  --cursor-halo: rgba(10,132,255,0.12);  /* Soft halo gradient */
  --cursor-dot: rgba(245,247,250,0.85);  /* Center dot color */
  --cursor-shadow: ...;               /* Ring shadow effects */
  --cursor-size: 36px;               /* Default size */
  --cursor-size-hover: 48px;         /* Hover size */
  --cursor-pad: 12px;                /* Surround padding */
  --cursor-radius-min: 16px;         /* Minimum corner radius */
}
```

## Usage Examples

```tsx
// Card that cursor will surround
<div data-cursor="surround" className="card">
  Card content...
</div>

// Custom hover element
<span data-cursor="hover">Clickable text</span>

// Keep native cursor
<div data-native-cursor>
  <input type="text" />
</div>
```

## Performance

- Uses CSS transforms and springs for 60fps animations
- Singleton pattern prevents duplicate instances
- Passive event listeners for better scroll performance
- Auto-cleanup on unmount

## Accessibility

- Automatically disabled when `prefers-reduced-motion: reduce`
- Disabled on touch devices
- Never interferes with pointer events
