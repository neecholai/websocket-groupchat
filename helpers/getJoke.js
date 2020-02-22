const axios = require('axios');

const getJoke = async () => {
  try {
    const response = await axios.get(
      'https://icanhazdadjoke.com/', {
        headers: {
          Accept: "text/plain"
        }
      });
    const joke = response.data;
    return joke;
  } catch (err) {
    return "Could not get dad joke"
  }
};

module.exports = getJoke;