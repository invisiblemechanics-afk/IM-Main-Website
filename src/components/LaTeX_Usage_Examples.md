# LaTeX Rendering in Practice Questions and Breakdowns

This application now supports LaTeX mathematical expressions throughout the platform using KaTeX for rendering.

## Supported LaTeX Syntax

### Inline Math
Use single dollar signs for inline mathematical expressions:
```
The quadratic formula is $x = \frac{-b \pm \sqrt{b^2 - 4ac}}{2a}$
```

### Block Math
Use double dollar signs for centered mathematical expressions:
```
$$\int_{-\infty}^{\infty} e^{-x^2} dx = \sqrt{\pi}$$
```

## Where LaTeX is Supported

LaTeX rendering is automatically applied to:

1. **Question Text** - Main question descriptions in practice and breakdown questions
2. **Question Titles** - Question headings and titles
3. **Answer Choices** - All multiple choice options
4. **Theory Slide Content** - Content in theory slides during breakdowns
5. **Slide Titles** - Titles of all slides in breakdown sequences
6. **Hints** - Hint text in questions and slides

## Common LaTeX Examples

### Basic Math
- Fractions: `$\frac{a}{b}$` → $\frac{a}{b}$
- Square roots: `$\sqrt{x}$` → $\sqrt{x}$
- Powers: `$x^2$` → $x^2$
- Subscripts: `$x_1$` → $x_1$

### Greek Letters
- `$\alpha, \beta, \gamma, \delta$` → $\alpha, \beta, \gamma, \delta$
- `$\pi, \theta, \phi, \lambda$` → $\pi, \theta, \phi, \lambda$

### Physics & Engineering
- `$F = ma$` → $F = ma$
- `$E = mc^2$` → $E = mc^2$
- `$V = IR$` → $V = IR$
- `$P = \frac{V^2}{R}$` → $P = \frac{V^2}{R}$

### Calculus
- `$\frac{d}{dx}f(x)$` → $\frac{d}{dx}f(x)$
- `$\int_a^b f(x) dx$` → $\int_a^b f(x) dx$
- `$\lim_{x \to 0} \frac{\sin x}{x} = 1$` → $\lim_{x \to 0} \frac{\sin x}{x} = 1$

### Matrices
```
$$\begin{pmatrix}
a & b \\
c & d
\end{pmatrix}$$
```

### Complex Expressions
```
$$\sum_{n=1}^{\infty} \frac{1}{n^2} = \frac{\pi^2}{6}$$
```

## Error Handling

If LaTeX syntax is invalid, the renderer will:
1. Display an error message in red: `[LaTeX Error: invalid_formula]`
2. Log the error to the console for debugging
3. Continue rendering the rest of the content normally

## Implementation Details

- Uses KaTeX library for fast, client-side rendering
- Automatically detects LaTeX expressions in text
- Supports both inline (`$...$`) and block (`$$...$$`) math
- Preserves HTML formatting for non-LaTeX content
- Safe rendering with error boundaries

## For Admin Panel Users

When creating questions, slides, or content:

1. **Question Text**: Include LaTeX directly in the question description
   ```
   Find the value of $x$ if $2x + 3 = 7$
   ```

2. **Answer Choices**: Use LaTeX in any option
   ```
   A) $x = 2$
   B) $x = \frac{1}{2}$
   C) $x = -2$
   D) $x = \sqrt{2}$
   ```

3. **Theory Slides**: Use both inline and block math
   ```
   The derivative of $f(x) = x^2$ is:
   $$f'(x) = 2x$$
   ```

4. **Hints**: Include mathematical expressions in hints
   ```
   Remember that $\sin^2 \theta + \cos^2 \theta = 1$
   ```

The LaTeX rendering is automatically applied - no special setup required in the admin panel!