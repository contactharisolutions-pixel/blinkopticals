import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    // Custom plugin: serve admin.html for any /admin/* request on the Vite dev server
    {
      name: 'admin-html-rewrite',
      configureServer(server) {
        server.middlewares.use((req, _res, next) => {
          // For Vite dev server: redirect /admin/* to admin.html
          if (req.url && req.url.startsWith('/admin') && !req.url.startsWith('/admin/js') && !req.url.startsWith('/admin/css') && !req.url.startsWith('/admin/img') && !req.url.startsWith('/admin/login') && !req.url.startsWith('/api')) {
            req.url = '/admin.html'
          }
          next()
        })
      }
    }
  ],
  // Use admin.html as the SPA entry so no storefront code bleeds in
  root: '.',
  build: {
    rollupOptions: {
      input: path.resolve(__dirname, 'admin.html'),
    },
  },
  server: {
    proxy: {
      '/api': 'http://localhost:5174',
      // Legacy Vanilla JS dashboard served by Express (used in iframes)
      '/legacy': 'http://localhost:5174',
      // Static assets proxied to Express/public
      '/js': 'http://localhost:5174',
      '/css': 'http://localhost:5174',
      '/img': 'http://localhost:5174',
      '/uploads': 'http://localhost:5174',
      '/admin/css': 'http://localhost:5174',
      '/admin/js': 'http://localhost:5174',
      '/admin/img': 'http://localhost:5174',
      '/admin/login': 'http://localhost:5174',
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
})
