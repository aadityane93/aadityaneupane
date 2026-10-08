import { BufferAttribute } from 'three';

// Share only bit-identical vertices. Preserve triangle order, UV seams,
// normals, material groups, and draw range; no geometry simplification.
export async function indexExactGeometry(geometry) {
  const entries = Object.entries(geometry.attributes);
  if (geometry.index || Object.keys(geometry.morphAttributes).length ||
      !entries.length || entries.some(([, attribute]) =>
        attribute.isInterleavedBufferAttribute || !(attribute.array instanceof Float32Array))) return;
  const count = entries[0][1].count;
  if (entries.some(([, attribute]) => attribute.count !== count)) return;
  const words = entries.map(([, attribute]) => new Uint32Array(
    attribute.array.buffer, attribute.array.byteOffset, attribute.array.length));
  const unique = new Map();
  const representatives = [];
  const indices = new Array(count);
  for (let i = 0; i < count; i++) {
    if (i % 2048 === 0) await new Promise(resolve => setTimeout(resolve, 0));
    let key = '';
    for (let j = 0; j < entries.length; j++) {
      const size = entries[j][1].itemSize;
      for (let k = 0; k < size; k++) key += `${words[j][i * size + k]},`;
    }
    let index = unique.get(key);
    if (index === undefined) {
      index = representatives.length;
      unique.set(key, index);
      representatives.push(i);
    }
    indices[i] = index;
  }
  if (representatives.length === count) return;
  for (const [name, attribute] of entries) {
    const array = new Float32Array(representatives.length * attribute.itemSize);
    for (let i = 0; i < representatives.length; i++) {
      const start = representatives[i] * attribute.itemSize;
      array.set(attribute.array.subarray(start, start + attribute.itemSize), i * attribute.itemSize);
    }
    const indexed = new BufferAttribute(array, attribute.itemSize, attribute.normalized);
    indexed.setUsage(attribute.usage);
    indexed.name = attribute.name;
    indexed.gpuType = attribute.gpuType;
    geometry.setAttribute(name, indexed);
  }
  geometry.setIndex(indices);
}
