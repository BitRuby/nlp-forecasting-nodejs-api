const tf = require("@tensorflow/tfjs-node");
const { evaluateRegPreds } = require("./evaluate");
const _ = require("lodash");

async function lstmModel(data, body) {
  const xTrainTensor = tf.tensor(data[0]);
  const yTrainTensor = tf.tensor(data[1]);
  const xTestTensor = tf.tensor(data[2]);
  const yTestTensor = tf.tensor(data[3]);

  console.log("LSTM Model");
  console.log("xTrainTensor Shape: " + xTrainTensor.shape);
  console.log("yTrainTensor Shape: " + yTrainTensor.shape);
  console.log("xTestTensor Shape: " + xTestTensor.shape);
  console.log("yTestTensor Shape: " + yTestTensor.shape);
  const model = tf.sequential();

  body.layerValues.forEach((e, i) => {
    if (i === 0) {
      model.add(
        tf.layers.lstm({
          units: e.units,
          activation: e.activation,
          inputShape: xTrainTensor.shape.slice(1),
        })
      );
    } else {
      model.add(tf.layers.lstm({ units: e.units, activation: e.activation }));
    }
  });

  model.add(
    tf.layers.dense({
      units: 1,
    })
  );

  model.compile({
    loss: body.lossFunction,
    optimizer: body.optimizerFunction,
    metrics: ["mse"],
  });
  await model.fit(xTrainTensor, yTrainTensor, {
    epochs: Number(body.epochs),
    batchSize: Number(body.batchSize),
  });

  const predict = model.predict(xTestTensor);
  const preds = await evaluateRegPreds(
    tf.squeeze(yTestTensor),
    tf.squeeze(predict)
  );
  return {
    preds,
    yTest: tf.squeeze(yTestTensor).arraySync(),
    predict: tf.squeeze(predict).arraySync(),
  };
}

module.exports = { lstmModel };
