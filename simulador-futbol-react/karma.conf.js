// karma.conf.js (ESM, funciona bien con Vite y Node 20/22)
// karma.conf.js
// karma.conf.js
export default function (config) {
  config.set({
    
    frameworks: ['jasmine'],
    files: [{ pattern: 'src/**/*.spec.{js,jsx}', watched: false }],
    preprocessors: { 'src/**/*.spec.{js,jsx}': ['esbuild'] },
    esbuild: {
      jsx: 'automatic',
      jsxImportSource: 'react',
      target: 'es2020',
      sourcemap: 'inline',
      loader: {
        '.js': 'jsx',
        '.jsx': 'jsx',
        '.png': 'dataurl'   // <-- punto 3
      },
      // opcional pero recomendable en Windows:
      resolveExtensions: ['.js', '.jsx', '.json']
      // ¡NO pongas format: 'esm' por ahora! (ver punto 2)
    },
    browsers: ['ChromeHeadless'],
    reporters: ['progress', 'coverage'],
    coverageReporter: { type: 'html', dir: 'coverage/' },
    singleRun: true,
  });
}

