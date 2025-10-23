const esbuild = require('esbuild');
const fs = require('fs');
const path = require('path');

// 플러그인 헤더 (src/plugin-header.txt 파일에서 읽어옴)
function getPluginHeader() {
  const headerPath = path.join(__dirname, 'src', 'plugin-header.txt');
  if (fs.existsSync(headerPath)) {
    return fs.readFileSync(headerPath, 'utf-8');
  }
  
  // 기본 헤더
  return `//@name usage-Plugin
//@display-name Usage Plugin (TypeScript)
//@arg example_setting string
`;
}

// esbuild 플러그인: 헤더 추가
const addHeaderPlugin = {
  name: 'add-header',
  setup(build) {
    build.onEnd((result) => {
      const outputFile = path.join(__dirname, 'dist', 'plugin.js');
      
      if (fs.existsSync(outputFile)) {
        const content = fs.readFileSync(outputFile, 'utf-8');
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
  plugins: [addHeaderPlugin],
  sourcemap: false,
  minify: false,
  keepNames: true,
};

async function build() {
  try {
    if (isWatch) {
      const ctx = await esbuild.context(buildOptions);
      await ctx.watch();
      console.log('👀 Watching for changes...');
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
