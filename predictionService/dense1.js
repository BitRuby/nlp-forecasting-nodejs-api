import * as tf from "@tensorflow/tfjs-node";
import { evaluateClassPreds } from "../evaluate";
import { trainTestSplit } from "../../preprocessingService/trainTestSplit";
import { createDataWindows } from "../utils";

export async function dense1Model(data) {
  const prices = data.map((e) => e.close);
  const dates = data.map((e) => e.date.toLocaleString());

  const { windows, labels } = createDataWindows(prices, 7, 1, true);

  const [xTrain, xTest] = trainTestSplit(windows, 0.1);
  const [yTrain, yTest] = trainTestSplit(labels, 0.1);

  console.log("First 10 prices: " + prices.slice(0, 10));
  console.log("First 10 days: " + dates.slice(0, 8).toString());
  console.log("First window " + xTrain[0].slice(0, 8).toString());
  console.log("First label: " + yTrain[0].toString());
  console.log(
    `DayDifference, when 0 - classified as drop, 1 - classified as growth: ${xTrain[0][6]} => ${xTrain[1][6]} = ${yTrain[0]}`
  );

  const xTrainTensor = tf.tensor(xTrain);
  const xTestTensor = tf.tensor(xTest);
  const yTrainTensor = tf.tensor(yTrain);
  const yTestTensor = tf.tensor(yTest);

  console.log("xTrainTensor Shape: " + xTrainTensor.shape);
  console.log("yTrainTensor Shape: " + yTrainTensor.shape);
  console.log("xTestTensor Shape: " + xTestTensor.shape);
  console.log("yTestTensor Shape: " + yTestTensor.shape);

  const model = tf.sequential();
  model.add(
    tf.layers.inputLayer({
      inputShape: [7],
    })
  );
  model.add(
    tf.layers.dense({
      units: 64,
      activation: "relu",
    })
  );
  model.add(
    tf.layers.dense({
      units: 128,
      activation: "relu",
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
