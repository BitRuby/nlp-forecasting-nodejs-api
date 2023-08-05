function countPostsByDate(posts) {
  const counts = {};

  posts.forEach((post) => {
    const isoDate = new Date(post.date).toISOString();
    const date = isoDate.split("T")[0];
    if (counts[date]) {
      counts[date] += 1;
    } else {
      counts[date] = 1;
    }
  });

  const result = Object.keys(counts).map((date) => ({
    date,
    count: counts[date],
  }));

  return result;
}

class MissingParameterError extends Error {
  constructor(parameterName) {
    super(`${parameterName} is required!`);
    this.name = "MissingParameterError";
  }
}

module.exports = { countPostsByDate, MissingParameterError };
