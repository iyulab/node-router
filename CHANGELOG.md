# Changelog

## [0.15.0] - 2026-09-16

### Changed

- **`<u-outlet>` now grows when a screen overflows a fixed-height parent.** 0.14.0 declared
  `display: block; height: 100%`, which gives a screen the height it needs to fill a sized
  parent but also pins the outlet to exactly that height. A screen taller than the parent
  therefore overflowed the outlet's box instead of growing it, and a scrolling ancestor adds
  its end padding to the scrollable area of its *in-flow children*, not of what those children
  overflow with. The end gutter dropped out of the scrollable area: scrolling to the bottom of
  a long screen left the content flush against the container's edge, while the gutter survived
  on the other three sides.

  Swapping `height` for `min-height` is not the fix. A percentage height only resolves against
  a parent whose `height` is specified, and a minimum does not satisfy that — so on a block (or
  flex) box a descendant's `height: 100%` computes to `auto`, and every layout built to fill the
  viewport collapses to its content height.

  A grid container gives both behaviors at once. A grid item stretches to its area by default,
  which fills without resolving a percentage, so the chain survives while the container's own
  height is indefinite — and because that height is `auto`, the box grows past the minimum when
  content demands it. The rule is now:

  ```css
  :where(u-outlet) { display: grid; min-height: 100%; }
  ```

  Multiple children behave as before: a track stretches, but an item with a definite height does
  not. The rule deliberately omits `align-content` and relies on the initial `normal` — setting
  `align-content: start` stops the track from stretching and silently voids the fill chain.

  Specificity is still zero, so an application's own `u-outlet { … }` rule wins without
  `!important`, exactly as in 0.14.0. `u-outlet { display: block; height: 100% }` restores the
  0.14.0 box model and `u-outlet { display: inline }` restores the pre-0.14.0 one.

### Contract addition

- **Making the outlet *smaller* now takes two declarations.** `min-height` is a floor, so
  `u-outlet { height: 200px }` on its own still measures the parent's height. Write
  `u-outlet { min-height: 0; height: 200px }`. Making the outlet larger, or replacing its
  `display`, needs nothing extra. This is the only behavioral difference for an application
  that was already overriding the rule.

### Tests

- The browser suite covering the outlet's box model grows from 9 cases to 15. The overflow
  topology — a parent with a definite height holding a taller child — was not covered before,
  which is why the previous rule shipped green: the suite pinned "an auto-height parent leaves
  the outlet auto" but never its opposite. Also pinned now: the two-declaration override above,
  multiple children keeping their own heights, and `align-content` breaking the fill chain.

## [0.14.0] - 2026-09-16

### Changed

- **`<u-outlet>` now declares its own `display: block`.** A custom element's UA default is
  `inline`, and the outlet had no styles of its own — so a container meant to hold a route's
  block-level screen generated an inline box. Consumers had to restate `u-outlet { display: block }`
  in every application that cared, which is a rule only the package that defines the element can
  reasonably own.

  Two independent applications reported this from opposite directions on the same day — one
  through printing (a short document gaining a blank trailing page), one through screen layout
  (a table not reaching the bottom of the viewport). Both traced it to the same missing
  declaration.

  The declaration is `display: block; height: 100%`. The height half is not cosmetic: changing
  `display` alone also changes which box a percentage height resolves against. While the outlet
  was inline it was not a block container, so a screen's `height: 100%` resolved against the
  block above it; making the outlet a block moves that reference onto the outlet itself, whose
  height is `auto`, which silently voids the percentage and collapses full-height layouts to
  their content height (measured: 747px → 60px for a screen built on
  `@iyulab/modern-app`'s master-detail layout). `height: 100%` restores the chain, and resolves
  to `auto` whenever the parent's height is `auto` — so ordinary document flow and printing,
  where the shell releases its height, are unaffected.

  The rule is adopted as a constructable stylesheet on whichever tree the outlet is connected to
  (the document, or the shadow root when the outlet lives in one), written as
  `:where(u-outlet)` so its specificity is zero — any `u-outlet { … }` rule an application writes
  still wins without `!important`, regardless of sheet order. Where constructable sheets are not
  available the rule is added as a `<style>` element instead.

  **This changes layout in normal flow**, not only when printing: an inline box and a block box
  differ in margin collapsing, and a block outlet can be given a height or a percentage size,
  which an inline one silently ignored. Applications that place the outlet inside a flex or grid
  container see no change — flex and grid items were already blockified. To keep the previous
  behavior, set `u-outlet { display: inline }`; to keep the box but not the height, set
  `u-outlet { height: auto }`. Neither needs `!important`.

## [0.13.0] - 2026-09-13

### Removed

- **`RouteConfig.force`** — deprecated in 0.12.0, removed as announced. It only ever expressed
  the two values `key` already covers: `force: false` is `key: () => ''` (keep the mounted
  content across every navigation that matches the route), `force: true` is the default
  (`ctx => ctx.href` — remount when the URL changes at all). Replace one with the other; a
  route that never set `force` is unaffected. The property is gone from the type, so a stale
  usage fails at compile time rather than silently doing nothing.

## [0.12.0] - 2026-09-13

### Added

- **`RouteConfig.key` — the route decides when its content is remounted.** Each navigation
  computes `key(ctx)`; while it is unchanged the outlet keeps the mounted content and re-renders
  it in place with the new `ctx` — a Lit template is rendered into the same part (elements and
  their state survive, only bindings change), a React element into the same root (component
  state survives, props change), and an `HTMLElement` is left as it is. A changed key unmounts
  and mounts fresh, as every navigation did before. Click interception, `go()` and `popstate`
  all follow the one rule because it lives on the route, not on the call. The default is
  `ctx => ctx.href` for leaf routes, so nothing changes until a route opts in:
  `{ path: '/orders', key: ctx => ctx.pathname, render: ctx => html`<orders-page .selectedId=${ctx.query.get('id')}></orders-page>` }`
  keeps the list — its scroll, selection and loaded rows — while `?id=` opens and closes a
  detail overlay.

### Changed

- **A layout route (one with `children`) is now re-rendered in place when a child changes.** It
  was already kept across child navigations, but its `render(ctx)` result was thrown away, so a
  layout could never react to the current `ctx` (an active-menu highlight, a breadcrumb). It now
  receives the new `ctx` through the same in-place path; its inner `<u-outlet>` and the child
  content are untouched.
- **Outlet renders are serialised.** A render that arrives while a React mount is still awaiting
  its dynamic import now waits for that mount instead of racing it.

### Fixed

- **`force: false` on a leaf route was silently ignored.** Defaults were applied with
  `route.force ||= true`, which turns an explicit `false` into `true` — the documented option
  could not be set on the routes it was documented for. `force` is now deprecated in favour of
  `key` (`false` ≡ a constant key, `true` ≡ the default) and, for this release, honoured as
  written on every route.

### Deprecated

- `RouteConfig.force` — use `key`. Still honoured in this release; removed in the next minor.

## [0.11.5] - 2026-09-10

### Fixed

- **`u-error-page`'s three colour hooks were documented as having no default.** They were
  described as falling back to the inherited colour, when the host block in fact declares a
  concrete colour for each — `--error-icon-color` `#4a5568` (dark `#a0aec0`),
  `--error-code-color` `#1a202c` (dark `#f7fafc`), `--error-message-color` `#718096`
  (dark `#cbd5e0`). A consumer reading the old text would expect the page to pick up the
  surrounding colour and find that it does not. The documentation now also states the
  consequence those literals carry: this page does not follow the host application's design
  tokens, and replacing it wholesale is what `fallback.render` is for. No behaviour changed.

## [0.11.4] - 2026-09-01

### Fixed

- **Three error messages gave no way to act on the failure.** `UOutlet.render()`
  threw a generic "not supported content type" without saying what type it
  actually received or what's supported; `getRoutes()` threw a garbled,
  comma-spliced message that leaked an internal function name
  (`setRoutes`) instead of the actual `path` value; and a route whose
  `render()` returned a non-renderable value threw "Failed to load content
  for the route." with no route path or id to identify which route failed.
  All three now interpolate the actual value/route and name the expected
  shape.

## [0.11.3] - 2026-08-31

### Fixed

- **`waitOutlet()` could hang forever in a backgrounded tab.** The wait loop
  only re-checked for the outlet after each `requestAnimationFrame`
  resolved, and a fully suspended tab can stop firing `rAF` entirely (not
  just throttle it), so the loop never exited. It now races each `rAF`
  wait against a `setTimeout` for the remaining budget, and does one more
  outlet check immediately before throwing — the deadline can pass in the
  exact frame the outlet became ready, and without that final check that
  read as a false timeout.

## [0.11.2] - 2026-08-25

### Fixed

- **`aria-current`/`aria-label` set on `<u-link>` never reached the accessibility tree.** The
  host attribute was present, but the actual interactive node exposed to assistive technology
  is the native `<a>` rendered inside the shadow root — ARIA content attributes on a shadow
  host do not cross the shadow boundary to label or mark current a descendant. Navigation
  links relying on `aria-current="page"` to announce the active item, or on `aria-label` for
  their accessible name, were exposed with neither. `render()` now forwards both host
  attributes onto the internal `<a>`, and changes made after connection are observed and
  re-rendered.

## [0.11.1] - 2026-08-20

### Fixed

- **Route matching threw `ReferenceError: URLPattern is not defined` on browsers that ship
  without the URL Pattern API.** The router constructs routes with the global `URLPattern`
  constructor directly; browsers that have not yet shipped it (older Safari and Firefox
  releases are still common in the field) failed synchronously in `new Router(...)`, before
  any route could render. A guarded polyfill (`urlpattern-polyfill`, self-installs only when
  `globalThis.URLPattern` is absent) is now imported by the router's internals, so browsers
  without native support get a working fallback and browsers with native support are
  unaffected at runtime.

### Internal

- Router's own `URLPattern` construction now runs through a small local type shim — the
  polyfill package's bundled types have not yet caught up to the constructor's `options`
  argument (`ignoreCase`), even though its runtime implementation already supports it.

## [0.11.0] - 2026-08-07

### Added

- **`<u-link navigate="document">` — link to a same-origin path the router does not own.**
  Whether a link was "external" was decided by an origin comparison alone, so there was no way to
  point at a same-origin path that is not a SPA route: a static docs site, a server-rendered page,
  a download endpoint, an auth redirect. The router intercepted the click and, with no matching
  route, the screen fell through to not-found.

  The three available escapes all meant something else: a different origin (the requirement is the
  *same* origin — cookies, session, reverse proxy), `target="_blank"` (forces a new tab; same-tab
  navigation was unexpressible), and a `#` fragment (not another document).

  `navigate` defaults to `router`, so existing behaviour is unchanged. The rendered anchor carries
  `data-navigate="document"`, which the router's global anchor delegation also honours — the
  element handler alone is not enough, since a link pointing at a *registered* route would
  otherwise be intercepted there instead.

  The name is deliberately not `external`: this module already uses `isExternalUrl`/`isExternal`
  with origin semantics, and the question here is about the document, not the origin.

### Fixed

- **`sideEffects` omitted the source-resolved entry barrel.** The allowlist covered the built
  artifacts with a directory-wide glob, but the source-form barrel and the `react` wrapper entry
  were outside it. The published artifacts
  were unaffected — the shipped allowlist already covered them — but a consumer resolving this
  package from source (a workspace sibling) could have the barrel elided, dropping the element
  registrations it pulls in. The failure is silent: no error, and unregistered custom elements
  render nothing. The source-form entry points are now declared alongside the artifact ones.

## [0.10.4] - 2026-08-01

### Documentation

- 체인지로그에서 **발견 정황 서술과 내부 참조를 제거**했다. 결함이 무엇이고 어떤 조건에서
  재현되는지는 그대로다. 코드 변경은 없다 — 게시본 문서를 정리하기 위한 패치 릴리스다.

## [0.10.3] - 2026-07-24

### Fixed
- **root 안에 `<u-outlet>` 이 없을 때 초기화 실패가 삼켜지던 문제 수정** (React + Vite 소비 앱의 E2E 실측). `waitOutlet` 은 타임아웃 시 서술적 오류로 reject 하지만, `Router` 생성자가 `void waitOutlet(...).then(...)` 로 거부를 처리하지 않아 폴링 타임아웃(최대 10초) 뒤 unhandled rejection 으로만 새어 나갔다 — 소비자에겐 원인 없는 빈 화면이었다. 이제 `.catch()` 로 `console.error('Router initialization failed:', …)` 에 명시적으로 표면화한다.

### Documentation
- README에 "React + Vite" 섹션 추가 — 아웃렛의 `react-dom/client` 동적 import 가 Vite dev 사전번들(`optimizeDeps`)에서 깨지는 CJS interop 을 `optimizeDeps.exclude: ['@iyulab/router']` + `include: ['react-dom/client']` 로 해소하는 소비 설정 명시(초안 #2).
- Quick Start 에 root 의 `<u-outlet>` 요구 + 부재 시 로그 메시지 명시.

## [0.10.2] - 2026-07-15

### Changed
- Click interception now reuses the route match computed while deciding whether to intercept an anchor, instead of recomputing it inside `go()` — avoids a duplicate `getRoutes` call per intercepted click
- Bumped `@types/node`, `@types/react`, `happy-dom`, `vite`, `vite-plugin-dts`, `vitest` devDependencies

## [0.10.1] - 2026-07-02

### Documentation
- `RouteConfig.render` JSDoc: clarified that returning a React element directly lets `<u-outlet>` auto-manage `createRoot`/`root.unmount()` — wrapping it in a manually-created container `HTMLElement` bypasses this and leaks the React root on route change. Added a React `@example` alongside the existing Lit one.

## [0.10.0] - 2026-06-11

### Changed
- Click interception now checks route matching before `preventDefault()`: same-origin anchors that do not match any registered route are passed through to native browser navigation instead of rendering the fallback (soft-404). This fixes apps with `basepath: '/'` greedily intercepting every same-origin link — e.g. cross-app links on a shared host

### Added
- Vitest-based test infrastructure (`npm test`) with coverage for anchor click interception behavior

## [0.9.3] - 2026-04-24

### Fixed
- Document click handler now scopes interception to the router's `_rootElement` instead of `document`, preventing accidental capture of clicks outside the router's DOM subtree
- Click handler no longer intercepts same-origin anchors pointing outside `basepath` — when `basepath` is not `/`, links targeting paths outside the basepath are passed through to browser navigation instead of falling through to the fallback route

## [0.9.2] - 2026-04-13

### Fixed
- Nested route rendering now waits for child outlet readiness after parent render, preventing children from being rendered into the previous outlet when the next `<u-outlet>` is created inside a component shadow root
- `Router.go()` now awaits `UOutlet.render()` before resolving the next outlet in the matched route chain
- `waitOutlet()` now prefers component lifecycle-aware readiness checks (`customElements.whenDefined`, `updateComplete`, next animation frame) during outlet discovery

## [0.9.1] - 2026-04-08

### Fixed
- Redirect cycle detection no longer triggers false positives on initial navigation — `visit()` check is now skipped for the first `go()` call and only applied within redirect chains (`isRedirect: true`)

## [0.9.0] - 2026-04-08

### Added
- `NavigateOptions` — new optional second parameter for `go()` with `isRedirect`, `replace`, and `state` fields
- `replace` option — navigate without pushing a new browser history entry (`replaceState`)
- `state` option — attach custom state object to `history.pushState` / `replaceState`
- `AccessDeniedError` — new error class (HTTP 403) thrown when an `enter` guard returns `false`; renders an error page with `ACCESS_DENIED` code
- Redirect cycle detection — logs an error and halts routing if the same URL is visited more than once within a single navigation chain
- `UErrorPage` now accepts an optional `RouteError` in its constructor for direct instantiation

### Changed
- **Breaking:** `enter` returning `false` now throws `AccessDeniedError` and renders a 403 error page instead of silently aborting navigation
- Redirect navigations (`isRedirect: true`) use `replaceState` — intermediate redirect URLs are no longer pushed onto the browser history stack
- Global `enter` guard is skipped on redirect hops — runs only once per user-initiated navigation
- Route-level `enter` hooks are deduplicated within a redirect chain — each route's `enter` executes at most once per navigation cycle
- `document.title` is now updated in a `finally` block — title is set regardless of whether routing succeeds or fails

## [0.8.0] - 2026-04-08

### Added
- Added navigation guards via `enter` hooks at both router level (`RouterConfig.enter`) and route level (`RouteConfig.enter`) with redirect/cancel flow support
- Added `rel` attribute support to `<u-link>` for secure external navigation patterns (for example `noopener noreferrer`)

### Changed
- **Breaking:** Renamed route metadata fields from `meta` to `metadata` (`RouteConfig.metadata`, `RouteContext.metadata`)
- Updated nested outlet resolution to prefer child outlet discovery inside the current outlet, improving deep nested route rendering behavior

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
