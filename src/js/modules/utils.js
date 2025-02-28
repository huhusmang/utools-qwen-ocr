// 工具函数
export class Utils {
  static showToast(message, type = 'info') {
    const toastContainer = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    
    toastContainer.appendChild(toast);
    
    setTimeout(() => {
      toast.remove();
    }, 3000);
  }

  static initMathJax() {
    return typeof MathJax !== 'undefined' && MathJax.typesetPromise;
  }
} 