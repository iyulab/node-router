import type { RouteContext } from "../types/RouteContext";

/**
 * 주어진 URL이 외부 링크인지 확인합니다.
 * 
 * @param url 확인할 URL 문자열
 * @return 외부 링크인 경우 true, 내부 링크인 경우 false
 */
export function isExternalUrl(url: string): boolean {
  if (!url) return false;
  url = url.trim();

  // 스킴 기반 즉시 외부 처리
  if (/^(?:mailto:|tel:|javascript:)/i.test(url)) return true;
  // 프로토콜 상대 URL
  if (url.startsWith('//')) return true;

  // 파싱 시도
  try {
    const base = typeof window !== 'undefined' ? window.location.origin : 'http://localhost';
    const parsed = new URL(url, base);

    // 네트워크 이동이 발생하는 것만 외부
    if (/^(?:ftp:|ftps:|ws:|wss:)/i.test(parsed.protocol)) return true;

    // origin 비교 — 같으면 내부(false), 다르면 외부(true)
    return parsed.origin !== new URL(base).origin;
  } catch {
    // 파싱 실패(상대경로 등) -> 내부 링크로 간주
    return false;
  }
}

/**
 * URL 문자열을 파싱하여 RouteContext 객체로 반환합니다.
 * - http(s)로 시작하는 절대 URL은 외부 링크로 간주됩니다.
 * - 절대경로(/...)는 그대로 사용됩니다.
 * - 상대경로는 basepath를 기준으로 절대경로로 변환됩니다. 
 * - 쿼리스트링(?)로 시작하는 쿼리는 현재 경로와 추가됩니다.
 * - 해시(#)로 시작하는 해시는 현재 경로와 추가됩니다.
 * 
 * @param url 파싱할 URL 문자열
 * @param basepath 기준이 되는 basepath 문자열
 * @returns 파싱된 RouteContext 객체
 */
export function parseUrl(url: string, basepath: string): RouteContext {
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
    progress: () => {}
  };
}

/**
 * pathname 경로를 조합하여 절대경로를 반환합니다.
 * 
 * @param paths 조합할 경로 문자열들
 * @returns 조합된 절대경로 문자열
 */
export function absolutePath(...paths: string[]): string {
  paths = paths.map(p => p.replace(/^\/|\/$/g, '')).filter(p => p.length > 0);
  if (paths.length === 0) return '/';

  return '/' + paths.join('/');
}

/**
 * basepath가 동적 패턴일 경우(RouteConfig에서 basepath가 :id 등으로 정의된 경우),
 * 현재 경로에서 해당되는 패턴의 basepath를 추출하여 반환합니다.
 * 
 * @param basepath 동적 패턴이 포함된 basepath 문자열
 * @return 현재 경로에 매칭되는 basepath 문자열
 * @example
 * catchBasePath('/app/:id') => '/app/123'
 */
export function catchBasepath(basepath: string): string {
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