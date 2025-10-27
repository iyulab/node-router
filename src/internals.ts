import type { RouteInfo } from "./types";

/**
 * pathname 경로를 조합하여 절대경로를 반환합니다.
 */
export function absolutePath(...paths: string[]) {
  paths = paths.map(p => p.replace(/^\/|\/$/g, '')).filter(p => p.length > 0);
  if (paths.length === 0) return '/';

  return '/' + paths.join('/');
}

/**
 * URL 문자열을 파싱하여 새로운 URL 정보를 반환합니다.
 * - ?로 시작하는 쿼리스트링, #으로 시작하는 해시값은 현재 경로에서 추가됩니다.
 * - 상대경로는 basepath를 기준으로 절대경로로 변환됩니다.
 */
export function parseURL(url: string, basepath: string): RouteInfo {
  let urlObj: URL;
  basepath = catchBasepath(basepath);
  if (url.startsWith('http')) {
    urlObj = new URL(url);
  } else if (url.startsWith('/')) {
    urlObj = new URL(url, window.location.origin);
  } else if (url.startsWith('?')) {
    urlObj = new URL(window.location.pathname + url, window.location.origin);
  } else if (url.startsWith('#')) {
    urlObj = new URL(window.location.pathname + window.location.search + url, window.location.origin);
  } else {
    urlObj = new URL(absolutePath(basepath, url), window.location.origin);
  }
  
  return {
    href: urlObj.href,
    origin: urlObj.origin,
    basepath: basepath,
    path: urlObj.href.replace(urlObj.origin, ''),
    pathname: urlObj.pathname,
    query: new URLSearchParams(urlObj.search),
    hash: urlObj.hash,
    params: {},
  };
}

/**
 * 현재 경로상의 basepath를 반환합니다.
 * @example
 * catchBasePath('/app/:id') => '/app/123'
 */
export function catchBasepath(basepath: string) {
  if (basepath === '/') return basepath;

  // basepath가 경로의 중간에 올수도 있으므로 /* 패턴으로 먼저 검사
  let pattern = new URLPattern({ pathname: basepath + '/*' });
  let match = pattern.exec({ pathname: window.location.pathname });
  if (match) {
    const rawPath = match.pathname.input;
    const restPath = match.pathname.groups?.["0"];
    return restPath ? rawPath.replace("/" + restPath, '') : rawPath.slice(0, -1);
  }

  // basepath가 경로의 끝에 올수도 있으므로 /? 패턴으로도 검사
  pattern = new URLPattern({ pathname: `${basepath}{/}?` });
  match = pattern.exec({ pathname: window.location.pathname });
  if (match) {
    return match.pathname.input;
  }

  // 일치하는 basepath가 없으면 기본 basepath 반환
  return basepath;
}

/**
 * 랜덤한 ID를 생성합니다.
 * - https일 경우 crypto.randomUUID()를 사용합니다.
 * - 그 외의 경우 crypto.getRandomValues()를 사용합니다.
 */
export function getRandomID() {
  return window.isSecureContext
        ? window.crypto.randomUUID()
        : window.crypto.getRandomValues(new Uint32Array(1))[0].toString(16);
}