const fs = require("fs");

function parseNetscapeCookies(filePath) {
  const text = fs.readFileSync(filePath, "utf8");
  const lines = text.split(/\r?\n/);
  const cookies = [];

  for (const line of lines) {
    if (!line || line.startsWith("#")) continue;

    const parts = line.split(/\t/);
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
      httpOnly: false,
      secure: secureFlag === "TRUE",
    });
  }

  return cookies;
}

module.exports = { parseNetscapeCookies };
