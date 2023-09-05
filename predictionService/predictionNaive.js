const tf = require("@tensorflow/tfjs");
const { evaluateRegPreds } = require("./evaluate");

const predictNaive = async (yTest) => {
  const preds = await evaluateRegPreds(
    tf.tensor(yTest.slice(1)),
    tf.tensor(yTest.slice(0, yTest.length - 1))
  );
  return {
    preds,
    yTest: tf.tensor(yTest.slice(1)).arraySync(),
    predict: tf.tensor(yTest.slice(0, yTest.length - 1)).arraySync(),
  };
};

module.exports = { predictNaive };
