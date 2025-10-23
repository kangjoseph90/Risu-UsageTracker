# Usage Plugin 개발 환경 설정

이 파일은 LBI 플러그인과 동일한 TypeScript 개발 환경으로 설정되었습니다.

## 설정된 파일

- ✅ `package.json` - 프로젝트 의존성 및 빌드 스크립트
- ✅ `tsconfig.json` - TypeScript 컴파일러 설정
- ✅ `build.js` - esbuild 기반 빌드 스크립트
- ✅ `src/` - TypeScript 소스 코드 디렉토리
- ✅ `src/index.ts` - 메인 진입점
- ✅ `src/plugin-header.txt` - 플러그인 헤더
- ✅ `README.md` - 개발 가이드

## 다음 단계

1. **의존성 설치**
   ```bash
   cd usage
   npm install
   ```

2. **개발 모드 시작**
   ```bash
   npm run dev
   ```

3. **`src/index.ts`에서 플러그인 코드 작성**

4. **빌드 완료 후 `dist/plugin.js` 사용**

## LBI와의 주요 차이점

- 플러그인 이름: `usage-plugin`
- Global name: `__USAGE_PLUGIN__`
- 의존성: uuid 포함 (필요에 따라 추가 가능)

모든 설정이 LBI 플러그인과 동일하게 구성되었습니다.
