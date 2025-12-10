import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'

const BACKEND_PORT = 5000;         // Flask 端口
const MINIO_INTERNAL = '192.168.31.145:9000';  // MinIO 实际监听地址

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // =====================
      // 原来的 /api 动态代理
      // =====================
      '/api': {
        target: 'http://127.0.0.1:' + BACKEND_PORT,
        changeOrigin: true,
        configure: (proxy, options) => {
          proxy.on('proxyReq', (proxyReq, req) => {
            const hostHeader = req.headers.host; // 如 "192.168.31.20:5173"
            const [realHost, realPort] = hostHeader.split(':');

            console.log('🟢 动态 Host:', realHost, 'Port:', realPort);

            const newTarget = `http://${realHost}:${BACKEND_PORT}`;
            proxy.options.target = newTarget;

            console.log('🚀 动态 API 代理目标:', newTarget);

            proxyReq.setHeader('host', `${realHost}:${realPort}`);
            proxyReq.setHeader('origin', `http://${realHost}:${BACKEND_PORT}`);
          });

          proxy.on('proxyRes', (proxyRes, req, res) => {
            console.log('🟡 API 后端响应状态:', proxyRes.statusCode);
          });

          proxy.on('error', (err, req, res) => {
            console.log('🔴 API 代理错误:', err.message);
          });
        },
      },

      // =====================
      // 新增的 /minio 反代
      // 等价于 Nginx 的 location /minio/
      // =====================
      '/minio': {
        // 目标 MinIO
        target: `http://${MINIO_INTERNAL}`,
        // 不让 Vite 自动改 origin，由我们手动设置 Host
        changeOrigin: false,
        /**
         * Nginx:
         *  location /minio/ { proxy_pass http://localhost:9000/; }
         * ⇒ /minio/xxx  →  /xxx
         */
        rewrite: (path) => path.replace(/^\/minio/, ''),
        configure: (proxy) => {
          proxy.on('proxyReq', (proxyReq, req) => {
            // 固定给 MinIO 的 Host，防止 presigned 签名失效
            proxyReq.setHeader('host', MINIO_INTERNAL);

            // 模拟 Nginx 的几个 header
            const remoteAddr = req.socket.remoteAddress || '';
            proxyReq.setHeader('X-Real-IP', remoteAddr);
            proxyReq.setHeader('X-Forwarded-For', remoteAddr);
            proxyReq.setHeader(
              'X-Forwarded-Proto',
              req.headers['x-forwarded-proto'] || 'http'
            );
            proxyReq.setHeader('Connection', '');

            // Vite 里没法关 chunked_transfer_encoding，这个一般问题不大
          });

          proxy.on('proxyRes', (proxyRes, req, res) => {
            console.log('🟡 MinIO 响应状态:', proxyRes.statusCode);
          });

          proxy.on('error', (err) => {
            console.log('🔴 MinIO 代理错误:', err.message);
          });
        },
      },
    },
  },
});
