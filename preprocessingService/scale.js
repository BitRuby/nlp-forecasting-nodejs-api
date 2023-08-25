const tf = require("@tensorflow/tfjs");

function normalize(tensor, min, max) {
  const minVal = min || tensor.min();
  const maxVal = max || tensor.max();
  const normalized = tensor.sub(minVal).div(maxVal.sub(minVal));
  return normalized;
}

function standarize(tensor, mean, std) {
  const meanVal = mean || tensor.mean();
  const stdVal = std || tensor.sub(meanVal).pow(2).mean().sqrt();
  const standarized = tensor.sub(meanVal).div(stdVal);
  return standarized;
}

function normalizeSingleColumns(tensor, trainTensor) {
  const transposed = tensor.transpose().arraySync();
  let transposedTrain;
  if (trainTensor) {
    transposedTrain = trainTensor.transpose().arraySync();
  }
  let newArray = [];
  for (let i = 0; i < transposed.length; i++) {
    const curr = tf.tensor(transposed[i]);
    if (transposedTrain) {
      const currTrain = tf.tensor(transposedTrain[i]);
      newArray.push(
        normalize(curr, currTrain.min(), currTrain.max()).arraySync()
      );
    } else {
      newArray.push(normalize(curr).arraySync());
    }
  }
  return tf.tensor(newArray).transpose();
}

function standarizeSingleColumns(tensor, trainTensor) {
  const transposed = tensor.transpose().arraySync();
  let transposedTrain;
  if (trainTensor) {
    transposedTrain = trainTensor.transpose().arraySync();
  }
  let newArray = [];
  for (let i = 0; i < transposed.length; i++) {
    const curr = tf.tensor(transposed[i]);
    if (transposedTrain) {
      const currTrain = tf.tensor(transposedTrain[i]);
      newArray.push(
        standarize(
          curr,
          currTrain.mean(),
          currTrain.sub(currTrain.mean()).pow(2).mean().sqrt()
        ).arraySync()
      );
    } else {
      newArray.push(standarize(curr).arraySync());
    }
  }
  return tf.tensor(newArray).transpose();
}

module.exports = {
  normalize,
  standarize,
  standarizeSingleColumns,
  normalizeSingleColumns,
};
