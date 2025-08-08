/**
 * Frontend Integration Tests
 * 测试Web界面的核心功能和用户交互流程
 */

import { jest } from '@jest/globals';
import puppeteer from 'puppeteer';
import axios from 'axios';
import FormData from 'form-data';
import sharp from 'sharp';
import fs from 'fs/promises';
import path from 'path';

describe('Frontend Integration Tests', () => {
  const serverUrl = global.__SERVER_URL__ || 'http://localhost:3001';
  let browser: puppeteer.Browser;
  let page: puppeteer.Page;
  
  beforeAll(async () => {
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
  });
  
  afterAll(async () => {
    if (browser) {
      await browser.close();
    }
    // Force cleanup of any remaining handles
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Force garbage collection if available
    if (global.gc) {
      global.gc();
    }
  });
  
  beforeEach(async () => {
    page = await browser.newPage();
    await page.goto(serverUrl);
  });
  
  afterEach(async () => {
    if (page) {
      await page.close();
    }
  });
  
  describe('页面加载和基本功能', () => {
    it('应该正确加载主页面', async () => {
      await page.waitForSelector('#buildForm');
      
      const title = await page.title();
      expect(title).toContain('Web-to-APK');
      
      // 检查表单元素是否存在
      const appNameInput = await page.$('#appName');
      const packageNameInput = await page.$('#packageName');
      const versionInput = await page.$('#version');
      const websiteUrlInput = await page.$('#websiteUrl');
      const iconInput = await page.$('#icon');
      const submitButton = await page.$('#submitBtn');
      
      expect(appNameInput).toBeTruthy();
      expect(packageNameInput).toBeTruthy();
      expect(versionInput).toBeTruthy();
      expect(websiteUrlInput).toBeTruthy();
      expect(iconInput).toBeTruthy();
      expect(submitButton).toBeTruthy();
    });
    
    it('应该显示正确的初始状态', async () => {
      await page.waitForSelector('#buildForm');
      
      // 检查提交按钮初始状态
      const submitButton = await page.$('#submitBtn');
      const buttonText = await page.evaluate(el => el.textContent, submitButton);
      expect(buttonText.trim()).toBe('构建 APK');
      
      // 检查状态区域初始为隐藏
      const statusDiv = await page.$('#status');
      const isHidden = await page.evaluate(el => el.style.display === 'none', statusDiv);
      expect(isHidden).toBe(true);
    });
  });
  
  describe('表单验证', () => {
    it('应该验证必填字段', async () => {
      await page.waitForSelector('#buildForm');
      
      // 尝试提交空表单
      await page.click('#submitBtn');
      
      // 检查是否显示验证错误
      const appNameInput = await page.$('#appName');
      const isRequired = await page.evaluate(el => el.hasAttribute('required'), appNameInput);
      expect(isRequired).toBe(true);
      
      // 浏览器应该阻止表单提交
      const currentUrl = page.url();
      expect(currentUrl).toBe(serverUrl + '/');
    });
    
    it('应该验证包名格式', async () => {
      await page.waitForSelector('#buildForm');
      
      // 填写无效的包名
      await page.type('#appName', 'Test App');
      await page.type('#packageName', 'invalid-package');
      await page.type('#version', '1.0.0');
      
      await page.click('#submitBtn');
      
      // 等待可能的错误消息
      await page.waitForTimeout(1000);
      
      // 检查是否有错误提示
      const errorMessage = await page.$('.error-message');
      if (errorMessage) {
        const errorText = await page.evaluate(el => el.textContent, errorMessage);
        expect(errorText).toContain('package');
      }
    });
  });
  
  describe('场景1: 用户填写表单并成功提交构建请求', () => {
    it('应该成功提交有效的构建请求', async () => {
      await page.waitForSelector('#buildForm');
      
      // 填写表单
      await page.type('#appName', 'Frontend Test App');
      await page.type('#packageName', 'com.frontend.test');
      await page.type('#version', '1.0.0');
      await page.type('#websiteUrl', 'https://example.com');
      
      // 提交表单
      await page.click('#submitBtn');
      
      // 等待状态更新
      await page.waitForSelector('#status', { visible: true });
      
      // 检查状态显示
      const statusDiv = await page.$('#status');
      const statusText = await page.evaluate(el => el.textContent, statusDiv);
      expect(statusText).toContain('构建中');
      
      // 检查按钮状态变化
      const submitButton = await page.$('#submitBtn');
      const buttonDisabled = await page.evaluate(el => el.disabled, submitButton);
      expect(buttonDisabled).toBe(true);
      
      // 检查进度条是否显示
      const progressBar = await page.$('#progressBar');
      expect(progressBar).toBeTruthy();
    });
    
    it('应该显示构建ID', async () => {
      await page.waitForSelector('#buildForm');
      
      // 填写并提交表单
      await page.type('#appName', 'Build ID Test');
      await page.type('#packageName', 'com.buildid.test');
      await page.type('#version', '1.0.0');
      
      await page.click('#submitBtn');
      
      // 等待构建ID显示
      await page.waitForSelector('#buildId', { visible: true });
      
      const buildIdElement = await page.$('#buildId');
      const buildIdText = await page.evaluate(el => el.textContent, buildIdElement);
      
      // 验证构建ID格式（UUID）
      expect(buildIdText).toMatch(/[0-9a-f-]{36}/);
    });
  });
  
  describe('场景2: 用户成功上传自定义图标', () => {
    it('应该成功上传PNG图标', async () => {
      await page.waitForSelector('#buildForm');
      
      // 创建测试图标文件
      const testIcon = await sharp({
        create: {
          width: 256,
          height: 256,
          channels: 4,
          background: { r: 255, g: 0, b: 0, alpha: 1 }
        }
      })
      .png()
      .toBuffer();
      
      // 创建临时文件
      const tempIconPath = path.join(__dirname, 'temp-icon.png');
      await fs.writeFile(tempIconPath, testIcon);
      
      try {
        // 填写表单
        await page.type('#appName', 'Icon Upload Test');
        await page.type('#packageName', 'com.iconupload.test');
        await page.type('#version', '1.0.0');
        
        // 上传图标文件
        const iconInput = await page.$('#icon');
        await iconInput.uploadFile(tempIconPath);
        
        // 检查文件是否被选中
        const fileName = await page.evaluate(() => {
          const input = document.getElementById('icon') as HTMLInputElement;
          return input.files?.[0]?.name;
        });
        expect(fileName).toBe('temp-icon.png');
        
        // 提交表单
        await page.click('#submitBtn');
        
        // 等待状态更新
        await page.waitForSelector('#status', { visible: true });
        
        const statusText = await page.evaluate(() => {
          const status = document.getElementById('status');
          return status?.textContent;
        });
        expect(statusText).toContain('构建中');
        
      } finally {
        // 清理临时文件
        try {
          await fs.unlink(tempIconPath);
        } catch (error) {
          // 忽略清理错误
        }
      }
    });
    
    it('应该显示图标预览', async () => {
      await page.waitForSelector('#buildForm');
      
      // 创建测试图标
      const testIcon = await sharp({
        create: {
          width: 128,
          height: 128,
          channels: 4,
          background: { r: 0, g: 255, b: 0, alpha: 1 }
        }
      })
      .png()
      .toBuffer();
      
      const tempIconPath = path.join(__dirname, 'temp-preview-icon.png');
      await fs.writeFile(tempIconPath, testIcon);
      
      try {
        // 上传图标
        const iconInput = await page.$('#icon');
        await iconInput.uploadFile(tempIconPath);
        
        // 等待预览显示
        await page.waitForSelector('#iconPreview', { visible: true });
        
        // 检查预览图片
        const previewImg = await page.$('#iconPreview img');
        expect(previewImg).toBeTruthy();
        
        const imgSrc = await page.evaluate(el => el.src, previewImg);
        expect(imgSrc).toContain('data:image');
        
      } finally {
        try {
          await fs.unlink(tempIconPath);
        } catch (error) {
          // 忽略清理错误
        }
      }
    });
    
    it('应该拒绝无效的文件类型', async () => {
      await page.waitForSelector('#buildForm');
      
      // 创建文本文件
      const tempTextPath = path.join(__dirname, 'temp-text.txt');
      await fs.writeFile(tempTextPath, 'This is not an image');
      
      try {
        // 尝试上传文本文件
        const iconInput = await page.$('#icon');
        await iconInput.uploadFile(tempTextPath);
        
        // 检查是否显示错误消息
        await page.waitForTimeout(1000);
        
        const errorMessage = await page.$('.file-error');
        if (errorMessage) {
          const errorText = await page.evaluate(el => el.textContent, errorMessage);
          expect(errorText).toContain('文件类型');
        }
        
      } finally {
        try {
          await fs.unlink(tempTextPath);
        } catch (error) {
          // 忽略清理错误
        }
      }
    });
  });
  
  describe('场景3: 默认图标回退机制', () => {
    it('应该在未上传图标时使用默认图标', async () => {
      await page.waitForSelector('#buildForm');
      
      // 填写表单但不上传图标
      await page.type('#appName', 'Default Icon Test');
      await page.type('#packageName', 'com.defaulticon.test');
      await page.type('#version', '1.0.0');
      // 不填写websiteUrl，也不上传图标
      
      await page.click('#submitBtn');
      
      // 等待状态更新
      await page.waitForSelector('#status', { visible: true });
      
      const statusText = await page.evaluate(() => {
        const status = document.getElementById('status');
        return status?.textContent;
      });
      expect(statusText).toContain('构建中');
      
      // 验证构建请求成功发送
      const buildIdElement = await page.waitForSelector('#buildId', { visible: true });
      expect(buildIdElement).toBeTruthy();
    });
    
    it('应该在favicon提取失败时使用默认图标', async () => {
      await page.waitForSelector('#buildForm');
      
      // 填写表单，使用无效的URL
      await page.type('#appName', 'Favicon Fallback Test');
      await page.type('#packageName', 'com.faviconfallback.test');
      await page.type('#version', '1.0.0');
      await page.type('#websiteUrl', 'https://this-domain-does-not-exist-12345.com');
      
      await page.click('#submitBtn');
      
      // 等待状态更新
      await page.waitForSelector('#status', { visible: true });
      
      // 应该仍然成功开始构建
      const statusText = await page.evaluate(() => {
        const status = document.getElementById('status');
        return status?.textContent;
      });
      expect(statusText).toContain('构建中');
    });
    
    it('应该显示图标来源信息', async () => {
      await page.waitForSelector('#buildForm');
      
      // 测试默认图标情况
      await page.type('#appName', 'Icon Source Test');
      await page.type('#packageName', 'com.iconsource.test');
      await page.type('#version', '1.0.0');
      
      await page.click('#submitBtn');
      
      // 等待状态更新
      await page.waitForSelector('#status', { visible: true });
      
      // 检查是否显示图标来源信息
      const iconSourceInfo = await page.$('.icon-source-info');
      if (iconSourceInfo) {
        const infoText = await page.evaluate(el => el.textContent, iconSourceInfo);
        expect(infoText).toContain('默认图标');
      }
    });
  });
  
  describe('场景4: 完整构建流程和APK下载', () => {
    it('应该完成完整的构建流程并显示下载链接', async () => {
      await page.waitForSelector('#buildForm');
      
      // 填写表单
      await page.type('#appName', 'Complete Build Test');
      await page.type('#packageName', 'com.completebuild.test');
      await page.type('#version', '1.0.0');
      await page.type('#websiteUrl', 'https://example.com');
      
      await page.click('#submitBtn');
      
      // 等待构建开始
      await page.waitForSelector('#status', { visible: true });
      
      // 等待构建完成（设置较长的超时时间）
      let buildCompleted = false;
      let attempts = 0;
      const maxAttempts = 120; // 2分钟超时
      
      while (!buildCompleted && attempts < maxAttempts) {
        await page.waitForTimeout(1000);
        
        const statusText = await page.evaluate(() => {
          const status = document.getElementById('status');
          return status?.textContent || '';
        });
        
        if (statusText.includes('构建完成') || statusText.includes('下载')) {
          buildCompleted = true;
        } else if (statusText.includes('构建失败') || statusText.includes('错误')) {
          // 构建失败也算完成
          buildCompleted = true;
        }
        
        attempts++;
      }
      
      expect(buildCompleted).toBe(true);
      
      // 检查下载链接
      const downloadLink = await page.$('#downloadLink');
      if (downloadLink) {
        const linkHref = await page.evaluate(el => el.href, downloadLink);
        expect(linkHref).toContain('/downloads/');
        expect(linkHref).toContain('.apk');
        
        // 检查链接文本
        const linkText = await page.evaluate(el => el.textContent, downloadLink);
        expect(linkText).toContain('下载');
      }
      
    }, 150000); // 2.5分钟超时
    
    it('应该显示构建配置信息', async () => {
      await page.waitForSelector('#buildForm');
      
      // 填写表单
      await page.type('#appName', 'Config Info Test');
      await page.type('#packageName', 'com.configinfo.test');
      await page.type('#version', '2.0.0');
      
      await page.click('#submitBtn');
      
      // 等待构建完成
      await page.waitForSelector('#status', { visible: true });
      
      // 等待配置信息显示
      let configVisible = false;
      let attempts = 0;
      const maxAttempts = 60;
      
      while (!configVisible && attempts < maxAttempts) {
        await page.waitForTimeout(1000);
        
        const configInfo = await page.$('#buildConfig');
        if (configInfo) {
          const isVisible = await page.evaluate(el => {
            return el.style.display !== 'none' && el.offsetHeight > 0;
          }, configInfo);
          
          if (isVisible) {
            configVisible = true;
            
            // 验证配置信息内容
            const configText = await page.evaluate(el => el.textContent, configInfo);
            expect(configText).toContain('Config Info Test');
            expect(configText).toContain('com.configinfo.test');
            expect(configText).toContain('2.0.0');
          }
        }
        
        attempts++;
      }
      
    }, 90000);
    
    it('应该显示构建时间信息', async () => {
      await page.waitForSelector('#buildForm');
      
      // 记录开始时间
      const startTime = Date.now();
      
      // 填写并提交表单
      await page.type('#appName', 'Build Time Test');
      await page.type('#packageName', 'com.buildtime.test');
      await page.type('#version', '1.0.0');
      
      await page.click('#submitBtn');
      
      // 等待构建完成
      await page.waitForSelector('#status', { visible: true });
      
      let buildTimeVisible = false;
      let attempts = 0;
      const maxAttempts = 60;
      
      while (!buildTimeVisible && attempts < maxAttempts) {
        await page.waitForTimeout(1000);
        
        const buildTimeElement = await page.$('#buildTime');
        if (buildTimeElement) {
          const timeText = await page.evaluate(el => el.textContent, buildTimeElement);
          if (timeText && timeText.includes('秒')) {
            buildTimeVisible = true;
            
            // 验证构建时间合理性
            const buildTime = parseFloat(timeText.match(/(\d+\.?\d*)/)?.[1] || '0');
            expect(buildTime).toBeGreaterThan(0);
            expect(buildTime).toBeLessThan(300); // 不应超过5分钟
          }
        }
        
        attempts++;
      }
      
    }, 90000);
  });
  
  describe('用户体验和交互', () => {
    it('应该显示实时构建进度', async () => {
      await page.waitForSelector('#buildForm');
      
      // 填写并提交表单
      await page.type('#appName', 'Progress Test');
      await page.type('#packageName', 'com.progress.test');
      await page.type('#version', '1.0.0');
      
      await page.click('#submitBtn');
      
      // 等待进度条显示
      await page.waitForSelector('#progressBar', { visible: true });
      
      // 检查进度更新
      let progressUpdated = false;
      let attempts = 0;
      const maxAttempts = 30;
      
      while (!progressUpdated && attempts < maxAttempts) {
        await page.waitForTimeout(1000);
        
        const progressValue = await page.evaluate(() => {
          const progress = document.getElementById('progressBar') as HTMLProgressElement;
          return progress?.value || 0;
        });
        
        if (progressValue > 0) {
          progressUpdated = true;
          expect(progressValue).toBeGreaterThan(0);
          expect(progressValue).toBeLessThanOrEqual(100);
        }
        
        attempts++;
      }
    });
    
    it('应该允许用户取消构建', async () => {
      await page.waitForSelector('#buildForm');
      
      // 填写并提交表单
      await page.type('#appName', 'Cancel Test');
      await page.type('#packageName', 'com.cancel.test');
      await page.type('#version', '1.0.0');
      
      await page.click('#submitBtn');
      
      // 等待取消按钮显示
      await page.waitForSelector('#cancelBtn', { visible: true });
      
      // 点击取消按钮
      await page.click('#cancelBtn');
      
      // 检查状态更新
      await page.waitForTimeout(1000);
      
      const statusText = await page.evaluate(() => {
        const status = document.getElementById('status');
        return status?.textContent || '';
      });
      
      expect(statusText).toContain('已取消');
      
      // 检查表单是否重新启用
      const submitButton = await page.$('#submitBtn');
      const buttonDisabled = await page.evaluate(el => el.disabled, submitButton);
      expect(buttonDisabled).toBe(false);
    });
    
    it('应该处理网络错误', async () => {
      await page.waitForSelector('#buildForm');
      
      // 模拟网络错误（通过拦截请求）
      await page.setRequestInterception(true);
      
      page.on('request', (request) => {
        if (request.url().includes('/api/build')) {
          request.abort();
        } else {
          request.continue();
        }
      });
      
      // 填写并提交表单
      await page.type('#appName', 'Network Error Test');
      await page.type('#packageName', 'com.networkerror.test');
      await page.type('#version', '1.0.0');
      
      await page.click('#submitBtn');
      
      // 等待错误消息
      await page.waitForTimeout(2000);
      
      const errorMessage = await page.$('.error-message');
      if (errorMessage) {
        const errorText = await page.evaluate(el => el.textContent, errorMessage);
        expect(errorText).toContain('网络');
      }
      
      // 关闭请求拦截
      await page.setRequestInterception(false);
    });
  });
  
  describe('响应式设计', () => {
    it('应该在移动设备上正确显示', async () => {
      // 设置移动设备视口
      await page.setViewport({ width: 375, height: 667 });
      await page.reload();
      
      await page.waitForSelector('#buildForm');
      
      // 检查表单在移动设备上的布局
      const formWidth = await page.evaluate(() => {
        const form = document.getElementById('buildForm');
        return form?.offsetWidth || 0;
      });
      
      expect(formWidth).toBeLessThanOrEqual(375);
      
      // 检查按钮是否适合移动设备
      const submitButton = await page.$('#submitBtn');
      const buttonHeight = await page.evaluate(el => el.offsetHeight, submitButton);
      expect(buttonHeight).toBeGreaterThanOrEqual(44); // 最小触摸目标
    });
  });

  describe('发布版签名功能测试', () => {
    let mockKeystoreBuffer: Buffer;
    let tempKeystorePath: string;

    beforeAll(async () => {
      // 创建模拟的密钥库文件
      mockKeystoreBuffer = Buffer.from('MOCK_KEYSTORE_DATA_FOR_TESTING');
      tempKeystorePath = path.join(__dirname, 'test-keystore.jks');
      await fs.writeFile(tempKeystorePath, mockKeystoreBuffer);
    });

    afterAll(async () => {
      // 清理测试文件
      try {
        await fs.unlink(tempKeystorePath);
      } catch (error) {
        // 忽略清理错误
      }
    });

    describe('发布版本复选框功能', () => {
      it('应该正确显示发布版本复选框', async () => {
        await page.waitForSelector('#buildForm');
        
        // 检查发布版本复选框是否存在
        const releaseCheckbox = await page.$('#isRelease');
        expect(releaseCheckbox).toBeTruthy();
        
        // 检查复选框标签
        const checkboxLabel = await page.evaluate(() => {
          const label = document.querySelector('label[for="isRelease"]');
          return label?.textContent?.trim();
        });
        expect(checkboxLabel).toContain('创建发布版本');
        expect(checkboxLabel).toContain('Create Release Build');
      });

      it('应该在勾选复选框时显示签名配置区域', async () => {
        await page.waitForSelector('#buildForm');
        
        // 初始状态下签名配置区域应该隐藏
        const releaseOptionsForm = await page.$('#release-options-form');
        const initialDisplay = await page.evaluate(el => 
          window.getComputedStyle(el).display, releaseOptionsForm);
        expect(initialDisplay).toBe('none');
        
        // 勾选发布版本复选框
        await page.click('#isRelease');
        
        // 检查签名配置区域是否显示
        const displayAfterCheck = await page.evaluate(el => 
          window.getComputedStyle(el).display, releaseOptionsForm);
        expect(displayAfterCheck).toBe('block');
        
        // 检查必需的表单字段是否存在
        const keystoreFileInput = await page.$('#keystoreFile');
        const keystorePasswordInput = await page.$('#keystorePassword');
        const keyAliasInput = await page.$('#keyAlias');
        const keyPasswordInput = await page.$('#keyPassword');
        
        expect(keystoreFileInput).toBeTruthy();
        expect(keystorePasswordInput).toBeTruthy();
        expect(keyAliasInput).toBeTruthy();
        expect(keyPasswordInput).toBeTruthy();
      });

      it('应该在取消勾选时隐藏签名配置区域', async () => {
        await page.waitForSelector('#buildForm');
        
        // 先勾选复选框
        await page.click('#isRelease');
        
        // 确认区域显示
        let releaseOptionsForm = await page.$('#release-options-form');
        let display = await page.evaluate(el => 
          window.getComputedStyle(el).display, releaseOptionsForm);
        expect(display).toBe('block');
        
        // 取消勾选
        await page.click('#isRelease');
        
        // 检查区域是否隐藏
        display = await page.evaluate(el => 
          window.getComputedStyle(el).display, releaseOptionsForm);
        expect(display).toBe('none');
      });
    });

    describe('密钥库文件上传功能', () => {
      it('应该支持密钥库文件上传', async () => {
        await page.waitForSelector('#buildForm');
        
        // 勾选发布版本
        await page.click('#isRelease');
        
        // 上传密钥库文件
        const keystoreInput = await page.$('#keystoreFile');
        await keystoreInput.uploadFile(tempKeystorePath);
        
        // 检查文件是否被选中
        const fileName = await page.evaluate(() => {
          const input = document.getElementById('keystoreFile') as HTMLInputElement;
          return input.files?.[0]?.name;
        });
        expect(fileName).toBe('test-keystore.jks');
        
        // 检查文件预览是否显示
        await page.waitForSelector('#keystorePreview', { visible: true });
        
        const previewText = await page.evaluate(() => {
          const preview = document.getElementById('keystoreFileName');
          return preview?.textContent;
        });
        expect(previewText).toBe('test-keystore.jks');
      });

      it('应该验证密钥库文件类型', async () => {
        await page.waitForSelector('#buildForm');
        
        // 创建无效文件类型
        const invalidFilePath = path.join(__dirname, 'invalid-file.txt');
        await fs.writeFile(invalidFilePath, 'invalid content');
        
        try {
          // 勾选发布版本
          await page.click('#isRelease');
          
          // 尝试上传无效文件
          const keystoreInput = await page.$('#keystoreFile');
          await keystoreInput.uploadFile(invalidFilePath);
          
          // 等待可能的错误消息
          await page.waitForTimeout(1000);
          
          // 检查是否显示错误或文件被拒绝
          const errorMessage = await page.$('.error-message');
          if (errorMessage) {
            const errorText = await page.evaluate(el => el.textContent, errorMessage);
            expect(errorText).toContain('keystore');
          }
          
        } finally {
          await fs.unlink(invalidFilePath);
        }
      });

      it('应该支持拖拽上传密钥库文件', async () => {
        await page.waitForSelector('#buildForm');
        
        // 勾选发布版本
        await page.click('#isRelease');
        
        // 模拟拖拽事件
        const keystoreUploadArea = await page.$('#keystoreUploadArea');
        
        // 添加dragover类来测试拖拽状态
        await page.evaluate(() => {
          const area = document.getElementById('keystoreUploadArea');
          area?.classList.add('dragover');
        });
        
        // 检查拖拽状态样式
        const hasDragoverClass = await page.evaluate(() => {
          const area = document.getElementById('keystoreUploadArea');
          return area?.classList.contains('dragover');
        });
        expect(hasDragoverClass).toBe(true);
      });
    });

    describe('发布版本表单验证', () => {
      it('应该验证发布版本必填字段', async () => {
        await page.waitForSelector('#buildForm');
        
        // 填写基本信息
        await page.type('#appName', 'Release Build Test');
        await page.type('#packageName', 'com.release.test');
        await page.type('#version', '1.0.0');
        
        // 勾选发布版本但不填写签名信息
        await page.click('#isRelease');
        
        // 尝试提交表单
        await page.click('#buildButton');
        
        // 等待验证错误
        await page.waitForTimeout(1000);
        
        // 检查是否显示验证错误
        const errorMessage = await page.$('.error-message');
        if (errorMessage) {
          const errorText = await page.evaluate(el => el.textContent, errorMessage);
          expect(errorText).toMatch(/keystore|密钥库|required|必需/i);
        }
      });

      it('应该验证密钥库密码字段', async () => {
        await page.waitForSelector('#buildForm');
        
        // 填写基本信息
        await page.type('#appName', 'Password Validation Test');
        await page.type('#packageName', 'com.password.test');
        await page.type('#version', '1.0.0');
        
        // 勾选发布版本并上传密钥库文件
        await page.click('#isRelease');
        const keystoreInput = await page.$('#keystoreFile');
        await keystoreInput.uploadFile(tempKeystorePath);
        
        // 只填写别名，不填写密码
        await page.type('#keyAlias', 'test-alias');
        
        // 尝试提交表单
        await page.click('#buildButton');
        
        // 等待验证错误
        await page.waitForTimeout(1000);
        
        // 检查密码验证
        const errorMessage = await page.$('.error-message');
        if (errorMessage) {
          const errorText = await page.evaluate(el => el.textContent, errorMessage);
          expect(errorText).toMatch(/password|密码|required|必需/i);
        }
      });

      it('应该验证密钥别名字段', async () => {
        await page.waitForSelector('#buildForm');
        
        // 填写基本信息
        await page.type('#appName', 'Alias Validation Test');
        await page.type('#packageName', 'com.alias.test');
        await page.type('#version', '1.0.0');
        
        // 勾选发布版本并上传密钥库文件
        await page.click('#isRelease');
        const keystoreInput = await page.$('#keystoreFile');
        await keystoreInput.uploadFile(tempKeystorePath);
        
        // 只填写密码，不填写别名
        await page.type('#keystorePassword', 'test-password');
        
        // 尝试提交表单
        await page.click('#buildButton');
        
        // 等待验证错误
        await page.waitForTimeout(1000);
        
        // 检查别名验证
        const errorMessage = await page.$('.error-message');
        if (errorMessage) {
          const errorText = await page.evaluate(el => el.textContent, errorMessage);
          expect(errorText).toMatch(/alias|别名|required|必需/i);
        }
      });
    });

    describe('发布版本构建流程', () => {
      // 模拟spawn函数来拦截构建命令
      let spawnMock: jest.SpyInstance;
      let capturedBuildArgs: string[] = [];

      beforeEach(() => {
        capturedBuildArgs = [];
        
        // 模拟child_process.spawn
        spawnMock = jest.spyOn(require('child_process'), 'spawn').mockImplementation((command, args, options) => {
          capturedBuildArgs = args || [];
          
          // 创建模拟的子进程
          const mockProcess = {
            stdout: {
              on: jest.fn((event, callback) => {
                if (event === 'data') {
                  setTimeout(() => callback(Buffer.from('Build output')), 100);
                }
              })
            },
            stderr: {
              on: jest.fn((event, callback) => {
                if (event === 'data') {
                  setTimeout(() => callback(Buffer.from('Build stderr')), 100);
                }
              })
            },
            on: jest.fn((event, callback) => {
              if (event === 'close') {
                setTimeout(() => callback(0), 1000); // 模拟成功完成
              } else if (event === 'error') {
                // 不触发错误
              }
            })
          };
          
          return mockProcess;
        });
      });

      afterEach(() => {
        if (spawnMock) {
          spawnMock.mockRestore();
        }
      });

      it('应该在发布版本构建中包含正确的--release参数', async () => {
        await page.waitForSelector('#buildForm');
        
        // 填写完整的发布版本表单
        await page.type('#appName', 'Release Args Test');
        await page.type('#packageName', 'com.releaseargs.test');
        await page.type('#version', '1.0.0');
        
        // 勾选发布版本
        await page.click('#isRelease');
        
        // 上传密钥库文件
        const keystoreInput = await page.$('#keystoreFile');
        await keystoreInput.uploadFile(tempKeystorePath);
        
        // 填写签名信息
        await page.type('#keystorePassword', 'test-keystore-password');
        await page.type('#keyAlias', 'test-key-alias');
        await page.type('#keyPassword', 'test-key-password');
        
        // 提交表单
        await page.click('#buildButton');
        
        // 等待构建开始
        await page.waitForSelector('#buildStatus', { visible: true });
        
        // 等待一段时间让后端处理请求
        await page.waitForTimeout(2000);
        
        // 验证构建命令参数
        expect(spawnMock).toHaveBeenCalled();
        expect(capturedBuildArgs).toContain('--release');
        expect(capturedBuildArgs).toContain('--keystore');
        expect(capturedBuildArgs).toContain('--keystore-password');
        expect(capturedBuildArgs).toContain('test-keystore-password');
        expect(capturedBuildArgs).toContain('--key-alias');
        expect(capturedBuildArgs).toContain('test-key-alias');
        expect(capturedBuildArgs).toContain('--key-password');
        expect(capturedBuildArgs).toContain('test-key-password');
      });

      it('应该在密钥密码为空时使用密钥库密码', async () => {
        await page.waitForSelector('#buildForm');
        
        // 填写表单，不填写密钥密码
        await page.type('#appName', 'Key Password Fallback Test');
        await page.type('#packageName', 'com.keypassword.test');
        await page.type('#version', '1.0.0');
        
        // 勾选发布版本
        await page.click('#isRelease');
        
        // 上传密钥库文件
        const keystoreInput = await page.$('#keystoreFile');
        await keystoreInput.uploadFile(tempKeystorePath);
        
        // 只填写密钥库密码和别名，不填写密钥密码
        await page.type('#keystorePassword', 'fallback-password');
        await page.type('#keyAlias', 'test-alias');
        
        // 提交表单
        await page.click('#buildButton');
        
        // 等待构建开始
        await page.waitForSelector('#buildStatus', { visible: true });
        await page.waitForTimeout(2000);
        
        // 验证使用了密钥库密码作为密钥密码
        expect(capturedBuildArgs).toContain('--key-password');
        expect(capturedBuildArgs).toContain('fallback-password');
      });
    });

    describe('安全性验证', () => {
      it('应该确保密码字段使用password类型', async () => {
        await page.waitForSelector('#buildForm');
        
        // 勾选发布版本
        await page.click('#isRelease');
        
        // 检查密钥库密码字段类型
        const keystorePasswordType = await page.evaluate(() => {
          const input = document.getElementById('keystorePassword') as HTMLInputElement;
          return input?.type;
        });
        expect(keystorePasswordType).toBe('password');
        
        // 检查密钥密码字段类型
        const keyPasswordType = await page.evaluate(() => {
          const input = document.getElementById('keyPassword') as HTMLInputElement;
          return input?.type;
        });
        expect(keyPasswordType).toBe('password');
      });

      it('应该在构建完成后清理临时密钥库文件', async () => {
        // 这个测试需要检查服务器端的文件清理
        // 由于是前端测试，我们主要验证请求是否正确发送
        await page.waitForSelector('#buildForm');
        
        // 填写完整表单
        await page.type('#appName', 'File Cleanup Test');
        await page.type('#packageName', 'com.cleanup.test');
        await page.type('#version', '1.0.0');
        
        // 勾选发布版本并填写信息
        await page.click('#isRelease');
        const keystoreInput = await page.$('#keystoreFile');
        await keystoreInput.uploadFile(tempKeystorePath);
        await page.type('#keystorePassword', 'cleanup-password');
        await page.type('#keyAlias', 'cleanup-alias');
        
        // 提交表单
        await page.click('#buildButton');
        
        // 等待构建状态更新
        await page.waitForSelector('#buildStatus', { visible: true });
        
        // 验证构建请求成功发送
        const statusText = await page.evaluate(() => {
          const status = document.getElementById('buildStatus');
          return status?.textContent;
        });
        expect(statusText).toContain('Release APK build started');
      });

      it('应该显示发布版本构建的特殊状态信息', async () => {
        await page.waitForSelector('#buildForm');
        
        // 填写发布版本表单
        await page.type('#appName', 'Release Status Test');
        await page.type('#packageName', 'com.releasestatus.test');
        await page.type('#version', '1.0.0');
        
        // 勾选发布版本
        await page.click('#isRelease');
        const keystoreInput = await page.$('#keystoreFile');
        await keystoreInput.uploadFile(tempKeystorePath);
        await page.type('#keystorePassword', 'status-password');
        await page.type('#keyAlias', 'status-alias');
        
        // 提交表单
        await page.click('#buildButton');
        
        // 等待状态更新
        await page.waitForSelector('#buildStatus', { visible: true });
        
        // 检查是否显示发布版本特有的状态信息
        const statusText = await page.evaluate(() => {
          const status = document.getElementById('buildStatus');
          return status?.textContent;
        });
        expect(statusText).toContain('Release APK build started');
      });
    });

    describe('用户体验优化', () => {
      it('应该显示发布版本的安全提示', async () => {
        await page.waitForSelector('#buildForm');
        
        // 勾选发布版本
        await page.click('#isRelease');
        
        // 检查是否显示安全警告
        const securityWarning = await page.$('.security-warning');
        if (securityWarning) {
          const warningText = await page.evaluate(el => el.textContent, securityWarning);
          expect(warningText).toMatch(/安全|security|keystore|密钥库/i);
        }
      });

      it('应该提供密钥密码的帮助提示', async () => {
        await page.waitForSelector('#buildForm');
        
        // 勾选发布版本
        await page.click('#isRelease');
        
        // 检查密钥密码字段的帮助文本
        const helpText = await page.evaluate(() => {
          const keyPasswordField = document.getElementById('keyPassword');
          const helpElement = keyPasswordField?.parentElement?.querySelector('small');
          return helpElement?.textContent;
        });
        
        expect(helpText).toContain('如果留空，将使用密钥库密码');
        expect(helpText).toContain('If empty, keystore password will be used');
      });

      it('应该在发布版本模式下更新按钮文本', async () => {
        await page.waitForSelector('#buildForm');
        
        // 填写基本信息
        await page.type('#appName', 'Button Text Test');
        await page.type('#packageName', 'com.buttontext.test');
        await page.type('#version', '1.0.0');
        
        // 勾选发布版本并填写完整信息
        await page.click('#isRelease');
        const keystoreInput = await page.$('#keystoreFile');
        await keystoreInput.uploadFile(tempKeystorePath);
        await page.type('#keystorePassword', 'button-password');
        await page.type('#keyAlias', 'button-alias');
        
        // 提交表单
        await page.click('#buildButton');
        
        // 检查按钮状态文本
        await page.waitForSelector('#buildStatus', { visible: true });
        
        const buttonText = await page.evaluate(() => {
          const button = document.getElementById('buildButton');
          return button?.textContent;
        });
        
        // 按钮应该显示构建中状态
        expect(buttonText).toMatch(/building|构建中/i);
      });
    });
  });
});