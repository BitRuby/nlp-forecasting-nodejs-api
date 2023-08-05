const { SCALE_TYPES } = require("./constants");
const { normalize, standarize } = require("./scale");
const { trainTestSplit } = require("./trainTestSplit");
const { createDataWindows } = require("./windowing");
const tf = require("@tensorflow/tfjs-node");

function preprocess({
  mappedRows,
  testFraction = 0.2,
  scaleType,
  scaleColumnsSeparately,
  pickColumns,
  windowSize,
  horizonSize,
}) {
  const { windows, labels } = createDataWindows(
    mappedRows,
    windowSize,
    horizonSize
  );

  const preprocessed = {
    windows: trainTestSplit(windows, Number(testFraction)),
    labels: trainTestSplit(labels, Number(testFraction)),
  };

  return preprocessed;

  // console.log(JSON.stringify(preprocessed.windows, null, 2));
  // console.log(JSON.stringify(preprocessed.labels, null, 2));

  // let trainFeatures, testFeatures, trainLabels, testLabels;

  // if (scaleColumnsSeparately) {
  //   const columnElements = {};
  //   pickColumns.forEach((columnName) => {
  //     let array = [];
  //     preprocessed.windows[0].map((e) =>
  //       e.forEach((f) => f.features.forEach((g) => array.push(g[columnName])))
  //     );
  //     columnElements[columnName] = {
  //       min: tf.tensor(array).min(),
  //       max: tf.tensor(array).max(),
  //     };
  //   });

  //   const getScaledColumn = (columnValues, columnName) => {
  //     if (scaleType === SCALE_TYPES.NORMALIZE) {
  //       return normalize(
  //         tf.tensor(columnValues),
  //         columnElements[columnName].min,
  //         columnElements[columnName].max
  //       ).arraySync();
  //     } else {
  //       return standarize(
  //         tf.tensor(columnValues),
  //         columnElements[columnName].min,
  //         columnElements[columnName].max
  //       ).arraySync();
  //     }
  //   };

  //   trainFeatures = preprocessed.windows[0].map((e) =>
  //     e.map((f) =>
  //       f.features
  //         .map((g) => pickColumns.map((h) => getScaledColumn(g[h], h)))
  //         .flat()
  //     )
  //   );
  //   testFeatures = preprocessed.windows[1].map((e) =>
  //     e.map((f) =>
  //       f.features
  //         .map((g) => pickColumns.map((h) => getScaledColumn(g[h], h)))
  //         .flat()
  //     )
  //   );
  // } else {
  //   trainFeatures = preprocessed.windows[0].map((e) =>
  //     e.map((f) => f.features.map((g) => pickColumns.map((h) => g[h])).flat())
  //   );
  //   testFeatures = preprocessed.windows[1].map((e) =>
  //     e.map((f) => f.features.map((g) => pickColumns.map((h) => g[h])).flat())
  //   );
  //   if (scaleType === SCALE_TYPES.NORMALIZE) {
  //     trainFeatures = normalize(tf.tensor(trainFeatures)).arraySync();
  //     testFeatures = normalize(
  //       tf.tensor(testFeatures),
  //       tf.tensor(trainFeatures).min(),
  //       tf.tensor(trainFeatures).max()
  //     ).arraySync();
  //   } else if (scaleType === SCALE_TYPES.STANDARIZE) {
  //     trainFeatures = standarize(tf.tensor(trainFeatures)).arraySync();
  //     testFeatures = standarize(
  //       tf.tensor(testFeatures),
  //       tf.tensor(trainFeatures).min(),
  //       tf.tensor(trainFeatures).max()
  //     ).arraySync();
  //   }
  // }

  // trainLabels = preprocessed.labels[0].map((e) => e.map((f) => f.label.close));
  // testLabels = preprocessed.labels[1].map((e) => e.map((f) => f.label.close));

  // console.log(trainFeatures);
  // console.log(testFeatures);

  // console.log(trainLabels);
  // console.log(testLabels);

  // return [trainFeatures, testFeatures, trainLabels, testLabels];
}

module.exports = { preprocess };
