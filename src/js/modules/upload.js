// 图片上传相关功能
export class Upload {
  constructor() {
    this.uploadArea = document.getElementById('uploadArea');
    this.uploadContent = document.getElementById('uploadContent');
    this.previewImage = document.getElementById('previewImage');
    this.currentImageData = null;
    
    this.initEventListeners();
    this.initPluginEntry();
  }

  initEventListeners() {
    // 文件拖放处理
    this.uploadArea.addEventListener('dragover', (e) => {
      e.preventDefault();
      this.uploadArea.classList.add('dragover');
    });

    this.uploadArea.addEventListener('dragleave', () => {
      this.uploadArea.classList.remove('dragover');
    });

    this.uploadArea.addEventListener('drop', (e) => {
      e.preventDefault();
      this.uploadArea.classList.remove('dragover');
      const file = e.dataTransfer.files[0];
      if (file && file.type.startsWith('image/')) {
        this.readFile(file);
      }
    });

    // 点击上传
    this.uploadArea.addEventListener('click', () => {
      const result = window.utools.showOpenDialog({
        filters: [{ name: '图片文件', extensions: ['jpg', 'jpeg', 'png', 'gif', 'bmp'] }],
        properties: ['openFile']
      });
      
      if (result && result.length > 0) {
        const imagePath = result[0];
        const imageData = window.services.readImageAsBase64(imagePath);
        window.ocr.processImage(imageData);
      }
    });

    // 粘贴处理
    document.addEventListener('paste', (e) => {
      const file = e.clipboardData.files[0];
      if (file && file.type.startsWith('image/')) {
        this.readFile(file);
      }
    });
  }

  readFile(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
      window.ocr.processImage(e.target.result);
    };
    reader.readAsDataURL(file);
  }

  updatePreview(imageData) {
    this.currentImageData = imageData;
    this.previewImage.src = imageData;
    this.previewImage.classList.add('show');
    this.uploadContent.classList.add('hide');
  }

  clear() {
    this.currentImageData = null;
    this.previewImage.src = '';
    this.previewImage.classList.remove('show');
    this.uploadContent.classList.remove('hide');
  }

  initPluginEntry() {
    // 为了确保 window.processPluginImage 总是指向正确的处理函数
    window.processPluginImage = (imageData) => {
      if (window.ocr && typeof window.ocr.processImage === 'function') {
        window.ocr.processImage(imageData);
      }
    };
  }
} 