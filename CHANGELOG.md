# Changelog

## 0.6.1 (January 20, 2026)
- Fixed `UErrorPage` CSS syntax error (trailing semicolon in CSS block)
- Enhanced initial route loading to wait for outlet element readiness
- Changed click event listener from rootElement to document level for better event handling
- Added `global.d.ts` import to main entry point
- Removed unnecessary `computedHref` state from `ULink` component

## 0.6.0 (January 15, 2026)
- Refactored internal module organization
- Renamed web-components: `ErrorPage` → `UErrorPage`, `Link` → `ULink`, `Outlet` → `UOutlet`
- Added dedicated `react.ts` export for React-compatible components(`ULink`, `UOutlet`)
- Improved `ULink` to support `target` attribute for anchor tags, allowing standard browser behavior for links like `_blank`, etc.

## 0.5.3 (December 4, 2025)
- Removed logic that prevented routing when navigating to the same URL

## 0.5.2 (November 17, 2025)
- Changed `RouteInfo` to `RouteContext` and added progress callback support
- Added `initialLoad` option to RouterConfig to control initial route loading behavior
- Added `fallback` option to RouterConfig for custom fallback rendering
- Added `RouteProgressEvent` to notify route loading progress
- Removed `children` in `NonIndexRouteConfig` to simplify route definitions
- Removed `route` in `window` object to reduce global namespace pollution
- Improved error handling and logging in ErrorPage component

## 0.5.1 (November 13, 2025)
- route error handling improvements

## 0.5.0 (November 12, 2025)
- Changed route rendering to support both synchronous and asynchronous `render` methods in route config
- Removed commonjs build output, now only ESM is supported

## 0.4.0 (November 11, 2025)
- Added global declarations
- Added `destroy` method to Router class
- Added `useIntercept`(whether to intercept anchor tag clicks) option to RouterConfig

## 0.3.0 (October 28, 2025)

### Breaking Changes
- Complete router architecture overhaul
- Split RouteConfig type into `IndexRouteConfig` and `PathRouteConfig`
- Changed `RouteError` to class and added `NotFoundRouteError`
- Simplified `Outlet` component rendering (unified renderContent method)
- Changed route event names (`route-start` → `route-begin`, `route-end` → `route-done`)

### Added
- Improved ErrorPage component styling and usability
- Unified route rendering using render functions

## 0.2.1 (October 27, 2025)

### Major Updates
- Refactored routing mechanism for improved performance
- Enhanced error handling with custom error pages

### Changed
- removed `connect()` and `disconnect()` methods
- removed `notfound` configuration option
- removed Old route progress events
- added ErrorPage component for error handling
- added Route events: `route-start`, `route-end`, `route-error`
- improved TypeScript types and interfaces

## 0.1.0 (April 25, 2025)
- Initial library version release
