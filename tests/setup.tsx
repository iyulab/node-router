import { html } from 'lit';
import { Router } from '../src';
import './layout';
import './pages/HomePage';
import './pages/LoginPage';
import './pages/ForbiddenPage';
import './pages/ParamsPage';
import './pages/AsyncPage';
import './pages/AdminPage';
import './pages/NestedLayout';
import './pages/NestedIndexPage';
import './pages/NestedLitPage';
import './pages/DeepLayout';
import './pages/DeepIndexPage';
import './pages/DeepPage';
import './pages/ErrorPage';
import { NestedReactPage } from './pages/NestedReactPage';
import { auth } from './auth';

const sleep = (ms: number) => new Promise<void>(res => setTimeout(res, ms));

const router = new Router({
  root: document.querySelector('preview-layout') as HTMLElement,
  basepath: '/',

  // ─── 글로벌 enter: 인증 체크 ────────────────────────────
  // 공개 경로가 아니면 /login으로 redirect
  enter: (ctx) => {
    const publicPaths = ['/', '/login', '/forbidden'];
    if (publicPaths.includes(ctx.pathname)) return true;
    if (!auth.isAuthenticated) return '/login';
    return true;
  },

  routes: [
    // ─── 공개 라우트 ──────────────────────────────────────
    {
      index: true,
      title: 'Home',
      render: () => html`<home-page></home-page>`,
    },
    {
      path: '/login',
      title: 'Login',
      render: () => html`<login-page></login-page>`,
    },
    {
      path: '/forbidden',
      title: 'Access Denied',
      render: () => html`<forbidden-page></forbidden-page>`,
    },

    // ─── 인증 필요 라우트 ────────────────────────────────
    // path: ':id?' → optional param (/params or /params/hello)
    {
      path: '/params/:id?',
      title: 'Params Viewer',
      metadata: { requiresAuth: true, section: 'tools' },
      render: (ctx) => html`<params-page .context=${ctx}></params-page>`,
    },

    // progress 콜백 시연: 여러 단계의 비동기 작업
    {
      path: '/async',
      title: 'Async Loading',
      metadata: { requiresAuth: true, section: 'tools' },
      render: async (ctx) => {
        ctx.progress(10);
        await sleep(400);
        ctx.progress(35);
        await sleep(400);
        ctx.progress(65);
        await sleep(300);
        ctx.progress(90);
        await sleep(200);
        ctx.progress(100);
        return html`<async-page></async-page>`;
      },
    },

    // ─── 라우트별 enter: 역할 기반 접근 제어 ─────────────
    // global enter 통과 후 per-route enter 추가 실행
    {
      path: '/admin',
      title: 'Admin Panel',
      metadata: { requiresAuth: true, role: 'admin', section: 'admin' },
      enter: () => auth.role === 'admin' || '/forbidden',
      render: () => html`<admin-page></admin-page>`,
    },

    // ─── 중첩 라우트 (2-level) ────────────────────────────
    // 부모: <nested-layout> 렌더링 → 내부 <u-outlet> 에 자식 렌더링
    {
      path: '/nested',
      title: 'Nested',
      metadata: { requiresAuth: true, section: 'nested' },
      render: () => html`<nested-layout></nested-layout>`,
      children: [
        {
          index: true,
          title: 'Nested – Overview',
          render: () => html`<nested-index-page></nested-index-page>`,
        },
        {
          path: 'lit',
          title: 'Nested – Lit',
          render: () => html`<nested-lit-page></nested-lit-page>`,
        },
        {
          path: 'react',
          title: 'Nested – React',
          render: () => (
            <NestedReactPage />
          ),
        },

        // ─── 3-level 중첩 라우트 ───────────────────────
        // /nested/deep → <deep-layout> → 내부 <u-outlet>
        // /nested/deep/:id → deep-layout 유지, item만 교체
        {
          path: 'deep',
          title: 'Deep Nested',
          metadata: { requiresAuth: true, section: 'nested', depth: 3 },
          render: () => html`<deep-layout></deep-layout>`,
          children: [
            {
              index: true,
              title: 'Deep – Overview',
              render: () => html`<deep-index-page></deep-index-page>`,
            },
            {
              path: ':id',
              title: 'Deep – Item',
              render: (ctx) => html`
                <deep-page .itemId=${ctx.params['id']}></deep-page>
              `,
            },
          ],
        },
      ],
    },

    // ─── 에러 핸들링: render 중 throw ──────────────────
    {
      path: '/error',
      title: 'Error Test',
      render: () => {
        throw new Error('Intentional render error for testing');
      },
    },
  ],

  // ─── fallback: 404 / 에러 표시 ──────────────────────
  fallback: {
    title: 'Error',
    render: (ctx) => html`<error-page .error=${ctx.error}></error-page>`,
  },
});

(window as any).router = router;
console.log('Router app initialized');