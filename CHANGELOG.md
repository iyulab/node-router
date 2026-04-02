# Changelog

## [0.7.6] - 2026-04-02

### Fixed
- Added `skills/` and `CHANGELOG.md` to npm `files` field — both were missing from the published package, making `npx skills add ./node_modules/@iyulab/router` non-functional

## [0.7.5] - 2026-04-02

### Changed
- `@lit/react` promoted from optional peer dependency to direct dependency — React integration now works without a separate `@lit/react` install
- Added Agent Skills definition (`skills/iyulab-router`) for AI agent tooling support

## [0.7.4] - 2026-03-05

### Fixed
- `findOutlet()` now searches both shadow DOM and light DOM simultaneously

## [0.7.3] - 2026-03-05

### Changed
- **Breaking:** Removed `RenderResult` and `FallbackRenderResult` types — `render` function return type is now `unknown`
- **Breaking:** Moved React dependencies (`react`, `react-dom`, `@lit/react`) to optional peer dependencies — Lit-only projects no longer require a React install
- Simplified `findOutlet` — removed shadow/light DOM branching and redundant `querySelector` traversal

### Fixed
- `UOutlet` now dynamically imports `react-dom/client` — prevents import failure in React-free environments
- Corrected `UErrorPage` error code string mismatches (`OUTLET_NOT_FOUND` → `OUTLET_MISSING`, `RENDER_FAILED` → `CONTENT_RENDER_FAILED`)
- Fixed edge case in `catchBasepath` where an empty `restPath` was treated as falsy, causing trailing slashes to be dropped
- Changed `ULink.getBasepath()` fallback from `""` to `"/"` to prevent incorrect path generation on initial access
- Applied optional chaining in `Router.go()` catch block to prevent property access errors when a primitive value is thrown

## [0.7.2] - 2026-02-09

### Changed
- Updated dependencies to latest versions

## [0.7.1] - 2026-02-09

### Fixed
- Fixed silent failure when passing `<u-outlet>` element directly as `Router` root (#1)
- `findOutlet()` now recognizes the root element itself as a valid outlet
- Improved `waitOutlet()` timeout error message with root element context for easier debugging

## [0.7.0] - 2026-02-09

### Added
- `meta` field on `RouteConfig` — attach arbitrary key-value data to any route
- `RouteContext.meta` — populated at navigation time with metadata merged from the full matched route chain (parent → child order, child overrides parent)

## [0.6.2] - 2026-01-21

### Changed
- **Breaking:** Refactored `UOutlet` from `LitElement` to native `HTMLElement` for improved performance and reduced bundle size
- **Breaking:** `UErrorPage` CSS custom properties renamed: `--route-icon-color` → `--error-icon-color`, `--route-code-color` → `--error-code-color`, `--route-message-color` → `--error-message-color`
- `ULink` click event handling moved to host element level for better encapsulation
- `@lit/react` moved from devDependency to dependency for proper React integration
- `UErrorPage` replaced inline SVG icon imports with emoji icons; SVG asset files removed

## [0.6.1] - 2026-01-20

### Added
- Added `global.d.ts` import to main entry point

### Changed
- Moved click event listener from root element to document level for more reliable event handling

### Fixed
- Fixed `UErrorPage` CSS syntax error (trailing semicolon in CSS block)
- Fixed initial route loading to wait for outlet element readiness before navigation

### Removed
- Removed unused `computedHref` reactive state from `ULink`

## [0.6.0] - 2026-01-15

### Added
- Dedicated `react.ts` export entry providing React-compatible `UOutlet` and `ULink` wrappers
- `ULink` now supports the `target` attribute, enabling standard browser behavior (e.g. `_blank`)

### Changed
- Renamed custom elements: `ErrorPage` → `UErrorPage`, `Link` → `ULink`, `Outlet` → `UOutlet`
- Refactored internal module organization

## [0.5.3] - 2025-12-04

### Changed
- Removed restriction that prevented re-navigation to the current URL

## [0.5.2] - 2025-11-17

### Added
- `initialLoad` option on `RouterConfig` — controls whether the router navigates to the current URL on initialization
- `fallback` option on `RouterConfig` — defines a custom render function for error and not-found states
- `RouteProgressEvent` dispatched during async route loading

### Changed
- Renamed `RouteInfo` to `RouteContext`; added `progress` callback to context for reporting load progress
- Improved error handling and display in the built-in error page component

### Removed
- Removed `children` from `NonIndexRouteConfig` to simplify the type interface
- Removed `route` property from the `window` object to reduce global namespace pollution

## [0.5.1] - 2025-11-13

### Fixed
- Improved route error handling

## [0.5.0] - 2025-11-12

### Changed
- Route `render` functions now support both synchronous and asynchronous return values

### Removed
- Dropped CommonJS build output — ESM only

## [0.4.0] - 2025-11-11

### Added
- `destroy()` method on `Router` to cleanly remove event listeners
- `useIntercept` option on `RouterConfig` — controls whether anchor tag clicks are intercepted for client-side routing
- Global type declarations (`global.d.ts`)

## [0.3.0] - 2025-10-28

### Changed
- **Breaking:** Complete router architecture overhaul
- **Breaking:** `RouteConfig` split into `IndexRouteConfig` and `PathRouteConfig`
- **Breaking:** `RouteError` converted to a class; added `NotFoundRouteError`
- **Breaking:** Route event names changed: `route-start` → `route-begin`, `route-end` → `route-done`
- Simplified `Outlet` rendering via a unified `renderContent` method

### Added
- Improved `ErrorPage` component styling and usability
- Unified route rendering using render functions

## [0.2.1] - 2025-10-27

### Changed
- Refactored routing mechanism for improved performance
- Enhanced error handling with custom error pages

### Removed
- Removed `connect()` and `disconnect()` methods from `Router`
- Removed `notfound` configuration option
- Removed legacy route progress events
- added ErrorPage component for error handling
- added Route events: `route-start`, `route-end`, `route-error`
- improved TypeScript types and interfaces

## [0.1.0] - 2025-04-25

### Added
- Initial release
