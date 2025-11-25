// pages/evaluation/evaluation.js
import apiService from '../../utils/api.js';
Page({
  data: {
    // 标签数据
    tabs: [
      { id: 1, name: '课堂教学' },
      { id: 2, name: '科研成果' },
      { id: 3, name: '学生指导' },
      { id: 4, name: '效果' }
    ],
    currentTab: 3, // 默认选中"效果"
    
    // 评价内容数据
    contents: [
      // 课堂教学
      [
        { 
          id: 101, 
          title: '教学内容充实', 
          description: '教学内容充实、教学方法得当、课堂互动良好、学生参与度高',
          time: 0 
        },
        { 
          id: 102, 
          title: '教学方法得当', 
          description: '采用多样化教学方法，激发学生学习兴趣',
          time: 0 
        }
      ],
      // 科研成果
      [
        { 
          id: 201, 
          title: '论文发表', 
          description: '学术论文发表数量和质量',
          time: 0 
        }
      ],
      // 学生指导
      [
        { 
          id: 301, 
          title: '学业指导', 
          description: '学生学业指导和辅导情况',
          time: 0 
        }
      ],
      // 效果
      [
        { 
          id: 401, 
          title: '教学内容充实', 
          description: '教学内容充实、教学方法得当、课堂互动良好、学生参与度高',
          time: 0 
        },
        { 
          id: 402, 
          title: '教学方法得当', 
          description: '采用多样化教学方法，激发学生学习兴趣',
          time: 0 
        }
      ]
    ],
    indicatorId:0,
    // 当前显示的内容
    currentContents: [],
    elements:[],
    currentElement:0,
    userInfo:{},
    currentLevel:{},
    canSubmit: false, // 是否可以提交
    levels: [
      { value: 'A', label: 'A (优秀)', score: 90 },
      { value: 'B', label: 'B (良好)', score: 80 },
      { value: 'C', label: 'C (合格)', score: 70 },
      { value: 'D', label: 'D (不合格)', score: 60 }
    ],
    gradeData:{}
  },

  onLoad(options) {
    this.setData({
      userInfo:wx.getStorageSync('userInfo') || {},
      indicatorId:options.indicatorId
    })
    // 初始化显示"效果"标签的内容
    this.loadEvaluationList();
  },

  // 选择等级
  selectLevel(e) {
    const level = e.currentTarget.dataset.level;
    const score = e.currentTarget.dataset.score;
    const id = e.currentTarget.dataset.id;
    // 使用setData更新，确保视图响应
    const currentLevel = this.data.currentLevel || {};
    currentLevel[id] = {
      "name": level,
      "score": score
    };
    this.setData({
      currentLevel: currentLevel
    });
    // 更新按钮状态
    this.updateButtonState();
  },

  // 检查所有考核等级是否已选择
  checkAllLevelsSelected() {
    const { contents } = this.data;
    const unselectedItems = [];
    
    // 遍历所有标签页的内容
    for (const tabContents of contents) {
      if (Array.isArray(tabContents)) {
        for (const item of tabContents) {
          // 只检查需要选择等级的项目（type != 'count'）
          if (item.data && item.data.type !== 'count') {
            if (!this.data.currentLevel || !this.data.currentLevel[item.id] || !this.data.currentLevel[item.id].name) {
              unselectedItems.push(item.title || `项目${item.id}`);
            }
          }
        }
      }
    }
    
    return {
      allSelected: unselectedItems.length === 0,
      unselectedItems: unselectedItems
    };
  },

  // 更新按钮状态
  updateButtonState() {
    const checkResult = this.checkAllLevelsSelected();
    this.setData({
      canSubmit: checkResult.allSelected
    });
  },

  async loadEvaluationList(){
    try{
      const value=await apiService.getEvaluationList({
        'indicatorId':this.data.indicatorId,
        'userId':this.data.userInfo.id
      });
      const valueTest=await apiService.getEvaluationListNew({
        'indicatorId':this.data.indicatorId,
        'userId':this.data.userInfo.id
      });
      valueTest.contents.forEach(value=>{
        value.forEach(v1=>{
          v1.data=JSON.parse(v1.data);
        });
      })
      const formattedContents = valueTest.contents;
      const currentTab = formattedContents[this.data.currentTab] ? this.data.currentTab : 0;
      this.setData({
        tabs:value.tabs,
        contents:formattedContents,
        currentTab,
        currentContents: formattedContents[currentTab] || [],
        currentElement: value.tabs ? value.tabs[currentTab] : null
      });
      // 初始化按钮状态
      this.updateButtonState();
    }catch(e){
      console.error(e);
    }
  },

  formatContents(contents = []) {
    return contents.map(tabContents => tabContents.map(item => {
      const baseItem = {
        ...item,
        uploadDesc: item.uploadDesc || '',
        fileName: item.fileName || '',
        filePath: item.filePath || '',
        uploadStatus: item.uploadStatus || '',
        uploadError: item.uploadError || '',
        jsonParamType: null,
        jsonParamData: [],
        selectedIndex: -1,
        selectedValue: '',
        selectedData: null
      };
      
      // 解析 type.jsonParam 字符串
      if (item.type && item.type.jsonParam) {
        try {
          const jsonParam = JSON.parse(item.type.jsonParam);
          baseItem.jsonParamType = jsonParam.type || null;
          baseItem.jsonParamData = Array.isArray(jsonParam.data) ? jsonParam.data : [];
          
          // 如果是 select 类型，初始化选择器相关字段
          if (jsonParam.type === 'select' && Array.isArray(jsonParam.data) && jsonParam.data.length > 0) {
            baseItem.selectedIndex = item.selectedIndex !== undefined && item.selectedIndex >= 0 ? item.selectedIndex : -1;
            baseItem.selectedValue = item.selectedValue || '';
            baseItem.selectedData = item.selectedData || null;
          }
        } catch (e) {
          console.error('解析 jsonParam 失败:', e, item);
          baseItem.jsonParamType = null;
          baseItem.jsonParamData = [];
        }
      }
      
      return baseItem;
    }));
  },

  // 切换标签
  switchTab(e) {
    const index = e.currentTarget.dataset.index;
    this.setData({
      currentTab: index,
      currentContents: this.data.contents[index],
      currentElement: this.data.tabs[index]
    });
    // 更新按钮状态
    this.updateButtonState();
  },

  // 分数输入
  onScoreInput(e) {
    const id = e.currentTarget.dataset.id;
    const value = parseInt(e.detail.value) || 0;
    this.updateScore(id, value);
  },

  // 减少分数
  decreaseScore(e) {
    const id = e.currentTarget.dataset.id;
    const currentItem = this.findItemById(id);
    if (currentItem && currentItem.time > 0) {
      this.updateScore(id, currentItem.time - 1);
    }
  },

  // 增加分数
  increaseScore(e) {
    const id = e.currentTarget.dataset.id;
    const currentItem = this.findItemById(id);
    if (currentItem) {
      this.updateScore(id, currentItem.time + 1);
    }
  },

  // 更新分数
  updateScore(id, newScore) {
    this.updateItemFields(id, { time: newScore });
  },

  // 根据ID查找项目
  findItemById(id) {
    const { contents } = this.data;
    for (const tabContents of contents) {
      const found = tabContents.find(item => item.id === id);
      if (found) {
        return found;
      }
    }
    return null;
  },

  updateItemFields(id, fields) {
    const { contents, currentTab } = this.data;
    const updatedContents = contents.map(tabContents =>
      tabContents.map(item => item.id === id ? { ...item, ...fields } : item)
    );

    this.setData({
      contents: updatedContents,
      currentContents: updatedContents[currentTab]
    });
  },

  onDescInput(e) {
    const { id } = e.currentTarget.dataset;
    const value = e.detail.value;
    this.updateItemFields(id, { uploadDesc: value });
  },

  // 选择器变化处理
  onSelectChange(e) {
    const id = e.currentTarget.dataset.id;
    const selectedIndex = parseInt(e.detail.value) || 0;
    const currentItem = this.findItemById(id);
    
    if (currentItem && currentItem.jsonParamType === 'select' && 
        Array.isArray(currentItem.jsonParamData) && 
        currentItem.jsonParamData.length > 0 &&
        currentItem.jsonParamData[selectedIndex]) {
      const selectedOption = currentItem.jsonParamData[selectedIndex];
      this.updateItemFields(id, {
        selectedIndex: selectedIndex,
        selectedValue: selectedOption.name || '',
        selectedData: {
          name: selectedOption.name || '',
          score: String(selectedOption.score || '0')
        }
      });
    }
  },

  // 提交评价
  submitEvaluation() {
    // 检查所有考核等级是否已选择
    const checkResult = this.checkAllLevelsSelected();
    if (!checkResult.allSelected) {
      wx.showToast({
        title: '请先完成所有考核等级的选择',
        icon: 'none',
        duration: 2000
      });
      return;
    }

    wx.showModal({
      title: '提交确认',
      content: '确定要提交评价结果吗？',
      success: (res) => {
        if (res.confirm) {
          this.putGrade();
        }
      }
    });
  },

  //提交审核
  submitAudit(){
    // 检查所有考核等级是否已选择
    const checkResult = this.checkAllLevelsSelected();
    if (!checkResult.allSelected) {
      wx.showToast({
        title: '请先完成所有考核等级的选择',
        icon: 'none',
        duration: 2000
      });
      return;
    }

    wx.showModal({
      title: '提交确认',
      content: '确定要提交评价结果进行审核吗？',
      success: (res) => {
        if (res.confirm) {
          this.putAudit();
        }
      }
    });
  },

  async putGrade(){
    try{
      await this.uploadAllFiles();
      let tcs = [];
      this.data.currentContents.forEach(value=>{
        const jsonObject = JSON.parse(value.type.jsonParam);
        const item = {
          "contentId": value.id,
          "time": value.time != null ? value.time : 0,
          "type":jsonObject.type,
          // TODO 小程序动态
          "var":this.data.currentLevel[value.id]
        };

        console.log(item);
        
        tcs.push(item);
      });
      this.setData({
        gradeData:{
          "userId":this.data.userInfo.id,
          "tcs":tcs
        },
      });
      const value=await apiService.grade({
        data: this.data.gradeData
      });
      if(value.code==200){
        wx.showToast({
          title: '提交成功',
          icon: 'success'
        });
        wx.navigateTo({
          url: '/pages/assessment/assessment'
        });
      }else{
        wx.showToast({
          title: '提交失败',
          icon: 'fail'
        });
      }
    }catch(e){
      console.error(e);
      wx.showToast({
        title: e.message || '提交失败',
        icon: 'none'
      });
    }
  },

  async putAudit(){
    try{
      await this.uploadAllFiles();
      const value=await apiService.getLeadersAll();
      const allIds = (value.data || []).map(item => item.id);
      const post=await apiService.postAudit({
        "userId":this.data.userInfo.id,
        "LeaderIds":allIds.join(","),
        "elementId":this.data.currentElement ? this.data.currentElement.id : null
      })
      if(post.code==200){
        wx.showToast({
          title: '提交审核成功',
          icon: 'success'
        });
      }else{
        wx.showToast({
          title: '提交审核失败',
          icon: 'fail'
        });
      }
    }catch(e){
      console.error(e);
      wx.showToast({
        title: e.message || '提交审核失败',
        icon: 'none'
      });
    }
  },

  // 返回
  navigateBack() {
    wx.navigateBack({
      delta: 1
    });
  },

  showDescription(e) {
    const { title, desc } = e.currentTarget.dataset;
    wx.showModal({
      title: title || '简介',
      content: desc || '暂无简介',
      showCancel: false
    });
  },

  chooseFile(e) {
    const id = e.currentTarget?.dataset?.id;
    if (!id) {
      return;
    }
    wx.chooseMessageFile({
      count: 1,
      type: 'file',
      success: (res) => {
        const file = res.tempFiles?.[0];
        if (!file) return;
        this.updateItemFields(id, {
          fileName: file.name,
          filePath: file.path,
          uploadStatus: 'pending',
          uploadError: ''
        });
      }
    });
  },

  removeFile(e) {
    console.log(e);
    const id = e.currentTarget.dataset.id;
    this.updateItemFields(id, {
      fileName: '',
      filePath: '',
      uploadStatus: '',
      uploadError: ''
    });
  },

  async uploadAllFiles() {
    const { contents, userInfo } = this.data;
    if (!userInfo || !userInfo.id) {
      throw new Error('用户信息缺失，请重新登录');
    }
    const filesToUpload = [];
    contents.forEach(tabContents => {
      tabContents.forEach(item => {
        if (item.filePath && item.uploadStatus !== 'uploaded') {
          filesToUpload.push(item);
        }
      });
    });

    if (!filesToUpload.length) {
      return;
    }

    wx.showLoading({
      title: '文件上传中...',
      mask: true
    });

    try {
      for (const fileItem of filesToUpload) {
        this.updateItemFields(fileItem.id, { uploadStatus: 'uploading', uploadError: '' });
        try {
          const res = await apiService.uploadEvaluationFile({
            filePath: fileItem.filePath,
            description: fileItem.uploadDesc || '',
            contentId: fileItem.id,
            userId: userInfo.id
          });
          if (res.code === 200) {
            this.updateItemFields(fileItem.id, { uploadStatus: 'uploaded' });
          } else {
            const reason = res.reason || '上传失败，请重试';
            this.updateItemFields(fileItem.id, { uploadStatus: 'failed', uploadError: reason });
            throw new Error(reason);
          }
        } catch (error) {
          const message = error?.message || '上传失败，请重试';
          this.updateItemFields(fileItem.id, { uploadStatus: 'failed', uploadError: message });
          throw error;
        }
      }
    } finally {
      wx.hideLoading();
    }
  }
});