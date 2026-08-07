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

  // Fallback until Vercel env is set (prefer Hostinger API URL in production)
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
      port: 5173,
      proxy: {
        // Local: frontend /api → api/_lib local server on :3000
        '/api': {
          target: 'http://localhost:3000',
          changeOrigin: true,
        },
      },
    },
    build: {
      outDir: 'dist',
    },
  };
});
