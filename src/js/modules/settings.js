// 设置相关功能
export class Settings {
  constructor() {
    this.settingsModal = document.getElementById('settingsModal');
    this.settingsBtn = document.getElementById('settingsBtn');
    this.closeSettings = document.getElementById('closeSettings');
    this.saveSettings = document.getElementById('saveSettings');
    this.apiToken = document.getElementById('apiToken');
    this.promptInput = document.getElementById('promptInput');
    this.deeplxUrl = document.getElementById('deeplxUrl');
    
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
      this.apiToken.value = settings.tokens.join(',');
      
      // 设置默认 prompt
      const defaultPrompt = '请识别图片中的内容。对于数学公式和数学符号，请使用标准的LaTeX格式输出。\n' +
        '要求：\n' +
        '1. 所有数学公式和单个数学符号都要用LaTeX格式\n' +
        '2. 普通文本保持原样\n' +
        '3. 严格保持原文的段落格式和换行，不需要输出具体的换行符\\n，只需保持原文的样式\n' +
        '4. 对于代码块，请使用 markdown 格式输出，使用```包裹代码块';
      
      this.promptInput.value = settings.prompt || defaultPrompt;
      
      this.deeplxUrl.value = settings.deeplxUrl || '';
      
      const translateService = settings.translateService || 'deeplx';
      const radioButton = document.querySelector(`input[name="translateService"][value="${translateService}"]`);
      if (radioButton) {
        radioButton.checked = true;
        this.updateTranslateSettings(translateService);
      }
      
      document.getElementById('openaiKey').value = settings.openaiKey || '';
      document.getElementById('openaiBaseUrl').value = settings.openaiBaseUrl || '';
      document.getElementById('openaiModel').value = settings.openaiModel || '';
      
      // 更新模型选择
      this.updateModelSelect().catch(console.error);
    }
  }

  saveSettingsToStorage() {
    const settings = {
      tokens: this.apiToken.value.trim().split(',').map(t => t.trim()).filter(t => t),
      prompt: this.promptInput.value.trim(),
      deeplxUrl: this.deeplxUrl.value.trim(),
      openaiKey: document.getElementById('openaiKey').value.trim(),
      openaiBaseUrl: document.getElementById('openaiBaseUrl').value.trim(),
      openaiModel: document.getElementById('openaiModel').value.trim(),
      translateService: document.querySelector('input[name="translateService"]:checked').value,
      targetLang: window.currentLang,
      model: document.getElementById('modelSelect').value || 'qwen2.5-vl-72b-instruct'
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

  async updateModelSelect() {
    const modelSelect = document.getElementById('modelSelect');
    const token = window.services.getRandomToken();
    
    if (!token) {
      modelSelect.innerHTML = '<option value="">请先设置 API Token</option>';
      modelSelect.disabled = true;
      return;
    }
    
    try {
      modelSelect.disabled = true;
      modelSelect.innerHTML = '<option value="">加载中...</option>';
      
      const models = await this.fetchModels(token);
      
      if (!models.length) {
        throw new Error('没有找到可用的视觉模型');
      }
      
      const settings = window.services.getSettings();
      const currentModel = settings.model || 'qwen2.5-vl-72b-instruct';
      
      modelSelect.innerHTML = models.map(model => `
        <option value="${model.id}" ${model.id === currentModel ? 'selected' : ''}>
          ${model.name} - ${model.info.meta.short_description}
        </option>
      `).join('');
    } catch (error) {
      console.error('更新模型列表失败:', error);
      modelSelect.innerHTML = `<option value="qwen2.5-vl-72b-instruct">
        Qwen2.5-VL-72B-Instruct - Smart large vision-language model
      </option>`;
      window.utils.showToast(`获取模型列表失败: ${error.message}`, 'error');
    } finally {
      modelSelect.disabled = false;
    }
  }

  async fetchModels(token) {
    const response = await fetch('https://chat.qwenlm.ai/api/models', {
      headers: {
        'authorization': `Bearer ${token}`,
      }
    });
    
    if (!response.ok) throw new Error('获取模型列表失败');
    
    const data = await response.json();
    return data.data.filter(model => model.info?.meta?.capabilities?.vision === true);
  }
} 