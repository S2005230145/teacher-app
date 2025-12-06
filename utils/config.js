// config.js
const config = {
  // 开发环境
  development: {
    baseURL: 'https://r.xcx100.info/v1',
    //baseURL: 'http://127.0.0.1:9000/v1',
    apiVersion: 'v1'
  },
  
  // 测试环境
  testing: {
    baseURL: 'https://r.xcx100.info/v1',
    //baseURL: 'http://127.0.0.1:9000/v1',
    apiVersion: 'v1'
  },
};

// 根据环境变量选择配置
const env = 'development'; // 可通过编译条件或小程序后台设置
export default config[env];