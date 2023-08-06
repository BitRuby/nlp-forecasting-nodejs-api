function tokenize(data) {
  let dict = {};
  data.forEach((e) => {
    e.posts.map((f) => {
      const sentence = f.content.split(" ");
      sentence.forEach((s) => {
        if (dict[s]) {
          dict[s]++;
        } else {
          dict[s] = 1;
        }
      });
    });
  });
  return dict;
}

function textVectorizer(dict, dictLength, text, textLength) {
  let keys = Object.keys(dict).sort((a, b) => dict[b] - dict[a]);
  if (dictLength) {
    keys = keys.slice(0, dictLength);
  }
  const vectorizedText = text.split(" ").map((e) => keys.indexOf(e));
  if (vectorizedText.length > textLength) {
    return vectorizedText.slice(0, textLength);
  } else {
    return vectorizedText.concat(
      new Array(textLength - vectorizedText.length).fill(0)
    );
  }
}

module.exports = { tokenize, textVectorizer };
