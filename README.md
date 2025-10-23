# Usage Plugin

TypeScript로 개발된 Usage 플러그인입니다.

## 프로젝트 구조

```
usage/
├── src/
│   ├── index.ts              # 메인 진입점
│   ├── plugin-header.txt     # 플러그인 헤더
│   └── types/                # TypeScript 타입 정의
├── dist/                      # 빌드 결과물
├── package.json              # 프로젝트 의존성
├── tsconfig.json            # TypeScript 설정
├── build.js                 # 빌드 스크립트
└── README.md                # 이 파일
```

## 개발 시작

### 1. 의존성 설치
```bash
npm install
```

### 2. 개발 모드 실행 (파일 변경 감시)
```bash
npm run dev
```

또는

```bash
npm run watch
```

### 3. 프로덕션 빌드
```bash
npm run build
```

## 빌드 결과

빌드 완료 후 `dist/plugin.js` 파일이 생성되며, 이 파일이 Risu 플러그인으로 사용됩니다.

## TypeScript 설정

- **Target**: ES2020
- **Module**: CommonJS
- **Output Format**: IIFE (즉시 실행 함수 표현식)
- **Bundle**: esbuild를 통한 번들링

## 주요 특징

- ✅ TypeScript 지원
- ✅ 자동 빌드 (watch 모드)
- ✅ Source maps 생성
- ✅ 플러그인 헤더 자동 추가
- ✅ Strict 모드 활성화
