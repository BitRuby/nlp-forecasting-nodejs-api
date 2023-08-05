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

module.exports = { normalize, standarize };
