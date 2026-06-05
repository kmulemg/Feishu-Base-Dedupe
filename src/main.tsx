/**
 * 重复数据检测与合并插件
 * 
 * 功能说明：
 * 1. 自动选择表格第一列作为检测字段
 * 2. 检测指定字段是否存在重复数据
 * 3. 当发现重复时，弹出冲突对话框让用户选择处理方式
 * 4. 支持多种合并策略：覆盖、保留、合并
 */

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.scss';
import { initI18n } from './locales/i18n';

// 初始化国际化
initI18n('zh');

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);