// api.js
import config from './config.js';
class ApiService {
  constructor() {
    this.baseURL = config.baseURL;
  }

  // 统一请求方法
  request(url, options = {}) {
    const fullURL = `${this.baseURL}${url}`;
    
    const defaultOptions = {
      method: 'GET',
      header: {
        'Content-Type': 'application/json',
        'Authorization': wx.getStorageSync('token') || ''
      }
    };

    return new Promise((resolve, reject) => {
      wx.request({
        url: fullURL,
        ...defaultOptions,
        ...options,
        success: (res) => {
          if (res.statusCode === 200) {
            resolve(res.data);
          } else {
            reject(this.handleError(res));
          }
        },
        fail: (err) => {
          reject(this.handleError(err));
        }
      });
    });
  }

  // 错误处理
  handleError(error) {
    console.error('API请求错误:', error);
    return {
      code: error.statusCode || -1,
      message: error.errMsg || '网络请求失败'
    };
  }

  // 具体API方法
  getTest(){
    return this.request("/tk/test/",{
      method: 'POST'
    })
  }
  //index.js
  getLogin(data){
    return this.request("/tk/login/noauth/",{
      method: 'POST',
      data:data,
      header: {
        'Content-Type': 'application/json'
      }
    })
  }
  //assessment.js
  getAssessmentList(data){
    return this.request("/front/tk/getList/",{
      method: 'POST',
      data:data
    })
  }
  getSummary(data){
    return this.request("/front/tk/getExamSummary/",{
      method: 'POST',
      data:data
    })
  }
  //evaluation.js
  getEvaluationList(data){
    return this.request("/front/tk/getElementList/",{
      method: 'POST',
      data:data
    });
  }

  grade(data){
    return this.request("/tk/grade/",{
      method: 'POST',
      data:data
    });
  }

  getLeadersAll(){
    return this.request("/tk/get/leader/",{
      method: 'POST'
    });
  }

  postAudit(data){
    return this.request("/tk/post/",{
      method: 'POST',
      data:data
    });
  }
  //profile.js
  getRankAndScore(data){
    return this.request("/front/tk/getRankAndScore/",{
      method: 'POST',
      data:data
    });
  }

  getUserStats(data){
    return this.request("/front/tk/getUserStats/",{
      method: 'POST',
      data:data
    });
  }

  uploadEvaluationFile({ filePath, description, contentId, userId }) {
    const url = `${this.baseURL}/front/tk/file/upload/`;
    return new Promise((resolve, reject) => {
      wx.uploadFile({
        url,
        filePath,
        name: 'file',
        formData: {
          description: description || '',
          contentId,
          userId
        },
        header: {
          'Authorization': wx.getStorageSync('token') || ''
        },
        success: (res) => {
          try {
            const data = JSON.parse(res.data);
            resolve(data);
          } catch (error) {
            reject(error);
          }
        },
        fail: (err) => {
          reject(err);
        }
      });
    });
  }
  //statistics.js
  getStatistics(){
    return this.request("/front/tk/getStatistics/",{
      method: 'POST'
    });
  }
  getTeacherCompletionStatus(){
    return this.request("/front/tk/teacher/person/status/",{
      method:'POST'
    });
  }
  //kpi.js   
  getKPI(data){
    return this.request("/front/tk/getKPI/",{
      method: 'POST',
      data:data
    });
  }
  //profile.js - 导出教师绩效（返回文件流）
  exportKPI(data){
    const fullURL = `${this.baseURL}/tk/export/`;
    
    return new Promise((resolve, reject) => {
      wx.request({
        url: fullURL,
        method: 'POST',
        data: data,
        responseType: 'arraybuffer', // 接收二进制数据
        header: {
          'Content-Type': 'application/json',
          'Authorization': wx.getStorageSync('token') || ''
        },
        success: (res) => {
          if (res.statusCode === 200) {
            resolve(res.data); // 返回 ArrayBuffer
          } else {
            reject(this.handleError(res));
          }
        },
        fail: (err) => {
          reject(this.handleError(err));
        }
      });
    });
  }

}

export default new ApiService();