// src/api/menu.js
import request from '../utils/request';

/**
 * 获取菜单树
 * GET /api/menus/tree
 */
export const getMenuTree = async () => {
  const res = await request.get('/menus/tree'); // baseURL 里已经有 /api

  return res;  // { code, message, data }
};

/**
 * 获取菜单列表（平铺）
 * GET /api/menus
 */
export const getMenuList = async () => {
  const res = await request.get('/menus');
    console.log('adfddf',res)
  return res;
};

/**
 * 新建菜单
 * POST /api/menus
 * @param {Object} data
 */
export const createMenu = async (data) => {
  const res = await request.post('/menus', data);
  return res;
};

/**
 * 更新菜单
 * PUT /api/menus/:id
 * @param {number|string} id
 * @param {Object} data
 */
export const updateMenu = async (id, data) => {
  const res = await request.put(`/menus/${id}`, data);
  return res;
};

/**
 * 删除菜单
 * DELETE /api/menus/:id
 * @param {number|string} id
 */
export const deleteMenu = async (id) => {
  const res = await request.delete(`/menus/${id}`);
  return res;
};
