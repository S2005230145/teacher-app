import apiService from '../../utils/api.js';
Page({
  data: {
    phone: '',
    password: '',
    phoneFocus: false,
    passwordFocus: false,
    passwordVisible: false,
    loading: false,
    errorMessage: '',
    // 学校选择相关
    campusList: [],
    campusIndex: 0,
    selectedCampus: '',
    selectedCampusId: null,
    campusFocus: false,
    showCampusPicker: false
  },

  // 监听输入变化
  onInputChange(e) {
    // 双向绑定已通过 model:value 处理
  },

  onPhoneFocus() {
    this.setData({ phoneFocus: true });
  },

  onPhoneBlur() {
    this.setData({ phoneFocus: false });
  },

  onPasswordFocus() {
    this.setData({ passwordFocus: true });
  },

  onPasswordBlur() {
    this.setData({ passwordFocus: false });
  },

  togglePasswordVisibility() {
    this.setData({ 
      passwordVisible: !this.data.passwordVisible 
    });
  },

  // 学校选择相关方法
  showCampusPicker() {
    const campusList = this.data.campusList || [];
    const selectedCampusId = this.data.selectedCampusId;
    let index = 0;

    // 如果已经选择过学校，则定位到已选择的那一项
    if (selectedCampusId != null && campusList.length) {
      const foundIndex = campusList.findIndex(item => item.id === selectedCampusId);
      if (foundIndex >= 0) {
        index = foundIndex;
      }
    }

    this.setData({ 
      showCampusPicker: true,
      campusFocus: true,
      campusIndex: index
    });
  },

  hideCampusPicker() {
    this.setData({ 
      showCampusPicker: false,
      campusFocus: false 
    });
  },

  stopPropagation() {
    // 阻止事件冒泡
  },

  // picker-view变化事件
  onPickerViewChange(e) {
    const value = e && e.detail && e.detail.value;
    if (!Array.isArray(value) || typeof value[0] !== 'number') {
      return;
    }
    let index = value[0];
    const max = (this.data.campusList || []).length;

    // 防御：下标越界时进行修正
    if (index < 0) index = 0;
    if (max && index >= max) index = max - 1;

    // 立即更新 campusIndex，确保确认时能获取到最新值
    this.setData({
      campusIndex: index
    });
  },

  // 确认选择
  confirmCampusPicker() {
    const campusList = this.data.campusList || [];
    // 使用最新的 campusIndex
    let index = this.data.campusIndex;

    // 防御：如果 index 为 undefined 或非法，回退到 0
    if (typeof index !== 'number' || Number.isNaN(index)) {
      index = 0;
    }
    if (index < 0 || index >= campusList.length) {
      index = 0;
    }

    const selectedCampus = campusList[index];
    
    // 安全检查：确保 selectedCampus 存在
    if (!selectedCampus) {
      console.warn('选中的校区不存在，index:', index);
      this.setData({
        showCampusPicker: false,
        campusFocus: false
      });
      return;
    }
    
    this.setData({
      selectedCampus: selectedCampus.campusName || selectedCampus.name || '',
      selectedCampusId: selectedCampus.id || null,
      showCampusPicker: false,
      campusFocus: false
    });
  },

  // 计算属性：表单是否有效
  get isFormValid() {
    const { phone, password } = this.data;
    const phoneValid = /^1[3-9]\d{9}$/.test(phone.trim());
    return phoneValid && password.length >= 6;
  },

  // 登录方法
  async onLogin() {
    // 验证手机号
    const phone = this.data.phone.trim();
    if (!/^1[3-9]\d{9}$/.test(phone)) {
      this.setData({ 
        errorMessage: '请输入正确的手机号',
        loading: false
      });
      return;
    }
    
    // 验证密码
    if (this.data.password.length < 6 || this.data.password.length > 20) {
      this.setData({ 
        errorMessage: '密码长度为6-20位',
        loading: false
      });
      return;
    }
    
    // 验证学校
    if (this.data.selectedCampusId === null) {
      this.setData({ 
        errorMessage: '请选择学校',
        loading: false
      });
      return;
    }
    
    this.setData({ 
      loading: true,
      errorMessage: ''
    });
    try {
      // 调用登录接口
      this.callLoginApi({
        phone: phone,
        password: this.data.password,
        campusId: this.data.selectedCampusId
      });
    } catch (error) {
      this.handleLoginFailure('网络错误，请检查连接');
    }
  },

  // 调用登录API
  async callLoginApi(loginData) {
    try{
      // 保存学校信息到本地存储
      if (this.data.selectedCampusId && this.data.selectedCampus) {
        wx.setStorageSync('selectedCampus', {
          id: this.data.selectedCampusId,
          name: this.data.selectedCampus
        });
      }
      console.log(loginData)
      const res = await apiService.getLogin(loginData);
      console.log(res)
      if (res.code === 200) {
        this.setData({loading:false});
        wx.setStorageSync('userInfo', res.data || res);
        wx.setStorageSync('token', res.token || res.data?.token || res.accessToken);
        // 跳转到考核页面
        setTimeout(() => {
          wx.reLaunch({
            url: '/pages/main/main'  // 跳转到考核页面
          });
        }, 1500);
        await this.handleLoginSuccess(res.data || res);
      } else {
        this.setData({loading:false});
        const errorMsg = res.message || res.msg || '登录失败，请检查手机号和密码';
        this.handleLoginFailure(errorMsg);
      }
    }catch(e){
      this.setData({loading:false});
      console.error(e);
      this.handleLoginFailure(e.message || '网络错误，请稍后重试');
    }
  },

  // 处理登录成功
  async handleLoginSuccess(userData) {
    // 显示成功提示
    await this.showSuccessMessage('登录成功');
    
    // 存储用户信息
    wx.setStorageSync('userInfo', userData);
    wx.setStorageSync('token', userData.token);
    
    // 跳转到首页
    wx.reLaunch({
      url: '/pages/dashboard/dashboard'
    });
  },

  // 处理登录失败
  handleLoginFailure(message) {
    this.setData({ 
      loading: false,
      errorMessage: message
    });
  },

  // 显示成功消息
  showSuccessMessage(text) {
    return new Promise((resolve) => {
      wx.showToast({
        title: text,
        icon: 'success',
        duration: 1500,
        success: () => {
          setTimeout(resolve, 1500);
        }
      });
    });
  },

  onForgotPassword() {
    wx.showModal({
      title: '忘记密码',
      content: '请联系学校系统管理员重置您的密码',
      confirmText: '知道了',
      showCancel: false
    });
  },

  onContactAdmin() {
    wx.makePhoneCall({
      phoneNumber: '400-123-4567'
    });
  },

  // 页面加载时初始化
  async onLoad() {
    // 获取学校列表
    await this.loadSchoolList();
  },

  // 加载学校列表
  async loadSchoolList() {
    try {
      wx.showLoading({ title: '加载中...' });
      const res = await apiService.getSchoolList();
      if (res.code === 200 && res.list && res.list.length > 0) {
        // 格式化学校列表数据
        const campusList = res.list.map(item => ({
          id: item.id,
          name: item.campusName,
          campusName: item.campusName,
          address: item.address,
          phone: item.phone,
          principal: item.principal
        }));
        
        // 如果之前有选择过学校，恢复选择
        let initialIndex = 0;
        const savedCampus = wx.getStorageSync('selectedCampus');
        if (savedCampus && savedCampus.id) {
          const foundIndex = campusList.findIndex(item => item.id === savedCampus.id);
          if (foundIndex >= 0) {
            initialIndex = foundIndex;
            this.setData({
              selectedCampus: savedCampus.name || campusList[foundIndex].campusName,
              selectedCampusId: savedCampus.id
            });
          }
        }
        
        this.setData({
          campusList: campusList,
          campusIndex: initialIndex
        });
      } else {
        wx.showToast({
          title: '获取学校列表失败',
          icon: 'none'
        });
      }
      wx.hideLoading();
    } catch (e) {
      wx.hideLoading();
      console.error('获取学校列表失败:', e);
      wx.showToast({
        title: '获取学校列表失败',
        icon: 'none'
      });
    }
  },

})