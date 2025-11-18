import apiService from '../../utils/api.js';
// pages/profile/profile.js
Page({
  data: {
    userInfo: {
      userName: '张老师',
      typeName: '语文教研组',
      score: 88.5,
      rank: 3,
      avatar: '/images/avatar.png'
    },
    userStats: {
      totalEvaluations: 24,
      averageScore: 88.5,
      completionRate: 92
    },
    unreadEvaluations: 2
  },

  onLoad() {
    this.checkLoginStatus();
  },

  // 检查登录状态
  async checkLoginStatus() {
    const userInfo = wx.getStorageSync('userInfo');
    if (userInfo) {
      const value=await apiService.getRankAndScore({
        "userId":userInfo.id
      });
      userInfo.score=value.score;
      userInfo.rank=value.rank;
      const value1=await apiService.getUserStats({
        "userId":userInfo.id
      });
      this.setData({
        userInfo: userInfo,
        userStats: {
          totalEvaluations: value1.totalEvaluations,
          averageScore: value1.averageScore,
          completionRate: value1.completionRate
        },
        unreadEvaluations: value1.unreadEvaluations
      });
    }
  },

  // 登录
  onLogin() {
    wx.showModal({
      title: '登录',
      content: '请选择登录方式',
      confirmText: '微信登录',
      cancelText: '账号登录',
      success: (res) => {
        if (res.confirm) {
          this.wechatLogin();
        } else {
          this.accountLogin();
        }
      }
    });
  },

  // 微信登录
  wechatLogin() {
    wx.login({
      success: (res) => {
        if (res.code) {
          // 模拟登录成功
          const userInfo = this.data.userInfo;
          wx.setStorageSync('userInfo', userInfo);
          this.setData({ userInfo });
          wx.showToast({
            title: '登录成功',
            icon: 'success'
          });
        }
      }
    });
  },

  // 账号登录
  accountLogin() {
    wx.navigateTo({
      url: '/pages/index/index'
    });
  },

  // 退出登录
  onLogout() {
    wx.showModal({
      title: '提示',
      content: '确定要退出登录吗？',
      success: (res) => {
        if (res.confirm) {
          wx.removeStorageSync('userInfo');
          this.setData({
            userInfo: {},
            userStats: {},
            unreadEvaluations: 0
          });
          wx.showToast({
            title: '已退出登录',
            icon: 'success'
          });
          wx.navigateTo({
            url: '/pages/index/index',
          })
        }
      }
    });
  },

  // 页面跳转
  navigateTo(e) {
    const url = e.currentTarget.dataset.url;
    wx.navigateTo({
      url: url
    });
  },

  // 意见反馈
  onFeedback() {
    wx.navigateTo({
      url: '/pages/feedback/feedback'
    });
  },

  // 关于我们
  onAbout() {
    wx.navigateTo({
      url: '/pages/about/about'
    });
  },

  // 分享应用
  onShare() {
    wx.showShareMenu({
      withShareTicket: true
    });
  },

  onShareAppMessage() {
    return {
      title: '教师绩效考核系统',
      path: '/pages/main/main'
    };
  }
});