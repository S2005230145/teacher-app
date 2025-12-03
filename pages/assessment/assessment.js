// pages/assessment/assessment.js
import apiService from '../../utils/api.js';
Page({
  data: {
    userInfo: {},
    assessmentData: {},
    assessmentList: []
  },

  onLoad(options) {
    this.loadUserInfo();
    this.getAssessmentList(options.id);
  },
  async navigateToEvaluation(e) {
    const elementId = e.currentTarget.dataset.id;
    console.log(elementId)
    const targetItem = (this.data.assessmentList || []).find(
      item => String(item.id) === String(elementId)
    );
    if (targetItem && targetItem.isExistLeaderGrade) {
      wx.showToast({
        title: '等待上级确认',
        icon: 'none'
      });
      return;
    }
    try {
      wx.navigateTo({
        url: '/pages/evaluation/evaluation?indicatorId=' + elementId
      });
    } catch (error) {
      console.error('检查审核状态失败:', error);
      // 即使检查失败，也允许进入评价页面
      wx.navigateTo({
        url: '/pages/evaluation/evaluation?indicatorId=' + elementId
      });
    }
  },

  // 加载用户信息
  loadUserInfo() {
    const userInfoStorage = wx.getStorageSync('userInfo') || {};
    this.setData({ userInfo:userInfoStorage });
  },
  // 加载考核数据
  async getAssessmentList(kpiId){
    try {
      // 模拟加载中
      wx.showLoading({ title: '加载中...' });
      const value=await apiService.getAssessmentList({
        'userId':this.data.userInfo.id,
        'kpiId':kpiId
      });
      console.log(value,666)
      const summary=await apiService.getSummary({
        'userId':this.data.userInfo.id,
        'kpiId':kpiId
      })
      const indicatorList = this.formatIndicatorList(value?.indicator || []);
      this.setData({
        summary: summary,
        list: indicatorList,
        assessmentData: summary,
        assessmentList: indicatorList
      });
      wx.hideLoading();
    }catch(e){
      wx.hideLoading();
      console.error(e);
      const summaryFallback = {
        currentScore: 88,
        rank: 5,
        completionRate: '75%'
      };
      const mockIndicatorList = [
        {
          id: 1,
          indicatorName: '教学质量评估',
          description: '课堂教学效果、学生反馈等综合评价',
          score: 92,
          finalScore: 94,
          isAuditCompleted: true,
          progress: 100,
          assessTime: '2024-01-15',
          status: 'completed',
          statusText: '已完成',
          isExistLeaderGrade: true
        },
        {
          id: 2,
          indicatorName: '科研成果考核',
          description: '论文发表、科研项目等成果评定',
          score: 85,
          finalScore: null,
          isAuditCompleted: false,
          progress: 100,
          assessTime: '2024-01-10',
          status: 'completed',
          statusText: '已完成',
          isExistLeaderGrade: false
        },
        {
          id: 3,
          indicatorName: '学生指导工作',
          description: '学生学业指导、毕业设计等',
          score: 78,
          finalScore: null,
          isAuditCompleted: false,
          progress: 60,
          assessTime: '2024-01-20',
          status: 'in-progress',
          statusText: '进行中',
          isExistLeaderGrade: false
        },
        {
          id: 4,
          indicatorName: '行政服务工作',
          description: '参与学院行政事务和公共服务',
          score: 0,
          finalScore: null,
          isAuditCompleted: false,
          progress: 20,
          assessTime: '2024-01-25',
          status: 'pending',
          statusText: '待开始',
          isExistLeaderGrade: false
        }
      ];
      const formattedMockList = this.formatIndicatorList(mockIndicatorList);
      this.setData({
        summary: summaryFallback,
        list: formattedMockList,
        assessmentData: summaryFallback,
        assessmentList: formattedMockList
      });
      wx.showToast({ title: '加载失败', icon: 'error' });
    }
  },

  formatIndicatorList(indicator = []) {
    return (indicator || []).map(item => {
      const fallbackScore = item?.score ?? item?.finalScore ?? 0;
      const displayScore = item?.isAuditCompleted
        ? (item?.finalScore ?? fallbackScore)
        : fallbackScore;
      return {
        ...item,
        displayScore
      };
    });
  },

  // 菜单点击
  // onMenuTap(e) {
  //   const page = e.currentTarget.dataset.page;
  //   const pages = {
  //     detail: '/pages/detail/detail',
  //     history: '/pages/history/history',
  //     compare: '/pages/compare/compare',
  //     settings: '/pages/settings/settings'
  //   };

  //   if (pages[page]) {
  //     wx.navigateTo({ url: pages[page] });
  //   }
  // },

  // 退出登录
  onLogout() {
    wx.showModal({
      title: '确认退出',
      content: '您确定要退出登录吗？',
      success: (res) => {
        if (res.confirm) {
          // 清除登录信息
          wx.removeStorageSync('userInfo');
          wx.removeStorageSync('token');
          
          // 跳转到登录页
          wx.reLaunch({ url: '/pages/index/index' });
        }
      }
    });
  },

  // 下拉刷新
  onPullDownRefresh() {
    this.getAssessmentList().then(() => {
      wx.stopPullDownRefresh();
    });
  }
});