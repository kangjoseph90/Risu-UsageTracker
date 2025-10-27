const esbuild = require('esbuild');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// consts.ts와 args.ts에서 정보 추출
function extractPluginInfo() {
  try {
    // consts.ts 읽기
    const constsPath = path.join(__dirname, 'src', 'consts.ts');
    const constsContent = fs.readFileSync(constsPath, 'utf-8');
    
    // PLUGIN_TITLE과 PLUGIN_VERSION 추출
    const titleMatch = constsContent.match(/const\s+PLUGIN_TITLE\s*=\s*'([^']+)'/);
    const versionMatch = constsContent.match(/const\s+PLUGIN_VERSION\s*=\s*'([^']+)'/);
    const title = titleMatch ? titleMatch[1] : 'Usage Plugin';
    const version = versionMatch ? versionMatch[1] : 'v0.0.1';
    
    // PLUGIN_NAME 동적 생성
    const pluginName = `${title}-${version}`;
    
    // consts.ts에서 상수값들 추출 (DB_ARG, PRICE_ARG, PRICE_TEMP_ARG 등)
    const constValues = {};
    const constMatches = constsContent.matchAll(/const\s+(\w+)\s*=\s*'([^']+)'/g);
    for (const match of constMatches) {
      constValues[match[1]] = match[2];
    }
    
    // args.ts 읽기
    const argsPath = path.join(__dirname, 'src', 'consts', 'args.ts');
    const argsContent = fs.readFileSync(argsPath, 'utf-8');
    
    // RISU_ARGS 객체에서 인자 추출
    const argsMatch = argsContent.match(/export\s+const\s+RISU_ARGS:\s*RisuArg\s*=\s*{([^}]+)}/s);
    const args = [];
    
    if (argsMatch) {
      const argsBody = argsMatch[1];
      // [변수명]: RisuArgType.타입 형태 찾기
      const argMatches = argsBody.match(/\[(\w+)\]:\s*RisuArgType\.(\w+)/g);
      if (argMatches) {
        argMatches.forEach(arg => {
          const match = arg.match(/\[(\w+)\]:\s*RisuArgType\.(\w+)/);
          if (match) {
            const argVarName = match[1];
            const argTypeRisu = match[2];
            
            // 변수명에서 실제 값 가져오기
            const argRealName = constValues[argVarName] || argVarName;
            
            // RisuArgType을 실제 타입으로 변환
            let argType = 'string'; // 기본값
            if (argTypeRisu === 'Int') {
              argType = 'int';
            } else if (argTypeRisu === 'String') {
              argType = 'string';
            } 
            
            args.push({ name: argRealName, type: argType });
          }
        });
      }
    }
    
    return { pluginName, title, version, args };
  } catch (error) {
    console.error('Error extracting plugin info:', error.message);
    return {
      pluginName: '',
      title: '',
      version: '',
      args: []
    };
  }
}

// 플러그인 헤더 생성
function getPluginHeader() {
  const info = extractPluginInfo();
  let header = `//@name ${info.pluginName}\n`;
  header += `//@display-name ${info.title}\n`;
  
  // RISU_ARGS에서 추출한 인자들 추가
  info.args.forEach(arg => {
    header += `//@arg ${arg.name} ${arg.type}\n`;
  });
  
  return header;
}

// CSS 빌드 함수
async function buildCSS() {
  try {
    console.log('Building CSS with Tailwind...');
    const postcss = require('postcss');
    const tailwindcss = require('@tailwindcss/postcss');
    const autoprefixer = require('autoprefixer');
    
    const cssInput = fs.readFileSync(path.join(__dirname, 'src', 'styles.css'), 'utf-8');
    
    const result = await postcss([
      tailwindcss,
      autoprefixer,
    ]).process(cssInput, {
      from: path.join(__dirname, 'src', 'styles.css'),
      to: path.join(__dirname, 'dist', 'styles.css'),
    });
    
    // Ensure dist directory exists
    if (!fs.existsSync(path.join(__dirname, 'dist'))) {
      fs.mkdirSync(path.join(__dirname, 'dist'), { recursive: true });
    }
    
    fs.writeFileSync(path.join(__dirname, 'dist', 'styles.css'), result.css, 'utf-8');
    console.log('✓ CSS built successfully');
  } catch (error) {
    console.error('CSS build failed:', error.message);
    throw error;
  }
}

// esbuild 플러그인: CSS 주입 및 헤더 추가
const injectCSSAndHeaderPlugin = {
  name: 'inject-css-and-header',
  setup(build) {
    build.onEnd((result) => {
      const outputFile = path.join(__dirname, 'dist', 'plugin.js');
      const cssFile = path.join(__dirname, 'dist', 'styles.css');
      
      if (fs.existsSync(outputFile)) {
        let content = fs.readFileSync(outputFile, 'utf-8');
        
        // CSS 주입
        if (fs.existsSync(cssFile)) {
          const cssContent = fs.readFileSync(cssFile, 'utf-8');
          // CSS를 JavaScript 문자열로 변환하여 주입
          const cssInjectionCode = `
(function() {
  if (typeof document !== 'undefined') {
    const style = document.createElement('style');
    style.textContent = ${JSON.stringify(cssContent)};
    document.head.appendChild(style);
  }
})();
`;
          content = cssInjectionCode + '\n' + content;
          console.log('✓ CSS injected into plugin.js');
        }
        
        // 헤더 추가
        const header = getPluginHeader();
        const newContent = header + '\n' + content;
        fs.writeFileSync(outputFile, newContent, 'utf-8');
        console.log('✓ Header added to plugin.js');
      }
    });
  },
};

// watch 모드 확인
const isWatch = process.argv.includes('--watch');

// esbuild 설정
const buildOptions = {
  entryPoints: ['src/index.ts'],
  bundle: true,
  outfile: 'dist/plugin.js',
  platform: 'browser',
  target: 'es2020',
  format: 'iife',
  globalName: '__USAGE_PLUGIN__',
  plugins: [injectCSSAndHeaderPlugin],
  sourcemap: false,
  minify: false,
  keepNames: true,
};

async function build() {
  try {
    // CSS 먼저 빌드
    await buildCSS();
    
    if (isWatch) {
      const ctx = await esbuild.context(buildOptions);
      await ctx.watch();
      console.log('👀 Watching for changes...');
      
      // Watch 모드에서 CSS 파일 변경 감지
      const chokidar = require('chokidar');
      const watcher = chokidar.watch(['src/**/*.ts', 'src/**/*.css'], {
        persistent: true,
        ignoreInitial: true
      });
      
      watcher.on('change', async (filepath) => {
        if (filepath.endsWith('.css') || filepath.endsWith('.ts')) {
          console.log(`File changed: ${filepath}, rebuilding CSS...`);
          try {
            await buildCSS();
          } catch (error) {
            console.error('CSS rebuild failed:', error.message);
          }
        }
      });
    } else {
      await esbuild.build(buildOptions);
      console.log('✓ Build completed successfully!');
    }
  } catch (error) {
    console.error('Build failed:', error);
    process.exit(1);
  }
}

build();
