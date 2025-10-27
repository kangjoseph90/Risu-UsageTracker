# Svelte + TypeScript + Tailwind CSS Plugin Builder

TypeScript, Svelte, Tailwind CSS를 사용하여 **단일 JS 파일**로 빌드되는 플러그인 빌더입니다.

## 특징

- ✅ **TypeScript로 개발** - 타입 안전성
- ✅ **Svelte로 UI 작성** - 이벤트 리스너 자동 관리
- ✅ **Tailwind CSS** - 유틸리티 클래스로 빠른 스타일링
- ✅ **단일 JS 파일** - `dist/my-plugin.js` (CSS 포함, UMD 포맷)
- ✅ **eval() 실행 가능** - 프론트엔드 앱에서 동적 로드

## 빌드

```bash
npm install
npm run build
```

빌드 결과물: `dist/my-plugin.js` (모든 CSS 포함)

## 사용

```javascript
// 플러그인 파일을 로드하여 eval
fetch('/path/to/my-plugin.js')
  .then(res => res.text())
  .then(code => eval(code));
```

## 프로젝트 구조

```
src/
├── main.ts          # 플러그인 진입점
├── MyPopup.svelte   # UI 컴포넌트
└── style.css        # Tailwind CSS
```

## 개발

`src/main.ts` - 플러그인 로직 작성  
`src/MyPopup.svelte` - Svelte 컴포넌트로 UI 작성  
`src/style.css` - Tailwind CSS 임포트

## 기술 스택

- **TypeScript** - 개발 언어
- **Svelte** - UI 프레임워크
- **Tailwind CSS** - 스타일링
- **Vite** - 빌드 도구
- **vite-plugin-css-injected-by-js** - CSS를 JS에 인라인
