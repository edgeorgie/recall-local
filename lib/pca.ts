/** Projects vectors to 2D with PCA (power iteration with deflation). Output is scaled into [-1, 1]. Deterministic. */
export function pca2d(vectors: Float32Array[]): [number, number][] {
  const n = vectors.length;
  if (n === 0) return [];
  const d = vectors[0].length;
  const mean = new Float64Array(d);
  for (const v of vectors) for (let j = 0; j < d; j++) mean[j] += v[j] / n;
  const X = vectors.map((v) => {
    const row = new Float64Array(d);
    for (let j = 0; j < d; j++) row[j] = v[j] - mean[j];
    return row;
  });

  const components: Float64Array[] = [];
  for (let k = 0; k < 2; k++) {
    let v = new Float64Array(d);
    for (let j = 0; j < d; j++) v[j] = Math.sin((j + 1) * (k + 1) * 1.7) + 0.01;
    for (let iter = 0; iter < 60; iter++) {
      const next = new Float64Array(d);
      for (const row of X) {
        let dot = 0;
        for (let j = 0; j < d; j++) dot += row[j] * v[j];
        for (let j = 0; j < d; j++) next[j] += row[j] * dot;
      }
      for (const c of components) {
        let dot = 0;
        for (let j = 0; j < d; j++) dot += next[j] * c[j];
        for (let j = 0; j < d; j++) next[j] -= dot * c[j];
      }
      let norm = 0;
      for (let j = 0; j < d; j++) norm += next[j] * next[j];
      norm = Math.sqrt(norm);
      if (norm < 1e-12) break;
      for (let j = 0; j < d; j++) next[j] /= norm;
      v = next;
    }
    components.push(v);
  }

  const pts = X.map((row) => components.map((c) => row.reduce((s, x, j) => s + x * c[j], 0)) as [number, number]);
  const scale = (i: 0 | 1) => Math.max(1e-9, ...pts.map((p) => Math.abs(p[i])));
  const sx = scale(0);
  const sy = scale(1);
  return pts.map(([x, y]) => [x / sx, y / sy]);
}
