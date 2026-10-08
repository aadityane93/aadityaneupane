import { useEffect, useRef } from "react";
import './threestyles.css';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader';
import { MTLLoader } from 'three/examples/jsm/loaders/MTLLoader';
import { gsap } from "gsap";
import { cullStaticInstances } from './cullStaticInstances.js';
import { indexExactGeometry } from './indexExactGeometry.js';

function wobble(obj, originalX, originalY, originalZ, requestRender) {
    // Prevent overlapping animations
    gsap.killTweensOf(obj.scale);
    
    // start from original scale, then animate to 85% and back
    obj.scale.set(originalX, originalY, originalZ);
    
    const scaleFactor = 0.85; // Only scale to 85%
    
    gsap.to(obj.scale, {
      x: originalX * scaleFactor,
      y: originalY * scaleFactor,
      z: originalZ * scaleFactor,
      duration: 0.5,
      yoyo: true,
      repeat: 1,
      ease: "sine.inOut",
      onUpdate: requestRender,
      onComplete: requestRender,
    });
  }
  
const ThreeScene = () => {
  const mountRef = useRef(null);

  useEffect(() => {
    const mount = mountRef.current;
    const loadingScreen = document.getElementById('loading-screen');
    const loadingBar = document.getElementById('loading-bar');
    const loadingTitle = loadingScreen.querySelector('h1');
    const retryButton = document.getElementById('retry-loading');
    loadingScreen.style.display = 'flex';
    loadingTitle.textContent = 'Loading...';
    loadingBar.style.width = '0%';
    retryButton.hidden = true;
    const introOverlay = document.getElementById('intro-overlay');
    const introCloseButton = introOverlay?.querySelector('#closeOverlay');
    let disposed = false;
    let assetsReady = false;
    let introClosed = introOverlay?.style.display === 'none';
    let animationStarted = false;
    let animationFrame = null;
    let previousFrameTime = null;
    let rendering = false;
    const cameraTarget = new THREE.Vector3(4, 8, -1);
    const orbitSpeed = 0.008 * 60; // Preserve the existing speed at 60 FPS.
    const totalOrbitAngle = Math.PI * 2.5;
    const downwardAngle = THREE.MathUtils.degToRad(45);
    let introProgress = 0;
    let cameraMovedByUser = false;

    const startIntroIfReady = () => {
      if (!disposed && assetsReady && introClosed && !animationStarted && !document.hidden) {
        // Upload the first frame while the loading screen still covers it.
        try {
          updateVisibleStars(camera);
          renderer.render(scene, camera);
        } catch (error) {
          console.error('Unable to render the scene:', error);
          loadingTitle.textContent = 'Unable to display the scene';
          retryButton.hidden = false;
          return;
        }
        loadingScreen.style.display = 'none';
        animationStarted = true;
        startRenderLoop();
      }
    };

    const handleIntroClose = () => {
      introClosed = true;
      startIntroIfReady();
    };
    const handleRetry = () => window.location.reload();
    introCloseButton?.addEventListener('click', handleIntroClose);
    retryButton.addEventListener('click', handleRetry);

    // Keep loading state tied to this scene mount. The manager can finish before
    // or after the visitor dismisses the intro overlay.
    const loadingManager = new THREE.LoadingManager();
    let preparingScene = false;
    const geometryPreparation = [];
    loadingManager.onLoad = async () => {
      if (disposed || preparingScene) return;
      preparingScene = true;
      try {
        await Promise.all(geometryPreparation);
        if (disposed) return;
        // Only the camera and hover targets change transforms at runtime.
        scene.traverse((object) => {
          if (object !== laptopModel && object !== paper && object !== laptopScreen) {
            object.updateMatrix();
            object.matrixAutoUpdate = false;
          }
        });
        await renderer.compileAsync(scene, camera);
      } catch (error) {
        // The normal first render remains a fallback if precompilation fails.
        console.warn('Scene preparation failed; using normal rendering', error);
      }
      if (disposed) return;
      assetsReady = true;
      clearTimeout(loadTimeout);
      startIntroIfReady();
    };
    loadingManager.onProgress = (_item, loaded, total) => {
      if (!disposed) loadingBar.style.width = `${(loaded / total) * 100}%`;
    };
    loadingManager.onError = (item) => {
      console.error('Failed to load scene asset:', item);
    };
    const loadTimeout = window.setTimeout(() => {
      if (disposed || assetsReady) return;
      loadingTitle.textContent = 'This scene is taking longer than expected';
      retryButton.hidden = false;
    }, 90000);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(65, window.innerWidth / window.innerHeight, 0.1, 1000);
    const setIntroCamera = (progress) => {
      // Move back on narrow screens so the whole table stays in view.
      const endDistance = Math.max(11, 12.8 / camera.aspect);
      const radius = THREE.MathUtils.lerp(200, endDistance, progress);
      const angle = totalOrbitAngle * progress;
      const endHeight = cameraTarget.y + endDistance * Math.tan(downwardAngle);
      const height = THREE.MathUtils.lerp(70, endHeight, progress);
      camera.position.set(
        cameraTarget.x + radius * Math.cos(angle),
        height,
        cameraTarget.z + radius * Math.sin(angle)
      );
      camera.lookAt(cameraTarget);
    };
    setIntroCamera(0);
    const renderer = new THREE.WebGLRenderer();
    mount.appendChild(renderer.domElement);

    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(window.innerWidth, window.innerHeight);
    // camera.position.set(8, 8, 12);
    // camera.position.set(100, 8, 12);
    
    // const geometry = new THREE.TorusGeometry(50,7,40,60)
    // const material = new THREE.MeshStandardMaterial({color:0xFF6347, wireframe: true})
    // const torus = new THREE.Mesh(geometry, material);
    // torus.scale.set(3,3,3);
    // scene.add(torus)

    // Resize handler
    const resizeHandler = () => {
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.setSize(window.innerWidth, window.innerHeight);
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      if (!cameraMovedByUser) setIntroCamera(introProgress);
      requestRender();
    };

    window.addEventListener("resize", resizeHandler);

    // Lighting
    const pointLight = new THREE.PointLight(0xffffff);
    pointLight.position.set(0,5,0)
    scene.add(pointLight)

    const ambientLight = new THREE.AmbientLight(0xffffff);
    ambientLight.position.setY(6);
    scene.add(pointLight, ambientLight)

    const ambientLight2 = new THREE.AmbientLight(0xffffff);
    ambientLight2.position.setY(30);
    scene.add(pointLight, ambientLight)

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(5, 10, 5);
    scene.add(directionalLight);

    const gridHelper = new THREE.GridHelper(200, 50);
    scene.add(gridHelper)
    // Orbit Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.target.copy(cameraTarget);
    controls.enabled = false;
    const handleControlStart = () => { cameraMovedByUser = true; };
    controls.addEventListener('start', handleControlStart);
    controls.addEventListener('change', requestRender);

    // One instanced draw call keeps the original round stars.
    const starGeometry = new THREE.SphereGeometry(0.25, 24, 24);
    const starMaterial = new THREE.MeshStandardMaterial({ color: 0xffffff });
    const stars = new THREE.InstancedMesh(starGeometry, starMaterial, 200);
    const starTransform = new THREE.Matrix4();
    for (let i = 0; i < 200; i++) {
      starTransform.makeTranslation(
        THREE.MathUtils.randFloatSpread(100),
        THREE.MathUtils.randFloatSpread(100),
        THREE.MathUtils.randFloatSpread(100)
      );
      stars.setMatrixAt(i, starTransform);
    }
    stars.instanceMatrix.needsUpdate = true;
    stars.computeBoundingSphere();
    scene.add(stars);
    const updateVisibleStars = cullStaticInstances(stars);

    // Set Background
    const spaceTexture = new THREE.TextureLoader(loadingManager).load('./black.png');
    scene.background = spaceTexture;

    // Load Laptop Model
    let laptopModel;
    const loader = new GLTFLoader(loadingManager);
    loader.load(
      './laptop.glb',
      (gltf) => {
        if (disposed) return;
        laptopModel = gltf.scene;
        scene.add(laptopModel);
        laptopModel.position.set(4, 7.41, -1);
        laptopModel.scale.set(15, 15, 15);
        laptopModel.rotation.y = THREE.MathUtils.degToRad(90);
      },
      undefined,
      (error) => console.error('Error loading model:', error)
    );

    // Laptop Screen Geometry
    const screenTextureLoader = new THREE.TextureLoader(loadingManager);
    const textureScreen = screenTextureLoader.load('./vscode.png');


    const geometryScreen = new THREE.PlaneGeometry(3.06, 1.62);
    const materialScreen = new THREE.MeshBasicMaterial({ map: textureScreen });
    const laptopScreen = new THREE.Mesh(geometryScreen, materialScreen);
    laptopScreen.position.set(4,8.46,-2.46); 
    // 4, 8.7, -2.6
    laptopScreen.rotation.x = (-25/180)*3.14
    scene.add(laptopScreen);




    let deskModel;

    const textureLoader = new THREE.TextureLoader(loadingManager);
    const diffuseTexture = textureLoader.load('./textures/desk-color-2k.jpg');
    const normalTexture = textureLoader.load('./textures/desk-normal-2k.png');
    const roughnessTexture = textureLoader.load('./textures/desk-022-roughness-metalness-4k.png'); 
    
    const mtlLoader = new MTLLoader(loadingManager);
    mtlLoader.load('./desk.mtl', (materials) => {
        if (disposed) return;
        materials.preload();
        
        const objLoader = new OBJLoader(loadingManager);
        objLoader.setMaterials(materials);
        objLoader.load('./desk.obj', (object) => {
            if (disposed) return;
            deskModel = object;
            scene.add(deskModel);
            deskModel.position.set(0, 0, 0);
            deskModel.scale.set(10, 10, 10);
    
            deskModel.traverse((child) => {
                if (child.isMesh) {
                    geometryPreparation.push(indexExactGeometry(child.geometry));
                    child.material.map = diffuseTexture;      
                    child.material.normalMap = normalTexture;
                    child.material.roughnessMap = roughnessTexture;
                    child.material.needsUpdate = true;
                }
            });
        });
    });

    let paper;

    const textureLoader1 = new THREE.TextureLoader(loadingManager);
    const diffuseTexture1 = textureLoader1.load('./textures/paper-art-1k.jpg');
    const roughnessTexture1 = textureLoader1.load('./textures/a4-sheet-006-roughness-metalness-4k.png'); 
    
    const mtlLoader1 = new MTLLoader(loadingManager);
    mtlLoader1.load('./a4.mtl', (materials) => {
        if (disposed) return;
        materials.preload();
        
        const objLoader1 = new OBJLoader(loadingManager);
        objLoader1.setMaterials(materials);
        objLoader1.load('./a4.obj', (object) => {
            if (disposed) return;
            paper = object;
            scene.add(paper);
            paper.position.set(-2.5, 7.41, 3);
            paper.scale.set(10, 10, 10);
            const axis = new THREE.Vector3(0, 1, 0);
            axis.normalize();
            const angle = THREE.MathUtils.degToRad(180);
            paper.rotateOnAxis(axis, angle);
    
            paper.traverse((child) => {
                if (child.isMesh) {
                    geometryPreparation.push(indexExactGeometry(child.geometry));
                    child.material.map = diffuseTexture1;      
                    child.material.roughnessMap = roughnessTexture1;
                    child.material.needsUpdate = true;
                }
            });
        });
    });
    
    
    let lamp;
    const loader2 = new GLTFLoader(loadingManager);
    loader2.load(
        './lamp.glb', 
        (gltf) => {
            if (disposed) return;
            lamp = gltf.scene;
            scene.add(lamp);
            lamp.position.set(-13, 0, -1);
            lamp.scale.set(1,1,1);
            // const axis = new THREE.Vector3(0, 1, 0);
            // axis.normalize();
            // const angle = THREE.MathUtils.degToRad(90);
            // lamp.rotateOnAxis(axis, angle);
    
        },
        undefined,
        (error) => {
            console.error('Error loading model:', error);
        }
    );

    // Raycasting for click events
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    // ===== FIXED: Use a reusable function to create overlays with working close buttons =====
    function createOverlay(htmlContent) {
        // Prevent multiple overlays
        if (document.getElementById("fullscreenOverlay")) return;

        // Create overlay container
        const overlay = document.createElement("div");
        overlay.id = "fullscreenOverlay";
        overlay.innerHTML = htmlContent;

        // Apply overlay styles
        overlay.style.position = "fixed";
        overlay.style.top = "0";
        overlay.style.left = "0";
        overlay.style.width = "100vw";
        overlay.style.height = "100vh";
        overlay.style.background = "rgba(0, 0, 0, 0.9)";
        overlay.style.display = "flex";
        overlay.style.justifyContent = "center";
        overlay.style.alignItems = "center";
        overlay.style.zIndex = "10000";

        // Append overlay to body FIRST
        document.body.appendChild(overlay);
        stopRenderLoop();

        // NOW find the close button within the overlay (guaranteed to be in DOM)
        const closeBtn = overlay.querySelector("#closeOverlay");
        if (closeBtn) {
            // closeBtn.innerHTML = "&times;";
            // closeBtn.style.position = "absolute";
            // closeBtn.style.top = "15px";
            // closeBtn.style.right = "25px";
            // closeBtn.style.fontSize = "48px";
            // closeBtn.style.color = "#fff";
            // closeBtn.style.background = "none";
            // closeBtn.style.border = "none";
            // closeBtn.style.cursor = "pointer";
            // closeBtn.style.zIndex = "10001";
            // closeBtn.style.width = "50px";
            // closeBtn.style.height = "50px";
            // closeBtn.style.display = "flex";
            // closeBtn.style.alignItems = "center";
            // closeBtn.style.justifyContent = "center";
            // closeBtn.style.lineHeight = "1";
            // closeBtn.style.padding = "0";
            // closeBtn.title = "Close";
            
            closeBtn.addEventListener("click", (e) => {
                e.preventDefault();
                e.stopPropagation();
                overlay.remove();
                startRenderLoop();
            });
        }

        return overlay;
    }

    const handleLaptopClick = async (event) => {
        if (!rendering) return;
        if (event.target instanceof Element && event.target.closest('#fullscreenOverlay, #intro-overlay')) return;
        if (!laptopModel) {
            console.warn("Laptop model is not loaded yet.");
            return;
        }
    
        mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    
        raycaster.setFromCamera(mouse, camera);
        const intersects = raycaster.intersectObject(laptopModel, true);
    
        if (intersects.length > 0) {
            console.log("Laptop Model Clicked!");
    
            try {
                const response = await fetch("./overlay-laptop.html");
                if (!response.ok) throw new Error("Failed to load overlay.html");
                const htmlContent = await response.text();
                if (!disposed) createOverlay(htmlContent);
            } catch (error) {
                console.error("Error loading overlay:", error);
            }
        }
    };
    window.addEventListener("click", handleLaptopClick);

    // Second raycaster for hoovering
    const raycaster2 = new THREE.Raycaster();
    const raycaster3 = new THREE.Raycaster();

    let hovering1 = false;
    let hovering2 = false;
    let pointerDirty = false;

    const handleMouseMove = (event) => {
        if (!rendering) return;
        mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
        pointerDirty = true;
        requestRender();
    };
    window.addEventListener('mousemove', handleMouseMove);

    const updateHover = () => {
        if (!pointerDirty) return;
        pointerDirty = false;
        if (paper) {
          raycaster2.setFromCamera(mouse, camera);
          const intersects2 = raycaster2.intersectObject(paper, true);
          if (intersects2.length > 0) {
            if (!hovering1) {
                wobble(paper, 10, 10, 10, requestRender);
                hovering1 = true;
            }
          } else {
            hovering1 = false;
          }
        }
        if (laptopModel) {
          raycaster3.setFromCamera(mouse, camera);
          const intersects3 = raycaster3.intersectObject(laptopModel, true);
          if (intersects3.length > 0) {
            if (!hovering2) {
                wobble(laptopModel, 15, 15, 15, requestRender);
                wobble(laptopScreen, 1, 1, 1, requestRender);
                hovering2 = true;
            }
          } else {
            hovering2 = false;
          }
        }
    };

    const handlePaperClick = async (event) => {
        if (!rendering) return;
        if (event.target instanceof Element && event.target.closest('#fullscreenOverlay, #intro-overlay')) return;
        if (!paper) {
            console.warn("Paper model is not loaded yet.");
            return;
        }
    
        mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    
        raycaster2.setFromCamera(mouse, camera);
        const intersects = raycaster2.intersectObject(paper, true);
    
        if (intersects.length > 0) {
            console.log("Paper Model Clicked!");
    
            try {
                const response = await fetch("./overlay-paper.html");
                if (!response.ok) throw new Error("Failed to load overlay.html");
                const htmlContent = await response.text();
                if (!disposed) createOverlay(htmlContent);
            } catch (error) {
                console.error("Error loading overlay:", error);
            }
        }
    };
    window.addEventListener("click", handlePaperClick);

    // Animation Loop
    function startRenderLoop() {
      if (disposed || rendering || document.hidden) return;
      rendering = true;
      previousFrameTime = null;
      requestRender();
    }

    function requestRender() {
      if (disposed || !rendering || document.hidden || animationFrame !== null) return;
      animationFrame = requestAnimationFrame(animate);
    }

    function stopRenderLoop() {
      rendering = false;
      cancelAnimationFrame(animationFrame);
      animationFrame = null;
      previousFrameTime = null;
    }

    function animate(timestamp) {
      animationFrame = null;
      if (!rendering) return;

      if (animationStarted && introProgress < 1) {
        const elapsedSeconds = previousFrameTime === null ? 0 : (timestamp - previousFrameTime) / 1000;
        previousFrameTime = timestamp;
        introProgress = Math.min(1, introProgress + elapsedSeconds * orbitSpeed / totalOrbitAngle);
        setIntroCamera(introProgress);
        if (introProgress === 1) {
          controls.update();
          controls.enabled = true;
        }
      }
      updateHover();
      updateVisibleStars(camera);
      renderer.render(scene, camera);
      if (introProgress < 1) requestRender();
    }

    const handleVisibilityChange = () => {
      if (document.hidden) {
        stopRenderLoop();
      } else {
        startIntroIfReady();
        if (animationStarted && !document.getElementById('fullscreenOverlay')) startRenderLoop();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Cleanup
    return () => {
      disposed = true;
      clearTimeout(loadTimeout);
      stopRenderLoop();
      introCloseButton?.removeEventListener('click', handleIntroClose);
      retryButton.removeEventListener('click', handleRetry);
      window.removeEventListener("resize", resizeHandler);
      window.removeEventListener('click', handleLaptopClick);
      window.removeEventListener('click', handlePaperClick);
      window.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      document.getElementById('fullscreenOverlay')?.remove();
      controls.removeEventListener('start', handleControlStart);
      controls.removeEventListener('change', requestRender);
      for (const object of [paper, laptopModel, laptopScreen]) {
        if (object) gsap.killTweensOf(object.scale);
      }
      controls.dispose();
      stars.dispose();
      starGeometry.dispose();
      starMaterial.dispose();
      mount.removeChild(renderer.domElement);
      renderer.dispose();
    };
  }, []);

  return <div ref={mountRef} />;
};

export default ThreeScene;
