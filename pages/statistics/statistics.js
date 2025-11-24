// pages/statistics/statistics.js
import apiService from '../../utils/api.js';
Page({
  data: {
    timeRange: ['本月', '本季度', '本学期', '本年度'],
    scoreDistribution: [
      { range: '90-100', count: 12, percentage: 80 },
      { range: '80-89', count: 8, percentage: 60 },
      { range: '70-79', count: 5, percentage: 40 },
      { range: '60-69', count: 3, percentage: 25 },
      { range: '60以下', count: 2, percentage: 15 }
    ],
    teacherRanking: [
      { id: 1, name: '张老师', department: '语文组', score: 95.6, change: 2.3 },
      { id: 2, name: '李老师', department: '数学组', score: 92.1, change: 1.8 },
      { id: 3, name: '王老师', department: '英语组', score: 89.4, change: -0.5 },
      { id: 4, name: '赵老师', department: '物理组', score: 87.2, change: 3.1 },
      { id: 5, name: '刘老师', department: '化学组', score: 85.8, change: 1.2 }
    ],
    itemAnalysis: [
      { name: '课堂教学效果', averageScore: 88.5, percentage: 88.5, trend: 2.1 },
      { name: '学生评价反馈', averageScore: 85.2, percentage: 85.2, trend: 1.5 },
      { name: '教学成果展示', averageScore: 82.7, percentage: 82.7, trend: -0.8 },
      { name: '教研活动参与', averageScore: 79.4, percentage: 79.4, trend: 3.2 }
    ],
    averageScore:null,
    excellentRate:null,
    passRate:null,
    completionStatus: {
      total: 0,
      pending: 0,
      completed: 0,
      progress: 0
    },
  },

  onLoad() {
    console.log('统计页面加载');
    this.loadMessage();
  },

  async loadMessage(){
    try{
      const [stats, completion] = await Promise.all([
        apiService.getStatistics(),
        apiService.getTeacherCompletionStatus()
      ]);
      const completionData = completion || {};
      this.setData({
        averageScore:stats.averageScore,
        excellentRate:stats.excellentRate,
        passRate:stats.passRate,
        scoreDistribution:stats.scoreDistribution,
        teacherRanking:stats.teacherRanking,
        itemAnalysis:stats.itemAnalysis,
        completionStatus: {
          total: completionData.total || 0,
          pending: completionData.pending || 0,
          completed: completionData.completed || 0,
          progress: completionData.progress || 0
        }
      })
    }catch(e){
      console.error(e);
    }
  },

  // 时间筛选
  onTimeChange(e) {
    const index = e.detail.value;
    console.log('选择时间范围:', this.data.timeRange[index]);
    // 这里可以添加数据更新逻辑
  },

  // 查看全部排名
  viewAllRanking() {
    wx.navigateTo({
      url: '/pages/ranking/ranking'
    });
  },

  onShareAppMessage() {
    return {
      title: '教师绩效考核统计',
      path: '/pages/statistics/statistics'
    };
  }
});