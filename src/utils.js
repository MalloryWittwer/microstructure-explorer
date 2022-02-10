import { dot, norm, cross } from "mathjs";

const spher2cart = (tp) => {
  const [t, p] = tp;
  const x = Math.cos(p) * Math.sin(t);
  const y = Math.sin(p) * Math.sin(t);
  const z = Math.cos(t);
  return [x, y, z];
};

const cart2spher = (xyz) => {
  const [x, y, z] = xyz;
  const t = Math.acos(z);
  const p = Math.atan2(y, x);
  return [t, p];
};

const stereoProjection = (xyz) => {
  let [x, y, z] = xyz;
  if (z === 0) {
    return [0, 0];
  }
  const X = x / (1 - z);
  const Y = y / (1 - z);
  return [X, Y];
};

const invStereoProjection = (XY) => {
  const [X, Y] = XY;
  const x = 2 * X;
  const y = 2 * Y;
  const z = -1 + X ** 2 + Y ** 2;
  return [x, y, z];
};

const arraysEqual = (a, b) => {
  for (let i = 0; i < a.length; ++i) {
    if (a[i] !== b[i]) return false;
  }
  return true;
};

const crossVectorNormed = (v1, v2) => {
  const cv = cross(v1, v2);
  const cvNorm = norm(cv);
  const cvNormed = cv.map((x) => x / cvNorm);
  return cvNormed;
};

const angleBetweenVectors = (v1, v2) => {
  return Math.acos(dot(v1, v2) / norm(v1) / norm(v2));
};

const matrixRot = (matrix, vect) => {
  const rotatedVect = [
    matrix[0][0] * vect[0] + matrix[0][1] * vect[1] + matrix[0][2] * vect[2],
    matrix[1][0] * vect[0] + matrix[1][1] * vect[1] + matrix[1][2] * vect[2],
    matrix[2][0] * vect[0] + matrix[2][1] * vect[1] + matrix[2][2] * vect[2],
  ];
  return rotatedVect;
};

const reBase = (vect0, phiBase, thetaBase) => {
  const rotPhiBase = [
    [Math.cos(-phiBase), Math.sin(phiBase), 0],
    [Math.sin(-phiBase), Math.cos(-phiBase), 0],
    [0, 0, 1],
  ];
  const vect1 = matrixRot(rotPhiBase, vect0);

  const rotThetaBase = [
    [Math.cos(Math.PI - thetaBase), 0, Math.sin(Math.PI - thetaBase)],
    [0, 1, 0],
    [Math.sin(thetaBase - Math.PI), 0, Math.cos(Math.PI - thetaBase)],
  ];
  const vect2 = matrixRot(rotThetaBase, vect1);

  const rotPhiBaseInv = [
    [Math.cos(phiBase), Math.sin(-phiBase), 0],
    [Math.sin(phiBase), Math.cos(phiBase), 0],
    [0, 0, 1],
  ];
  const vect3 = matrixRot(rotPhiBaseInv, vect2);
  return vect3;
};

export {
  spher2cart,
  cart2spher,
  stereoProjection,
  invStereoProjection,
  reBase,
  matrixRot,
  angleBetweenVectors,
  crossVectorNormed,
  arraysEqual,
};
