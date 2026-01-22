import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Engine, Scene, ArcRotateCamera, HemisphericLight, DirectionalLight, Vector3, Color3, Color4, StandardMaterial, SceneLoader } from '@babylonjs/core';
import '@babylonjs/materials';

function STLThumbnailGenerator({ stlFile, onThumbnailGenerated }) {
  const canvasRef = useRef(null);
  const [status, setStatus] = useState('ready');

  const generateThumbnail = useCallback(() => {
    setStatus('generating');

    const canvas = canvasRef.current;

    // 创建Babylon.js引擎
    const engine = new Engine(canvas, true, {
      antialias: true,
      preserveDrawingBuffer: true
    });

    // 创建场景
    const scene = new Scene(engine);
    scene.clearColor = new Color4(0.95, 0.95, 0.95, 1);

    // 创建相机
    const camera = new ArcRotateCamera(
      'camera',
      Math.PI / 4,
      Math.PI / 3,
      10,
      Vector3.Zero(),
      scene
    );

    // 添加环境光
    const ambientLight = new HemisphericLight(
      'ambientLight',
      new Vector3(0, 1, 0),
      scene
    );
    ambientLight.intensity = 0.5;
    ambientLight.diffuse = new Color3(1, 1, 1);
    ambientLight.groundColor = new Color3(0.2, 0.2, 0.2);

    // 添加主光源
    const mainLight = new DirectionalLight(
      'mainLight',
      new Vector3(-1, -1, -1),
      scene
    );
    mainLight.intensity = 0.8;
    mainLight.diffuse = new Color3(1, 1, 1);
    mainLight.specular = new Color3(1, 1, 1);

    // 添加辅助光源
    const fillLight = new DirectionalLight(
      'fillLight',
      new Vector3(0.5, -0.5, 0.5),
      scene
    );
    fillLight.intensity = 0.5;
    fillLight.diffuse = new Color3(1, 1, 1);

    // 创建临时URL来加载文件
    const fileUrl = URL.createObjectURL(stlFile);

    // 加载STL模型
    SceneLoader.ImportMesh(
      '',
      '',
      fileUrl,
      scene,
      (meshes) => {
        if (meshes.length > 0) {
          const modelMesh = meshes[0];

          // 创建材质
          const material = new StandardMaterial('modelMaterial', scene);
          material.diffuseColor = new Color3(0, 1, 0);
          material.specularColor = new Color3(0.07, 0.07, 0.07);
          material.specularPower = 200;
          modelMesh.material = material;

          // 计算边界框
          const boundingInfo = modelMesh.getBoundingInfo();
          const size = boundingInfo.maximum.subtract(boundingInfo.minimum);
          const maxDim = Math.max(size.x, size.y, size.z);
          const center = boundingInfo.minimum.add(size.scale(0.5));

          // 缩放和居中模型
          const scale = 5 / maxDim;
          modelMesh.scaling = new Vector3(scale, scale, scale);
          modelMesh.position = center.scale(-scale);

          // 调整相机
          camera.setTarget(Vector3.Zero());
          camera.radius = maxDim * 1.5;

          // 渲染一帧
          scene.render();

          // 生成缩略图
          setTimeout(() => {
            // 将canvas转换为Blob
            canvas.toBlob((blob) => {
              if (blob) {
                const thumbnailFile = new File([blob], 'thumbnail.png', { type: 'image/png' });
                onThumbnailGenerated(thumbnailFile);
              }
              setStatus('completed');
              
              // 清理
              URL.revokeObjectURL(fileUrl);
              engine.dispose();
            }, 'image/png');
          }, 100);
        }
      },
      (progress) => {
        console.log(`加载进度: ${Math.round((progress.loaded / progress.total) * 100)}%`);
      },
      (error) => {
        console.error('加载STL模型失败:', error);
        setStatus('error');
        URL.revokeObjectURL(fileUrl);
        engine.dispose();
      }
    );
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