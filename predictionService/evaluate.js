const tf = require("@tensorflow/tfjs");

function meanAbsoluteScaledError(yTrue, yPred) {
  const mae = tf.mean(tf.abs(tf.sub(yTrue, yPred)));
  const maeNaiveNoSeason = tf.mean(tf.abs(tf.sub(yTrue, yPred)));
  const mase = tf.div(mae, maeNaiveNoSeason);
  return mase;
}

async function evaluateRegPreds(yTrue, yPred) {
  const yTrueFloat32 = yTrue.cast("float32");
  const yPredFloat32 = yPred.cast("float32");

  let mae = tf.metrics.meanAbsoluteError(yTrueFloat32, yPredFloat32);
  let mse = tf.metrics.meanSquaredError(yTrueFloat32, yPredFloat32);
  let rmse = tf.sqrt(mse);
  let mape = tf.metrics.meanAbsolutePercentageError(yTrueFloat32, yPredFloat32);
  let mase = meanAbsoluteScaledError(yTrueFloat32, yPredFloat32);

  if (mae.rank === 1) {
    mae = mae.mean();
    mse = mse.mean();
    rmse = rmse.mean();
    mape = mape.mean();
    mase = mase.mean();
  }

  return {
    mae: (await mae.data())[0],
    mse: (await mse.data())[0],
    rmse: (await rmse.data())[0],
    mape: (await mape.data())[0],
    mase: mase.dataSync()[0],
  };
}

async function evaluateClassPreds(yTrue, yPred) {
  let accuracy;
  if (yTrue.rank === 1) {
    accuracy = tf.metrics.binaryAccuracy(yTrue, yPred);
  } else {
    accuracy = tf.metrics.categoricalAccuracy(yTrue, yPred);
  }

  const precision = tf.metrics.precision(yTrue, yPred);
  const recall = tf.metrics.recall(yTrue, yPred);

  const accuracyValue = (await accuracy.data())[0] * 100;
  const precisionValue = (await precision.data())[0];
  const recallValue = (await recall.data())[0];
  const f1ScoreValue =
    (2 * (precisionValue * recallValue)) / (precisionValue + recallValue);

  return {
    accuracy: accuracyValue,
    precision: precisionValue,
    recall: recallValue,
    f1Score: f1ScoreValue,
  };
}

module.exports = { evaluateClassPreds, evaluateRegPreds };
