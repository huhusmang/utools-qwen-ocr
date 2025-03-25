// 设置相关功能
export class Settings {
  constructor() {
    this.settingsModal = document.getElementById('settingsModal');
    this.settingsBtn = document.getElementById('settingsBtn');
    this.closeSettings = document.getElementById('closeSettings');
    this.saveSettings = document.getElementById('saveSettings');
    this.promptInput = document.getElementById('promptInput');
    
    // OCR 服务配置
    this.ocrBaseUrl = document.getElementById('ocrBaseUrl');
    this.ocrApiKey = document.getElementById('ocrApiKey');
    this.ocrModelName = document.getElementById('ocrModelName');
    
    // 翻译服务配置
    this.deeplxUrl = document.getElementById('deeplxUrl');
    this.translationBaseUrl = document.getElementById('translationBaseUrl');
    this.translationApiKey = document.getElementById('translationApiKey');
    this.translationModelName = document.getElementById('translationModelName');
    
    this.initEventListeners();
  }

  initEventListeners() {
    // 打开设置面板
    this.settingsBtn.addEventListener('click', () => {
      this.loadSettings();
      this.settingsModal.classList.add('show');
    });

    // 关闭设置面板
    this.closeSettings.addEventListener('click', () => {
      this.settingsModal.classList.remove('show');
    });

    // 点击遮罩层关闭
    this.settingsModal.addEventListener('click', (e) => {
      if (e.target === this.settingsModal) {
        this.settingsModal.classList.remove('show');
      }
    });

    // 保存设置
    this.saveSettings.addEventListener('click', () => this.saveSettingsToStorage());

    // 翻译服务切换监听
    document.querySelectorAll('input[name="translateService"]').forEach(radio => {
      radio.addEventListener('change', (e) => {
        this.updateTranslateSettings(e.target.value);
      });
    });
  }

  loadSettings() {
    const settings = window.services.getSettings();
    if (settings) {
      // 设置默认 prompt
      const defaultPrompt = '请识别图片中的内容。对于数学公式和数学符号，请使用标准的 LaTeX 格式输出。\n' +
        '要求：\n' +
        '1. 所有数学公式和单个数学符号都要用 LaTeX 格式\n' +
        '2. 普通文本保持原样\n' +
        '3. 严格保持原文的段落格式和换行，不需要输出具体的换行符\\n，只需保持原文的样式\n' +
        '4. 对于代码块，请使用 markdown 格式输出，使用```包裹代码块';
      
      this.promptInput.value = settings.prompt || defaultPrompt;
      
      // OCR 服务设置
      this.ocrBaseUrl.value = settings.ocrBaseUrl || '';
      this.ocrApiKey.value = settings.ocrApiKey || '';
      this.ocrModelName.value = settings.ocrModelName || 'qwen2.5-vl-32b-instruct';
      
      // 翻译服务设置
      this.deeplxUrl.value = settings.deeplxUrl || '';
      this.translationBaseUrl.value = settings.translationBaseUrl || 'https://api.openai.com/v1';
      this.translationApiKey.value = settings.translationApiKey || '';
      this.translationModelName.value = settings.translationModelName || 'gpt-4o-mini';
      
      const translateService = settings.translateService || 'deeplx';
      const radioButton = document.querySelector(`input[name="translateService"][value="${translateService}"]`);
      if (radioButton) {
        radioButton.checked = true;
        this.updateTranslateSettings(translateService);
      }
    }
  }

  saveSettingsToStorage() {
    const settings = {
      prompt: this.promptInput.value.trim(),
      
      // OCR 服务设置
      ocrBaseUrl: this.ocrBaseUrl.value.trim(),
      ocrApiKey: this.ocrApiKey.value.trim(),
      ocrModelName: this.ocrModelName.value.trim() || 'qwen2.5-vl-32b-instruct',
      
      // 翻译服务设置
      deeplxUrl: this.deeplxUrl.value.trim(),
      translationBaseUrl: this.translationBaseUrl.value.trim(),
      translationApiKey: this.translationApiKey.value.trim(),
      translationModelName: this.translationModelName.value.trim() || 'gpt-4o-mini',
      translateService: document.querySelector('input[name="translateService"]:checked').value,
      targetLang: window.currentLang,
    };
    
    window.services.saveSettings(settings);
    this.settingsModal.classList.remove('show');
    window.utils.showToast('设置已保存', 'success');
  }

  updateTranslateSettings(service) {
    document.querySelector('.deeplx-setting').style.display = 
      service === 'deeplx' ? 'block' : 'none';
    document.querySelector('.openai-setting').style.display = 
      service === 'openai' ? 'block' : 'none';
  }
}