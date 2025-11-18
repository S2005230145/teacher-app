// config.js
const config = {
  // 开发环境
  development: {
    baseURL: 'http://120.48.81.209/v1/',
    apiVersion: 'v1'
  },
  
  // 测试环境
  testing: {
    baseURL: 'http://120.48.81.209/v1/',
    apiVersion: 'v1'
  },
};

// 根据环境变量选择配置
const env = 'development'; // 可通过编译条件或小程序后台设置
export default config[env];