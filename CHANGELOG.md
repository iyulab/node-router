# Changelog

## 0.7.3 (March 5, 2026)

### Breaking Changes
- `RenderResult`, `FallbackRenderResult` 타입 제거 — `render` 함수 반환 타입이 `unknown`으로 변경
- React (`react`, `react-dom`, `@lit/react`)를 optional `peerDependencies`로 이동 — Lit-only 프로젝트에서 React 설치 불필요

### Fixed
- `UOutlet`에서 `react-dom/client`를 동적 import로 변경하여 React 미설치 환경에서의 import 실패 해결
- `UErrorPage` 에러 코드 문자열 불일치 수정 (`OUTLET_NOT_FOUND` → `OUTLET_MISSING`, `RENDER_FAILED` → `CONTENT_RENDER_FAILED`)
- `catchBasepath`에서 `restPath`가 빈 문자열일 때 falsy로 판정되어 trailing slash가 잘리는 엣지케이스 수정
- `ULink`의 `getBasepath()` fallback을 빈 문자열 `""`에서 `"/"`로 변경하여 초기 접근 시 잘못된 경로 생성 방지
- `Router.go()` catch 블록에서 원시 타입 throw 시 속성 접근 오류 방지 (옵셔널 체이닝 적용)

### Improved
- `findOutlet` 함수 단순화 — shadowRoot/일반 DOM 분기 및 중복 `querySelector` 탐색 제거

## 0.7.2 (February 9, 2026)

### Changed
- Dependencies version bump

## 0.7.1 (February 9, 2026)

### Fixed
- Fixed silent failure when passing `<u-outlet>` element directly as `Router` root (#1)
- `findOutlet()` now recognizes the root element itself as a valid outlet
- Improved `waitOutlet()` timeout error message with root element context for easier debugging

## 0.6.2 (January 21, 2026)

### Breaking Changes
- Refactored `UOutlet` from LitElement to native HTMLElement (improved performance and reduced dependencies)

### Changed
- Changed `ULink` click event handling to host element level for better encapsulation
- Changed `@lit-react` devDependency to dependency for proper React integration
- Enhanced all helpers and types for better TypeScript support

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
