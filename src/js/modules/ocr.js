// OCR 识别相关功能
export class OCR {
  constructor() {
    this.resultDiv = document.getElementById('result');
    this.loadingSpinner = document.getElementById('loadingSpinner');
    this.retranslateBtn = document.getElementById('retranslateBtn');
    this.currentOcrText = null;

    this.initEventListeners();
  }

  initEventListeners() {
    // 重新识别功能
    this.retranslateBtn.addEventListener('click', () => {
      if (window.upload.currentImageData) {
        this.resultDiv.innerHTML = '';
        this.loadingSpinner.style.display = 'block';
        this.processImage(window.upload.currentImageData);
      }
    });
  }

  // 将图片数据转换为 base64
  async imageToBase64(imageData) {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      img.onload = () => {
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);
        // 移除 data:image/png;base64, 前缀
        const base64 = canvas.toDataURL('image/png').replace(/^data:image\/png;base64,/, '');
        resolve(base64);
      };
      img.src = imageData;
    });
  }

  async processImage(imageData) {
    if (!imageData) return;

    // 更新预览
    window.upload.updatePreview(imageData);

    // 清空结果并显示加载
    this.resultDiv.innerHTML = '';
    this.loadingSpinner.style.display = 'block';

    try {
      if (!window.services) {
        window.utils.showToast('服务初始化失败，请检查 preload.js 是否正确加载', 'error');
        return;
      }

      const settings = window.services.getSettings();
      if (!settings.ocrBaseUrl || !settings.ocrApiKey) {
        window.utils.showToast('请先设置 OCR API Base URL 和 API Key', 'error');
        window.settings.settingsModal.classList.add('show');
        return;
      }

      // 将图片转换为 base64
      const base64Image = await this.imageToBase64(imageData);

      const prompt = settings.prompt || '请识别图片中的内容。对于数学公式和数学符号，请使用标准的 LaTeX 格式输出。' +
        '要求：\n' +
        '1. 所有数学公式和单个数学符号都要用 LaTeX 格式\n' +
        '2. 普通文本保持原样\n' +
        '3. 严格保持原文的段落格式和换行，不需要输出具体的换行符\\n，只需保持原文的样式\n' +
        '4. 对于代码块，请使用 markdown 格式输出，使用```包裹代码块';

      // 调用 OpenAI 兼容的 API 进行识别
      const response = await fetch(`${settings.ocrBaseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${settings.ocrApiKey}`,
        },
        body: JSON.stringify({
          model: settings.ocrModelName || 'qwen2.5-vl-32b-instruct',
          messages: [
            {
              role: 'system',
              content: [
                {
                  type: 'text',
                  text: 'You are a helpful assistant.'
                }
              ]
            },
            {
              role: 'user',
              content: [
                {
                  type: 'image_url',
                  image_url: {
                    url: `data:image/png;base64,${base64Image}`
                  }
                },
                {
                  type: 'text',
                  text: prompt
                }
              ]
            }
          ]
        })
      });

      if (!response.ok) {
        throw new Error(`API 请求失败：${response.status} ${response.statusText}`);
      }

      const recognizeData = await response.json();
      const result = recognizeData.choices[0]?.message?.content || '识别失败';
      this.currentOcrText = result;

      // 处理结果
      this.resultDiv.innerHTML = result
        .replace(/\\（/g, '\\(')
        .replace(/\\）/g, '\\)')
        .replace(/\n{3,}/g, '\n\n')
        .replace(/([^\n])\n([^\n])/g, '$1\n$2')
        .trim();

      // 渲染数学公式
      if (window.utils.initMathJax()) {
        await MathJax.typesetPromise([this.resultDiv]);
      }

    } catch (error) {
      window.utils.showToast(`处理失败：${error.message}`, 'error');
      this.resultDiv.textContent = '';
    } finally {
      this.loadingSpinner.style.display = 'none';
    }
  }
} 