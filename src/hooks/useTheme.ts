/**
 * 主题 Hook
 * 
 * 用于获取和监听多维表格的主题变化
 * 支持 Light Mode 和 Dark Mode
 */

import { bitable } from '@lark-base-open/js-sdk';
import { useState, useEffect } from 'react';
import type { ThemeMode } from '../types';

// 主题样式配置
const themeStyles = {
  LIGHT: {
    '--color-primary': 'rgb(20, 86, 240)',
    '--color-success': 'rgb(52, 199, 89)',
    '--color-warning': 'rgb(255, 149, 0)',
    '--color-error': 'rgb(255, 59, 48)',
    '--color-bg': '#ffffff',
    '--color-bg-secondary': '#f5f5f5',
    '--color-text': '#1d1d1f',
    '--color-text-secondary': '#6e6e73',
    '--color-border': '#d2d2d7',
    '--color-hover': 'rgba(0, 0, 0, 0.04)',
  },
  DARK: {
    '--color-primary': '#4571e1',
    '--color-success': '#30d158',
    '--color-warning': '#ff9f0a',
    '--color-error': '#ff453a',
    '--color-bg': '#1c1c1e',
    '--color-bg-secondary': '#2c2c2e',
    '--color-text': '#f5f5f7',
    '--color-text-secondary': '#8e8e93',
    '--color-border': '#38383a',
    '--color-hover': 'rgba(255, 255, 255, 0.08)',
  },
};

export function useTheme() {
  const [theme, setTheme] = useState<ThemeMode>('LIGHT');

  // 应用主题样式到根元素
  const applyThemeStyles = (themeMode: ThemeMode) => {
    const root = document.documentElement;
    const styles = themeStyles[themeMode];
    
    Object.entries(styles).forEach(([property, value]) => {
      root.style.setProperty(property, value);
    });
  };

  // 初始化主题并监听变化
  useEffect(() => {
    // 获取当前主题
    const initTheme = async () => {
      try {
        const currentTheme = await bitable.bridge.getTheme();
        setTheme(currentTheme);
        applyThemeStyles(currentTheme);
      } catch (error) {
        console.error('Failed to get theme:', error);
        // 默认使用 Light 主题
        setTheme('LIGHT');
        applyThemeStyles('LIGHT');
      }
    };

    initTheme();

    // 监听主题变化
    const unsubscribe = bitable.bridge.onThemeChange((event) => {
      const newTheme = event.data.theme;
      setTheme(newTheme);
      applyThemeStyles(newTheme);
    });

    // 清理订阅
    return () => {
      unsubscribe();
    };
  }, []);

  return { theme };
}
