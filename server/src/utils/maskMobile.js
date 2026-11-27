module.exports = (value) => typeof value === 'string' && value.length >= 4 ? '••••••' + value.slice(-4) : null;
