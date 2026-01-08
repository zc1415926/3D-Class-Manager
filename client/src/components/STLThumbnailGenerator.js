import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader';

function STLThumbnailGenerator({ stlFile, onThumbnailGenerated }) {
  const canvasRef = useRef(null);
  const [status, setStatus] = useState('ready');

  const generateThumbnail = useCallback(() => {
    setStatus('generating');

    const canvas = canvasRef.current;
    const width = 800;
    const height = 500;

    // 创建场景
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf0f0f0);

    // 创建相机
    const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
    camera.position.z = 5;

    // 创建渲染器
    const renderer = new THREE.WebGLRenderer({
      canvas: canvas,
      antialias: true,
      preserveDrawingBuffer: true
    });
    renderer.setSize(width, height);

    // 添加灯光
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(1, 1, 1);
    scene.add(directionalLight);

    const directionalLight2 = new THREE.DirectionalLight(0xffffff, 0.5);
    directionalLight2.position.set(-1, -1, -1);
    scene.add(directionalLight2);

    // 加载STL模型
    const reader = new FileReader();
    reader.onload = (e) => {
      const loader = new STLLoader();
      const geometry = loader.parse(e.target.result);

      const material = new THREE.MeshPhongMaterial({
        color: 0x00ff00,
        specular: 0x111111,
        shininess: 200,
        side: THREE.DoubleSide
      });
      const mesh = new THREE.Mesh(geometry, material);

      // 居中模型
      geometry.center();

      // 自动缩放以充满视口
      const box = new THREE.Box3().setFromObject(mesh);
      const size = new THREE.Vector3();
      box.getSize(size);
      const maxDim = Math.max(size.x, size.y, size.z);
      
      // 根据相机FOV和距离计算合适的缩放比例
      const fov = camera.fov * (Math.PI / 180);
      const cameraDistance = 8;
      const visibleHeight = 2 * Math.tan(fov / 2) * cameraDistance;
      const visibleWidth = visibleHeight * (width / height);
      const minVisibleDim = Math.min(visibleWidth, visibleHeight);
      const scale = (minVisibleDim * 0.85) / maxDim;
      mesh.scale.set(scale, scale, scale);

      scene.add(mesh);

      // 设置相机位置 - 斜45度看侧面
      camera.position.set(6, 3, 6);
      camera.lookAt(0, 0, 0);

      // 渲染
      renderer.render(scene, camera);

      // 生成缩略图
      setTimeout(() => {
        // 将canvas转换为Blob
        canvas.toBlob((blob) => {
          if (blob) {
            const thumbnailFile = new File([blob], 'thumbnail.png', { type: 'image/png' });
            onThumbnailGenerated(thumbnailFile);
          }
          setStatus('completed');
        }, 'image/png');
      }, 100);
    };

    reader.readAsArrayBuffer(stlFile);
  }, [onThumbnailGenerated, stlFile]);

  useEffect(() => {
    if (stlFile && canvasRef.current && status === 'ready') {
      generateThumbnail();
    }
  }, [stlFile, status, generateThumbnail]);

  return (
    <div>
      <canvas
        ref={canvasRef}
        style={{ display: status === 'completed' ? 'none' : 'block' }}
      />
      {status === 'generating' && (
        <div className="text-center mt-2">
          <div className="spinner-border spinner-border-sm text-primary" role="status">
            <span className="visually-hidden">生成缩略图中...</span>
          </div>
          <span className="ms-2">生成缩略图中...</span>
        </div>
      )}
    </div>
  );
}

export default STLThumbnailGenerator;