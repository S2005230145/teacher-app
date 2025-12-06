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
    unreadEvaluations: 2,
    kpiList: [] // KPI列表
  },

  onLoad() {
    this.checkLoginStatus();
    this.getAllKPI();
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

 async getAllKPI() {
  const kpiAllList=await apiService.getAllKPI({});
  console.log(kpiAllList,666)
  this.setData({
    kpiList: kpiAllList.list || []
  });
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

  // 导出教师绩效
  async onExportKPI() {
    const _that = this;
    const userInfo = wx.getStorageSync('userInfo');
    
    if (!userInfo || !userInfo.id) {
      wx.showToast({
        title: '请先登录',
        icon: 'none'
      });
      return;
    }

    // 使用从API获取的KPI列表
    let kpiList = this.data.kpiList || [];
    
    // 如果列表为空，尝试重新获取
    if (kpiList.length === 0) {
      await this.getAllKPI();
      kpiList = this.data.kpiList || [];
    }

    // 检查是否有KPI数据
    if (kpiList.length === 0) {
      wx.showToast({
        title: '暂无KPI数据',
        icon: 'none'
      });
      return;
    }

    // 构建选择列表（显示KPI标题）
    const itemList = kpiList.map(item => item.title || '');

    // 显示选择弹窗
    wx.showActionSheet({
      itemList: itemList,
      success: function (res) {
        if (!res.cancel) {
          const selectedKpi = kpiList[res.tapIndex];
          // 选择完成后，执行导出
          _that.doExportKPI(selectedKpi.id, userInfo.id);
        }
      },
      fail: (err) => {
        if (err.errMsg !== 'showActionSheet:fail cancel') {
          wx.showToast({
            title: '选择失败',
            icon: 'none'
          });
        }
      }
    });
  },

  // 执行导出
  async doExportKPI(kpiId, userId) {
    wx.showLoading({
      title: '导出中...',
      mask: true
    });

    try {
      const fileBuffer = await apiService.exportKPI({
        userId: userId,
        kpiId: kpiId
      });
      
      // 生成临时文件路径
      const filePath = `${wx.env.USER_DATA_PATH}/export_${Date.now()}.pdf`; // 根据实际文件类型修改扩展名
      const fs = wx.getFileSystemManager();
      
      // 将文件流写入临时文件
      fs.writeFile({
        filePath: filePath,
        data: fileBuffer,
        success: () => {
          wx.hideLoading();
          // 打开文档
          wx.openDocument({
            filePath: filePath,
            showMenu: true,
            success: () => {
              console.log('打开文档成功');
            },
            fail: (err) => {
              console.error('打开文档失败:', err);
              // 如果打开文档失败，尝试预览图片
              wx.previewImage({
                urls: [filePath],
                fail: (previewErr) => {
                  wx.showToast({
                    title: '无法打开文件',
                    icon: 'none'
                  });
                  console.error('预览图片失败:', previewErr);
                }
              });
            }
          });
        },
        fail: (err) => {
          wx.hideLoading();
          wx.showToast({
            title: '保存文件失败',
            icon: 'none'
          });
          console.error('写入文件失败:', err);
        }
      });
    } catch (error) {
      wx.hideLoading();
      wx.showToast({
        title: error.message || '导出失败',
        icon: 'none'
      });
      console.error('导出失败:', error);
    }
  },

  onShareAppMessage() {
    return {
      title: '教师绩效考核系统',
      path: '/pages/main/main'
    };
  }
});