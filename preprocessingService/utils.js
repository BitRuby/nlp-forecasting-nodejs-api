const momentjs = require("moment");
const { shuffleData } = require("./shuffle");

function filterAndSortByDate({ array, label, postsByRandom, postsPerDay }) {
  const targetDate = new Date(label.date);
  let filteredArray = array.filter((item) => {
    const itemDate = momentjs(item.date).subtract(1, "hour").toDate();
    return (
      itemDate.getDate() === targetDate.getDate() &&
      itemDate.getMonth() === targetDate.getMonth() &&
      itemDate.getFullYear() === targetDate.getFullYear()
    );
  });
  if (postsByRandom) {
    filteredArray = shuffleData(filteredArray);
  }
  filteredArray = filteredArray.slice(0, postsPerDay);
  filteredArray.sort((a, b) => new Date(a.date) - new Date(b.date));
  return { features: filteredArray, label };
}

module.exports = { filterAndSortByDate };
