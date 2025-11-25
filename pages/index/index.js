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
    showAutoLoginTip: false,
    loginTimer: null, // 自动登录定时器
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
    // 双向绑定已通过 model:value 处理，这里主要处理自动登录逻辑
    this.checkAutoLogin();
  },

  onPhoneFocus() {
    this.setData({ phoneFocus: true });
  },

  onPhoneBlur() {
    this.setData({ phoneFocus: false });
    this.checkAutoLogin();
  },

  onPasswordFocus() {
    this.setData({ passwordFocus: true });
  },

  onPasswordBlur() {
    this.setData({ passwordFocus: false });
    this.checkAutoLogin();
  },

  togglePasswordVisibility() {
    this.setData({ 
      passwordVisible: !this.data.passwordVisible 
    });
  },

  // 学校选择相关方法
  showCampusPicker() {
    this.setData({ 
      showCampusPicker: true,
      campusFocus: true 
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
    const index = e.detail.value[0];
    this.setData({
      campusIndex: index
    });
  },

  // 确认选择
  confirmCampusPicker() {
    const index = this.data.campusIndex;
    const selectedCampus = this.data.campusList[index];
    this.setData({
      selectedCampus: selectedCampus.campusName || selectedCampus.name,
      selectedCampusId: selectedCampus.id,
      showCampusPicker: false,
      campusFocus: false
    });
    this.checkAutoLogin();
  },

  // 检查是否满足自动登录条件
  checkAutoLogin() {
    const { phone, password, selectedCampusId, loading } = this.data;
    
    // 清除之前的定时器
    if (this.loginTimer) {
      clearTimeout(this.loginTimer);
      this.loginTimer = null;
    }

    // 验证手机号格式（11位数字）
    const phoneValid = /^1[3-9]\d{9}$/.test(phone.trim());
    
    // 如果表单有效且不在加载中，设置自动登录（需要选择校区）
    if (phoneValid && password.length >= 6 && selectedCampusId !== null && !loading) {
      this.setData({ 
        showAutoLoginTip: true,
        errorMessage: '' 
      });
      
      // 延迟1秒后自动登录（给用户反应时间）
      this.loginTimer = setTimeout(() => {
        this.onLogin();
      }, 1000);
    } else {
      this.setData({ showAutoLoginTip: false });
    }
  },

  // 计算属性：表单是否有效
  get isFormValid() {
    const { phone, password } = this.data;
    const phoneValid = /^1[3-9]\d{9}$/.test(phone.trim());
    return phoneValid && password.length >= 6;
  },

  // 登录方法
  async onLogin() {
    // 清除自动登录定时器
    if (this.loginTimer) {
      clearTimeout(this.loginTimer);
      this.loginTimer = null;
    }
    
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
      errorMessage: '',
      showAutoLoginTip: false 
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
      console.log(res)
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
        
        this.setData({
          campusList: campusList,
          campusIndex: 0,
          selectedCampus: campusList[0].campusName,
          selectedCampusId: campusList[0].id
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

  // 页面卸载时清理定时器
  onUnload() {
    if (this.loginTimer) {
      clearTimeout(this.loginTimer);
    }
  }
})