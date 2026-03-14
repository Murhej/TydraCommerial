# Frontend UI Modernization Requirement

This project uses the following UI modernization standards for all current and future frontend work.

## Scope
- Apply improvements across all frontend pages and shared components.
- Public and admin experiences must look and feel like one product.

## Design System Standards
- Use shared tokens for spacing, typography, colors, radii, shadows, motion, and z-index.
- Prefer reusable UI primitives over page-local one-off styles.
- Keep semantic status variants consistent: `success`, `warning`, `error`, `info`, `neutral`.

## Interaction Standards
- Use subtle, purposeful motion for hover, press, expand/collapse, and overlays.
- Respect reduced motion preferences.
- Provide clear feedback for long actions and successful completion.

## Data UX Standards
- Every data screen must define loading, empty, and error states.
- Use skeleton loaders where possible.
- Provide retry affordances for recoverable API failures.

## Form Standards
- Keep labels, hints, validation, and error text consistent.
- Disable submit during active requests.
- Show success confirmation after submit.

## Accessibility Standards
- Maintain semantic heading and section hierarchy.
- Ensure keyboard and focus visibility support.
- Ensure modals and interactive controls are accessible.
- Maintain adequate contrast for all statuses and controls.

## Responsive Standards
- Layouts should support desktop, tablet, and mobile.
- Admin screens should remain usable in half-width windows.
- Tables and dense data should degrade gracefully on narrow widths.

## Quality Target
- Visual and interaction quality should match modern SaaS expectations:
  polished, clear hierarchy, consistent rhythm, and conversion-focused UX.
