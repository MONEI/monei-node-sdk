import axios from "axios";
import { createServer, type RequestListener, type Server } from "http";
import { Connect, ConnectException } from "../index";

const WOO_PATH = "/wp-admin/admin-post.php?action=monei_connect";
const WOO = `https://shop.example${WOO_PATH}`;
const LABEL = "a".repeat(63);
// Split the fixture prefixes so secret scanners can distinguish them from credentials.
const LIVE = {
  accountId: "acc-live",
  apiKey: "mk" + "_live_c2NvcGVkLWxpdmUta2V5",
  signingSecret: "mksec" + "_bGl2ZS1zaWduaW5nLXNlY3JldA",
};
const TEST = {
  accountId: "acc-test",
  apiKey: "mk" + "_test_c2NvcGVkLXRlc3Qta2V5",
  signingSecret: "mksec" + "_dGVzdC1zaWduaW5nLXNlY3JldA",
};

describe("Connect.start", () => {
  test("matches the RFC 7636 appendix B vector so the broker can verify the challenge", () => {
    expect(Connect.codeChallenge("dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk")).toBe(
      "E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM",
    );
  });

  test("encodes the nested redirect query and derives the challenge from the returned verifier", () => {
    const start = Connect.start("woocommerce", WOO);
    expect(start.url).toMatch(
      /^https:\/\/oauth\.monei\.com\/integrations\/authorize\?client_id=woocommerce&redirect_uri=https%3A%2F%2Fshop.example%2Fwp-admin%2Fadmin-post.php%3Faction%3Dmonei_connect&state=/,
    );
    expect(Object.fromEntries(new URL(start.url).searchParams)).toEqual({
      client_id: "woocommerce",
      redirect_uri: WOO,
      state: start.state,
      code_challenge: Connect.codeChallenge(start.verifier),
      code_challenge_method: "S256",
    });
  });

  test("sends the Sylius client ID instead of substituting a different integration", () => {
    const start = Connect.start("sylius", "https://shop.example/monei/connect");
    expect(new URL(start.url).searchParams.get("client_id")).toBe("sylius");
  });

  test("uses the supplied broker base without doubling its trailing slash", () => {
    const { url } = Connect.start(
      "medusa",
      "https://shop.example/monei/connect",
      "https://oauth.example/",
    );
    expect(url).toMatch(/^https:\/\/oauth\.example\/integrations\/authorize\?/);
  });

  test("generates a fresh 32-byte state and a fresh 64-character verifier for each flow", () => {
    const first = Connect.start("woocommerce", WOO);
    const second = Connect.start("woocommerce", WOO);
    expect(first.state).not.toBe(second.state);
    expect(first.verifier).not.toBe(second.verifier);
    for (const start of [first, second]) {
      expect(start.state).toMatch(/^[A-Za-z0-9_-]{43}$/);
      expect(Buffer.from(start.state, "base64url")).toHaveLength(32);
      expect(start.verifier).toMatch(/^[A-Za-z0-9_-]{64}$/);
    }
  });
});

describe("Connect.exchange", () => {
  const servers: Server[] = [];

  async function serve(listener: RequestListener, hostname = "127.0.0.1"): Promise<string> {
    const server = createServer(listener);
    servers.push(server);
    await new Promise<void>((resolve, reject) => {
      server.once("error", reject);
      server.listen(0, hostname, resolve);
    });
    const address = server.address();
    if (!address || typeof address === "string") throw new Error("Expected a TCP listener");
    return `http://${hostname}:${address.port}`;
  }

  afterEach(async () => {
    vi.restoreAllMocks();
    await Promise.all(
      servers
        .splice(0)
        .map((server) => new Promise<void>((resolve) => server.close(() => resolve()))),
    );
  });

  const exchange = (baseUrl?: string) =>
    Connect.exchange("code-1", "verifier-1", "woocommerce", WOO, baseUrl);

  const reply = (status: number, body: string, headers?: Record<string, string>) =>
    serve((_, res) => {
      res.writeHead(status, { "Content-Type": "application/json", ...headers });
      res.end(body);
    });

  test("POSTs exactly the broker form fields and ignores ambient Axios Authorization", async () => {
    const capture = vi.fn();
    const baseUrl = await serve(async (req, res) => {
      req.setEncoding("utf8");
      let body = "";
      for await (const chunk of req) body += chunk;
      capture(req.method, req.url, req.headers["content-type"], req.headers.authorization, [
        ...new URLSearchParams(body),
      ]);
      res.end('{"errors":{"live":"cap"}}');
    });
    const headers = axios.defaults.headers.common;
    const previous = headers.Authorization;
    headers.Authorization = "Bearer test-only";
    try {
      await exchange(`${baseUrl}/`);
    } finally {
      if (previous === undefined) delete headers.Authorization;
      else headers.Authorization = previous;
    }
    expect(capture).toHaveBeenCalledExactlyOnceWith(
      "POST",
      "/integrations/token",
      "application/x-www-form-urlencoded",
      undefined,
      [
        ["code", "code-1"],
        ["code_verifier", "verifier-1"],
        ["client_id", "woocommerce"],
        ["redirect_uri", WOO],
      ],
    );
  });

  test("gives the default broker 35 seconds to mint the keys", async () => {
    const post = vi.spyOn(axios.Axios.prototype, "post").mockResolvedValueOnce({
      status: 200,
      data: '{"errors":{"live":"cap"}}',
    });
    await exchange();
    expect(post.mock.calls[0][0]).toBe("https://oauth.monei.com/integrations/token");
    expect(post.mock.contexts[0]).toMatchObject({ defaults: { timeout: 35_000 } });
  });

  test("keeps live and test credentials in their own modes and normalizes the PHP empty errors map", async () => {
    const baseUrl = await reply(200, JSON.stringify({ live: LIVE, test: TEST, errors: [] }));
    await expect(exchange(baseUrl)).resolves.toEqual({ live: LIVE, test: TEST, errors: {} });
  });

  test("returns per-mode refusals when a 200 contains only errors", async () => {
    const baseUrl = await reply(200, '{"errors":{"live":"cap","test":"cap"}}');
    await expect(exchange(baseUrl)).resolves.toEqual({ errors: { live: "cap", test: "cap" } });
  });

  test.each([
    [400, "invalid_request"],
    [400, "invalid_client"],
    [400, "invalid_grant"],
    [403, "access_denied"],
    [503, "temporarily_unavailable"],
  ])("preserves %i %s so the integration can report the broker's refusal", async (status, code) => {
    const baseUrl = await reply(status, JSON.stringify({ error: code }));
    await expect(exchange(baseUrl)).rejects.toMatchObject({
      name: "ConnectException",
      code,
      status,
      message: `MONEI connect failed: ${code}`,
    });
  });

  test.each<[string, number, string, Record<string, string>?]>([
    ["API Gateway 503", 503, '{"message":"Service Unavailable"}'],
    ["API Gateway 504", 504, '{"message":"Endpoint request timed out"}'],
    ["broker switch off", 404, '{"message":"Not Found"}'],
    ["non-JSON body", 502, "<html>Bad Gateway</html>"],
    ["redirect", 302, "", { Location: "https://oauth.monei.com/elsewhere" }],
    ["200 without keys or errors", 200, "{}"],
    ["200 with an empty errors map", 200, '{"errors":{}}'],
    ["200 with an empty refusal code", 200, '{"errors":{"live":""}}'],
    ["200 with incomplete credentials", 200, '{"live":{"accountId":"acc-live"}}'],
    ["404 with an unrelated OAuth error", 404, '{"error":"invalid_request"}'],
    ["error text with an invalid code format", 400, '{"error":"Bad Request"}'],
  ])(
    "maps %s to temporarily_unavailable instead of accepting an unusable reply",
    async (_, status, body, headers) => {
      const baseUrl = await reply(status, body, headers);
      await expect(exchange(baseUrl)).rejects.toMatchObject({
        code: "temporarily_unavailable",
        status,
      });
    },
  );

  test("maps a dropped connection to the same exception as a broker failure", async () => {
    const baseUrl = await serve((req) => req.socket.destroy());
    await expect(exchange(baseUrl)).rejects.toBeInstanceOf(ConnectException);
    await expect(exchange(baseUrl)).rejects.toMatchObject({
      code: "temporarily_unavailable",
      status: 0,
    });
  });

  test("drops the transport error when a cut response might retain a key", async () => {
    const truncated = `{"live":{"accountId":"acc-live","apiKey":"${LIVE.apiKey}`;
    const baseUrl = await serve((_, res) => {
      res.writeHead(200, { "Content-Length": Buffer.byteLength(truncated) + 10 });
      res.write(truncated, () => res.socket?.end());
    });
    const result = exchange(baseUrl);
    await expect(result).rejects.toMatchObject({ code: "temporarily_unavailable", status: 0 });
    await expect(result).rejects.not.toHaveProperty("cause");
    await expect(result).rejects.not.toHaveProperty("response");
  });

  test("keeps keys and signing secrets out of the message for a complete transfer of truncated JSON", async () => {
    const baseUrl = await reply(
      200,
      `{"live":{"accountId":"acc-live","apiKey":"${LIVE.apiKey}","signingSecret":"${LIVE.signingSecret}`,
    );
    const result = exchange(baseUrl);
    await expect(result).rejects.toMatchObject({
      message: "MONEI connect failed: temporarily_unavailable",
      status: 200,
    });
    await expect(result).rejects.not.toHaveProperty("cause");
  });

  test("does not forward the code and verifier through a 307 to another host", async () => {
    const receiveRedirect = vi.fn();
    const otherHost = await serve((_, res) => {
      receiveRedirect();
      res.end('{"errors":{"live":"cap"}}');
    }, "localhost");
    const baseUrl = await reply(307, "", { Location: `${otherHost}/elsewhere` });
    await expect(exchange(baseUrl)).rejects.toMatchObject({
      code: "temporarily_unavailable",
      status: 307,
    });
    expect(receiveRedirect).not.toHaveBeenCalled();
  });
});

describe("Connect.canonicalRedirectUri", () => {
  test.each([
    ["upper case, default port, empty path", "HTTPS://Shop.com:443", "https://shop.com/"],
    ["another port", "https://shop.example:8443/cb", "https://shop.example:8443/cb"],
    ["percent escape in the host", "https://%73hop.example/cb", "https://shop.example/cb"],
    [
      "non-ASCII path",
      `https://shop.example/tienda-ñ${WOO_PATH}`,
      `https://shop.example/tienda-%C3%B1${WOO_PATH}`,
    ],
    [
      "a Medusa callback with a default port and mixed-case host",
      "https://Shop.example:443/monei/connect",
      "https://shop.example/monei/connect",
    ],
    [
      "an IDN without transitional ß-to-ss conversion",
      "https://straße.de",
      "https://xn--strae-oqa.de/",
    ],
  ])("serializes %s in the broker's required canonical form", (_, raw, canonical) => {
    expect(Connect.canonicalRedirectUri(raw)).toBe(canonical);
  });

  test.each([
    ["a non-numeric port", "https://shop.example:44a/cb"],
    ["a port over 65535", "https://shop.example:65536/cb"],
    ["a host escape of a forbidden character", "https://shop%2Fevil.example/cb"],
  ])("rejects %s instead of returning an unusable URI", (_, raw) => {
    expect(() => Connect.canonicalRedirectUri(raw)).toThrow(TypeError);
  });
});

describe("Connect.callbackProblem", () => {
  test.each([
    ["woocommerce in a subdirectory", "woocommerce", `https://shop.example/blog${WOO_PATH}`],
    ["woocommerce three prefix segments", "woocommerce", `https://shop.example/a/b/c${WOO_PATH}`],
    [
      "prestashop friendly, with a language",
      "prestashop",
      "https://shop.example/en/module/monei/connect",
    ],
    [
      "prestashop index.php, with id_lang",
      "prestashop",
      "https://shop.example/shop/index.php?fc=module&module=monei&controller=connect&id_lang=2",
    ],
    [
      "prestashop index.php, one language",
      "prestashop",
      "https://shop.example/index.php?fc=module&module=monei&controller=connect",
    ],
    [
      "magento index.php and a store code",
      "magento",
      "https://shop.example/a/index.php/default/monei/payment/connect/",
    ],
    ["medusa callback on a subdomain", "medusa", "https://api.shop.example/monei/connect"],
    ["medusa two prefix segments", "medusa", "https://shop.example/a/b/monei/connect"],
    ["sylius callback on a subdomain", "sylius", "https://api.shop.example/monei/connect"],
    ["sylius two prefix segments", "sylius", "https://shop.example/a/b/monei/connect"],
    [
      "a key name of 300 characters",
      "woocommerce",
      `https://shop.example/${"a".repeat(274)}${WOO_PATH}`,
    ],
    [
      "labels of 63 and a host of 253",
      "woocommerce",
      `https://${LABEL}.${LABEL}.${LABEL}.${"a".repeat(61)}${WOO_PATH}`,
    ],
  ])("accepts %s so the integration can offer Connect", (_, client, uri) => {
    expect(Connect.callbackProblem(client, uri)).toBeNull();
  });

  test.each([
    [
      "three Magento prefix segments",
      "magento",
      "https://shop.example/a/b/c/monei/payment/connect/",
      "callbackDepth",
    ],
    [
      "medusa three prefix segments",
      "medusa",
      "https://shop.example/a/b/c/monei/connect",
      "callbackDepth",
    ],
    ["medusa query parameter", "medusa", "https://shop.example/monei/connect?x=1", "callbackPath"],
    ["medusa trailing slash", "medusa", "https://shop.example/monei/connect/", "callbackPath"],
    [
      "medusa index.php prefix",
      "medusa",
      "https://shop.example/index.php/monei/connect",
      "callbackIndexPhp",
    ],
    [
      "sylius three prefix segments",
      "sylius",
      "https://shop.example/a/b/c/monei/connect",
      "callbackDepth",
    ],
    ["sylius query parameter", "sylius", "https://shop.example/monei/connect?x=1", "callbackPath"],
    ["sylius trailing slash", "sylius", "https://shop.example/monei/connect/", "callbackPath"],
    [
      "sylius index.php prefix",
      "sylius",
      "https://shop.example/index.php/monei/connect",
      "callbackIndexPhp",
    ],
    [
      "four prefix segments",
      "woocommerce",
      `https://shop.example/a/b/c/d${WOO_PATH}`,
      "callbackDepth",
    ],
    [
      "another path with the right query",
      "woocommerce",
      "https://shop.example/wp-admin/admin.php?action=monei_connect",
      "callbackPath",
    ],
    [
      "the friendly path with the index.php query",
      "prestashop",
      "https://shop.example/module/monei/connect?fc=module&module=monei&controller=connect",
      "callbackPath",
    ],
    ["an extra query key", "woocommerce", `${WOO}&next=https://evil.example`, "callbackPath"],
    [
      "an open redirect path before the suffix",
      "woocommerce",
      `https://shop.example/out/evil.com${WOO_PATH}`,
      "callbackDot",
    ],
    [
      "index.php outside Magento",
      "woocommerce",
      `https://shop.example/index.php${WOO_PATH}`,
      "callbackIndexPhp",
    ],
    [
      "a percent-encoded segment",
      "woocommerce",
      `https://shop.example/sh%6Fp${WOO_PATH}`,
      "callbackEncoded",
    ],
    ["an empty segment", "woocommerce", `https://shop.example/${WOO_PATH}`, "callbackEmptySegment"],
    [
      "a segment outside [A-Za-z0-9_-]",
      "woocommerce",
      `https://shop.example/~shop${WOO_PATH}`,
      "callbackSegment",
    ],
    ["a loopback http URI", "woocommerce", "http://localhost:3000/cb", "notHttps"],
    [
      "the Cursor callback",
      "woocommerce",
      "cursor://anysphere.cursor-mcp/oauth/callback",
      "notHttps",
    ],
    ["https on localhost", "woocommerce", "https://localhost/cb", "localhost"],
    ["https on a .localhost host", "woocommerce", "https://shop.localhost/cb", "localhost"],
    ["a host without a dot", "woocommerce", "https://intranet/cb", "noDot"],
    ["a host the key refuses (_)", "woocommerce", "https://my_shop.example/cb", "keyHost"],
    [
      "a label part that starts with monei",
      "woocommerce",
      "https://monei-connect.shop/cb",
      "moneiHost",
    ],
    [
      "a whole label that ends with monei",
      "woocommerce",
      "https://securemonei.net/cb",
      "moneiHost",
    ],
    ["a part after the - split", "woocommerce", "https://secure-moneipay.shop/cb", "moneiHost"],
    ["a label other than the first", "woocommerce", "https://pay.securemonei.net/cb", "moneiHost"],
    ["the exempt domain itself", "woocommerce", "https://monei-dev-tunnel.com/cb", "moneiHost"],
    [
      "the exempt domain outside the suffix",
      "woocommerce",
      "https://monei-dev-tunnel.com.shop-secure.net/cb",
      "moneiHost",
    ],
    [
      "the exempt domain without a dot before it",
      "woocommerce",
      "https://shop-monei-dev-tunnel.com/cb",
      "moneiHost",
    ],
    [
      "a host under the exempt domain",
      "woocommerce",
      "https://magento.monei-dev-tunnel.com/cb",
      "callbackPath",
    ],
    ["monei inside a word", "woocommerce", "https://simoneinteriors.com/cb", "callbackPath"],
    [
      "a key name of 301 characters",
      "woocommerce",
      `https://shop.example/${"a".repeat(275)}${WOO_PATH}`,
      "nameLength",
    ],
    ["an IPv4 literal", "woocommerce", "https://93.184.215.14/cb", "ipLiteral"],
    ["an IPv6 literal", "woocommerce", "https://[2606:2800:220:1::1]/cb", "ipLiteral"],
    ["an IPv4 shorthand", "woocommerce", "https://127.1/cb", "ipLiteral"],
    ["any trailing-dot host", "woocommerce", "https://evil.com./cb", "trailingDot"],
    ["userinfo", "woocommerce", "https://user@x.com/cb", "userinfo"],
    ["a fragment", "woocommerce", "https://x.com/cb#x", "fragment"],
    ["an empty fragment", "woocommerce", "https://x.com/cb#", "fragment"],
    ["513 characters", "woocommerce", `https://x.com/${"a".repeat(499)}`, "length"],
    ["512 characters", "woocommerce", `https://x.com/${"a".repeat(498)}`, "callbackPath"],
    ["a label of 64", "woocommerce", `https://${"a".repeat(64)}.example${WOO_PATH}`, "keyHost"],
    [
      "a host of 254",
      "woocommerce",
      `https://${LABEL}.${LABEL}.${LABEL}.${"a".repeat(62)}${WOO_PATH}`,
      "keyHost",
    ],
  ])("reports the correct refusal for %s (%s, %s, %s)", (_, client, uri, problem) => {
    expect(Connect.callbackProblem(client, uri)).toBe(problem);
  });

  test.each([
    [
      "forbidden characters before canonicalization",
      "https://Shop.example/a b/monei/connect",
      "character",
    ],
    ["an unparseable URL", "not-a-url", "notCanonical"],
    [
      "a normalized path before the callback pin",
      "https://shop.example/a/../monei/connect",
      "notCanonical",
    ],
    ["userinfo before fragments", "https://user@shop.example/monei/connect#x", "userinfo"],
    ["a public HTTP host before its query", "http://shop.example/monei/connect?x=1", "httpHost"],
    ["loopback port zero before its query", "http://localhost:0/cb?x=1", "port"],
    ["a loopback query before the HTTPS rule", "http://localhost:3000/cb?x=1", "query"],
    [
      "a different custom scheme before the HTTPS rule",
      "custom://shop.example/monei/connect",
      "scheme",
    ],
    [
      "a host reserved by the broker before the lookalike check",
      "https://oauth.monei.com/monei/connect",
      "reservedHost",
    ],
    [
      "a verified OAuth URI exempted from the reserved host check",
      "https://chatgpt.com/connector_platform_oauth_redirect",
      "callbackPath",
    ],
    [
      "excessive depth before an encoded segment",
      "https://shop.example/a/b/%63/monei/connect",
      "callbackDepth",
    ],
  ])("keeps broker check precedence for %s", (_, uri, problem) => {
    expect(Connect.callbackProblem("medusa", uri)).toBe(problem);
  });

  test.each(["shopify", "toString"])(
    "rejects the unknown client %s before applying callback rules",
    (client) => {
      expect(() => Connect.callbackProblem(client, WOO)).toThrow(`Unknown client: ${client}`);
    },
  );
});
