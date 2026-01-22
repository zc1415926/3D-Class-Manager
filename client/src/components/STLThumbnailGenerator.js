import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Engine, Scene, ArcRotateCamera, HemisphericLight, DirectionalLight, Vector3, Color3, Color4, StandardMaterial } from '@babylonjs/core';
import '@babylonjs/loaders';
import '@babylonjs/loaders/OBJ/objFileLoader';
import '@babylonjs/loaders/STL/stlFileLoader';
import '@babylonjs/materials';

function STLThumbnailGenerator({ stlFile, onThumbnailGenerated }) {
  const canvasRef = useRef(null);
  const [status, setStatus] = useState('ready');

  const generateThumbnail = useCallback(() => {
    setStatus('generating');

    const canvas = canvasRef.current;

    // 创建 Babylon.js 引擎
    const engine = new Engine(canvas, true, {
      antialias: true,
      preserveDrawingBuffer: true,
      stencil: true
    });

    // 创建场景
    const scene = new Scene(engine);
    scene.clearColor = new Color4(0.95, 0.95, 0.95, 1);

    // 创建相机 - 调整角度以更好地俯视模型
    const camera = new ArcRotateCamera(
      'camera',
      Math.PI / 4,      // alpha - 水平角度 (45度)
      Math.PI / 4,      // beta - 垂直角度 (45度)，更平的视角
      15,              // radius - 初始距离，增加距离
      Vector3.Zero(),
      scene
    );
    camera.wheelPrecision = 50;
    camera.minZ = 0.1;
    camera.maxZ = 1000;

    // 添加环境光
    const ambientLight = new HemisphericLight(
      'ambientLight',
      new Vector3(0, 1, 0),
      scene
    );
    ambientLight.intensity = 0.6;
    ambientLight.diffuse = new Color3(1, 1, 1);
    ambientLight.groundColor = new Color3(0.2, 0.2, 0.2);

    // 添加主光源
    const mainLight = new DirectionalLight(
      'mainLight',
      new Vector3(-1, -2, -1),
      scene
    );
    mainLight.intensity = 0.8;
    mainLight.diffuse = new Color3(1, 1, 1);
    mainLight.specular = new Color3(1, 1, 1);

    // 添加辅助光源
    const fillLight = new DirectionalLight(
      'fillLight',
      new Vector3(1, -1, 1),
      scene
    );
    fillLight.intensity = 0.5;
    fillLight.diffuse = new Color3(1, 1, 1);

    // 创建 blob URL，确保文件名包含 .stl 扩展名
    const fileName = stlFile.name.endsWith('.stl') ? stlFile.name : `${stlFile.name}.stl`;
    const fileBlob = new File([stlFile], fileName, { type: 'model/stl' });
    const fileUrl = URL.createObjectURL(fileBlob);

    console.log('开始加载STL文件:', fileName, 'URL:', fileUrl, '文件大小:', stlFile.size);

    // 使用 ImportMesh 加载 STL 模型
    const { SceneLoader } = require('@babylonjs/core');

    SceneLoader.ImportMesh(
      null,                    // meshNames
      fileUrl,                 // rootUrl
      '',                      // sceneFilename
      scene,                   // scene
      (meshes, particleSystems, skeletons) => {
        console.log('STL模型加载成功，网格数量:', meshes.length);
        console.log('所有网格信息:', meshes.map(m => ({
          name: m.name,
          vertices: m.totalVertices,
          indices: m.getTotalIndices(),
          position: m.position
        })));
        
        if (meshes.length > 0) {
          // 不再过滤网格，直接使用所有网格
          const modelMeshes = meshes;
          
          console.log('使用网格数量:', modelMeshes.length);
          
          // 创建材质 - 石头质感
          const material = new StandardMaterial('modelMaterial', scene);
          material.diffuseColor = new Color3(0.5, 0.5, 0.5); // 灰色
          material.specularColor = new Color3(0.1, 0.1, 0.1); // 低高光，模拟粗糙表面
          material.specularPower = 8; // 高光功率低，让高光更分散
          material.ambientColor = new Color3(0.3, 0.3, 0.3); // 环境光颜色
          material.emissiveColor = new Color3(0, 0, 0); // 不发光
          material.backFaceCulling = false; // 禁用背面剔除，确保所有面都可见
          
          // 应用材质到所有模型网格
          modelMeshes.forEach(mesh => {
            mesh.material = material;
            console.log(`网格 ${mesh.name}: 顶点数 ${mesh.totalVertices}, 面数 ${mesh.getTotalIndices() / 3}`);
          });

          // 计算所有模型的边界框
          let minBBox = modelMeshes[0].getBoundingInfo().minimum;
          let maxBBox = modelMeshes[0].getBoundingInfo().maximum;
          
          for (let i = 1; i < modelMeshes.length; i++) {
            const bbox = modelMeshes[i].getBoundingInfo();
            minBBox = Vector3.Min(minBBox, bbox.minimum);
            maxBBox = Vector3.Max(maxBBox, bbox.maximum);
          }
          
          const size = maxBBox.subtract(minBBox);
          const maxDim = Math.max(size.x, size.y, size.z);
          const center = minBBox.add(size.scale(0.5));
          
          console.log('模型尺寸:', size, '最大维度:', maxDim, '中心点:', center);

          // 缩放和旋转模型
          const scale = 8 / maxDim; // 放大一倍，原来是 4 / maxDim
          modelMeshes.forEach((mesh, index) => {
            mesh.scaling = new Vector3(scale, scale, scale);
            // 绕Y轴旋转180度
            mesh.rotation.y = Math.PI;
            // 强制更新世界矩阵，确保旋转生效
            mesh.computeWorldMatrix(true);
          });
          
          // 旋转后重新计算边界框并居中
          let minBBoxAfter = modelMeshes[0].getBoundingInfo().boundingBox.minimumWorld;
          let maxBBoxAfter = modelMeshes[0].getBoundingInfo().boundingBox.maximumWorld;
          
          for (let i = 1; i < modelMeshes.length; i++) {
            const bbox = modelMeshes[i].getBoundingInfo();
            minBBoxAfter = Vector3.Min(minBBoxAfter, bbox.boundingBox.minimumWorld);
            maxBBoxAfter = Vector3.Max(maxBBoxAfter, bbox.boundingBox.maximumWorld);
          }
          
          const sizeAfter = maxBBoxAfter.subtract(minBBoxAfter);
          const centerAfter = minBBoxAfter.add(sizeAfter.scale(0.5));
          
          console.log('旋转后模型尺寸:', sizeAfter, '中心点:', centerAfter);
          
          // 居中模型
          modelMeshes.forEach((mesh, index) => {
            mesh.position = mesh.position.subtract(centerAfter);
            // 再次更新世界矩阵
            mesh.computeWorldMatrix(true);
            
            console.log(`网格 ${index} (${mesh.name}) 最终状态:`);
            console.log('  位置:', mesh.position);
            console.log('  旋转:', mesh.rotation);
            console.log('  缩放:', mesh.scaling);
            console.log('  世界边界框最小值:', mesh.getBoundingInfo().boundingBox.minimumWorld);
            console.log('  世界边界框最大值:', mesh.getBoundingInfo().boundingBox.maximumWorld);
          });

          // 调整相机
          camera.setTarget(Vector3.Zero());
          camera.radius = maxDim * scale * 1.5; // 减小距离，让模型显示得更大（原来是 3）
          camera.beta = Math.PI / 3; // 设置45度的俯视角度，确保能看到模型顶部
          
          console.log('========== 相机信息 ==========');
          console.log('相机位置:', camera.position);
          console.log('相机目标:', camera.getTarget());
          console.log('相机距离 (radius):', camera.radius);
          console.log('相机角度 alpha:', camera.alpha, '(弧度) =', camera.alpha * 180 / Math.PI, '(度)');
          console.log('相机角度 beta:', camera.beta, '(弧度) =', camera.beta * 180 / Math.PI, '(度)');
          console.log('相机视野:', camera.fov);
          
          // 计算相机能够看到的范围
          const cameraHeight = camera.radius * Math.sin(camera.beta);
          const cameraDistance = camera.radius * Math.cos(camera.beta);
          console.log('相机高度:', cameraHeight);
          console.log('相机水平距离:', cameraDistance);
          
          // 输出场景中所有网格的汇总信息
          console.log('========== 场景网格汇总 ==========');
          let totalVertices = 0;
          let totalTriangles = 0;
          modelMeshes.forEach(mesh => {
            totalVertices += mesh.totalVertices;
            totalTriangles += mesh.getTotalIndices() / 3;
          });
          console.log('总顶点数:', totalVertices);
          console.log('总三角形数:', totalTriangles);
          console.log('================================');

          // 渲染几帧以确保模型正确显示
          let frameCount = 0;
          const maxFrames = 3;
          
          const renderFrame = () => {
            if (frameCount < maxFrames) {
              scene.render();
              frameCount++;
              requestAnimationFrame(renderFrame);
            } else {
              // 生成缩略图
              setTimeout(() => {
                canvas.toBlob((blob) => {
                  if (blob) {
                    console.log('缩略图生成成功，大小:', blob.size, '字节');
                    const thumbnailFile = new File([blob], 'thumbnail.png', { type: 'image/png' });
                    onThumbnailGenerated(thumbnailFile);
                  } else {
                    console.error('生成缩略图失败：blob 为空');
                    setStatus('error');
                  }
                  setStatus('completed');
                  
                  // 清理
                  URL.revokeObjectURL(fileUrl);
                  engine.dispose();
                }, 'image/png');
              }, 200);
            }
          };
          
          renderFrame();
        } else {
          console.error('加载的网格数量为 0');
          setStatus('error');
          URL.revokeObjectURL(fileUrl);
          engine.dispose();
        }
      },
      (evt) => {
        // 加载进度
        if (evt.loaded && evt.total) {
          const progress = Math.round((evt.loaded / evt.total) * 100);
          if (progress % 10 === 0) { // 每10%输出一次
            console.log(`加载进度: ${progress}%`);
          }
        }
      },
      (scene, message, exception) => {
        console.error('加载STL模型失败:', message, exception);
        setStatus('error');
        URL.revokeObjectURL(fileUrl);
        engine.dispose();
      },
      '.stl'                   // pluginExtension - 明确指定使用 STL 加载器
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
        style={{ display: status === 'completed' ? 'none' : 'block', width: '100%', maxWidth: '400px', height: '250px' }}
      />
      {status === 'generating' && (
        <div className="text-center mt-2">
          <div className="spinner-border spinner-border-sm text-primary" role="status">
            <span className="visually-hidden">生成缩略图中...</span>
          </div>
          <span className="ms-2">生成缩略图中...</span>
        </div>
      )}
      {status === 'error' && (
        <div className="text-center mt-2 text-danger">
          <small>缩略图生成失败，请检查STL文件格式</small>
        </div>
      )}
    </div>
  );
}

export default STLThumbnailGenerator;