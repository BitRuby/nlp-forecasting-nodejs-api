const transformations = (text, checkboxes) => {
  let content = typeof text === "string" ? text : String(text);
  if (checkboxes[CHECKBOXES.REMOVE_USERNAMES]) {
    content = content.replace(/@\S+/g, "").replace(/\s\s+/g, "");
  }
  if (checkboxes[CHECKBOXES.REMOVE_URLS]) {
    content = content.replace(/http\S+/g, "").replace(/\s\s+/g, "");
  }
  if (checkboxes[CHECKBOXES.REMOVE_PUNCTUATION_MARKS]) {
    content = content
      .replace(/(?<!\d)\.(?!\d)|[^\w\s.']/g, " ")
      .replace(/'/g, "")
      .replace(/\s\s+/g, " ");
  }
  if (checkboxes[CHECKBOXES.TEXT_TO_LOWERCASE]) {
    content = content.toLowerCase();
  }
  if (checkboxes[CHECKBOXES.REMOVE_SHORT_WORDS]) {
    content = content
      .split(" ")
      .filter((e) => e.length > 2)
      .join(" ");
  }
  return content
    .split(" ")
    .filter((e) => e.length !== 0)
    .join(" ")
    .trim();
};

const CHECKBOXES = {
  REMOVE_USERNAMES: "REMOVE_USERNAMES",
  REMOVE_URLS: "REMOVE_URLS",
  REMOVE_PUNCTUATION_MARKS: "REMOVE_PUNCTUATION_MARKS",
  TEXT_TO_LOWERCASE: "TEXT_TO_LOWERCASE",
  REMOVE_SHORT_WORDS: "REMOVE_SHORT_WORDS",
};

module.exports = { transformations };