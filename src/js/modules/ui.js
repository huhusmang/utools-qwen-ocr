// UI交互相关功能
export class UI {
  constructor() {
    this.copyBtn = document.getElementById('copyBtn');
    this.clearBtn = document.getElementById('clearBtn');
    this.screenshotBtn = document.getElementById('screenshotBtn');
    this.resultDiv = document.getElementById('result');
    
    this.initEventListeners();
    
    // Delay template system initialization to ensure services are available
    setTimeout(() => this.initTemplateSystem(), 0);
  }

  initEventListeners() {
    // 复制结果功能
    this.copyBtn.addEventListener('click', () => {
      const result = this.resultDiv.textContent;
      window.services.copyToClipboard(result);
      this.copyBtn.textContent = '已复制';
      this.copyBtn.classList.add('copied');
      setTimeout(() => {
        this.copyBtn.textContent = '一键复制';
        this.copyBtn.classList.remove('copied');
      }, 2000);
    });

    // 一键清除功能
    this.clearBtn.addEventListener('click', () => {
      window.upload.clear();
      this.resultDiv.innerHTML = '';
    });

    // 截图功能
    this.screenshotBtn.addEventListener('click', () => {
      // 最小化窗口，以免影响截图
      window.utools.hideMainWindow();
      // 延迟一小段时间，确保窗口已经隐藏
      setTimeout(() => {
        window.utools.screenCapture((imageData) => {
          window.utools.showMainWindow();
          if (imageData) {
            window.ocr.processImage(imageData);
          }
        });
      }, 100);
    });
  }

  initTemplateSystem() {
    const promptTemplateBtn = document.querySelector('.prompt-template-btn');
    const promptTemplateDropdown = document.querySelector('.prompt-template-dropdown');
    const promptAddBtn = document.querySelector('.prompt-add-btn');
    const templateConfigModal = document.getElementById('templateConfigModal');
    const closeTemplateConfig = document.getElementById('closeTemplateConfig');
    const applyTemplate = document.getElementById('applyTemplate');
    const saveTemplateModal = document.getElementById('saveTemplateModal');
    const closeSaveTemplate = document.getElementById('closeSaveTemplate');
    const saveAsTemplate = document.getElementById('saveAsTemplate');
    
    let currentTemplate = null;
    
    const templates = {
      'default': {
        title: '默认模板',
        description: '通用文本识别，支持数学公式和代码块',
        prompt: '请识别图片中的内容。对于数学公式和数学符号，请使用标准的LaTeX格式输出。\n' +
                '要求：\n' +
                '1. 所有数学公式和单个数学符号都要用LaTeX格式\n' +
                '2. 普通文本保持原样\n' +
                '3. 严格保持原文的段落格式和换行，不需要输出具体的换行符\\n，只需保持原文的样式\n' +
                '4. 对于代码块，请使用 markdown 格式输出，使用```包裹代码块'
      },
      'object-detection': {
        title: '目标检测',
        description: '检测图像中的特定目标并返回坐标位置',
        generate: (label, subLabel) => {
          const subLabels = subLabel.split(',').map(s => s.trim()).filter(s => s);
          return `you are a object detector, Detect all the ${label} in the image and return their positions in coordinate form. The "label" is "${label}," and the "sub label" is "${subLabels.join('" or "')}", for example {"bbox_2d": [0,0,0,0], "label": "${label}", "sub_label": "${subLabels[0]}"}`;
        }
      }
    };
    
    // 添加默认模板到下拉菜单
    const defaultTemplateHtml = `
      <div class="prompt-template-item" data-template="default">
        <div class="template-header">
          <span class="template-title">${templates.default.title}</span>
        </div>
        <div class="template-desc">${templates.default.description}</div>
      </div>
    `;
    
    promptTemplateDropdown?.insertAdjacentHTML('afterbegin', defaultTemplateHtml);
    
    // 点击默认模板
    promptTemplateDropdown?.querySelector('[data-template="default"]')?.addEventListener('click', () => {
      document.getElementById('promptInput').value = templates.default.prompt;
      promptTemplateDropdown.classList.remove('show');
      window.utils.showToast('默认模板已应用', 'success');
    });
    
    // 点击模板按钮
    promptTemplateBtn?.addEventListener('click', () => {
      promptTemplateDropdown?.classList.toggle('show');
    });
    
    // 点击配置按钮
    document.querySelectorAll('.template-config-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const templateItem = e.target.closest('.prompt-template-item');
        currentTemplate = templateItem?.dataset.template;
        templateConfigModal?.classList.add('show');
        promptTemplateDropdown?.classList.remove('show');
      });
    });
    
    // 关闭配置对话框
    closeTemplateConfig?.addEventListener('click', () => {
      templateConfigModal?.classList.remove('show');
    });
    
    // 点击外部关闭下拉菜单
    document.addEventListener('click', (e) => {
      if (!e.target.closest('.prompt-template')) {
        promptTemplateDropdown?.classList.remove('show');
      }
    });
    
    // 应用模板
    applyTemplate?.addEventListener('click', () => {
      const label = document.getElementById('templateLabel')?.value.trim();
      const subLabel = document.getElementById('templateSubLabel')?.value.trim();
      
      if (!label || !subLabel) {
        window.utils.showToast('请填写完整的模板配置', 'error');
        return;
      }
      
      const template = templates[currentTemplate];
      if (template) {
        const promptText = template.generate(label, subLabel);
        document.getElementById('promptInput').value = promptText;
        templateConfigModal?.classList.remove('show');
        window.utils.showToast('模板应用成功', 'success');
      }
    });
    
    // 点击遮罩层关闭配置对话框
    templateConfigModal?.addEventListener('click', (e) => {
      if (e.target === templateConfigModal) {
        templateConfigModal.classList.remove('show');
      }
    });

    // 点击新增模板按钮
    promptAddBtn?.addEventListener('click', () => {
      saveTemplateModal.classList.add('show');
    });
    
    // 关闭保存模板对话框
    closeSaveTemplate?.addEventListener('click', () => {
      saveTemplateModal.classList.remove('show');
    });
    
    // 点击遮罩层关闭
    saveTemplateModal?.addEventListener('click', (e) => {
      if (e.target === saveTemplateModal) {
        saveTemplateModal.classList.remove('show');
      }
    });
    
    // 保存自定义模板
    saveAsTemplate?.addEventListener('click', () => {
      const name = document.getElementById('templateName').value.trim();
      const prompt = document.getElementById('templatePrompt').value.trim();
      
      if (!name || !prompt) {
        window.utils.showToast('请填写完整的模板信息', 'error');
        return;
      }
      
      // 生成唯一模板ID
      const templateId = 'custom-' + Date.now();
      
      // 保存模板到本地存储
      const settings = window.services.getSettings();
      settings.customTemplates = settings.customTemplates || {};
      settings.customTemplates[templateId] = {
        title: name,
        prompt: prompt
      };
      window.services.saveSettings(settings);
      
      // 添加新模板到下拉菜单
      const templateHtml = `
        <div class="prompt-template-item" data-template="${templateId}">
          <div class="template-header">
            <span class="template-title">${name}</span>
            <button class="template-delete-btn" data-template-id="${templateId}">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" viewBox="0 0 16 16">
                <path d="M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708z"/>
              </svg>
            </button>
          </div>
        </div>
      `;
      
      // 插入到列表末尾
      promptTemplateDropdown.insertAdjacentHTML('beforeend', templateHtml);
      
      // 清空输入框
      document.getElementById('templateName').value = '';
      document.getElementById('templatePrompt').value = '';
      
      // 关闭对话框
      saveTemplateModal.classList.remove('show');
      window.utils.showToast('模板保存成功', 'success');
      
      // 绑定新模板的点击事件
      this.bindTemplateEvents(templateId);
    });
    
    // 加载已保存的自定义模板
    this.loadCustomTemplates();
  }

  // 加载自定义模板
  loadCustomTemplates() {
    if (!window.services) {
      console.warn('Services not yet available, skipping custom templates load');
      return;
    }

    const settings = window.services.getSettings();
    const customTemplates = settings.customTemplates || {};
    
    Object.entries(customTemplates).forEach(([id, template]) => {
      const templateHtml = `
        <div class="prompt-template-item" data-template="${id}">
          <div class="template-header">
            <span class="template-title">${template.title}</span>
            <button class="template-delete-btn" data-template-id="${id}">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" viewBox="0 0 16 16">
                <path d="M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708z"/>
              </svg>
            </button>
          </div>
          <div class="template-desc">${template.description}</div>
        </div>
      `;
      
      // 插入到列表末尾
      const saveTemplateItem = document.querySelector('.prompt-template-dropdown .save-template');
      saveTemplateItem.insertAdjacentHTML('beforebegin', templateHtml);
      
      // 绑定模板事件
      this.bindTemplateEvents(id);
    });
  }

  // 绑定模板事件
  bindTemplateEvents(templateId) {
    const templateItem = document.querySelector(`[data-template="${templateId}"]`);
    const deleteBtn = templateItem.querySelector('.template-delete-btn');
    
    // 点击模板应用
    templateItem.addEventListener('click', (e) => {
      if (!e.target.closest('.template-delete-btn')) {
        const settings = window.services.getSettings();
        const template = settings.customTemplates[templateId];
        document.getElementById('promptInput').value = template.prompt;
        document.querySelector('.prompt-template-dropdown').classList.remove('show');
        window.utils.showToast('模板已应用', 'success');
      }
    });
    
    // 删除模板
    deleteBtn?.addEventListener('click', (e) => {
      e.stopPropagation();
      const settings = window.services.getSettings();
      delete settings.customTemplates[templateId];
      window.services.saveSettings(settings);
      templateItem.remove();
      window.utils.showToast('模板已删除', 'success');
    });
  }
} 