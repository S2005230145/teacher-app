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
  //index.js - 获取学校列表
  getSchoolList(){
    return this.request("/front/tk/school/list/",{
      method: 'POST',
      header: {
        'Content-Type': 'application/json'
      }
    })
  }
  //index.js - 登录
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
  getEvaluationListNew(data){
    return this.request("/front/tk/getElementList/new/",{
      method: 'POST',
      data:data
    });
  }

  grade(data){
    return this.request("/tk/grade/new/",{
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
    const url = `${this.baseURL}/front/tk/file/upload/add/`;

    // 将 filePath 统一处理为数组，支持字符串（带逗号）、单个路径或数组
    const normalizeFilePaths = (input) => {
      if (!input) {
        return [];
      }
      if (Array.isArray(input)) {
        return input.map(path => (path || '').trim()).filter(Boolean);
      }
      if (typeof input === 'string') {
        return input.split(',').map(path => path.trim()).filter(Boolean);
      }
      // 其他类型（如对象）统一转成字符串
      return [String(input).trim()].filter(Boolean);
    };

    const filePaths = normalizeFilePaths(filePath);
    if (!filePaths.length) {
      return Promise.reject(new Error('没有有效的文件路径'));
    }

    const uploadSingleFile = (singleFilePath) => {
      return new Promise((resolve, reject) => {
        wx.uploadFile({
          url,
          filePath: singleFilePath,
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
              console.log(res)
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
    };

    if (filePaths.length === 1) {
      return uploadSingleFile(filePaths[0]);
    }

    // 多个文件并行上传
    return Promise.all(filePaths.map(uploadSingleFile)).then(results => {
      const failedResults = results.filter(r => r.code !== 200);
      if (failedResults.length > 0) {
        const errorMsg = failedResults[0].reason || '部分文件上传失败';
        return Promise.reject(new Error(errorMsg));
      }
      return results[0] || { code: 200, message: '所有文件上传成功' };
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

  //判断是否提交过审核
getIsAudit(data){
  return this.request("/front/tk/is/submit/audit/",{
    method: 'POST',
    data:data
  });
}

cancelAudit(data){
  return this.request("/front/tk/audit/withDraw/",{
    method: 'POST',
    data:data
  });
}

  // 删除历史文件
  deleteHistoryFile({ filePath, description, contentId, userId }) {
    return this.request("/front/tk/file/upload/delete/", {
      method: 'POST',
      data: {
        filePath,
        description: description || '',
        contentId,
        userId
      }
    });
  }

}



export default new ApiService();