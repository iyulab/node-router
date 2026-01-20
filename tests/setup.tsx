import { html } from 'lit';
import { Router } from '../src';
import './layout';
import './pages/HomePage';
import './pages/ErrorPage';
import './pages/ContextPage';
import './pages/NestedLitPage';
import { NestedReactPage } from './pages/NestedReactPage';

const root = document.querySelector('preview-layout') as HTMLElement;
const router = new Router({
  // 라우팅 결과를 렌더링될 루트 요소 지정
  root,

  // 기본 경로 설정
  basepath: '/',

  // 라우트 설정
  routes: [
    {
      path: '/',
      title: 'Home',
      render: async () => html`<home-page></home-page>`,
    },
    {
      path: '/context',
      title: 'Context Viewer',
      render: async (ctx) => {
        
        // 진행 상태 전달 예제 (window의 route-progress 이벤트와 연동)
        ctx.progress(10);
        await new Promise(res => setTimeout(res, 300));
        ctx.progress(30);
        await new Promise(res => setTimeout(res, 300));
        ctx.progress(50);
        await new Promise(res => setTimeout(res, 300));
        ctx.progress(100);

        // 컨텍스트 정보를 ContextPage 컴포넌트에 전달하여 렌더링
        return html`<context-page .ctx=${ctx}></context-page>`;
      }
    },
    {
      path: '/nested',
      render: async () => {
        const layout = document.createElement('div');
        layout.innerHTML = '<h2>Nested Layout</h2><u-outlet></u-outlet>';
        return layout;
      },
      children: [
        {
          index: true,
          title: 'Nested (Lit)',
          render: async () => html`<nested-lit-page></nested-lit-page>`,
        },
        {
          path: 'react',
          title: 'Nested (React)',
          render: () => {
            return (
              <NestedReactPage></NestedReactPage>
            )
          }
        }
      ],
    },
    {
      path: '/error',
      title: 'Error Test',
      render: async () => {
        throw new Error('This is a test error');
      }
    },
  ],

  // 오류 발생 시 표시할 페이지 설정
  fallback: {
    title: 'Error Occurred',
    render: async (ctx) => {
      return html`<error-page .error=${ctx.error}></error-page>`;
    },
  },
  
  // a 태그 기본 동작 차단 및 히스토리 API 사용 설정
  useIntercept: true,

  // 초기 로드 시 라우터 시작
  initialLoad: true,
});

// Expose router for debugging
(window as any).router = router;
console.log('Router app initialized');
