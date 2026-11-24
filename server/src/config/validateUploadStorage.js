const fs = require('fs');
const path = require('path');
const { uploadDir } = require('../utils/productImages');

function validateUploadStorage({
  nodeEnv = process.env.NODE_ENV,
  platform = process.platform,
  directory = uploadDir,
  mountInfo,
  access = fs.accessSync,
} = {}) {
  if (nodeEnv !== 'production' || platform !== 'linux') return;
  const resolved = path.posix.resolve(directory);
  const mounts = mountInfo ?? fs.readFileSync('/proc/self/mountinfo', 'utf8');
  const hasPersistentMount = mounts.split('\n').some((line) => {
    const mountPath = line.split(' ')[4]?.replace(/\\040/g, ' ');
    return mountPath && mountPath !== '/' &&
      (resolved === mountPath || resolved.startsWith(`${mountPath}/`));
  });
  if (!hasPersistentMount) {
    throw new Error(`Product uploads need a persistent volume mounted at ${resolved} (or a parent directory).`);
  }
  access(resolved, fs.constants.W_OK);
}

module.exports = validateUploadStorage;
