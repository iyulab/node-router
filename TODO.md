## Lit 의존성 제거

- UOutlet에서 lit 정적 import 제거하고 TemplateResult 렌더링을 동적 로딩으로 전환
- UOutlet에서 lit 미설치 환경 대응 에러 메시지 및 graceful fallback 정리
- ULink를 LitElement 대신 HTMLElement 기반 수동 구현으로 전환
- ULink 속성/클릭 인터셉트 동작(href/target/rel, 보조키, 외부링크, 해시) 회귀 테스트 추가
- Router 기본 에러 처리에서 UErrorPage 의존 제거
- fallback 미지정 시 Router 내부 기본 HTML 에러 엘리먼트 렌더링 구현
- route-error 이벤트 기반 외부 에러 처리 가이드 문서화
- lit 의존성 정책 재정리(dependencies → optional peer dependencies) 및 README 업데이트
