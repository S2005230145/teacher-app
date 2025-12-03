// pages/evaluation/evaluation.js
import apiService from '../../utils/api.js';
const REMOTE_FILE_BASE_URL = 'https://r.xcx100.info/';

function buildRemoteFileUrl(rawPath = '') {
  if (!rawPath) {
    return '';
  }
  if (/^https?:/i.test(rawPath)) {
    return rawPath;
  }
  const base = REMOTE_FILE_BASE_URL.replace(/\/+$/, '');
  const path = String(rawPath).replace(/^\/+/, '');
  return `${base}/${path}`;
}

// 移除 URL 前缀，返回原始路径
function removeUrlPrefix(fullUrl = '') {
  if (!fullUrl) {
    return '';
  }
  // 如果是完整的 URL，移除前缀
  if (/^https?:/i.test(fullUrl)) {
    const base = REMOTE_FILE_BASE_URL.replace(/\/+$/, '');
    return String(fullUrl).replace(base, '').replace(/^\/+/, '');
  }
  // 如果已经是相对路径，直接返回
  return String(fullUrl).replace(/^\/+/, '');
}
// 安全乘法，避免浮点精度问题（保留两位小数）
function multiplyScore(a, b) {
  const x = Number(a) || 0;
  const y = Number(b) || 0;
  // 先放大再缩小，降低精度误差，再用 toFixed 控制小数位
  const result = Math.round(x * 1000) * Math.round(y * 1000) / 1000000;
  return Number(result.toFixed(2));
}

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
    isReview: false,
    allLeaderGraded: false,
    showWithdraw: false,
    interactionLocked: false,
    showWaitingLeader: false,   // 所有 isLeaderGrade=true 时显示“等待上级确认”
    showFinalScoreMode: false,  // 所有 isLeaderGrade=false 且 completed=true 时展示 finalScore
    levels: [
      { value: 'A', label: 'A (优秀)', score: 90 },
      { value: 'B', label: 'B (良好)', score: 80 },
      { value: 'C', label: 'C (合格)', score: 70 },
      { value: 'D', label: 'D (不合格)', score: 60 }
    ],
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

  // 页面显示时刷新数据（包括从其他页面返回时）
/*   onShow() {
    if (this.data.indicatorId) {
      this.loadEvaluationList();
    }
  }, */

  computeInteractionLocked() {
    return this.data.isReview === true;
  },

  refreshInteractionLock() {
    const locked = this.computeInteractionLocked();
    if (locked !== this.data.interactionLocked) {
      this.setData({
        interactionLocked: locked
      });
    }
  },

  isReadOnly() {
    return this.data.interactionLocked;
  },

  // 选择等级
  selectLevel(e) {
    // 如果已完成或待审核，不允许操作
    if (this.isReadOnly()) {
      return;
    }
    const level = e.currentTarget.dataset.level;
    const score = e.currentTarget.dataset.score;
    const id = e.currentTarget.dataset.id;
    // 使用setData更新，确保视图响应
    const currentLevel = this.data.currentLevel || {};
    currentLevel[id] = {
      "name": level,
      "score": score
    };
    // 如果有考核等级，完成次数默认为1
    const currentItem = this.findItemById(id);
    if (currentItem && (!currentItem.time || currentItem.time === 0)) {
      this.updateScore(id, 1);
    }
    this.setData({
      currentLevel: currentLevel
    });
    // 更新按钮状态
    this.updateButtonState();
  },

  // 检查当前页是否至少完成一次
  // 1. 没有考核等级的（count类型），完成次数至少1次
  // 2. 有考核等级的（非count类型），需要选择考核等级
  hasEvaluationAction() {
    const { contents = [], currentLevel = {} } = this.data;
    if (!Array.isArray(contents) || contents.length === 0) {
      return false;
    }
    // 检查是否有至少一项完成
    return contents.some(tabItems => {
      const items = Array.isArray(tabItems) ? tabItems : [];
      return items.some(item => {
        const itemData = item?.data || {};
        const itemType = itemData.type;

        // 没有考核等级的（count类型）：完成次数至少1次
        if (itemType === 'count') {
          return Number(item.time || 0) >= 1;
        }

        // 有考核等级的（非count类型）：需要选择考核等级
        const level = currentLevel[item.id];
        return level && level.name;
      });
    });
  },

  // 更新按钮状态：至少有一项操作时才可提交
  updateButtonState() {
    const hasAction = this.hasEvaluationAction();
    const readOnly = this.isReadOnly();
    this.setData({
      canSubmit: hasAction && !readOnly
    });
  },

  async loadEvaluationList(){
    try{
      const value=await apiService.getEvaluationList({
        'indicatorId':this.data.indicatorId,
        'userId':this.data.userInfo.id
      });
      console.log(this.data.indicatorId,66)
      console.log(this.data.userInfo.id,666)

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
          let normalizedFiles = initialFiles;
          
          // 如果有历史文件路径，支持单个或多个文件路径（用逗号分隔）
          if (hasLegacyFile) {
            const filePaths = String(clone.filePath).split(',').map(path => path.trim()).filter(path => path);
            if (filePaths.length > 0) {
              // 如果有多个文件路径，为每个路径创建一个文件对象
              normalizedFiles = filePaths.map((filePath, index) => {
                // 如果有多个文件，尝试从 fileName 中提取对应的文件名
                let fileName = clone.fileName || '';
                if (filePaths.length > 1 && fileName) {
                  // 如果 fileName 也包含逗号，按索引取对应的文件名
                  const fileNames = String(fileName).split(',').map(name => name.trim());
                  fileName = fileNames[index] || fileNames[0] || `文件${index + 1}`;
                }
                return {
                  name: fileName || `文件${index + 1}`,
                  path: buildRemoteFileUrl(filePath),
                  status: clone.uploadStatus || 'uploaded',
                  error: clone.uploadError || '',
                  description: clone.uploadDesc || '',
                  isRemote: true,
                  originalPath: filePath // 保存原始路径（不带URL前缀）
                };
              });
            }
          }
          clone.files = normalizedFiles.map(file => {
            const isRemote = file.isRemote || (file.path && /^https?:/i.test(file.path));
            const resolvedPath = isRemote ? buildRemoteFileUrl(file.path) : (file.path || '');
            return {
              name: file.name || '',
              path: resolvedPath,
              status: file.status || (isRemote ? 'uploaded' : ''),
              error: file.error || '',
              description: file.description || '',
              isRemote,
              originalPath: file.originalPath || (isRemote ? removeUrlPrefix(file.path) : '') // 保存原始路径
            };
          });
          delete clone.fileName;
          delete clone.filePath;
          delete clone.uploadStatus;
          delete clone.uploadError;
          // 如果后端未下发 isNeedUploadFile，则默认需要上传材料
          if (clone.isNeedUploadFile === undefined || clone.isNeedUploadFile === null) {
            clone.isNeedUploadFile = true;
          }
          // 如果有考核等级（非count类型），完成次数默认为1
          const itemType = clone.data?.type;
          if (itemType && itemType !== 'count') {
            if (!clone.time || clone.time === 0) {
              clone.time = 1;
            }
          }

          // 计算初始当前得分：权值 * 完成次数
          const baseScore = clone.score;
          const count = clone.time;
          let totalScore = multiplyScore(baseScore, count);

          // 业务规则：如果该项需要上传材料但当前没有任何文件，则当前得分视为 0 分
          //（无论是否选择了等级或有默认次数）
          const needFile = clone.isNeedUploadFile === true;
          const hasFiles = Array.isArray(clone.files) && clone.files.length > 0;
          if (needFile && !hasFiles) {
            totalScore = 0;
          }
          clone.totalScore = totalScore;

          return clone;
        });
      });
      const formatTabs = Array.isArray(valueTest.tabs) ? valueTest.tabs : [];

      // 统计 tab 状态
      let anyTabCompleted = false;
      let anyLeaderGraded = false;
      if (formatTabs.length > 0) {
        anyTabCompleted = formatTabs.some(tab => tab && tab.completed === true);
        anyLeaderGraded = formatTabs.some(tab => tab && tab.isLeaderGrade === true);
      }

      const allLeaderTrue = formatTabs.length > 0
        ? formatTabs.every(tab => tab && tab.isLeaderGrade === true)
        : false;
      const allLeaderFalse = formatTabs.length > 0
        ? formatTabs.every(tab => tab && tab.isLeaderGrade === false)
        : false;
      const allCompletedNull = formatTabs.length > 0
        ? formatTabs.every(tab => tab && (tab.completed === null || tab.completed === undefined))
        : false;
      const allCompletedFalse = formatTabs.length > 0
        ? formatTabs.every(tab => tab && tab.completed === false)
        : false;
      const allCompletedTrue = formatTabs.length > 0
        ? formatTabs.every(tab => tab && tab.completed === true)
        : false;

      // 根据需求描述的 4 种组合，优先匹配精确场景
      let isReview = false;
      let interactionLocked = false;
      let allLeaderGraded = false;
      let showWithdraw = false;
      let showWaitingLeader = false;
      let showFinalScoreMode = false;

      if (allLeaderTrue) {
        // 1. 所有 isLeaderGrade=true，completed 无论何值：
        //    按“等待上级确认”处理，整页只读
        isReview = true;
        interactionLocked = true;
        allLeaderGraded = true;
        showWaitingLeader = true;
        showWithdraw = false;
        showFinalScoreMode = false;
      } else if (allLeaderFalse && allCompletedNull) {
        // 2. 所有 isLeaderGrade=false，completed=null：
        //    初始状态，可编辑，可“提交审核”
        isReview = false;
        interactionLocked = false;
        allLeaderGraded = false;
        showWaitingLeader = false;
        showWithdraw = false;
        showFinalScoreMode = false;
      } else if (allLeaderFalse && allCompletedFalse) {
        // 3. 所有 isLeaderGrade=false，completed=false：
        //    已提交待审核，可“撤销审核”，但页面只读
        isReview = true;
        interactionLocked = true;
        allLeaderGraded = false;
        showWaitingLeader = false;
        showWithdraw = true;
        showFinalScoreMode = false;
      } else if (allLeaderFalse && allCompletedTrue) {
        // 4. 所有 isLeaderGrade=false，completed=true：
        //    显示每个 content 下的 finalScore，页面只读
        isReview = true;
        interactionLocked = true;
        allLeaderGraded = false;
        showWaitingLeader = false;
        showWithdraw = false;
        showFinalScoreMode = true;
      } else {
        // 其他混合场景，维持原先的兼容逻辑
        const shouldLock = anyTabCompleted || anyLeaderGraded;
        const canWithdraw = anyLeaderGraded && !anyTabCompleted;
        isReview = shouldLock;
        interactionLocked = shouldLock;
        allLeaderGraded = anyLeaderGraded;
        showWithdraw = canWithdraw;
        showWaitingLeader = false;
        showFinalScoreMode = false;
      }

      console.log('tabs 状态:', {
        anyTabCompleted,
        anyLeaderGraded,
        allLeaderTrue,
        allLeaderFalse,
        allCompletedNull,
        allCompletedFalse,
        allCompletedTrue,
        isReview,
        interactionLocked,
        allLeaderGraded,
        showWithdraw,
        showWaitingLeader,
        showFinalScoreMode
      });
      const defaultTab = 0;
      const currentTab = normalizedContents[defaultTab] ? defaultTab : 0;
      const currentTabInfo = formatTabs[currentTab] || null;
      console.log('当前页签信息:', currentTabInfo);
      if (currentTabInfo && Object.prototype.hasOwnProperty.call(currentTabInfo, 'robotScore')) {
        console.log('当前 robotScore:', currentTabInfo.robotScore);
      }
      const restoredLevels = {};
      normalizedContents.forEach(tabList => {
        tabList.forEach(item => {
        const preferScore = item.score ?? item.finalScore ?? null;
        if (item.data && item.data.data && preferScore != null) {
          const matched = item.data.data.find(option => Number(option.score) === Number(preferScore));
          if (matched) {
            restoredLevels[item.id] = {
              name: matched.name,
              score: matched.score
            };
          }
        }
        });
      });

      this.setData({
        tabs: formatTabs,
        contents: normalizedContents,
        currentTab,
        currentContents: normalizedContents[currentTab] || [],
        currentElement: currentTabInfo,
        currentLevel: restoredLevels,
        isReview,
        allLeaderGraded,
        showWithdraw,
        showWaitingLeader,
        showFinalScoreMode,
        interactionLocked
      });
      this.refreshInteractionLock();
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
    console.log(this.data.currentElement);
    this.refreshInteractionLock();

    if (this.data.drawerOpen) {
      this.closeDrawer();
    }
    // 更新按钮状态
    this.updateButtonState();
  },

  // 分数输入
  onScoreInput(e) {
    // 如果已完成或待审核，不允许操作
    if (this.isReadOnly()) {
      return;
    }
    const id = e.currentTarget.dataset.id;
    const currentItem = this.findItemById(id);
    // 如果有考核等级（非count类型），不允许修改完成次数
    const itemData = currentItem?.data || {};
    if (itemData.type && itemData.type !== 'count') {
      return;
    }
    const value = parseInt(e.detail.value) || 0;
    this.updateScore(id, value);
  },

  // 减少分数
  decreaseScore(e) {
    // 如果已完成或待审核，不允许操作
    if (this.isReadOnly()) {
      return;
    }
    const id = e.currentTarget.dataset.id;
    const currentItem = this.findItemById(id);
    // 如果有考核等级（非count类型），不允许修改完成次数
    const itemData = currentItem?.data || {};
    if (itemData.type && itemData.type !== 'count') {
      return;
    }
    if (currentItem && currentItem.time > 0) {
      this.updateScore(id, currentItem.time - 1);
    }
  },

  // 增加分数
  increaseScore(e) {
    // 如果已完成或待审核，不允许操作
    if (this.isReadOnly()) {
      return;
    }
    const id = e.currentTarget.dataset.id;
    const currentItem = this.findItemById(id);
    // 如果有考核等级（非count类型），不允许修改完成次数
    const itemData = currentItem?.data || {};
    if (itemData.type && itemData.type !== 'count') {
      return;
    }
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
    // 如果尝试修改time字段，检查是否有考核等级，并同步更新当前得分
    if (fields.time !== undefined) {
      const targetItem = this.findItemById(id);
      const itemData = targetItem?.data || {};
      // 如果有考核等级（非count类型），强制设置为1
      if (itemData.type && itemData.type !== 'count') {
        fields.time = 1;
      }
      // 计算当前得分：权值 * 完成次数（使用安全乘法避免精度问题）
      const baseScore = targetItem?.score;
      const count = fields.time;
      fields.totalScore = multiplyScore(baseScore, count);
    }
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
    // 如果已完成或待审核，不允许操作
    if (this.isReadOnly()) {
      return;
    }
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

  buildGradePayload() {
    const { contents = [], currentLevel = {}, userInfo = {}, indicatorId } = this.data;
    const tcs = [];
    contents.forEach(tabItems => {
      (tabItems || []).forEach(item => {
        if (!item) {
          return;
        }
        const itemType = item?.data?.type || '';
        const count = Number(item.time != null ? item.time : 0);
        let score = 0;

        if (itemType === 'count') {
          // 计数类：得分 = 权值 * 完成次数，这里直接给权值，后端会自己计算
          score = item.score;
        } else {
          // 等级类：得分来自当前选择的等级
          const level = currentLevel[item.id];
          score = Number(level?.score || 0);
        }

        // 跳过完全无操作的项目
        if (!count && !score) {
          return;
        }

        // 统一转换为带两位小数的字符串，保证 JSON 中是浮点格式（如 "1.00"）
        const scoreStr = Number(score).toFixed(2);
        tcs.push({
          contentId: item.id,
          time: count,
          score: scoreStr
        });
      });
    });
    return {
      userId: userInfo.id,
      indicatorId,
      tcs
    };
  },

  saveAllEvaluations() {
    const payload = this.buildGradePayload();
    if (!payload.userId) {
      throw new Error('用户信息丢失，请重新登录');
    }
    if (!payload.indicatorId) {
      throw new Error('指标信息缺失，无法提交');
    }
    if (!payload.tcs.length) {
      throw new Error('暂无可提交的评价内容');
    }
    return payload;
  },

  //提交审核
  submitAudit(){
    if (this.isReadOnly()) {
      wx.showToast({
        title: '已审核，无需重复提交',
        icon: 'none'
      });
      return;
    }
    if (!this.data.canSubmit) {
      wx.showToast({
        title: '请先完成评价后再提交',
        icon: 'none'
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

  async putAudit(){
    try{
      wx.showLoading({
        title: '提交中...',
        mask: true
      });
      await this.uploadAllFiles();
      const payload = this.saveAllEvaluations();
      console.log(payload,4646);
      const value=await apiService.getLeadersAll();
      console.log(value,4646);
      const allIds = (value.data || []).map(item => item.id).filter(id => id != null);
      if (!allIds.length) {
        throw new Error('暂无可通知的审核人');
      }

      //console.log(userId);
      console.log(allIds);
      console.log(payload.indicatorId);
      console.log(payload.tcs);

      console.log(this.data.userInfo.id,466464);

      const post = await apiService.postAudit({
        userId: this.data.userInfo.id,
        LeaderIds: allIds.join(","),
        indicatorId: payload.indicatorId,
        tcs: payload.tcs
      });
      console.log(post,4646); 
      if (post.code !== 200) {
        throw new Error(post.message || post.reason || '提交审核失败');
      }
      wx.showToast({
        title: '提交审核成功',
        icon: 'success'
      });
      this.setData({
        isReview: true,
        allLeaderGraded: true
      });
      this.refreshInteractionLock();
      this.updateButtonState();
      this.loadEvaluationList();
    }catch(e){
      console.error(e);
      wx.showToast({
        title: e.message || '提交审核失败',
        icon: 'none'
      });
    } finally {
      wx.hideLoading();
    }
  },


  // 撤销审核：当有领导评分但未完成时，允许撤销所有已评分要素
  withdrawAudit() {
    wx.showModal({
      title: '撤销审核确认',
      content: '确定要撤销审核吗？撤销后可重新编辑并再次提交。',
      success: (res) => {
        if (res.confirm) {
          this.doWithdrawAudit();
        }
      }
    });
  },

  async doWithdrawAudit() {
    const { userInfo = {}, indicatorId } = this.data;
    const userId = userInfo?.id;
    if (!userId) {
      wx.showToast({
        title: '用户信息缺失，请重新登录',
        icon: 'none'
      });
      return;
    }
    if (!indicatorId) {
      wx.showToast({
        title: '指标信息缺失，无法撤销',
        icon: 'none'
      });
      return;
    }
    try {
      wx.showLoading({
        title: '撤销中...',
        mask: true
      });
      const res = await apiService.cancelAudit({
        indicatorId,
        userId
      });
      if (res.code !== 200) {
        throw new Error(res.message || '撤销审核失败');
      }
      wx.showToast({
        title: res.reason || '撤销审核成功',
        icon: 'success'
      });
      this.loadEvaluationList();
    } catch (e) {
      console.error(e);
      wx.showToast({
        title: e.message || '撤销审核失败',
        icon: 'none'
      });
    } finally {
      wx.hideLoading();
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
    // 如果已完成或待审核，不允许操作
    if (this.isReadOnly()) {
      return;
    }
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
          description: '',
          isRemote: false
        }));
        this.appendFilesToItem(id, normalized);
      }
    });
  },

  // 拍照上传
  chooseImage(e) {
    // 如果已完成或待审核，不允许操作
    if (this.isReadOnly()) {
      return;
    }
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
    // 使用 chooseMedia API（推荐，支持拍照和视频）
    wx.chooseMedia({
      count: remain,
      mediaType: ['image'], // 只允许拍照
      sourceType: ['camera'], // 只允许拍照，不允许从相册选择
      camera: 'back', // 默认后置摄像头
      success: (res) => {
        const files = res.tempFiles || [];
        if (!files.length) return;
        const normalized = files.map((file, index) => ({
          name: `照片_${Date.now()}_${index + 1}.jpg`,
          path: file.tempFilePath,
          status: 'pending',
          error: '',
          description: '',
          isRemote: false
        }));
        this.appendFilesToItem(id, normalized);
      },
      fail: (err) => {
        console.error('拍照失败:', err);
        if (err.errMsg && !err.errMsg.includes('cancel')) {
          wx.showToast({
            title: '拍照失败',
            icon: 'none'
          });
        }
      }
    });
  },

  removeFile(e) {
    const id = e.currentTarget.dataset.id;
    const index = e.currentTarget.dataset.index;
    const userId = this.data.userInfo.id;
    
    console.log(id, index, 666666, userId);

    if (id == null || index == null) {
      return;
    }
    const target = this.findItemById(id);
    if (!target || !Array.isArray(target.files)) {
      return;
    }
    const file = target.files[index];
    if (!file) {
      return;
    }
    
    // 如果是远程文件（历史文件），切换删除状态（开关式）
    if (file.isRemote) {
      const nextFiles = [...target.files];
      
      if (file.status === 'deleted') {
        // 当前是删除状态，恢复文件
        const restoredFile = {
          ...file,
          status: 'uploaded'
        };
        nextFiles[index] = restoredFile;
        this.updateItemFields(id, { files: nextFiles });
        
        wx.showToast({
          title: '已恢复文件',
          icon: 'success'
        });
      } else {
        // 当前是正常状态，标记删除
        const deletedFile = {
          ...file,
          status: 'deleted',
          originalPath: file.originalPath || removeUrlPrefix(file.path) // 保存原始路径（移除URL前缀）用于删除接口
        };
        nextFiles[index] = deletedFile;
        this.updateItemFields(id, { files: nextFiles });
        
        wx.showToast({
          title: '已标记删除，提交时生效',
          icon: 'success'
        });
      }
    } else {
      // 本地文件直接删除
      const nextFiles = target.files.filter((_, idx) => idx !== Number(index));
      this.updateItemFields(id, { files: nextFiles });
    }
  },

  async deleteHistoryFile(deleteFileForm) {
    try {
      wx.showLoading({
        title: '删除中...',
        mask: true
      });
      console.log(this.data.userInfo,45)
      console.log(deleteFileForm,666666)
      const res = await apiService.deleteHistoryFile(deleteFileForm);

      wx.hideLoading();

      if (res.code === 200) {
        wx.showToast({
          title: res.reason || '删除成功',
          icon: 'success'
        });
        // 从列表中移除文件
        const target = this.findItemById(itemId);
        if (target && Array.isArray(target.files)) {
          const nextFiles = target.files.filter((_, idx) => idx !== Number(fileIndex));
          this.updateItemFields(itemId, { files: nextFiles });
        }
      } else {
        wx.showToast({
          title: res.reason || '删除失败',
          icon: 'none'
        });
      }
    } catch (e) {
      wx.hideLoading();
      console.error(e);
      wx.showToast({
        title: e.message || '删除失败',
        icon: 'none'
      });
    }
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

    const path = file.path || '';
    console.log(file.path,66)
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
    const filesToDelete = [];
    
    // 收集需要上传和删除的文件
    contents.forEach(tabContents => {
      tabContents.forEach(item => {
        const fileList = Array.isArray(item.files) ? item.files : [];
        //console.log(fileList)
        fileList.forEach((file, index) => {
          // 收集需要删除的历史文件（标记为删除的远程文件）
          if (file.isRemote && file.status === 'deleted') {
            // 移除 URL 前缀，只保留相对路径
            const cleanPath = removeUrlPrefix(file.originalPath || file.path);
            filesToDelete.push({
              filePath: cleanPath,
              description: item.uploadDesc || '',
              contentId: item.id,
              userId: userInfo.id
            });
            return;
          }
          
          // 跳过已上传成功的文件
          if (file.status === 'uploaded') {
            return;
          }
          
          // 只上传有本地路径的新文件
          if (file.path && !file.isRemote) {
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

    if (!filesToUpload.length && !filesToDelete.length) {
      return;
    }

    wx.showLoading({
      title: '处理文件中...',
      mask: true
    });

    try {
      // 1. 先删除需要删除的历史文件
      if (filesToDelete.length > 0) {
        console.log('删除文件:', filesToDelete);
        for (const deleteItem of filesToDelete) {
          try {
            const res = await apiService.deleteHistoryFile(deleteItem);
            if (res.code !== 200) {
              console.warn('删除文件失败:', deleteItem, res);
            }
          } catch (error) {
            console.warn('删除文件出错:', deleteItem, error);
          }
        }
      }

      // 2. 再上传新文件
      if (filesToUpload.length > 0) {
        // 将所有文件标记为上传中
        filesToUpload.forEach(fileItem => {
          this.updateFileStatus(fileItem.itemId, fileItem.fileIndex, { status: 'uploading', error: '' });
        });

        // 按 contentId 分组上传
        const filesByContentId = {};
        filesToUpload.forEach(fileItem => {
          const contentId = fileItem.itemId;
          if (!filesByContentId[contentId]) {
            filesByContentId[contentId] = [];
          }
          filesByContentId[contentId].push(fileItem);
        });

        console.log('上传文件分组:', filesByContentId);

        // 对每个 contentId 一次性上传所有文件
        for (const contentId in filesByContentId) {
          const items = filesByContentId[contentId];
          const filePaths = items.map(item => item.file.path).join(',');
          const firstItem = items[0];
          const description = firstItem.description || '';

          console.log('上传文件路径:', filePaths);

          try {
            const res = await apiService.uploadEvaluationFile({
              filePath: filePaths,
              description: description,
              contentId: contentId,
              userId: userInfo.id
            });
            console.log(res,6456464)
            if (res.code === 200) {
              // 所有文件上传成功
              items.forEach(item => {
                this.updateFileStatus(item.itemId, item.fileIndex, { status: 'uploaded' });
              });
            } else {
              const reason = res.reason || '上传失败，请重试';
              // 所有文件标记为失败
              items.forEach(item => {
                this.updateFileStatus(item.itemId, item.fileIndex, { status: 'failed', error: reason });
              });
              throw new Error(reason);
            }
          } catch (error) {
            const message = error?.message || '上传失败，请重试';
            // 所有文件标记为失败
            items.forEach(item => {
              this.updateFileStatus(item.itemId, item.fileIndex, { status: 'failed', error: message });
            });
            throw error;
          }
        }
      }
    } finally {
      wx.hideLoading();
    }
  }
  ,

});