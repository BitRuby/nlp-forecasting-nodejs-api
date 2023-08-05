function computeEMA(data, windowSize, key) {
  const alpha = 2 / (windowSize + 1);
  let ema = [],
    prevEMA = 0;

  for (let i = 0; i < data.length; i++) {
    const value = data[i][key];

    if (i === 0) {
      prevEMA = value;
      ema.push({ set: [data[i]], avg: value });
    } else {
      const currEMA = value * alpha + prevEMA * (1 - alpha);
      prevEMA = currEMA;
      ema.push({ set: [data[i]], avg: currEMA });
    }
  }
  return ema;
}

module.exports = { computeEMA };
