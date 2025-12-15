import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'

const BACKEND_PORT = 5000;                    // Flask 端口
const MINIO_INTERNAL = '192.168.31.145:9000'; // MinIO 实际监听地址
const ONLYOFFICE_INTERNAL = '192.168.31.145:8080'; // ⭐ OnlyOffice DocumentServer 地址

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // =====================
      // /api 动态代理
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
      // /minio 反代（等价 Nginx location /minio/）
      // =====================
      '/minio': {
        target: `http://${MINIO_INTERNAL}`,
        changeOrigin: false,
        // /minio/xxx -> /xxx
        rewrite: (path) => path.replace(/^\/minio/, ''),
        configure: (proxy) => {
          proxy.on('proxyReq', (proxyReq, req) => {
            proxyReq.setHeader('host', MINIO_INTERNAL);

            const remoteAddr = req.socket.remoteAddress || '';
            proxyReq.setHeader('X-Real-IP', remoteAddr);
            proxyReq.setHeader('X-Forwarded-For', remoteAddr);
            proxyReq.setHeader(
              'X-Forwarded-Proto',
              req.headers['x-forwarded-proto'] || 'http'
            );
            proxyReq.setHeader('Connection', '');
          });

          proxy.on('proxyRes', (proxyRes, req, res) => {
            console.log('🟡 MinIO 响应状态:', proxyRes.statusCode);
          });

          proxy.on('error', (err) => {
            console.log('🔴 MinIO 代理错误:', err.message);
          });
        },
      },

      // =====================
      // /onlyoffice 反代
      // 等价于 Nginx: location /onlyoffice/ { proxy_pass http://ONLYOFFICE_INTERNAL/; ... }
      // =====================
      '/onlyoffice': {
        target: `http://${ONLYOFFICE_INTERNAL}`,
        changeOrigin: false,
        ws: true, // ⭐ OnlyOffice 用到 WebSocket，记得打开
        // 一般我们保持 /onlyoffice 前缀，不做 rewrite
        // 如果你线上是挂在根路径，可以按需改：
        rewrite: (path) => path.replace(/^\/onlyoffice/, ''),
        configure: (proxy) => {
          proxy.on('proxyReq', (proxyReq, req) => {
            // 给 DocumentServer 的 Host，用内部地址最稳
            proxyReq.setHeader('host', ONLYOFFICE_INTERNAL);

            const remoteAddr = req.socket.remoteAddress || '';
            proxyReq.setHeader('X-Real-IP', remoteAddr);
            proxyReq.setHeader('X-Forwarded-For', remoteAddr);
            proxyReq.setHeader(
              'X-Forwarded-Proto',
              req.headers['x-forwarded-proto'] || 'http'
            );

            // WebSocket & 长连接
            proxyReq.setHeader('Connection', 'upgrade');
            if (req.headers.upgrade) {
              proxyReq.setHeader('Upgrade', req.headers.upgrade);
            }
          });

          proxy.on('proxyRes', (proxyRes, req, res) => {
            console.log('🟡 OnlyOffice 响应状态:', proxyRes.statusCode);
          });

          proxy.on('error', (err) => {
            console.log('🔴 OnlyOffice 代理错误:', err.message);
          });
        },
      },
    },
  },
});
