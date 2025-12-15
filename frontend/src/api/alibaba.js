// src/api/alibaba.js
import request from '../utils/request';

/**
 * 通用调用 Alibaba API 的调试接口
 * payload 结构:
 * {
 *   api_name: string,
 *   http_method?: 'GET' | 'POST',
 *   seller_id?: string,
 *   access_token?: string,
 *   params?: object
 * }
 */
export function callAlibabaApi(payload) {
  return request({
    url: '/alibaba_debug/call',   // 最终会变成 /api/alibaba/call
    method: 'post',
    data: payload,
  });
}
