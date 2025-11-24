import apiService from '../../utils/api.js';
Page({
  data: {
    username: '',
    password: '',
    usernameFocus: false,
    passwordFocus: false,
    passwordVisible: false,
    loading: false,
    errorMessage: '',
    showAutoLoginTip: false,
    loginTimer: null, // 自动登录定时器
    // 校区选择相关
    campusList: [
      { id: 1, name: '主校区' },
      { id: 2, name: '东校区' },
      { id: 3, name: '西校区' },
      { id: 4, name: '南校区' },
      { id: 5, name: '北校区' }
    ],
    campusIndex: 0,
    selectedCampus: '',
    campusFocus: false,
    showCampusPicker: false
  },

  // 监听输入变化
  onInputChange(e) {
    // 双向绑定已通过 model:value 处理，这里主要处理自动登录逻辑
    this.checkAutoLogin();
  },

  onUsernameFocus() {
    this.setData({ usernameFocus: true });
  },

  onUsernameBlur() {
    this.setData({ usernameFocus: false });
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

  // 校区选择相关方法
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
    const selectedCampus = this.data.campusList[index].name;
    this.setData({
      selectedCampus: selectedCampus,
      showCampusPicker: false,
      campusFocus: false
    });
    this.checkAutoLogin();
  },

  // 检查是否满足自动登录条件
  checkAutoLogin() {
    const { username, password, selectedCampus, loading } = this.data;
    
    // 清除之前的定时器
    if (this.loginTimer) {
      clearTimeout(this.loginTimer);
      this.loginTimer = null;
    }

    // 如果表单有效且不在加载中，设置自动登录（需要选择校区）
    if (username.trim().length > 0 && password.length >= 6 && selectedCampus && !loading) {
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
    const { username, password } = this.data;
    return username.trim().length > 0 && password.length >= 6;
  },

  // 登录方法
  async onLogin() {
    // 清除自动登录定时器
    if (this.loginTimer) {
      clearTimeout(this.loginTimer);
      this.loginTimer = null;
    }
    this.setData({ 
      loading: true,
      errorMessage: '',
      showAutoLoginTip: false 
    });
    try {
      // 调用登录接口
      this.callLoginApi({
        username: this.data.username.trim(),
        password: this.data.password
      });
    } catch (error) {
      this.handleLoginFailure('网络错误，请检查连接');
    }
  },

  // 调用登录API
  async callLoginApi(loginData) {
    try{
      // 获取选中的校区信息
      const selectedCampusId = this.data.campusList[this.data.campusIndex]?.id;
      const selectedCampusName = this.data.selectedCampus;
      
      // 将校区信息添加到登录数据中
      const loginDataWithCampus = {
        ...loginData,
        campusId: selectedCampusId,
        campusName: selectedCampusName
      };
      
      // 保存校区信息到本地存储
      if (selectedCampusId && selectedCampusName) {
        wx.setStorageSync('selectedCampus', {
          id: selectedCampusId,
          name: selectedCampusName
        });
      }
      
      const res=await apiService.getLogin(loginDataWithCampus);
      if (res.code === 200) {
        this.setData({loading:false});
        wx.setStorageSync('userInfo', res);
        wx.setStorageSync('token', res.token || res.accessToken);
         // 跳转到考核页面
        setTimeout(() => {
          wx.reLaunch({
            url: '/pages/main/main'  // 跳转到考核页面
          });
        }, 1500);
        await this.handleLoginSuccess(res);
      } else {
        this.setData({loading:false});
        console.log(`登录失败（${res.statusCode}）`);
        this.handleLoginFailure(res);
      }
    }catch(e){
      this.setData({loading:false});
      console.error(e);
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
  onLoad() {
    // 初始化默认选中第一个校区
    if (this.data.campusList.length > 0 && !this.data.selectedCampus) {
      this.setData({
        selectedCampus: this.data.campusList[0].name
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