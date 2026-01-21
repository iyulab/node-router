import { defineConfig } from 'vite';
import { resolve } from 'path';
import dts from 'vite-plugin-dts';
import { readFileSync, appendFileSync } from 'fs';

export default defineConfig({
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    minify: false,
    lib: {
      entry: [
        resolve(__dirname, 'src/index.ts'), // 메인 엔트리 포인트
        resolve(__dirname, 'src/react.ts'), // React 래퍼 엔트리 포인트
      ],
      formats: ['es'],
      fileName: (format, entry) => {
        return format === 'es' ? `${entry}.js` : `${entry}.${format}.js`;
      }
    },
    rollupOptions: {
      external: [
        /^@lit.*/,
        /^lit.*/,
        /^react.*/,
      ],
      output: {
        // 공유 청크 파일 이름 설정
        chunkFileNames: 'share-[hash].js',
      }
    },
  },
  plugins: [
    dts({
      include: ['src/**/*'],
      rollupTypes: true,

      // src/global.d.ts 내용을 dist/index.d.ts에 추가
      afterBuild: () => {
        const source = resolve(__dirname, 'src/global.d.ts');
        const target = resolve(__dirname, 'dist/index.d.ts');
        
        const content = readFileSync(source, 'utf-8');
        const blocks = extractBlock(content);
        
        if (blocks) {
          appendFileSync(target, '\n' + blocks, 'utf-8');
          console.log('✓ Global declarations added successfully');
        } else {
          console.error('⚠️ No global declarations found to add.');
        }
      }
    })
  ]
});

/** 파일에서 declare global 블록만 추출하는 유틸 함수 */
function extractBlock(content: string): string | null {
  const keyword = "declare global";
  const startKw = content.indexOf(keyword);
  if (startKw === -1) return null;

  // keyword 이후 첫 번째 '{' 찾기
  const startBrace = content.indexOf("{", startKw);
  if (startBrace === -1) return null;

  let i = startBrace;
  let depth = 0;

  // 상태 머신: 문자열/주석 처리
  let inSingle = false;
  let inDouble = false;
  let inTemplate = false;
  let inLineComment = false;
  let inBlockComment = false;
  let escaped = false;

  for (; i < content.length; i++) {
    const ch = content[i];
    const next = content[i + 1];

    // 라인 주석
    if (!inSingle && !inDouble && !inTemplate && !inBlockComment) {
      if (!inLineComment && ch === "/" && next === "/") {
        inLineComment = true;
        i++; // next 소비
        continue;
      }
      if (inLineComment && ch === "\n") {
        inLineComment = false;
        continue;
      }
    }

    // 블록 주석
    if (!inSingle && !inDouble && !inTemplate && !inLineComment) {
      if (!inBlockComment && ch === "/" && next === "*") {
        inBlockComment = true;
        i++;
        continue;
      }
      if (inBlockComment && ch === "*" && next === "/") {
        inBlockComment = false;
        i++;
        continue;
      }
    }

    if (inLineComment || inBlockComment) continue;

    // 문자열 처리
    if (escaped) {
      escaped = false;
      continue;
    }
    if (ch === "\\") {
      // 문자열/템플릿 안에서만 escape 의미
      if (inSingle || inDouble || inTemplate) escaped = true;
      continue;
    }

    if (!inDouble && !inTemplate && ch === "'" ) { inSingle = !inSingle; continue; }
    if (!inSingle && !inTemplate && ch === '"' ) { inDouble = !inDouble; continue; }
    if (!inSingle && !inDouble && ch === "`" ) { inTemplate = !inTemplate; continue; }

    if (inSingle || inDouble || inTemplate) continue;

    // 중괄호 depth 계산
    if (ch === "{") depth++;
    else if (ch === "}") {
      depth--;
      if (depth === 0) {
        // startKw부터 현재 '}'까지 포함
        return content.slice(startKw, i + 1).trim();
      }
    }
  }

  return null;
}