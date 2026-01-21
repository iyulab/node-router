import { getRandomID } from "./crypto-helpers";
import { absolutePath } from "./url-helpers";

import type { RouteConfig } from "../types/RouteConfig";

/**
 * 라우트들을 다음 사항에 따라 재귀적으로 재설정합니다.
 * - 각 라우트에 고유 `id`를 랜덤하게 부여합니다.
 * - `path`를 URLPattern 객체로 변환합니다.
 * - 자식 라우트가 있으면 재귀적으로 재설정합니다.
 * 
 * @param routes 설정할 라우트 배열
 * @param basepath 기준이 되는 basepath 문자열
 * @returns 재설정된 라우트 배열
 */
export function setRoutes(routes: RouteConfig[], basepath: string): RouteConfig[] {
  for (const route of routes) {
    route.id ||= getRandomID();
    route.ignoreCase ||= false;
    
    if (route.index === true) {
      // 인덱스 라우트는 현재 basepath를 URLPattern으로 설정
      route.path = new URLPattern({ pathname: `${basepath}{/}?` }, {
        ignoreCase: route.ignoreCase,
      });
      route.force ||= true;
    } else {
      if (typeof route.path === 'string') {
        // 경로 라우트 처리 - string이면 URLPattern으로 변환
        const absolutePathStr = absolutePath(basepath, route.path);
        route.path = new URLPattern({ pathname: `${absolutePathStr}{/}?` }, {
          ignoreCase: route.ignoreCase,
        });
      } else if (route.path instanceof URLPattern) {
        // 이미 URLPattern인 경우, 아무것도 하지 않음
      } else {
        // 경로가 설정되지 않은 경우 현재 basepath를 사용
        route.path = new URLPattern({ pathname: `${basepath}{/}?` }, {
          ignoreCase: route.ignoreCase,
        });
      }

      // 자식 라우트가 있는 경우 재귀적으로 처리
      if (route.children && route.children.length > 0) {
        // URLPattern에서 자식 route에 맞는 basepath 추출
        const childBasepath = route.path.pathname.replace('{/}?', '');
        route.children = setRoutes(route.children, childBasepath);

        // 자식 라우트가 있으면 강제 렌더링 false
        route.force ||= false;
      } else {
        // 자식 라우트가 없으면 강제 렌더링 true
        route.force ||= true;
      }
    }
  }

  return routes;
}

/** 
 * URLPattern을 사용하여 경로와 일치하는 라우트들을 자식 라우트까지 포함하여 반환합니다.
 * 반환된 배열은 상위 라우트부터 하위 라우트 순서로 정렬됩니다.
 * 
 * @param routes 검사할 라우트 배열 
 * @param pathname 검사할 경로 이름
 * @returns 일치하는 라우트 배열
 */
export function getRoutes(routes: RouteConfig[], pathname: string): RouteConfig[] {
  for (const route of routes) {
    if (route.index !== true && route.children && route.children.length > 0) {
      const childRoutes = getRoutes(route.children, pathname);
      if (childRoutes.length > 0) {
        return [route, ...childRoutes];
      }
    }
    
    // 라우트 매칭 확인
    if (route.path instanceof URLPattern) {
      const isMatch = route.path.test({ pathname: pathname });
      if (isMatch) return [route];
    } else {
      throw new Error('Route path must be an instance of URLPattern, Something wrong in setRoutes function.');
    }
  }
  return [];
}