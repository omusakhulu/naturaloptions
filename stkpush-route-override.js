const daraja = require("/var/www/naturaloptions/daraja-standalone.js");
const { AppRouteRouteModule } = require("next/dist/server/route-modules/app-route/module.compiled");
const { RouteKind } = require("next/dist/server/route-kind");
const { patchFetch } = require("next/dist/server/lib/patch-fetch");
const workAsyncStorage = require("next/dist/server/app-render/work-async-storage.external.js");
const workUnitAsyncStorage = require("next/dist/server/app-render/work-unit-async-storage.external.js");

const runtime = "nodejs";

function normalizeKenyanPhone(input) {
  const digits = String(input || "").replace(/\D/g, "");
  if (!digits) return "";
  if (digits.startsWith("0") && digits.length === 10) return "254" + digits.slice(1);
  if (digits.startsWith("254") && digits.length === 12) return digits;
  if (digits.startsWith("7") && digits.length === 9) return "254" + digits;
  return digits;
}

async function POST(req) {
  const { NextResponse } = require("next/server");
  try {
    const body = await req.json();
    const phone = normalizeKenyanPhone(body.phone);
    const amount = Number(body.amount);
    const accountReference = String(body.accountReference || "").trim() || ("POS-" + Date.now());
    const transactionDesc = String(body.transactionDesc || "").trim() || "POS Payment";

    if (!phone) {
      return NextResponse.json({ success: false, error: "Phone number is required" }, { status: 400 });
    }
    if (!Number.isFinite(amount) || amount <= 0) {
      return NextResponse.json({ success: false, error: "Amount must be > 0" }, { status: 400 });
    }

    const cfg = daraja.getConfig();
    const resp = await daraja.stkPush(cfg, phone, amount, accountReference, transactionDesc);
    return NextResponse.json({ success: true, phone, amount, ...resp });
  } catch (error) {
    console.error("M-PESA stkpush error:", error.message || error);
    return NextResponse.json(
      { success: false, error: "Failed to send M-PESA prompt", details: error.message || String(error) },
      { status: 500 }
    );
  }
}

const userland = { POST, runtime };

const routeModule = new AppRouteRouteModule({
  definition: {
    kind: RouteKind.APP_ROUTE,
    page: "/api/payments/mpesa/stkpush/route",
    pathname: "/api/payments/mpesa/stkpush",
    filename: "route",
    bundlePath: "app/api/payments/mpesa/stkpush/route"
  },
  resolvedPagePath: "/var/www/naturaloptions/src/app/api/payments/mpesa/stkpush/route.ts",
  nextConfigOutput: "",
  userland
});

module.exports = routeModule;
module.exports.routeModule = routeModule;
module.exports.POST = POST;
module.exports.runtime = runtime;
module.exports.patchFetch = function() { return patchFetch({ workAsyncStorage, workUnitAsyncStorage }); };
module.exports.workAsyncStorage = workAsyncStorage;
module.exports.workUnitAsyncStorage = workUnitAsyncStorage;
module.exports.serverHooks = {};
