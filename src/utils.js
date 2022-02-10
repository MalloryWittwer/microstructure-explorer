import { dot, norm, cross, rotationMatrix } from 'mathjs'

const spher2cart = (rtp) => {
  const [r, t, p] = rtp;
  const x = r * Math.cos(p) * Math.sin(t);
  const y = r * Math.sin(p) * Math.sin(t);
  const z = r * Math.cos(t);
  return [x, y, z];
};

const cart2spher = (xyz) => {
  const [x, y, z] = xyz;
  const r = Math.sqrt(x ** 2 + y ** 2 + z ** 2);
  const t = Math.acos(z);
  const p = Math.atan2(y, x);
  return [r, t, p];
};

const stereoProjection = (xyz, factor) => {
  let [x, y, z] = xyz.map((x) => x * factor);
  if (z === 0) {
    return [0, 0];
  }
  const X = x / (1 - z);
  const Y = y / (1 - z);
  return [X, Y];
};

const invStereoProjection = (XY) => {
  const [X, Y] = XY;
  const x = (2 * X);
  const y = (2 * Y);
  const z = (-1 + X ** 2 + Y ** 2);
  return [x, y, z];
};

const arraysEqual = (a, b) => {
  for (let i = 0; i < a.length; ++i) {
    if (a[i] !== b[i]) return false;
  }
  return true;
}

const crossVectorNormed = (v1, v2) => {
  const cv = cross(v1, v2);
  const cvNorm = norm(cv);
  const cvNormed = cv.map((x) => x / cvNorm);
  return cvNormed;
}

const rodriguesRotMat = (axis, angle) => {
  const R = rotationMatrix(angle, axis)
  // const [x, y, z] = axis;
  // const s = Math.sin(angle);
  // const c = Math.cos(angle);
  // const R = [
  //   [1 - (1 - c) * (z**2 + y**2), -s * z + (1 - c) * x * y, s * y + (1 - c) * x * z],
  //   [s * z + (1 - c) * x * y, 1 - (1 - c) * (x**2 + z**2), -s * x + (1 - c) * y * z],
  //   [-s * y + (1 - c) * x * z, s * x + (1 - c) * y * z, 1 - (1 - c) * (x**2 + y**2)]
  // ];
  return R;
}

const angleBetweenVectors = (v1, v2) => {
  const dp = dot(v1, v2);
  const v1Norm = norm(v1);
  const v2Norm = norm(v2);
  const angle = Math.acos(dp / v1Norm / v2Norm);
  return angle;
}

const matrixRot = (matrix, vect) => {
  const rotatedVect = [
    matrix[0][0] * vect[0] + matrix[0][1] * vect[1] + matrix[0][2] * vect[2],
    matrix[1][0] * vect[0] + matrix[1][1] * vect[1] + matrix[1][2] * vect[2],
    matrix[2][0] * vect[0] + matrix[2][1] * vect[1] + matrix[2][2] * vect[2],
  ];
  return rotatedVect;
};

const rotX = (vect, angle) => {
  const rotXMat = [
    [1, 0, 0],
    [0, Math.cos(angle), Math.sin(-angle)],
    [0, Math.sin(angle), Math.cos(angle)],
  ];
  return matrixRot(rotXMat, vect);
};

const rotY = (vect, angle) => {
  const rotYMat = [
    [Math.cos(angle), 0, Math.sin(angle)],
    [0, 1, 0],
    [Math.sin(-angle), 0, Math.cos(angle)],
  ];
  return matrixRot(rotYMat, vect);
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
  rotX,
  rotY,
  matrixRot,
  angleBetweenVectors,
  rodriguesRotMat,
  crossVectorNormed,
  arraysEqual
};
