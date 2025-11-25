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
    currentTab: 0, // 默认选中第1个标签
    
    // 评价内容数据
    contents: [
      // 课堂教学
      [
        { 
          id: 101, 
          title: '教学内容充实', 
          description: '教学内容充实、教学方法得当、课堂互动良好、学生参与度高',
          time: 0,
          files: []
        },
        { 
          id: 102, 
          title: '教学方法得当', 
          description: '采用多样化教学方法，激发学生学习兴趣',
          time: 0,
          files: []
        }
      ],
      // 科研成果
      [
        { 
          id: 201, 
          title: '论文发表', 
          description: '学术论文发表数量和质量',
          time: 0,
          files: []
        }
      ],
      // 学生指导
      [
        { 
          id: 301, 
          title: '学业指导', 
          description: '学生学业指导和辅导情况',
          time: 0,
          files: []
        }
      ],
      // 效果
      [
        { 
          id: 401, 
          title: '教学内容充实', 
          description: '教学内容充实、教学方法得当、课堂互动良好、学生参与度高',
          time: 0,
          files: []
        },
        { 
          id: 402, 
          title: '教学方法得当', 
          description: '采用多样化教学方法，激发学生学习兴趣',
          time: 0,
          files: []
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
    canSubmit: false, // 初始锁定提交按钮
    levels: [
      { value: 'A', label: 'A (优秀)', score: 90 },
      { value: 'B', label: 'B (良好)', score: 80 },
      { value: 'C', label: 'C (合格)', score: 70 },
      { value: 'D', label: 'D (不合格)', score: 60 }
    ],
    gradeData:{},
    drawerOpen:false,
    drawerWidth:520,
    maxFilesPerItem:5
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
  // 检查当前页是否至少完成一次选择/计数
  hasEvaluationAction() {
    const { contents = [], currentLevel = {}, currentTab = 0 } = this.data;
    const currentTabItems = Array.isArray(contents[currentTab]) ? contents[currentTab] : [];
    if (!currentTabItems.length) {
      return false;
    }
    const hasLevel = currentTabItems.some(item => {
      const level = currentLevel[item.id];
      return level && level.name;
    });
    if (hasLevel) {
      return true;
    }
    const hasCount = currentTabItems.some(item => {
      const itemData = item?.data || {};
      return itemData.type === 'count' && Number(item.time || 0) > 0;
    });
    return hasCount;
  },

  // 更新按钮状态：至少有一项操作时才可提交
  updateButtonState() {
    this.setData({
      canSubmit: this.hasEvaluationAction()
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
      console.log(valueTest)
      const formattedContentsRaw = valueTest.contents || [];
      const normalizedContents = formattedContentsRaw.map(list => {
        if (!Array.isArray(list)) {
          return [];
        }
        return list.map(entry => {
          const clone = { ...entry };
          if (clone.data && typeof clone.data === 'string') {
            try {
              clone.data = JSON.parse(clone.data);
            } catch (err) {
              console.warn('解析 data 失败:', err, clone);
              clone.data = {};
            }
          }
          const initialFiles = Array.isArray(clone.files) ? clone.files : [];
          const hasLegacyFile = clone.filePath;
          const normalizedFiles = hasLegacyFile ? [{
            name: clone.fileName || '',
            path: clone.filePath,
            status: clone.uploadStatus || '',
            error: clone.uploadError || '',
            description: clone.uploadDesc || ''
          }] : initialFiles;
          clone.files = normalizedFiles.map(file => ({
            name: file.name || '',
            path: file.path || '',
            status: file.status || '',
            error: file.error || '',
            description: file.description || ''
          }));
          delete clone.fileName;
          delete clone.filePath;
          delete clone.uploadStatus;
          delete clone.uploadError;
          return clone;
        });
      });
      const formatTabs = valueTest.tabs || [];
      const defaultTab = 0;
      const currentTab = normalizedContents[defaultTab] ? defaultTab : 0;
      const currentTabInfo = formatTabs[currentTab] || null;
      console.log('当前页签信息:', currentTabInfo);
      if (currentTabInfo && Object.prototype.hasOwnProperty.call(currentTabInfo, 'robotScore')) {
        console.log('当前 robotScore:', currentTabInfo.robotScore);
      }
      this.setData({
        tabs: formatTabs,
        contents: normalizedContents,
        currentTab,
        currentContents: normalizedContents[currentTab] || [],
        currentElement: currentTabInfo
      });
      // 初始化按钮状态
      this.updateButtonState();
    }catch(e){
      console.error(e);
    }
  },

  openDrawer() {
    if (this.data.drawerOpen) {
      return;
    }
    this.setData({
      drawerOpen: true
    });
  },

  closeDrawer() {
    if (!this.data.drawerOpen) {
      return;
    }
    this.setData({
      drawerOpen: false
    });
  },

  onTouchStart(e) {
    if (!e.touches || !e.touches.length) {
      return;
    }
    const touch = e.touches[0];
    this.touchContext = {
      startX: touch.pageX,
      startY: touch.pageY,
      fromEdge: touch.pageX <= 40,
      fromDrawer: this.data.drawerOpen && touch.pageX <= (this.data.drawerWidth + 40),
      deltaX: 0,
      deltaY: 0
    };
  },

  onTouchMove(e) {
    if (!this.touchContext || !e.touches || !e.touches.length) {
      return;
    }
    const touch = e.touches[0];
    this.touchContext.deltaX = touch.pageX - this.touchContext.startX;
    this.touchContext.deltaY = touch.pageY - this.touchContext.startY;
  },

  onTouchEnd() {
    if (!this.touchContext) {
      return;
    }
    const { deltaX = 0, deltaY = 0, fromEdge, fromDrawer } = this.touchContext;
    const isHorizontal = Math.abs(deltaX) > 60 && Math.abs(deltaX) > Math.abs(deltaY);
    if (isHorizontal) {
      if (!this.data.drawerOpen && fromEdge && deltaX > 60) {
        this.openDrawer();
      } else if (this.data.drawerOpen && fromDrawer && deltaX < -60) {
        this.closeDrawer();
      }
    }
    this.touchContext = null;
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
    if (this.data.drawerOpen) {
      this.closeDrawer();
    }
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
    this.updateButtonState();
  },

  appendFilesToItem(id, newFiles = []) {
    const target = this.findItemById(id);
    if (!target) {
      return;
    }
    const existingFiles = Array.isArray(target.files) ? target.files : [];
    const availableSlots = (this.data.maxFilesPerItem || 5) - existingFiles.length;
    if (availableSlots <= 0) {
      wx.showToast({
        title: `最多上传${this.data.maxFilesPerItem}个文件`,
        icon: 'none'
      });
      return;
    }
    const filesToAdd = newFiles.slice(0, availableSlots);
    this.updateItemFields(id, { files: [...existingFiles, ...filesToAdd] });
  },

  updateFileStatus(itemId, fileIndex, patch = {}) {
    const target = this.findItemById(itemId);
    if (!target || !Array.isArray(target.files)) {
      return;
    }
    const nextFiles = target.files.map((file, idx) => {
      if (idx === fileIndex) {
        return { ...file, ...patch };
      }
      return file;
    });
    this.updateItemFields(itemId, { files: nextFiles });
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
          "var": (this.data.currentLevel && this.data.currentLevel[value.id]) ? this.data.currentLevel[value.id] : null
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
    const target = this.findItemById(id);
    const existing = Array.isArray(target?.files) ? target.files.length : 0;
    const maxFiles = this.data.maxFilesPerItem || 5;
    const remain = maxFiles - existing;
    if (remain <= 0) {
      wx.showToast({
        title: `最多上传${maxFiles}个文件`,
        icon: 'none'
      });
      return;
    }
    wx.chooseMessageFile({
      count: remain,
      type: 'file',
      success: (res) => {
        const files = res.tempFiles || [];
        if (!files.length) return;
        const normalized = files.map(file => ({
          name: file.name || '文件',
          path: file.path,
          status: 'pending',
          error: '',
          description: ''
        }));
        this.appendFilesToItem(id, normalized);
      }
    });
  },

  removeFile(e) {
    const id = e.currentTarget.dataset.id;
    const index = e.currentTarget.dataset.index;
    if (id == null || index == null) {
      return;
    }
    const target = this.findItemById(id);
    if (!target || !Array.isArray(target.files)) {
      return;
    }
    const nextFiles = target.files.filter((_, idx) => idx !== Number(index));
    this.updateItemFields(id, { files: nextFiles });
  },

  previewFile(e) {
    const id = e.currentTarget.dataset.id;
    const index = e.currentTarget.dataset.index;
    if (id == null || index == null) {
      return;
    }
    const target = this.findItemById(id);
    if (!target || !Array.isArray(target.files)) {
      return;
    }
    const file = target.files[index];
    if (!file || !file.path) {
      wx.showToast({
        title: '暂无可预览文件',
        icon: 'none'
      });
      return;
    }
    const path = file.path;
    const name = file.name || '';
    const isImage = /\.(png|jpg|jpeg|bmp|gif|webp)$/i.test(name) || /\.(png|jpg|jpeg|bmp|gif|webp)$/i.test(path);
    if (isImage) {
      wx.previewImage({
        current: path,
        urls: [path]
      });
      return;
    }
    wx.openDocument({
      filePath: path,
      showMenu: true,
      fail: () => {
        wx.showToast({
          title: '无法预览该文件',
          icon: 'none'
        });
      }
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
        const fileList = Array.isArray(item.files) ? item.files : [];
        fileList.forEach((file, index) => {
          if (file.path && file.status !== 'uploaded') {
            filesToUpload.push({
              itemId: item.id,
              fileIndex: index,
              file,
              description: item.uploadDesc || ''
            });
          }
        });
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
        this.updateFileStatus(fileItem.itemId, fileItem.fileIndex, { status: 'uploading', error: '' });
        try {
          const res = await apiService.uploadEvaluationFile({
            filePath: fileItem.file.path,
            description: fileItem.description || '',
            contentId: fileItem.itemId,
            userId: userInfo.id
          });
          if (res.code === 200) {
            this.updateFileStatus(fileItem.itemId, fileItem.fileIndex, { status: 'uploaded' });
          } else {
            const reason = res.reason || '上传失败，请重试';
            this.updateFileStatus(fileItem.itemId, fileItem.fileIndex, { status: 'failed', error: reason });
            throw new Error(reason);
          }
        } catch (error) {
          const message = error?.message || '上传失败，请重试';
          this.updateFileStatus(fileItem.itemId, fileItem.fileIndex, { status: 'failed', error: message });
          throw error;
        }
      }
    } finally {
      wx.hideLoading();
    }
  }
  ,

});