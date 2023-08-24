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
    if (trainTensor) {
      newArray.push(
        normalize(
          curr,
          tf.tensor(transposedTrain[i]).min(),
          tf.tensor(transposedTrain[i]).max()
        )
      );
    } else {
      newArray.push(normalize(curr));
    }
  }
  return tf.tensor(newArray).transpose().arraySync();
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
    if (trainTensor) {
      newArray.push(
        standarize(
          curr,
          tf.tensor(transposedTrain[i]).mean(),
          tf
            .tensor(transposedTrain[i])
            .sub(tf.tensor(transposedTrain[i]).mean())
            .pow(2)
            .mean()
            .sqrt()
        )
      );
    } else {
      newArray.push(standarize(curr).arraySync());
    }
  }
  return tf.tensor(newArray).transpose().arraySync();
}

module.exports = {
  normalize,
  standarize,
  standarizeSingleColumns,
  normalizeSingleColumns,
};
