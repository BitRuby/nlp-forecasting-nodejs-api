function computeSMA(data, windowSize, key) {
  let rAvgs = [],
    avgPrev = 0;
  for (let i = 0; i <= data.length - windowSize; i++) {
    let currAvg = 0.0,
      t = i + windowSize;
    for (let k = i; k < t && k <= data.length; k++) {
      currAvg += data[k][key] / windowSize;
    }
    rAvgs.push({ set: data.slice(i, i + windowSize), avg: currAvg });
    avgPrev = currAvg;
  }
  return rAvgs;
}

module.exports = { computeSMA };
