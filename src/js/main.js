// 主入口文件
import { Settings } from './modules/settings.js';
import { Upload } from './modules/upload.js';
import { OCR } from './modules/ocr.js';
import { Translate } from './modules/translate.js';
import { UI } from './modules/ui.js';
import { Utils } from './modules/utils.js';

// 立即定义全局处理函数，确保它在最早的时间被定义
window.processPluginImage = (imageData) => {
  console.log('processPluginImage called (global)');
  // 此时可能还没初始化完，添加到队列中
  setTimeout(() => {
    if (window.ocr && typeof window.ocr.processImage === 'function') {
      console.log('Executing delayed OCR.processImage');
      window.ocr.processImage(imageData);
    } else {
      console.error('OCR module not ready yet, image data might be lost');
      // 存储图像数据到全局变量，以便后续处理
      window._pendingImageData = imageData;
    }
  }, 200);
};

// 主题管理
const themeToggle = document.getElementById('themeToggle');
const prefersDarkScheme = window.matchMedia('(prefers-color-scheme: dark)');

// 从本地存储加载主题设置
const savedTheme = localStorage.getItem('theme') || (prefersDarkScheme.matches ? 'dark' : 'light');
document.documentElement.setAttribute('data-theme', savedTheme);

// 切换主题
themeToggle.addEventListener('click', () => {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
});

// 监听系统主题变化
prefersDarkScheme.addEventListener('change', (e) => {
    if (!localStorage.getItem('theme')) {
        const newTheme = e.matches ? 'dark' : 'light';
        document.documentElement.setAttribute('data-theme', newTheme);
    }
});

document.addEventListener('DOMContentLoaded', () => {
  // Wait for window.services to be available
  const initApp = () => {
    if (!window.services) {
      setTimeout(initApp, 100); // Try again in 100ms
      return;
    }

    // Initialize modules once services are available
    window.utils = Utils;
    window.settings = new Settings();
    window.upload = new Upload();
    window.ocr = new OCR();
    window.translate = new Translate();
    window.ui = new UI();
    
    // Load initial settings
    window.settings.loadSettings();
    
    // 处理可能在初始化前接收到的图片
    if (window._pendingImageData && window.ocr) {
      console.log('Processing pending image data');
      window.ocr.processImage(window._pendingImageData);
      window._pendingImageData = null;
    }
  };

  initApp();
}); 