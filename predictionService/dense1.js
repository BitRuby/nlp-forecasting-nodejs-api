const tf = require("@tensorflow/tfjs-node");
const { evaluateRegPreds } = require("./evaluate");
const _ = require("lodash");

async function dense1Model(data, body) {
  const xTrainTensor = tf.tensor(data[0]);
  const yTrainTensor = tf.tensor(data[1]);
  const xTestTensor = tf.tensor(data[2]);
  const yTestTensor = tf.tensor(data[3]);

  console.log("Dense Model");
  console.log("xTrainTensor Shape: " + xTrainTensor.shape);
  console.log("yTrainTensor Shape: " + yTrainTensor.shape);
  console.log("xTestTensor Shape: " + xTestTensor.shape);
  console.log("yTestTensor Shape: " + yTestTensor.shape);

  const model = tf.sequential();
  model.add(
    tf.layers.flatten({
      inputShape: xTrainTensor.shape.slice(1),
    })
  );
  body.layerValues.forEach((e) => {
    model.add(tf.layers.dense({ units: e.units, activation: e.activation }));
  });
  model.add(tf.layers.dense({ units: 1 }));
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
  return preds;
}

module.exports = { dense1Model };
