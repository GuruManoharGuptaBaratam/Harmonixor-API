const fs = require("fs");

function resolveCookieText(input) {
  if (!input) return "";
  if (fs.existsSync(input)) {
    return fs.readFileSync(input, "utf8");
  }
  return String(input);
}

function parseNetscapeCookies(input) {
  const text = resolveCookieText(input);
  const lines = text.split(/\r?\n/);
  const cookies = [];

  for (const line of lines) {
    if (!line) continue;
    if (line.startsWith("#") && !line.startsWith("#HttpOnly_")) continue;

    const sanitizedLine = line.replace(/^#HttpOnly_/, "");
    const parts = sanitizedLine.split(/\t/);
    if (parts.length < 7) continue;

    const [
      domain,
      flag,
      path,
      secureFlag,
      expiry,
      name,
      value
    ] = parts;

    cookies.push({
      name,
      value,
      domain: domain.replace(/^\./, ""),
      path,
      expires: expiry === "0" ? undefined : Number(expiry),
      httpOnly: line.startsWith("#HttpOnly_"),
      secure: secureFlag === "TRUE",
    });
  }

  return cookies;
}

module.exports = { parseNetscapeCookies };
