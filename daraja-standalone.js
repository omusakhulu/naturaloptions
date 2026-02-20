const https = require("https");

let cachedToken = null;

function requireEnv(name) {
  const v = process.env[name];
  if (!v) throw new Error("Missing env: " + name);
  return v;
}

function getConfig() {
  return {
    baseUrl: process.env.MPESA_BASE_URL || "https://sandbox.safaricom.co.ke",
    consumerKey: requireEnv("MPESA_CONSUMER_KEY"),
    consumerSecret: requireEnv("MPESA_CONSUMER_SECRET"),
    shortcode: requireEnv("MPESA_SHORTCODE"),
    passkey: requireEnv("MPESA_PASSKEY"),
    callbackUrl: requireEnv("MPESA_CALLBACK_URL")
  };
}

function formatTimestamp(d) {
  d = d || new Date();
  const pad = n => String(n).padStart(2, "0");
  return String(d.getFullYear()) + pad(d.getMonth()+1) + pad(d.getDate()) +
    pad(d.getHours()) + pad(d.getMinutes()) + pad(d.getSeconds());
}

function httpsRequest(url, method, headers, body) {
  return new Promise((resolve, reject) => {
    console.log("[mpesa]", method, url);
    if (body) console.log("[mpesa] body:", body);
    const req = https.request(url, { method, headers }, (res) => {
      let data = "";
      res.on("data", c => data += c);
      res.on("end", () => {
        console.log("[mpesa] response:", res.statusCode, data);
        let json;
        try { json = JSON.parse(data); } catch { json = { raw: data }; }
        resolve({ statusCode: res.statusCode, json });
      });
    });
    req.on("error", reject);
    if (body) req.write(body);
    req.end();
  });
}

async function getAccessToken(cfg) {
  if (cachedToken && cachedToken.expiresAtMs > Date.now() + 10000) {
    console.log("[mpesa] Using cached token");
    return cachedToken.token;
  }
  const basic = Buffer.from(cfg.consumerKey + ":" + cfg.consumerSecret).toString("base64");
  console.log("[mpesa] Getting new token, key starts:", cfg.consumerKey.slice(0,8));
  const resp = await httpsRequest(
    cfg.baseUrl + "/oauth/v1/generate?grant_type=client_credentials",
    "GET", { Authorization: "Basic " + basic }
  );
  if (resp.statusCode >= 400) throw new Error("Token request failed: " + JSON.stringify(resp.json));
  const token = String(resp.json.access_token || "");
  if (!token) throw new Error("No access_token returned");
  const expiresIn = parseInt(String(resp.json.expires_in || "3599"), 10) || 3599;
  cachedToken = { token, expiresAtMs: Date.now() + expiresIn * 1000 };
  return token;
}

async function stkPush(cfg, phone, amount, accountReference, transactionDesc) {
  const token = await getAccessToken(cfg);
  const timestamp = formatTimestamp();
  const password = Buffer.from(cfg.shortcode + cfg.passkey + timestamp).toString("base64");
  const body = JSON.stringify({
    BusinessShortCode: cfg.shortcode,
    Password: password,
    Timestamp: timestamp,
    TransactionType: "CustomerPayBillOnline",
    Amount: Math.round(amount),
    PartyA: phone,
    PartyB: cfg.shortcode,
    PhoneNumber: phone,
    CallBackURL: cfg.callbackUrl,
    AccountReference: accountReference,
    TransactionDesc: transactionDesc
  });
  const resp = await httpsRequest(
    cfg.baseUrl + "/mpesa/stkpush/v1/processrequest",
    "POST",
    { Authorization: "Bearer " + token, "Content-Type": "application/json" },
    body
  );
  if (resp.statusCode >= 400) {
    throw new Error("Daraja STK failed (" + resp.statusCode + "): " + JSON.stringify(resp.json));
  }
  return resp.json;
}

async function stkQuery(cfg, checkoutRequestId) {
  const token = await getAccessToken(cfg);
  const timestamp = formatTimestamp();
  const password = Buffer.from(cfg.shortcode + cfg.passkey + timestamp).toString("base64");
  const body = JSON.stringify({
    BusinessShortCode: cfg.shortcode,
    Password: password,
    Timestamp: timestamp,
    CheckoutRequestID: checkoutRequestId
  });
  const resp = await httpsRequest(
    cfg.baseUrl + "/mpesa/stkpushquery/v1/query",
    "POST",
    { Authorization: "Bearer " + token, "Content-Type": "application/json" },
    body
  );
  if (resp.statusCode >= 400) {
    throw new Error("Daraja query failed (" + resp.statusCode + "): " + JSON.stringify(resp.json));
  }
  return resp.json;
}

module.exports = { getConfig, stkPush, stkQuery };
