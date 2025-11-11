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
    
    if ('index' in route && route.index) {
      // 인덱스 라우트는 현재 basepath를 URLPattern으로 설정
      route.path = new URLPattern({ pathname: `${basepath}{/}?` });
    } else if ('path' in route && route.path) {
      // 경로 라우트 처리 - string이면 URLPattern으로 변환
      if (typeof route.path === 'string') {
        const absolutePathStr = absolutePath(basepath, route.path);
        route.path = new URLPattern({ pathname: `${absolutePathStr}{/}?` });
      }
    } else {
      throw new Error('Route must have either "index" or "path" property defined.');
    }

    if (route.children && route.children.length > 0) {
      let childBasepath: string;
      if ('index' in route) {
        // 인덱스 라우트는 현재 basepath를 그대로 사용
        childBasepath = basepath;
      } else {
        // 경로 라우트는 해당 경로를 자식의 basepath로 사용
        if (typeof route.path === 'string') {
          childBasepath = absolutePath(basepath, route.path);
        } else {
          // URLPattern에서 pathname 추출
          childBasepath = route.path.pathname.replace('{/}?', '');
        }
      }
      route.children = setRoutes(route.children, childBasepath);
      route.force ||= false;
    } else {
      route.force ||= true;
    }
  }
  return routes;
}

/** 
 * URLPattern을 사용하여 경로와 일치하는 라우트들을 자식 라우트까지 포함하여 반환합니다. 
 */
export function getRoutes(pathname: string, routes: RouteConfig[]): RouteConfig[] {
  for (const route of routes) {
    if (route.children) {
      const childRoutes = getRoutes(pathname, route.children);
      if (childRoutes.length > 0) {
        return [route, ...childRoutes];
      }
    }
    
    // 라우트 매칭 확인
    let matches = false;
    if ('index' in route && route.index && route.path) {
      // 인덱스 라우트는 설정된 path URLPattern으로 테스트
      matches = route.path.test({ pathname: pathname });
    } else if ('path' in route && route.path instanceof URLPattern) {
      matches = route.path.test({ pathname: pathname });
    }
    
    if (matches) {
      return [route];
    }
  }
  return [];
}