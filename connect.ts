import axios, { type AxiosResponse } from "axios";
import { createHash, randomBytes } from "crypto";
import { isIP } from "net";
import { domainToASCII, domainToUnicode } from "url";

const BASE_URL = "https://oauth.monei.com";
const EXCHANGE_TIMEOUT = 35_000;
const TEMPORARILY_UNAVAILABLE = "temporarily_unavailable";
const MODES = ["live", "test"] as const;

// Callback rules from authorization-service/src/broker/integrations.ts.
const CLIENTS = {
  woocommerce: {
    name: "WooCommerce",
    callbacks: [{ path: "/wp-admin/admin-post.php", search: /^\?action=monei_connect$/ }],
    maxPrefix: 3,
    indexPhp: 0,
  },
  prestashop: {
    name: "PrestaShop",
    callbacks: [
      { path: "/module/monei/connect", search: /^$/ },
      {
        path: "/index.php",
        search: /^\?fc=module&module=monei&controller=connect(&id_lang=\d+)?$/,
      },
    ],
    maxPrefix: 3,
    indexPhp: 0,
  },
  magento: {
    name: "Magento",
    callbacks: [{ path: "/monei/payment/connect/", search: /^$/ }],
    maxPrefix: 2,
    indexPhp: 1,
  },
  medusa: {
    name: "Medusa",
    callbacks: [{ path: "/monei/connect", search: /^$/ }],
    maxPrefix: 2,
    indexPhp: 0,
  },
  sylius: {
    name: "Sylius",
    callbacks: [{ path: "/monei/connect", search: /^$/ }],
    maxPrefix: 2,
    indexPhp: 0,
  },
};

const FORBIDDEN_URI_CHARACTERS = /[\p{Cc}\p{Cf}\p{Z}\s\\]/u;
const CURSOR_CALLBACK = "cursor://anysphere.cursor-mcp/oauth/callback";
const LOOPBACK_HOSTS = ["localhost", "127.0.0.1", "[::1]"];
const RESERVED_HOSTS = [
  "monei.com",
  "monei-dev.com",
  "claude.ai",
  "chatgpt.com",
  "oauth-redirect.googleusercontent.com",
];
const VERIFIED_CALLBACKS = [
  "https://claude.ai/api/mcp/auth_callback",
  "https://chatgpt.com/connector_platform_oauth_redirect",
];
const HOST_LABEL = /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/;
const MONEI_EXEMPT_SUFFIX = ".monei-dev-tunnel.com";

type ConnectMode = (typeof MODES)[number];

type ConnectCredentials = {
  accountId: string;
  apiKey: string;
  signingSecret: string;
};

export type ConnectResult = Partial<Record<ConnectMode, ConnectCredentials>> & {
  errors?: Partial<Record<ConnectMode, string>>;
};

export class ConnectException extends Error {
  constructor(
    public readonly code: string,
    public readonly status: number = 0,
  ) {
    super(`MONEI connect failed: ${code}`);
    this.name = "ConnectException";
  }
}

// Isolate the exchange from Axios defaults that can carry API credentials.
const tokenClient = new axios.Axios({
  adapter: "http",
  headers: { "Content-Type": "application/x-www-form-urlencoded" },
  responseType: "text",
  timeout: EXCHANGE_TIMEOUT,
  maxRedirects: 0,
  validateStatus: () => true,
});

const endpoint = (baseUrl: string, route: string) =>
  `${baseUrl.replace(/\/+$/, "")}/integrations/${route}`;

const base64Url = (bytes: Buffer) =>
  bytes.toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const tokenResult = (body: Record<string, unknown>): ConnectResult | null => {
  const result: ConnectResult = {};
  for (const mode of MODES) {
    if (!(mode in body)) continue;
    const keys = body[mode];
    if (!isRecord(keys)) return null;
    const { accountId, apiKey, signingSecret } = keys;
    if (
      typeof accountId !== "string" ||
      typeof apiKey !== "string" ||
      typeof signingSecret !== "string"
    ) {
      return null;
    }
    result[mode] = { accountId, apiKey, signingSecret };
  }

  if ("errors" in body) {
    const errors = body.errors;
    // PHP arrays can encode an empty map as [].
    if (!isRecord(errors) && !(Array.isArray(errors) && errors.length === 0)) return null;
    result.errors = {};
    for (const mode of MODES) {
      const code = isRecord(errors) ? errors[mode] : undefined;
      if (code == null) continue;
      if (typeof code !== "string" || code === "") return null;
      result.errors[mode] = code;
    }
  }

  return result.live || result.test || result.errors?.live || result.errors?.test ? result : null;
};

// Broker URI checks run before the integration-specific checks.
const redirectUriProblem = (raw: string, url: URL): string | null => {
  const { hostname, protocol } = url;
  if (url.href !== raw) {
    // The PHP SDK reports IPv4 shorthand as an IP literal.
    const ipv4Alias = /^https:\/\/([\da-fx.]+)(?=[:/?#]|$)/i.exec(raw)?.[1];
    if (ipv4Alias && isIP(hostname) === 4 && raw.replace(ipv4Alias, hostname) === url.href) {
      return "ipLiteral";
    }
    return "notCanonical";
  }
  if (url.username || url.password) return "userinfo";
  if (raw.includes("#")) return "fragment";
  if (raw === CURSOR_CALLBACK) return null;
  if (protocol === "http:") {
    if (!LOOPBACK_HOSTS.includes(hostname)) return "httpHost";
    if (url.port === "0") return "port";
    return raw.includes("?") ? "query" : null;
  }
  if (protocol !== "https:") return "scheme";
  if (isIP(hostname.replace(/^\[|\]$/g, ""))) return "ipLiteral";
  if (hostname.endsWith(".")) return "trailingDot";
  const unicode = domainToUnicode(hostname);
  if (!unicode || unicode.split(".").some((label) => label.startsWith("xn--"))) return "punycode";
  const host = domainToASCII(hostname.replace(/^\.+/, ""));
  if (
    !VERIFIED_CALLBACKS.includes(raw) &&
    RESERVED_HOSTS.some((reserved) => host === reserved || host.endsWith(`.${reserved}`))
  ) {
    return "reservedHost";
  }
  return null;
};

const isMoneiLike = (hostname: string) =>
  !hostname.endsWith(MONEI_EXEMPT_SUFFIX) &&
  hostname.split(/[.-]/).some((part) => part.startsWith("monei") || part.endsWith("monei"));

export class Connect {
  /** Create an authorization URL and the state and verifier to keep for the callback. */
  static start(client: string, redirectUri: string, baseUrl = BASE_URL) {
    const state = base64Url(randomBytes(32));
    const verifier = base64Url(randomBytes(48));
    const query = new URLSearchParams({
      client_id: client,
      redirect_uri: redirectUri,
      state,
      code_challenge: Connect.codeChallenge(verifier),
      code_challenge_method: "S256",
    });
    return { url: `${endpoint(baseUrl, "authorize")}?${query}`, state, verifier };
  }

  /** Derive the RFC 7636 S256 challenge from a PKCE verifier. */
  static codeChallenge(verifier: string): string {
    return base64Url(createHash("sha256").update(verifier).digest());
  }

  /** Exchange the code using the verifier and exact redirect URI from the authorization request. */
  static async exchange(
    code: string,
    verifier: string,
    client: string,
    redirectUri: string,
    baseUrl = BASE_URL,
  ): Promise<ConnectResult> {
    let response: AxiosResponse<string>;
    try {
      const url = new URL(endpoint(baseUrl, "token"));
      if (url.username || url.password) throw new ConnectException(TEMPORARILY_UNAVAILABLE);
      const form = new URLSearchParams({
        code,
        code_verifier: verifier,
        client_id: client,
        redirect_uri: redirectUri,
      });
      response = await tokenClient.post<string>(url.href, form.toString());
    } catch {
      // Axios errors can retain the request verifier and keys from a partial response.
      throw new ConnectException(TEMPORARILY_UNAVAILABLE);
    }

    const { status, data } = response;
    let body: unknown;
    try {
      body = JSON.parse(data);
    } catch {
      throw new ConnectException(TEMPORARILY_UNAVAILABLE, status);
    }
    if (status < 200 || status >= 300) {
      const code = isRecord(body) ? body.error : undefined;
      if (status !== 404 && typeof code === "string" && /^[a-z_]{1,64}$/.test(code)) {
        throw new ConnectException(code, status);
      }
      throw new ConnectException(TEMPORARILY_UNAVAILABLE, status);
    }

    const result = isRecord(body) ? tokenResult(body) : null;
    if (!result) throw new ConnectException(TEMPORARILY_UNAVAILABLE, status);
    return result;
  }

  /** Serialize a redirect URI in the broker's canonical WHATWG form. */
  static canonicalRedirectUri(uri: string): string {
    return new URL(uri).href;
  }

  /** Check the canonical redirect URI against the broker's local rules. */
  static callbackProblem(client: string, redirectUri: string): string | null {
    if (!Object.prototype.hasOwnProperty.call(CLIENTS, client)) {
      throw new TypeError(`Unknown client: ${client}`);
    }
    const { name, callbacks, maxPrefix, indexPhp } = CLIENTS[client as keyof typeof CLIENTS];
    if (redirectUri.length > 512) return "length";
    if (FORBIDDEN_URI_CHARACTERS.test(redirectUri)) return "character";

    let url: URL;
    try {
      url = new URL(redirectUri);
    } catch {
      return "notCanonical";
    }
    const problem = redirectUriProblem(redirectUri, url);
    if (problem) return problem;

    const { hostname, protocol, pathname, search, host } = url;
    if (protocol !== "https:") return "notHttps";
    if (hostname === "localhost" || hostname.endsWith(".localhost")) return "localhost";
    if (!hostname.includes(".")) return "noDot";
    if (hostname.length > 253 || !hostname.split(".").every((label) => HOST_LABEL.test(label))) {
      return "keyHost";
    }
    if (isMoneiLike(hostname)) return "moneiHost";

    const form = callbacks.find(
      ({ path, search: query }) => pathname.endsWith(path) && query.test(search),
    );
    if (!form) return "callbackPath";
    const prefix = pathname.slice(0, -form.path.length);
    const segments = prefix ? prefix.slice(1).split("/") : [];
    const plain = segments.filter((segment) => segment !== "index.php");
    if (plain.length > maxPrefix) return "callbackDepth";
    if (prefix.includes("%")) return "callbackEncoded";
    if (segments.includes("")) return "callbackEmptySegment";
    if (segments.length - plain.length > indexPhp) return "callbackIndexPhp";
    if (plain.some((segment) => segment.includes("."))) return "callbackDot";
    if (!plain.every((segment) => /^[\w-]+$/.test(segment))) return "callbackSegment";
    if (`${name}: ${host}${prefix}`.length > 300) return "nameLength";
    return null;
  }
}
