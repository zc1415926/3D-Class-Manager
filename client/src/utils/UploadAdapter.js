import axios from 'axios';

class UploadAdapter {
  constructor(loader) {
    this.loader = loader;
  }

  upload() {
    return this.loader.file.then(file => new Promise((resolve, reject) => {
      const data = new FormData();
      data.append('upload', file);

      axios.post('/api/upload-image', data, {
        headers: {
          'Content-Type': 'multipart/form-data'
        },
        onUploadProgress: (progressEvent) => {
          if (progressEvent.lengthComputable) {
            this.loader.uploadTotal = progressEvent.total;
            this.loader.uploaded = progressEvent.loaded;
          }
        }
      })
      .then(response => {
        if (response.data && response.data.url) {
          resolve({
            default: response.data.url
          });
        } else {
          reject('上传失败：服务器返回格式错误');
        }
      })
      .catch(error => {
        reject(error.message || '上传失败');
      });
    }));
  }

  abort() {
    // 可以在这里实现取消上传的逻辑
  }
}

export default UploadAdapter;