# Changelog

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