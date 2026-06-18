const path = require('path');
const axios1 = require('axios');
const metaService = require('../src/services/meta.service');
const axiosKeys = Object.keys(require.cache).filter(k => k.includes('axios'));
console.log("Axios cache keys:", axiosKeys);
