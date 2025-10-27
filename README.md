# RisuAI UsageTracker Plugin

API 사용량과 비용을 추적하고 관리하는 RisuAI 플러그인입니다.

## 기능

- **API 사용량 추적** - 요청/응답 토큰 수 기록
- **실시간 비용 계산** - 다양한 API의 가격 정보 적용
- **데이터 저장** - 사용 기록을 로컬에 저장
- **다중 API 지원** - OpenAI, Anthropic, Google 등
- **TailwindCSS 통합** - 빌드 시 CSS가 자동으로 plugin.js에 주입됨

## 설치

`dist/plugin.js` 파일을 RisuAI 플러그인으로 로드합니다.

## 개발

### 설정

```bash
npm install
```

### 빌드

```bash
npm run build
```

빌드 과정:
1. TailwindCSS가 `src/styles.css`를 처리하여 사용된 클래스만 포함한 CSS 생성
2. TypeScript 소스 파일에서 HTML 문자열의 클래스를 자동 감지
3. 생성된 CSS를 JavaScript 코드로 변환하여 `plugin.js`에 주입
4. 플러그인 실행 시 CSS가 자동으로 `<style>` 태그로 DOM에 삽입됨

### 개발 모드 (자동 재빌드)

```bash
npm run dev
```

파일 변경 시 자동으로 CSS와 JavaScript를 재빌드합니다.

## 플러그인 구성

| 폴더 | 설명 |
|------|------|
| `src/tracker/` | 사용량/비용 추적 로직 |
| `src/format/` | API 형식 변환 (OpenAI, Anthropic, Google) |
| `src/manager/` | 데이터 관리 (사용량, 가격) |
| `src/ui/` | 사용자 인터페이스 |
| `src/styles.css` | TailwindCSS 스타일 정의 |

## 기술 스택

- **TypeScript** - 타입 안전한 코드 작성
- **esbuild** - 빠른 번들링
- **TailwindCSS v4** - 유틸리티 기반 스타일링
- **PostCSS** - CSS 처리 및 최적화

## 라이선스

MIT
