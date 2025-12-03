// pages/kpi/kpi.js
import apiService from '../../utils/api.js';
Page({
  data: {
    showFilterPanel: false,
    searchKeyword: '',
    currentFilter: {
      type: 'all',
      status: 'all'
    },
    totalKpis: 0,
    completedKpis: 0,
    completionRate: 0,
    averageScore: 0,
    kpiList: [],
    filteredKpis: [],
    userInfo:null
  },

  onLoad() {
    const userInfo=wx.getStorageSync("userInfo") || {};
    this.setData({
      userInfo:userInfo
    });
    this.loadKpiData();
  },

  // 加载KPI数据
  async loadKpiData() {
    let mockData = [
      {
        id: 1,
        name: '课堂教学质量评估',
        description: '课堂教学效果、学生参与度、教学方法创新等',
        type: 'teaching',
        typeText: '教学',
        status: 'active',
        statusText: '进行中',
        weight: 30,
        targetValue: '优秀',
        currentValue: '良好',
        progress: 75,
        score: 85,
        maxScore: 100,
        deadline: '2024-06-30',
        createTime: '2024-01-15'
      },
      {
        id: 2,
        name: '科研论文发表',
        description: '核心期刊论文发表数量和质量',
        type: 'research',
        typeText: '科研',
        status: 'completed',
        statusText: '已完成',
        weight: 25,
        targetValue: '3篇',
        currentValue: '4篇',
        progress: 100,
        score: 95,
        maxScore: 100,
        deadline: '2024-05-31',
        createTime: '2024-01-10'
      },
      {
        id: 3,
        name: '学生指导服务',
        description: '学生学业指导、心理辅导等服务时长',
        type: 'service',
        typeText: '服务',
        status: 'pending',
        statusText: '未开始',
        weight: 15,
        targetValue: '50小时',
        currentValue: '0小时',
        progress: 0,
        score: 0,
        maxScore: 100,
        deadline: '2024-07-31',
        createTime: '2024-02-01'
      },
      {
        id: 4,
        name: '教学成果展示',
        description: '教学成果汇报、公开课展示等',
        type: 'teaching',
        typeText: '教学',
        status: 'active',
        statusText: '进行中',
        weight: 20,
        targetValue: '2次',
        currentValue: '1次',
        progress: 50,
        score: 60,
        maxScore: 100,
        deadline: '2024-06-15',
        createTime: '2024-01-20'
      },
      {
        id: 5,
        name: '教研活动参与',
        description: '教研组活动参与度和贡献',
        type: 'research',
        typeText: '科研',
        status: 'completed',
        statusText: '已完成',
        weight: 10,
        targetValue: '100%',
        currentValue: '100%',
        progress: 100,
        score: 100,
        maxScore: 100,
        deadline: '2024-04-30',
        createTime: '2024-01-05'
      }
    ];
    try{
      const value=await apiService.getKPI({
        "userId":this.data.userInfo.id
      });
      mockData=value.mockData;
      console.log(mockData,555)
    }catch(e){
      console.error(e);
    }
    const completedCount = mockData.filter(item => item.status === 'completed').length;
    const totalScore = mockData.reduce((sum, item) => sum + item.score, 0);
    const averageScore = mockData.length > 0 ? (totalScore / mockData.length).toFixed(1) : 0;

    this.setData({
      kpiList: mockData,
      filteredKpis: mockData,
      totalKpis: mockData.length,
      completedKpis: completedCount,
      completionRate: Math.round((completedCount / mockData.length) * 100),
      averageScore: averageScore
    });
  },

  // 搜索输入
  onSearchInput(e) {
    const keyword = e.detail.value;
    this.setData({ searchKeyword: keyword });
    this.filterKpis();
  },

  // 显示筛选面板
  showFilter() {
    this.setData({ showFilterPanel: !this.data.showFilterPanel });
  },

  // 设置筛选条件
  setFilter(e) {
    const type = e.currentTarget.dataset.type;
    const value = e.currentTarget.dataset.value;
    
    this.setData({
      [`currentFilter.${type}`]: value
    });
    
    this.filterKpis();
  },

  // 筛选KPI
  filterKpis() {
    const { searchKeyword, currentFilter, kpiList } = this.data;
    
    let filtered = kpiList.filter(item => {
      // 搜索筛选
      const matchSearch = !searchKeyword || 
        item.name.includes(searchKeyword) || 
        item.description.includes(searchKeyword);
      
      // 类型筛选
      const matchType = currentFilter.type === 'all' || item.type === currentFilter.type;
      
      // 状态筛选
      const matchStatus = currentFilter.status === 'all' || item.status === currentFilter.status;
      
      return matchSearch && matchType && matchStatus;
    });

    this.setData({ filteredKpis: filtered });
  },

  // 查看KPI详情
  viewKpiDetail(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: `/pages/assessment/assessment?id=${id}`
    });
  },

});