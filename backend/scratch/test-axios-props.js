const axios = require('axios');
const metaService = require('../src/services/meta.service');

console.log("type of axios:", typeof axios);
console.log("axios keys:", Object.keys(axios));
console.log("axios.default keys:", axios.default ? Object.keys(axios.default) : "none");
console.log("axios.interceptors exists?", !!axios.interceptors);
console.log("axios.default.interceptors exists?", axios.default ? !!axios.default.interceptors : "n/a");
