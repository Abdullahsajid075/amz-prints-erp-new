const { defineConfig, loadEnv } = require('vite');
const react = require('@vitejs/plugin-react');
const esbuild = require('esbuild');
const path = require('path');

const appJsPath = path.resolve(__dirname, 'src/App.js');

module.exports = defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), ['VITE_', 'REACT_APP_']);

  // Vercel injects env on process.env — ensure Vite define sees them
  ['REACT_APP_GAS_API_URL'].forEach((key) => {
    if (process.env[key] && !env[key]) {
      env[key] = process.env[key];
    }
  });

  const envDefine = Object.fromEntries(
    Object.entries(env).map(([key, val]) => [`process.env.${key}`, JSON.stringify(val)])
  );

  // Hard fallback so production never boots without a GAS URL baked in
  if (!envDefine['process.env.REACT_APP_GAS_API_URL']) {
    envDefine['process.env.REACT_APP_GAS_API_URL'] = JSON.stringify(
      'https://script.google.com/macros/s/AKfycbxEvWjbbh0-VJ1JxKR-qFZ9TbllIyh9rAJRg1ythfihJP61o6sxvcYhHehXafZEYummLw/exec'
    );
  }

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
