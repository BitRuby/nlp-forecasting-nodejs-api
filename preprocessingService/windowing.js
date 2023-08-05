function createDataWindows(data, windowSize, horizon) {
  const windows = [];
  const labels = [];
  const numWindows = data.length - windowSize - horizon + 1;
  for (let i = 0; i < numWindows; i++) {
    const window = data.slice(i, i + windowSize).map((e) => e.posts);
    const label = data
      .slice(i + windowSize, i + windowSize + horizon)
      .map(({ posts, ...rest }) => rest);
    windows.push(window);
    labels.push(label);
  }
  return { windows, labels };
}

module.exports = { createDataWindows };
