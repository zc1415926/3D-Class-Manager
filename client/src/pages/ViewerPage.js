import React, { useEffect, useRef, useState, useCallback } from 'react';
import axios from 'axios';
import { useParams, Link, useLocation } from 'react-router-dom';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader';

function ViewerPage() {
  const { id } = useParams();
  const location = useLocation();
  const containerRef = useRef(null);
  const [submission, setSubmission] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchSubmission = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await axios.get(`/api/submissions/${id}`);
      if (response.data.success) {
        setSubmission(response.data.data);
      } else {
        setError('获取作品信息失败');
      }
    } catch (err) {
      console.error('获取作品信息错误:', err);
      setError('获取作品信息失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  }, [id]);

  const initViewer = useCallback(() => {
    if (!containerRef.current || !submission) return;

    const container = containerRef.current;
    const width = container.clientWidth;
    const height = container.clientHeight;

    // 创建场景 - 简单的深色背景
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x222222);

    // 创建相机
    const camera = new THREE.PerspectiveCamera(
      75,
      width / height,
      0.1,
      1000
    );
    camera.position.z = 5;

    // 创建渲染器 - 简化配置提升性能
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    // 添加轨道控制器
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;

    // 简单的灯光系统
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1.2);
    directionalLight.position.set(5, 5, 5);
    scene.add(directionalLight);

    // 加载STL模型
    const loader = new STLLoader();
    loader.load(
      submission.filePath,
      (geometry) => {
        // 使用简单的Phong材质
        const material = new THREE.MeshPhongMaterial({
          color: 0x87ceeb,
          side: THREE.DoubleSide
        });
        const mesh = new THREE.Mesh(geometry, material);

        // 居中模型
        geometry.center();

        // 自动缩放以适应视图
        const box = new THREE.Box3().setFromObject(mesh);
        const size = new THREE.Vector3();
        box.getSize(size);
        const maxDim = Math.max(size.x, size.y, size.z);
        const scale = 3.5 / maxDim;
        mesh.scale.set(scale, scale, scale);

        scene.add(mesh);

        // 设置相机位置
        camera.position.set(5, 3, 5);
        camera.lookAt(0, 0, 0);
        controls.update();
      },
      (xhr) => {
        console.log((xhr.loaded / xhr.total) * 100 + '% loaded');
      },
      (error) => {
        console.error('加载STL模型失败:', error);
        setError('加载3D模型失败');
      }
    );

    // 动画循环
    const animate = () => {
      requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    // 处理窗口大小变化
    const handleResize = () => {
      if (!containerRef.current) return;
      const newWidth = containerRef.current.clientWidth;
      const newHeight = containerRef.current.clientHeight;
      camera.aspect = newWidth / newHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(newWidth, newHeight);
    };

    window.addEventListener('resize', handleResize);

    // 清理函数
    return () => {
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
      controls.dispose();
    };
  }, [submission]);

  useEffect(() => {
    fetchSubmission();
  }, [fetchSubmission]);

  // 获取返回路径
  const getBackPath = () => {
    const from = location.state?.from;
    if (from === '/works' || from === '/student-management') {
      return from;
    }
    return '/student-view';
  };

  useEffect(() => {
    if (submission && containerRef.current) {
      const cleanup = initViewer();
      return () => {
        if (cleanup) cleanup();
        // 清理资源
        if (containerRef.current) {
          containerRef.current.innerHTML = '';
        }
      };
    }
  }, [submission, initViewer]);

  if (loading) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">加载中...</span>
        </div>
        <p className="mt-3">加载作品信息中...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-5">
        <div className="display-1 mb-3">❌</div>
        <h4>{error}</h4>
        <Link to="/teacher" className="btn btn-primary mt-3">
          返回教师页面
        </Link>
      </div>
    );
  }

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <Link to={getBackPath()} className="btn btn-outline-secondary me-2">
            ← 返回
          </Link>
          <h2 className="d-inline-block align-middle mb-0">
            🎨 作品详情
          </h2>
        </div>
        <button
          className="btn btn-info text-white"
          onClick={() => window.location.reload()}
        >
          🔄 重新加载
        </button>
      </div>

      <div className="row">
        <div className="col-lg-8">
          <div className="card">
            <div className="card-body p-0">
              <div ref={containerRef} id="stl-viewer"></div>
            </div>
          </div>
          <div className="card mt-3">
            <div className="card-body">
              <h5 className="card-title">🎮 操作说明</h5>
              <ul className="mb-0">
                <li>鼠标左键拖拽：旋转模型</li>
                <li>鼠标右键拖拽：平移模型</li>
                <li>鼠标滚轮：缩放模型</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="col-lg-4">
          <div className="card">
            <div className="card-header bg-primary text-white">
              <h5 className="mb-0">📋 作品信息</h5>
            </div>
            <div className="card-body">
              <table className="table table-borderless">
                <tbody>
                  <tr>
                    <td className="fw-bold">作品名称:</td>
                    <td>{submission.workName}</td>
                  </tr>
                  <tr>
                    <td className="fw-bold">学生姓名:</td>
                    <td>{submission.studentName}</td>
                  </tr>
                  {submission.description && (
                    <tr>
                      <td className="fw-bold">作品说明:</td>
                      <td>{submission.description}</td>
                    </tr>
                  )}
                  <tr>
                    <td className="fw-bold">文件名:</td>
                    <td>{submission.filename}</td>
                  </tr>
                  <tr>
                    <td className="fw-bold">提交时间:</td>
                    <td>
                      {new Date(submission.createdAt).toLocaleString('zh-CN')}
                    </td>
                  </tr>
                </tbody>
              </table>

              {submission.thumbnailPath && (
                <div className="mt-3">
                  <h6 className="fw-bold">缩略图:</h6>
                  <img
                    src={submission.thumbnailPath}
                    alt="缩略图"
                    className="img-fluid rounded"
                    style={{ maxHeight: '200px' }}
                  />
                </div>
              )}
            </div>
          </div>

          <div className="card mt-3">
            <div className="card-body">
              <a
                href={submission.filePath}
                download={submission.filename}
                className="btn btn-success w-100"
              >
                📥 下载STL文件
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ViewerPage;