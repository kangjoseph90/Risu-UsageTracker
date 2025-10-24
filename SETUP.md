# UsageTracker Plugin 개발 설정

TypeScript 기반 RisuAI 플러그인 개발 환경입니다.

## 초기 설정

### 의존성 설치

```bash
npm install
```

### 빌드

프로덕션 빌드:

```bash
npm run build
```

개발 모드 (자동 재빌드):

```bash
npm run dev
```

## 구조

- `src/` - TypeScript 소스 코드
- `dist/plugin.js` - 빌드 결과물 (RisuAI에 복사)
- `build.js` - esbuild 기반 빌드 스크립트

## 플러그인 헤더

`consts.ts`의 `PLUGIN_NAME`과 `args.ts`의 `RISU_ARGS`에서 자동으로 헤더를 생성합니다.

- `//@name` - PLUGIN_TITLE + PLUGIN_VERSION
- `//@display-name` - PLUGIN_TITLE
- `//@arg` - RISU_ARGS의 인자들

## 사용

1. 빌드: `npm run build`
2. `dist/plugin.js`를 RisuAI 플러그인 폴더에 복사
3. RisuAI에서 플러그인 로드
