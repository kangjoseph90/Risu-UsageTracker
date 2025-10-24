# RisuAI UsageTracker Plugin

API 사용량과 비용을 추적하고 관리하는 RisuAI 플러그인입니다.

## 기능

- **API 사용량 추적** - 요청/응답 토큰 수 기록
- **실시간 비용 계산** - 다양한 API의 가격 정보 적용
- **데이터 저장** - 사용 기록을 로컬에 저장
- **다중 API 지원** - OpenAI, Anthropic, Google 등

## 설치

1. `dist/plugin.js` 파일을 RisuAI 플러그인 폴더에 복사합니다.
2. RisuAI에서 플러그인을 로드합니다.

## 개발

### 설정

```bash
npm install
```

### 빌드

```bash
npm run build
```

### 개발 모드 (자동 재빌드)

```bash
npm run dev
```

## 플러그인 구성

| 폴더 | 설명 |
|------|------|
| `src/tracker/` | 사용량/비용 추적 로직 |
| `src/format/` | API 형식 변환 (OpenAI, Anthropic, Google) |
| `src/manager/` | 데이터 관리 (사용량, 가격) |
| `src/ui/` | 사용자 인터페이스 |

## 라이선스

MIT
