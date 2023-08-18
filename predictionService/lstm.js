import * as tf from "@tensorflow/tfjs";
import { evaluateClassPreds } from "./evaluate";

export async function lstmModel(
  xTrainTensor,
  yTrainTensor,
  xTestTensor,
  yTestTensor
) {
  const model = tf.sequential();
  model.add(
    tf.layers.lstm({
      units: 128,
      activation: "relu",
      inputShape: [1, 7],
    })
  );
  model.add(
    tf.layers.dense({
      units: 1,
      activation: "sigmoid",
    })
  );
  model.compile({
    loss: "binaryCrossentropy",
    optimizer: "adam",
    metrics: ["accuracy"],
  });
  model.summary();

  const fit = await model.fit(xTrainTensor, yTrainTensor, {
    epochs: 100,
    batchSize: 7,
    verbose: 0,
  });
  console.log("Train accuracy: " + fit.history.acc[fit.history.acc.length - 1]);

  const predict = model.predict(xTestTensor);
  console.log("First 10 predictions: ");
  console.log(predict.arraySync().slice(0, 10));
  console.log("First 10 true labels: ");
  console.log(yTestTensor.arraySync().slice(0, 10));

  const results = await evaluateClassPreds(
    tf.squeeze(yTestTensor),
    tf.squeeze(tf.round(predict))
  );
  console.log(results);
}
