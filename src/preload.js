const { clipboard } = require('electron')
const fs = require('fs')
const fsPromises = require('fs').promises
const path = require('path')

// 确保在 DOM 加载完成后初始化 services
window.addEventListener('DOMContentLoaded', () => {
  // 清理临时文件
  const cleanupTempFiles = async (dir) => {
    try {
      const files = await fsPromises.readdir(dir)
      const now = Date.now()
      for (const file of files) {
        if (file.startsWith('qwen_ocr_')) {
          const filePath = path.join(dir, file)
          const stats = await fsPromises.stat(filePath)
          // 删除超过1小时的临时文件
          if (now - stats.mtimeMs > 3600000) {
            await fsPromises.unlink(filePath)
          }
        }
      }
    } catch (error) {
      console.error('清理临时文件失败:', error)
    }
  }

  window.services = {
    // 获取设置
    getSettings: () => {
      try {
        return utools.dbStorage.getItem('qwen_ocr_settings') || {
          tokens: [],
          prompt: ''
        }
      } catch (error) {
        console.error('获取设置失败:', error)
        return { tokens: [], prompt: '' }
      }
    },

    // 保存设置
    saveSettings: (settings) => {
      try {
        if (!settings || typeof settings !== 'object') {
          throw new Error('无效的设置对象')
        }
        // 确保 tokens 是数组格式
        if (typeof settings.tokens === 'string') {
          settings.tokens = settings.tokens.split(',').map(t => t.trim()).filter(t => t)
        }
        if (!Array.isArray(settings.tokens)) {
          settings.tokens = []
        }
        utools.dbStorage.setItem('qwen_ocr_settings', settings)
      } catch (error) {
        console.error('保存设置失败:', error)
        throw error
      }
    },

    // 获取随机 token
    getRandomToken: () => {
      try {
        const settings = utools.dbStorage.getItem('qwen_ocr_settings') || { tokens: [] }
        const tokens = settings.tokens
        if (!tokens || tokens.length === 0) return null
        return tokens[Math.floor(Math.random() * tokens.length)]
      } catch (error) {
        console.error('获取Token失败:', error)
        return null
      }
    },

    // 复制文本到剪贴板
    copyToClipboard: (text) => {
      try {
        if (typeof text !== 'string') {
          throw new Error('复制内容必须是字符串')
        }
        clipboard.writeText(text)
      } catch (error) {
        console.error('复制到剪贴板失败:', error)
        throw error
      }
    },

    // 保存图片到临时文件
    saveTempImage: (base64Data) => {
      try {
        if (!base64Data || typeof base64Data !== 'string') {
          throw new Error('无效的图片数据')
        }
        const tempDir = utools.getPath('temp')
        const imagePath = path.join(tempDir, `qwen_ocr_${Date.now()}.png`)
        const base64Image = base64Data.replace(/^data:image\/\w+;base64,/, '')
        fs.writeFileSync(imagePath, Buffer.from(base64Image, 'base64'))
        return imagePath
      } catch (error) {
        console.error('保存临时图片失败:', error)
        throw error
      }
    },

    // 从文件路径读取图片为 base64
    readImageAsBase64: (filePath) => {
      try {
        if (!filePath || typeof filePath !== 'string') {
          throw new Error('无效的文件路径')
        }
        const data = fs.readFileSync(filePath)
        return `data:image/png;base64,${data.toString('base64')}`
      } catch (error) {
        console.error('读取图片失败:', error)
        throw error
      }
    }
  }

  // 定期清理临时文件
  const tempDir = utools.getPath('temp')
  cleanupTempFiles(tempDir)
  setInterval(() => cleanupTempFiles(tempDir), 3600000) // 每小时清理一次

  // 监听插件进入事件
  utools.onPluginEnter(({ code, type, payload }) => {
    try {
      console.log('Plugin enter event:', { code, type, payload });
      
      if (payload === '截图文字识别') {
        utools.hideMainWindow();
        setTimeout(() => {
          utools.screenCapture((imageBase64) => {
            utools.showMainWindow();
            if (imageBase64 && window.processPluginImage) {
              window.processPluginImage(imageBase64);
            }
          });
        }, 100);
      }
      // 处理图片类型输入
      else if (type === 'img') {
        const imageData = payload; // payload 已经是 base64 字符串
        console.log('Processing image from enter event');
        if (window.processPluginImage) {
          window.processPluginImage(imageData);
        } else {
          console.error('processPluginImage is not defined in onPluginEnter handler');
        }
      }
      // 处理文件类型输入
      else if (type === 'files' && Array.isArray(payload) && payload.length > 0) {
        const fileObj = payload[0];
        if (fileObj.isFile && /\.(jpg|jpeg|png|gif|bmp)$/i.test(fileObj.path)) {
          const imageData = window.services.readImageAsBase64(fileObj.path);
          if (window.processPluginImage) {
            window.processPluginImage(imageData);
          }
        }
      }
    } catch (error) {
      console.error('插件处理失败:', error);
    }
  })
}) 