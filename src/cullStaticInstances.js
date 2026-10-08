import { DynamicDrawUsage, Frustum, Matrix4 } from 'three';

// For static instances with a shared opaque material and no per-instance colors.
// Keep original transforms separately: the GPU buffer contains only visible ones.
export function cullStaticInstances(mesh) {
  mesh.geometry.computeBoundingSphere();
  const transforms = [];
  const bounds = [];
  for (let i = 0; i < mesh.count; i++) {
    const transform = new Matrix4();
    mesh.getMatrixAt(i, transform);
    transforms.push(transform);
    const bound = mesh.geometry.boundingSphere.clone().applyMatrix4(transform);
    bound.radius += 0.00001; // Conservative margin at the edge of the view.
    bounds.push(bound);
  }
  const slots = new Int32Array(mesh.count).fill(-1);
  const frustum = new Frustum();
  const projection = new Matrix4();
  const previousProjection = new Matrix4();
  let initialized = false;
  mesh.instanceMatrix.setUsage(DynamicDrawUsage);
  // The individual sphere tests below replace the combined mesh bounds test.
  mesh.frustumCulled = false;

  return function updateVisibleInstances(camera) {
    camera.updateWorldMatrix(true, false);
    mesh.updateWorldMatrix(true, false);
    projection.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse);
    projection.multiply(mesh.matrixWorld);
    if (initialized && projection.equals(previousProjection)) return;
    initialized = true;
    previousProjection.copy(projection);
    frustum.setFromProjectionMatrix(projection);
    let count = 0;
    let changed = false;
    for (let i = 0; i < bounds.length; i++) {
      if (!frustum.intersectsSphere(bounds[i])) continue;
      if (slots[count] !== i) {
        mesh.setMatrixAt(count, transforms[i]);
        slots[count] = i;
        changed = true;
      }
      count++;
    }
    mesh.count = count;
    if (changed) mesh.instanceMatrix.needsUpdate = true;
  };
}
