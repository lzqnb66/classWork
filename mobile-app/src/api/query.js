import http from './http';

/**
 * 执行高级查询
 * @param {Object} params - 查询参数
 * @param {string} params.dataType - 数据类型: '全部', '饮食记录', '步数记录', '睡眠记录'
 * @param {string} params.startDate - 开始日期 YYYY-MM-DD
 * @param {string} params.endDate - 结束日期 YYYY-MM-DD
 * @param {string} params.startTime - 开始时间 HH:mm
 * @param {string} params.endTime - 结束时间 HH:mm
 * @param {string} params.sortOrder - 排序方式: '时间升序', '时间降序', '数值升序', '数值降序'
 * @param {string} params.keyword - 关键词搜索
 * @param {number} params.page - 页码
 * @param {number} params.pageSize - 每页数量
 */
export async function advancedQuery(params) {
  const queryParams = new URLSearchParams();
  
  Object.keys(params).forEach(key => {
    if (params[key] !== undefined && params[key] !== null && params[key] !== '') {
      queryParams.append(key, params[key]);
    }
  });

  const { data } = await http.get(`/query/advanced?${queryParams}`);
  return data;
}

/**
 * 获取查询统计信息
 * @param {Object} params - 查询参数
 * @param {string} params.dataType - 数据类型
 * @param {string} params.startDate - 开始日期
 * @param {string} params.endDate - 结束日期
 */
export async function getQueryStats(params) {
  const queryParams = new URLSearchParams();
  
  Object.keys(params).forEach(key => {
    if (params[key] !== undefined && params[key] !== null && params[key] !== '') {
      queryParams.append(key, params[key]);
    }
  });

  const { data } = await http.get(`/query/stats?${queryParams}`);
  return data;
}

/**
 * 删除记录
 * @param {number} id - 记录ID
 */
export async function deleteRecord(id) {
  const { data } = await http.delete(`/records/${id}`);
  return data;
}

/**
 * 导出记录数据
 * @param {Object} record - 记录对象
 */
export function exportRecord(record) {
  const content = JSON.stringify(record, null, 2);
  const blob = new Blob([content], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${record.type}_${record.date}_${record.id}.json`;
  a.click();
  URL.revokeObjectURL(url);
  return true;
}