const tf = require("@tensorflow/tfjs-node");
const { evaluateRegPreds, evaluateClassPreds } = require("./evaluate");
const fs = require("fs");
const csvParser = require("csv-parser");
const {
  standarize,
  normalize,
  standarizeSingleColumns,
} = require("../preprocessingService/scale");
const _ = require("lodash");
const { trainTestSplit } = require("../preprocessingService/trainTestSplit");

// async function dense1Model(data) {
//   const xTrainTensor = tf.tensor(data[0]);
//   const yTrainTensor = tf.tensor(data[1]);
//   const xTestTensor = tf.tensor(data[2]);
//   const yTestTensor = tf.tensor(data[3]);

//   console.log("Dense Model");
//   console.log("xTrainTensor Shape: " + xTrainTensor.shape);
//   console.log("yTrainTensor Shape: " + yTrainTensor.shape);
//   console.log("xTestTensor Shape: " + xTestTensor.shape);
//   console.log("yTestTensor Shape: " + yTestTensor.shape);

//   const model = tf.sequential();
//   model.add(
//     tf.layers.flatten({
//       inputShape: xTrainTensor.shape.slice(1),
//     })
//   );
//   model.add(tf.layers.dense({ units: 64, activation: "relu" }));
//   model.add(tf.layers.dense({ units: 1, activation: "linear" }));
//   model.compile({
//     loss: "meanSquaredError",
//     optimizer: "adam",
//     metrics: ["mse"],
//   });
//   model.summary();
//   await model.fit(xTrainTensor, yTrainTensor, {
//     epochs: 100,
//     batchSize: 128,
//     verbose: 0,
//   });
//   const predict = model.predict(xTestTensor);
//   const preds = await evaluateRegPreds(tf.squeeze(predict), yTestTensor);
//   return preds;
// }

async function dense1Model(data) {
  let dataset = await loadCsv("./predictionService/Churn_Modelling.csv");

  //dataset = _.shuffle(dataset);

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

  // const trainX = tf.tensor(X.slice(0, Math.floor(X.length * 0.8)));
  // const testX = tf.tensor(X.slice(Math.floor(X.length * 0.8)));

  // const trainY = tf.tensor(y.slice(0, Math.floor(y.length * 0.8)));
  // const testY = tf.tensor(y.slice(Math.floor(y.length * 0.8)));

  const [xTrain, xTest] = trainTestSplit(X, 0.2);
  const [yTrain, yTest] = trainTestSplit(y, 0.2);

  console.log(xTrain.slice(0,3));

  const xTrainTensor = standarizeSingleColumns(tf.tensor(xTrain));
  // const xTestTensor = standarizeSingleColumns(
  //   tf.tensor(xTest),
  //   tf.tensor(xTrain)
  // );

  // const yTrainTensor = tf.tensor(yTrain);
  // const yTestTensor = tf.tensor(yTest);

  console.log(xTrainTensor.slice(0, 3));

  // console.log("xTrainTensor Shape: " + xTrainTensor.shape);
  // console.log("yTrainTensor Shape: " + yTrainTensor.shape);
  // console.log("xTestTensor Shape: " + xTestTensor.shape);
  // console.log("yTestTensor Shape: " + yTestTensor.shape);

  // const model = tf.sequential();
  // model.add(
  //   tf.layers.dense({ units: 6, activation: "relu", inputShape: [12] })
  // );
  // model.add(tf.layers.dense({ units: 6, activation: "relu" }));
  // model.add(tf.layers.dense({ units: 1, activation: "sigmoid" }));
  // model.compile({
  //   loss: "binaryCrossentropy",
  //   optimizer: "adam",
  //   metrics: ["accuracy"],
  // });

  // await model.fit(xTrainTensor, yTrainTensor, {
  //   epochs: 100,
  //   batchSize: 32,
  // });

  // const predict = model.predict(xTestTensor);
  // const preds = await evaluateClassPreds(
  //   tf.squeeze(yTestTensor),
  //   tf.squeeze(tf.round(predict))
  // );
  // console.log(tf.squeeze(tf.round(predict)).arraySync().find(e => e === 1));
  // console.log(tf.squeeze(yTestTensor).arraySync().slice(0, 10));
  // console.log(preds);

  // const xTrainTensor = tf.tensor(data[0]);
  // const yTrainTensor = tf.tensor(data[1]);
  // const xTestTensor = tf.tensor(data[2]);
  // const yTestTensor = tf.tensor(data[3]);

  // console.log("Dense Model");
  // console.log("xTrainTensor Shape: " + xTrainTensor.shape);
  // console.log("yTrainTensor Shape: " + yTrainTensor.shape);
  // console.log("xTestTensor Shape: " + xTestTensor.shape);
  // console.log("yTestTensor Shape: " + yTestTensor.shape);

  // const model = tf.sequential();
  // model.add(
  //   tf.layers.flatten({
  //     inputShape: xTrainTensor.shape.slice(1),
  //   })
  // );
  // model.add(tf.layers.dense({ units: 64, activation: "relu" }));
  // model.add(tf.layers.dense({ units: 1, activation: "linear" }));
  // model.compile({
  //   loss: "meanSquaredError",
  //   optimizer: "adam",
  //   metrics: ["mse"],
  // });
  // model.summary();
  // await model.fit(xTrainTensor, yTrainTensor, {
  //   epochs: 100,
  //   batchSize: 128,
  //   verbose: 0,
  // });
  // const predict = model.predict(xTestTensor);
  // const preds = await evaluateRegPreds(tf.squeeze(predict), yTestTensor);
  // return preds;
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
