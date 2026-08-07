const { defineConfig, loadEnv } = require('vite');
const react = require('@vitejs/plugin-react');
const path = require('path');

module.exports = defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), ['VITE_', 'REACT_APP_']);

  // Vercel / Hostinger inject env on process.env — ensure Vite define sees them
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
    plugins: [react()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, 'src'),
      },
    },
    define: {
      ...envDefine,
      'process.env.NODE_ENV': JSON.stringify(mode === 'production' ? 'production' : 'development'),
    },
    // Allow JSX inside any remaining .js under src (Hostinger/Linux safe)
    esbuild: {
      loader: 'jsx',
      include: /src\/.*\.jsx?$/,
      jsx: 'automatic',
    },
    optimizeDeps: {
      esbuildOptions: {
        loader: { '.js': 'jsx' },
      },
    },
    server: {
      port: 3000,
    },
    build: {
      outDir: 'dist',
    },
  };
});
