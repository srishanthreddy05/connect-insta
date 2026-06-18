const axios = require('axios');

axios.interceptors.request.use((config) => {
  console.log("🚀 INTERCEPTED REQUEST TO:", config.url);
  return Promise.reject({
    isMock: true,
    response: { data: { success: true } }
  });
});

axios.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error && error.isMock) {
      console.log("🚀 INTERCEPTED RESPONSE MOCK");
      return Promise.resolve(error.response);
    }
    return Promise.reject(error);
  }
);

async function run() {
  const res = await axios.post('https://example.com/replies', { message: 'hello' });
  console.log("Result:", res.data);
}

run().catch(console.error);
