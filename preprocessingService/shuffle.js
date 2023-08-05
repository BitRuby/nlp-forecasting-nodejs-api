const _ = require("lodash");

const shuffleData = (array) => {
  return _.shuffle(array);
};

module.exports = { shuffleData };
