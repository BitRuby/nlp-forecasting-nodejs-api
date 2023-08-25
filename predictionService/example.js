const tf = require("@tensorflow/tfjs-node");
const { evaluateClassPreds } = require("./evaluate");
const fs = require("fs");
const csvParser = require("csv-parser");
const { standarizeSingleColumns } = require("../preprocessingService/scale");
const _ = require("lodash");
const { trainTestSplit } = require("../preprocessingService/trainTestSplit");

async function dense1Model(data) {
  let dataset = await loadCsv("./predictionService/Churn_Modelling.csv");

  const X = dataset.map(({ Exited, RowNumber, CustomerId, Surname, ...e }) => {
    if (e.Geography === "France") {
      e.Geography = [1, 0, 0];
    } else if (e.Geography === "Germany") {
      e.Geography = [0, 1, 0];
    } else {
      e.Geography = [0, 0, 1];
    }

    if (e.Gender === "Female") {
      e.Gender = 0;
    } else {
      e.Gender = 1;
    }
    return Object.values(e)
      .flat()
      .map((f) => parseFloat(f));
  });

  const y = dataset.map((e) => e.Exited).map((f) => parseInt(f));

  const [xTrain, xTest] = trainTestSplit(X, 0.2);
  const [yTrain, yTest] = trainTestSplit(y, 0.2);

  const xTrainTensor = standarizeSingleColumns(tf.tensor(xTrain));
  const xTestTensor = standarizeSingleColumns(
    tf.tensor(xTest),
    tf.tensor(xTrain)
  );

  const yTrainTensor = tf.tensor(yTrain);
  const yTestTensor = tf.tensor(yTest);

  console.log("xTrainTensor Shape: " + xTrainTensor.shape);
  console.log("yTrainTensor Shape: " + yTrainTensor.shape);
  console.log("xTestTensor Shape: " + xTestTensor.shape);
  console.log("yTestTensor Shape: " + yTestTensor.shape);

  const model = tf.sequential();
  model.add(
    tf.layers.dense({ units: 6, activation: "relu", inputShape: [12] })
  );
  model.add(tf.layers.dense({ units: 6, activation: "relu" }));
  model.add(tf.layers.dense({ units: 1, activation: "sigmoid" }));
  model.compile({
    loss: "binaryCrossentropy",
    optimizer: "adam",
    metrics: ["accuracy"],
  });

  await model.fit(xTrainTensor, yTrainTensor, {
    epochs: 5,
    batchSize: 32,
  });

  const predict = model.predict(xTestTensor);
  const preds = await evaluateClassPreds(
    tf.squeeze(yTestTensor),
    tf.squeeze(tf.round(predict))
  );
  return preds;
}
async function loadCsv(filename) {
  return new Promise((resolve, reject) => {
    const results = [];

    fs.createReadStream(filename)
      .pipe(csvParser())
      .on("data", (data) => results.push(data))
      .on("end", () => {
        resolve(results);
      })
      .on("error", (err) => {
        reject(err);
      });
  });
}

module.exports = { dense1Model };
