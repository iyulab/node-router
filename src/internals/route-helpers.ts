import { getRandomID } from "./crypto-helpers";
import { absolutePath } from "./url-helpers";

import type { RouteConfig } from "../types/RouteConfig";

/**
 * 라우트들을 설정된 basepath에 맞게 재귀적으로 처리합니다.
 * 각 라우트에 고유 ID를 부여하고, 경로를 절대 경로에 URLPattern으로 변환합니다.
 * 자식 라우트가 있으면 재귀적으로 처리합니다.
 */
export function setRoutes(routes: RouteConfig[], basepath: string) {
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
        route.force ||= false;
      } else {
        route.force ||= true;
      }
    }
  }
  return routes;
}

/** 
 * URLPattern을 사용하여 경로와 일치하는 라우트들을 자식 라우트까지 포함하여 반환합니다. 
 */
export function getRoutes(pathname: string, routes: RouteConfig[]): RouteConfig[] {
  for (const route of routes) {
    if (route.index !== true && route.children && route.children.length > 0) {
      const childRoutes = getRoutes(pathname, route.children);
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