const { defineConfig, loadEnv } = require('vite');
const react = require('@vitejs/plugin-react');
const esbuild = require('esbuild');
const path = require('path');

const appJsPath = path.resolve(__dirname, 'src/App.js');

module.exports = defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), ['VITE_', 'REACT_APP_']);
  const envDefine = Object.fromEntries(
    Object.entries(env).map(([key, val]) => [`process.env.${key}`, JSON.stringify(val)])
  );

  return {
    plugins: [
      {
        name: 'jsx-in-app-js',
        enforce: 'pre',
        async transform(code, id) {
          if (path.normalize(id) !== appJsPath) {
            return null;
          }

          return esbuild.transformSync(code, {
            loader: 'jsx',
            jsx: 'automatic',
          }).code;
        },
      },
      react(),
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, 'src'),
      },
    },
    define: {
      ...envDefine,
      'process.env.NODE_ENV': JSON.stringify(mode === 'production' ? 'production' : 'development'),
    },
    server: {
      port: 3000,
    },
    build: {
      outDir: 'dist',
    },
  };
});
