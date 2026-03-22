interface Env {
  ASSETS: Fetcher;
  UMAMI_URL: string;
  UMAMI_WEBSITE_ID: string;
}

/**
 * Static slot-to-ticker mapping for permalink decoding.
 * Copied from src/services/permalink.ts — must stay in sync.
 * Index 0 for optional slots (2+) = null (none selected).
 */
const SLOT_OPTIONS: readonly (readonly (string | null)[])[] = [
  /* 0  STL Engine      */ ["ENG", "FSE", "GEN", "AEN", "HTE"],
  /* 1  STL Fuel Tank   */ ["SSL", "MSL", "LSL"],
  /* 2  FTL Reactor     */ [null, "RCT", "QCR", "HPR", "HYR"],
  /* 3  FTL Fuel Tank   */ [null, "SFL", "MFL", "LFL"],
  /* 4  Cargo Bay       */ ["TCB", "VSC", "SCB", "MCB", "LCB", "WCB", "VCB", "HCB"],
  /* 5  Hull Plates     */ ["BHP", "LHP", "RHP", "HHP", "AHP"],
  /* 6  Heat Shielding  */ [null, "BPT", "APT"],
  /* 7  Whipple Shield  */ [null, "BWH", "AWH"],
  /* 8  Stability       */ [null, "STS"],
  /* 9  Radiation Shield */ [null, "BRP", "SRP", "ARP"],
  /* 10 Repair Drones   */ [null, "RDS", "RDL"],
  /* 11 High-G Seats    */ [null, "BGS", "AGS"],
];

const TOTAL_SLOTS = 12;
const MIN_DIGITS = 6;

/** Decode ?bp= param into an array of selected module tickers (nulls excluded). */
function decodeTickers(bp: string): string[] | null {
  const dashIndex = bp.indexOf("-");
  if (dashIndex < 0) return null;

  const version = bp.slice(0, dashIndex);
  const digitString = bp.slice(dashIndex + 1);

  if (version !== "1") return null;
  if (!/^\d+$/.test(digitString)) return null;
  if (digitString.length < MIN_DIGITS) return null;

  const padded = digitString.padEnd(TOTAL_SLOTS, "0");
  const tickers: string[] = [];

  for (let i = 0; i < TOTAL_SLOTS; i++) {
    const options = SLOT_OPTIONS[i]!;
    const digit = parseInt(padded[i]!, 10);
    if (digit >= options.length) return null;
    const ticker = options[digit];
    if (ticker !== null) {
      tickers.push(ticker);
    }
  }

  return tickers;
}

/** Escape HTML special chars in user-provided strings for safe meta tag injection. */
function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

/** Build OG meta tag block for a blueprint permalink. */
function buildOgTags(url: URL): string | null {
  const bp = url.searchParams.get("bp");
  if (!bp) return null;

  const tickers = decodeTickers(bp);
  if (!tickers || tickers.length === 0) return null;

  const rawName = url.searchParams.get("n");
  const name = rawName && rawName.trim()
    ? rawName.trim().slice(0, 50)
    : "Shared Blueprint";

  const title = escapeHtml(`${name} — DryDock`);
  const description = escapeHtml(tickers.join(" · "));
  const fullUrl = escapeHtml(url.toString());

  return [
    `<meta property="og:title" content="${title}" />`,
    `<meta property="og:description" content="${description}" />`,
    `<meta property="og:url" content="${fullUrl}" />`,
    `<meta property="og:site_name" content="DryDock" />`,
    `<meta name="theme-color" content="#c4a35a" />`,
  ].join("\n");
}

export default {
  async fetch(
    request: Request,
    env: Env,
    ctx: ExecutionContext
  ): Promise<Response> {
    const url = new URL(request.url);

    // Serve the static asset
    const response = await env.ASSETS.fetch(request);

    // Only track navigation requests, not asset fetches
    const accept = request.headers.get("Accept") || "";
    const isPageRequest =
      request.method === "GET" &&
      (accept.includes("text/html") || url.pathname === "/") &&
      !url.pathname.match(
        /\.(js|css|png|jpg|jpeg|gif|svg|ico|woff2?|ttf|json|map|wasm)$/
      );

    if (isPageRequest) {
      const ip = request.headers.get("CF-Connecting-IP") || "";
      const userAgent = request.headers.get("User-Agent") || "";

      ctx.waitUntil(
        fetch(`${env.UMAMI_URL}/api/send`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "User-Agent": userAgent,
          },
          body: JSON.stringify({
            type: "event",
            payload: {
              website: env.UMAMI_WEBSITE_ID,
              url: url.pathname + url.search,
              hostname: url.hostname,
              language:
                request.headers.get("Accept-Language")?.split(",")[0] || "",
              referrer: request.headers.get("Referer") || "",
              ip: ip,
              userAgent: userAgent,
            },
          }),
        }).catch(() => {
          // Silently swallow — analytics must never break the site
        })
      );
    }

    // Inject OG meta tags for blueprint permalink requests
    if (isPageRequest && url.searchParams.has("bp")) {
      const ogTags = buildOgTags(url);
      if (ogTags) {
        const html = await response.text();
        const injected = html.replace("</head>", `${ogTags}\n</head>`);
        return new Response(injected, {
          status: response.status,
          headers: response.headers,
        });
      }
    }

    return response;
  },
} satisfies ExportedHandler<Env>;
