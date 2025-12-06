import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:5000', // 假设你的 Flask 运行在 5000 端口
        changeOrigin: true,
        // 如果后端路由定义本身包含了 /api (如 __init__.py 中所示)，则不需要 rewrite 去掉它
        // 根据你的 __init__.py，url_prefix="/api/menus"，所以这里不需要 rewrite
      }
    }
  }
})