// pages/ranking/ranking.js
Page({
  data: {
    timeRange: ['本月', '本季度', '本学期', '本年度'],
    timeIndex: 0,
    typeRange: ['综合排名', '教学成绩', '科研成果', '学生评价'],
    typeIndex: 0,
    rankingData: [],
    currentUser: null,
    totalTeachers: 0,
    averageScore: 0,
    excellentRate: 0
  },

  onLoad() {
    this.loadRankingData();
  },

  onShow() {
    this.loadCurrentUser();
  },

  // 加载排名数据
  loadRankingData() {
    // 模拟数据
    const mockData = [
      { id: 1, name: '张老师', department: '语文组', score: 95.6, change: 2.3, avatar: '', medal: '🏆' },
      { id: 2, name: '李老师', department: '数学组', score: 92.1, change: 1.8, avatar: '', medal: '⭐' },
      { id: 3, name: '王老师', department: '英语组', score: 89.4, change: -0.5, avatar: '', medal: '🌟' },
      { id: 4, name: '赵老师', department: '物理组', score: 87.2, change: 3.1, avatar: '' },
      { id: 5, name: '刘老师', department: '化学组', score: 85.8, change: 1.2, avatar: '' },
      { id: 6, name: '陈老师', department: '生物组', score: 84.3, change: -1.5, avatar: '' },
      { id: 7, name: '杨老师', department: '历史组', score: 82.7, change: 0.8, avatar: '' },
      { id: 8, name: '黄老师', department: '地理组', score: 80.1, change: 2.1, avatar: '' },
      { id: 9, name: '周老师', department: '体育组', score: 78.9, change: -0.7, avatar: '' },
      { id: 10, name: '吴老师', department: '艺术组', score: 76.5, change: 1.4, avatar: '' }
    ];

    this.setData({
      rankingData: mockData,
      totalTeachers: mockData.length,
      averageScore: '85.6',
      excellentRate: '45.2'
    });
  },

  // 加载当前用户信息
  loadCurrentUser() {
    const currentUser = {
      id: 4,
      name: '赵老师',
      department: '物理组',
      score: 87.2,
      change: 3.1,
      avatar: '',
      rank: 4
    };
    this.setData({ currentUser });
  },

  // 时间筛选
  onTimeChange(e) {
    const index = e.detail.value;
    this.setData({ timeIndex: index });
    this.loadRankingData();
  },

  // 类型筛选
  onTypeChange(e) {
    const index = e.detail.value;
    this.setData({ typeIndex: index });
    this.loadRankingData();
  },

  onShareAppMessage() {
    return {
      title: '教师绩效排名',
      path: '/pages/ranking/ranking'
    };
  }
});