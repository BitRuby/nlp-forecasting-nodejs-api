function trainTestSplit(features, testFraction) {
  const numExamples = features.length;
  const numTestExamples = Math.floor(numExamples * testFraction);
  const trainFeatures = features.slice(0, features.length - numTestExamples);
  const testFeatures = features.slice(
    features.length - numTestExamples,
    features.length
  );
  return [trainFeatures, testFeatures];
}

module.exports = { trainTestSplit };
