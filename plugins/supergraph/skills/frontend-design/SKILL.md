---
name: frontend-design
description: Create distinctive, production-grade frontend interfaces with high design quality. Use this skill when the user asks to build web components, pages, artifacts, posters, or applications (examples include websites, landing pages, dashboards, React components, HTML/CSS layouts, or when styling/beautifying any web UI). Generates creative, polished code and UI design that avoids generic AI aesthetics.
---

Create distinctive, production-grade frontend interfaces that avoid generic "AI slop" aesthetics. Implement real working code with exceptional attention to aesthetic detail and creative choices.

Announce: "🎨 /supergraph:frontend-design — designing [component/page]..."

## When to Use

- User asks to build a component, page, application, landing page, dashboard, or any web UI
- Styling or beautifying an existing interface
- Creating HTML/CSS/JS, React, Vue, or any frontend artifact

## Steps

### 1. Understand context
Clarify if needed: purpose, target audience, technical constraints (framework, existing design system). Do NOT start coding yet.

### 2. Commit to a bold aesthetic direction

Before coding, decide:
- **Tone** — pick an extreme: brutally minimal, maximalist, retro-futuristic, organic, luxury, editorial, brutalist, art deco, soft/pastel, industrial, etc.
- **Differentiation** — what is the one thing someone will remember about this UI?
- **Constraints** — framework, performance, accessibility requirements

**CRITICAL:** Choose a clear conceptual direction and execute it with precision. Bold maximalism and refined minimalism both work — the key is intentionality.

### 3. Implement

Produce working code (HTML/CSS/JS, React, Vue, etc.) that is:
- Production-grade and functional
- Visually striking and memorable
- Cohesive with a clear aesthetic point-of-view
- Meticulously refined in every detail

### 4. Handoff
Deliver the working code. If the user is in a supergraph workflow:
- Static component → no further steps needed
- Interactive feature → `/supergraph:webapp-testing` to verify UI behavior

## Design Thinking Reference

Before coding, understand the context and commit to a BOLD aesthetic direction:

- **Purpose**: What problem does this interface solve? Who uses it?
- **Tone**: Pick an extreme: brutally minimal, maximalist chaos, retro-futuristic, organic/natural, luxury/refined, playful/toy-like, editorial/magazine, brutalist/raw, art deco/geometric, soft/pastel, industrial/utilitarian, etc. There are so many flavors to choose from. Use these for inspiration but design one that is true to the aesthetic direction.
- **Constraints**: Technical requirements (framework, performance, accessibility).
- **Differentiation**: What makes this UNFORGETTABLE? What's the one thing someone will remember?

**CRITICAL**: Choose a clear conceptual direction and execute it with precision. Bold maximalism and refined minimalism both work - the key is intentionality, not intensity.

Then implement working code (HTML/CSS/JS, React, Vue, etc.) that is:

- Production-grade and functional
- Visually striking and memorable
- Cohesive with a clear aesthetic point-of-view
- Meticulously refined in every detail

## Frontend Aesthetics Guidelines

Focus on:

- **Typography**: Choose fonts that are beautiful, unique, and interesting. Avoid generic fonts like Arial and Inter; opt instead for distinctive choices that elevate the frontend's aesthetics; unexpected, characterful font choices. Pair a distinctive display font with a refined body font.
- **Color & Theme**: Commit to a cohesive aesthetic. Use CSS variables for consistency. Dominant colors with sharp accents outperform timid, evenly-distributed palettes.
- **Motion**: Use animations for effects and micro-interactions. Prioritize CSS-only solutions for HTML. Use Motion library for React when available. Focus on high-impact moments: one well-orchestrated page load with staggered reveals (animation-delay) creates more delight than scattered micro-interactions. Use scroll-triggering and hover states that surprise.
- **Spatial Composition**: Unexpected layouts. Asymmetry. Overlap. Diagonal flow. Grid-breaking elements. Generous negative space OR controlled density.
- **Backgrounds & Visual Details**: Create atmosphere and depth rather than defaulting to solid colors. Add contextual effects and textures that match the overall aesthetic. Apply creative forms like gradient meshes, noise textures, geometric patterns, layered transparencies, dramatic shadows, decorative borders, custom cursors, and grain overlays.

NEVER use generic AI-generated aesthetics like overused font families (Inter, Roboto, Arial, system fonts), cliched color schemes (particularly purple gradients on white backgrounds), predictable layouts and component patterns, and cookie-cutter design that lacks context-specific character.

Interpret creatively and make unexpected choices that feel genuinely designed for the context. No design should be the same. Vary between light and dark themes, different fonts, different aesthetics. NEVER converge on common choices (Space Grotesk, for example) across generations.

**IMPORTANT**: Match implementation complexity to the aesthetic vision. Maximalist designs need elaborate code with extensive animations and effects. Minimalist or refined designs need restraint, precision, and careful attention to spacing, typography, and subtle details. Elegance comes from executing the vision well.

Remember: Claude is capable of extraordinary creative work. Don't hold back, show what can truly be created when thinking outside the box and committing fully to a distinctive vision.

## Rules

- NEVER use Inter, Roboto, Arial, or system fonts — choose distinctive typefaces
- NEVER use purple gradients on white as a default color scheme
- NEVER produce cookie-cutter layouts — every output must have a unique aesthetic point-of-view
- ALWAYS commit to one clear aesthetic direction before coding
- ALWAYS deliver working code, not mockups or pseudocode
- Match implementation complexity to vision: maximalist designs need elaborate code, minimalist designs need precision and restraint
- No two designs should converge on the same choices (fonts, colors, layout) across generations
