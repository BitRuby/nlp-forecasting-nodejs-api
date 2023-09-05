const { SCALE_TYPES } = require("./constants");
const {
  normalize,
  standarize,
  normalizeSingleColumns,
  standarizeSingleColumns,
} = require("./scale");
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
  labelName,
}) {
  const { windows, labels } = createDataWindows(
    mappedRows,
    windowSize,
    horizonSize,
    "posts"
  );

  let trainFeatures, testFeatures, trainLabels, testLabels;

  const preprocessed = {
    windows: trainTestSplit(windows, Number(testFraction)),
    labels: trainTestSplit(labels, Number(testFraction)),
  };

  trainFeatures = preprocessed.windows[0].map((e) =>
    e.map((f) => f.map((g) => pickColumns.map((h) => g[h])).flat())
  );

  testFeatures = preprocessed.windows[1].map((e) =>
    e.map((f) => f.map((g) => pickColumns.map((h) => g[h])).flat())
  );

  const train = tf.tensor(trainFeatures);
  const test = tf.tensor(testFeatures);

  if (scaleType === SCALE_TYPES.NORMALIZE) {
    trainFeatures = scaleColumnsSeparately
      ? normalizeSingleColumns(train)
      : normalize(train);
    testFeatures = scaleColumnsSeparately
      ? normalizeSingleColumns(test, train)
      : normalize(test, train.min(), train.max());
  } else if (scaleType === SCALE_TYPES.STANDARIZE) {
    trainFeatures = scaleColumnsSeparately
      ? standarizeSingleColumns(train)
      : standarize(train);
    testFeatures = scaleColumnsSeparately
      ? standarizeSingleColumns(test, train)
      : standarize(
          test,
          train.mean(),
          train.sub(train.mean()).pow(2).mean().sqrt()
        );
  } else {
    trainFeatures = train;
    testFeatures = test;
  }

  // if (scaleColumnsSeparately) {
  //   const columnElements = {};
  //   pickColumns.forEach((columnName) => {
  //     let array = [];
  //     preprocessed.windows[0].forEach((e) =>
  //       e.forEach((f) => f.forEach((g) => array.push(g[columnName])))
  //     );
  //     columnElements[columnName] = {
  //       min: tf.tensor(array).min(),
  //       max: tf.tensor(array).max(),
  //       mean: tf.tensor(array).mean(),
  //       std: tf.tensor(array).sub(tf.tensor(array).mean()).pow(2).mean().sqrt(),
  //     };
  //   });
  //   const getScaledColumn = (columnValues, columnName) => {
  //     if (scaleType === SCALE_TYPES.NORMALIZE) {
  //       return normalize(
  //         tf.tensor(columnValues),
  //         columnElements[columnName].min,
  //         columnElements[columnName].max
  //       ).arraySync();
  //     } else if (scaleType === SCALE_TYPES.STANDARIZE) {
  //       return standarize(
  //         tf.tensor(columnValues),
  //         columnElements[columnName].mean,
  //         columnElements[columnName].std
  //       ).arraySync();
  //     } else {
  //       return tf.tensor(columnValues);
  //     }
  //   };
  //   trainFeatures = preprocessed.windows[0].map((e) =>
  //     e.map((f) =>
  //       f.map((g) => pickColumns.map((h) => getScaledColumn(g[h], h))).flat()
  //     )
  //   );
  //   testFeatures = preprocessed.windows[1].map((e) =>
  //     e.map((f) =>
  //       f.map((g) => pickColumns.map((h) => getScaledColumn(g[h], h))).flat()
  //     )
  //   );
  // } else {
  //   trainFeatures = preprocessed.windows[0].map((e) =>
  //     e.map((f) => f.map((g) => pickColumns.map((h) => g[h])).flat())
  //   );

  //   testFeatures = preprocessed.windows[1].map((e) =>
  //     e.map((f) => f.map((g) => pickColumns.map((h) => g[h])).flat())
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
  //       tf.tensor(trainFeatures).mean(),
  //       tf
  //         .tensor(trainFeatures)
  //         .sub(tf.tensor(trainFeatures).mean())
  //         .pow(2)
  //         .mean()
  //         .sqrt()
  //     ).arraySync();
  //   }
  // }

  const splittedLabels = labelName.split(".");

  trainLabels = preprocessed.labels[0].map((e) =>
    e.map((f) =>
      splittedLabels.length > 1
        ? f[splittedLabels[0]][splittedLabels[1]]
        : f[splittedLabels[0]]
    )
  );
  testLabels = preprocessed.labels[1].map((e) =>
    e.map((f) =>
      splittedLabels.length > 1
        ? f[splittedLabels[0]][splittedLabels[1]]
        : f[splittedLabels[0]]
    )
  );

  if (labelName === "quote.close") {
  } else if (labelName === "Close") {
    trainLabels = trainLabels.map((e) => [Number(e[0])]);
    testLabels = testLabels.map((e) => [Number(e[0])]);
  } else {
    trainLabels = trainLabels.map((e) => [Number(e[0].slice(1))]);
    testLabels = testLabels.map((e) => [Number(e[0].slice(1))]);
  }

  return [
    trainFeatures.arraySync(),
    trainLabels,
    testFeatures.arraySync(),
    testLabels,
  ];
}

module.exports = { preprocess };
