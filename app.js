// app.js
import apiService from './utils/api.js';
import config from './utils/config.js';
App({
  onLaunch() {
    // 展示本地存储能力
    const logs = wx.getStorageSync('logs') || []
    logs.unshift(Date.now())
    wx.setStorageSync('logs', logs)

    // 全局配置
    this.globalData = {
      apiConfig: config,
      apiService: apiService
    };

    // 检查网络状态
     this.checkNetwork();

    // 登录
    wx.login({
      success: res => {
        // 发送 res.code 到后台换取 openId, sessionKey, unionId
      }
    })
  },
  // 网络状态检查
  checkNetwork() {
    wx.getNetworkType({
      success: (res) => {
        console.log('网络类型:', res.networkType);
      }
    });

    wx.onNetworkStatusChange((res) => {
      if (!res.isConnected) {
        wx.showToast({
          title: '网络连接已断开',
          icon: 'none'
        });
      }
    });
  },
  globalData: {
    userInfo: null,
    apiConfig:null,
    apiService:null,
    // 全局待上传文件存储：{ pageKey: { contentId: [file1, file2, ...] } }
    pendingUploadFiles: {}
  }
})
