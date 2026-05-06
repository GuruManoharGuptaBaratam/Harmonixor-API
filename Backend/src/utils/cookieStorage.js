function looksLikeNetscapeCookieText(value) {
  if (!value || typeof value !== "string") return false;

  return (
    value.includes("\t") &&
    (value.includes(".youtube.com") ||
      value.includes("youtube.com") ||
      value.includes("# Netscape") ||
      value.includes("#HttpOnly_"))
  );
}

function decodeCookieTextFromStorage(storedValue) {
  if (!storedValue) {
    throw new Error("Cookie data is empty");
  }

  if (looksLikeNetscapeCookieText(storedValue)) {
    return storedValue;
  }

  const decoded = Buffer.from(storedValue, "base64").toString("utf8");
  if (looksLikeNetscapeCookieText(decoded)) {
    return decoded;
  }

  throw new Error("Stored cookie data is not a valid Netscape cookie export");
}

function normalizeCookieForStorage(rawValue) {
  const text = decodeCookieTextFromStorage(rawValue);
  return Buffer.from(text, "utf8").toString("base64");
}

module.exports = {
  decodeCookieTextFromStorage,
  looksLikeNetscapeCookieText,
  normalizeCookieForStorage,
};
