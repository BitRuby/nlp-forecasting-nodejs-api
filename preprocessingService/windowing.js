function createDataWindows(data, windowSize, horizon, key) {
  const windows = [];
  const labels = [];
  const numWindows = data.length - windowSize - horizon + 1;
  for (let i = 0; i < numWindows; i++) {
    let window, label;
    if (key) {
      window = data.slice(i, i + windowSize).map((e) => e[key]);
    } else {
      window = data.slice(i, i + windowSize);
    }
    if (key) {
      label = data
        .slice(i + windowSize, i + windowSize + horizon)
        .map(({ key, ...rest }) => rest);
    } else {
      label = data.slice(i + windowSize, i + windowSize + horizon);
    }
    windows.push(window);
    labels.push(label);
  }
  return { windows, labels };
}

module.exports = { createDataWindows };
