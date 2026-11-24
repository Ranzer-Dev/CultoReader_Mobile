const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Limita workers simultâneos no Windows para evitar estouro de memória (OOM) no Metro Bundler
config.maxWorkers = 2;

module.exports = config;
