/**
 * 日期时间格式化工具
 */

/**
 * 格式化日期时间为 "YYYY-MM-DD HH:mm:ss" 格式
 * @param date 日期对象、时间戳或日期字符串
 * @returns 格式化后的日期时间字符串，如 "2025-06-03 13:00:21"
 */
export function formatDateTime(date: Date | string | number | null | undefined): string | null {
  if (!date) return null;
  
  try {
    const dateObj = typeof date === 'string' || typeof date === 'number' 
      ? new Date(date) 
      : date;
    
    if (isNaN(dateObj.getTime())) {
      return null;
    }
    
    const year = dateObj.getFullYear();
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    const day = String(dateObj.getDate()).padStart(2, '0');
    const hours = String(dateObj.getHours()).padStart(2, '0');
    const minutes = String(dateObj.getMinutes()).padStart(2, '0');
    const seconds = String(dateObj.getSeconds()).padStart(2, '0');
    
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
  } catch (error) {
    return null;
  }
}

/**
 * 格式化对象中的日期字段
 * @param obj 对象
 * @param dateFields 需要格式化的日期字段名数组
 * @returns 格式化后的新对象
 */
export function formatObjectDates<T extends Record<string, any>>(
  obj: T,
  dateFields: string[]
): T {
  if (!obj) return obj;
  
  const result = { ...obj } as any;
  dateFields.forEach(field => {
    if (result[field]) {
      result[field] = formatDateTime(result[field]);
    }
  });
  
  return result as T;
}

