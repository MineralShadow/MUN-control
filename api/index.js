// node_modules/.pnpm/hono@4.13.16/node_modules/hono/dist/http-exception.js
var HTTPException = class extends Error {
  res;
  status;
  /**
  * Creates an instance of `HTTPException`.
  * @param status - HTTP status code for the exception. Defaults to 500.
  * @param options - Additional options for the exception.
  */
  constructor(status = 500, options) {
    super(options?.message, { cause: options?.cause });
    this.res = options?.res;
    this.status = status;
  }
  /**
  * Returns the response object associated with the exception.
  * If a response object is not provided, a new response is created with the error message and status code.
  * @returns The response object.
  */
  getResponse() {
    if (this.res) return new Response(this.res.body, {
      status: this.status,
      headers: this.res.headers
    });
    return new Response(this.message, { status: this.status });
  }
};

// node_modules/.pnpm/hono@4.13.16/node_modules/hono/dist/request/constants.js
var GET_MATCH_RESULT = /* @__PURE__ */ Symbol();

// node_modules/.pnpm/hono@4.13.16/node_modules/hono/dist/utils/buffer.js
var bufferToFormData = (arrayBuffer, contentType) => {
  return new Response(arrayBuffer, { headers: { "Content-Type": contentType.replace(/^[^;]+/, (mediaType) => mediaType.toLowerCase()) } }).formData();
};

// node_modules/.pnpm/hono@4.13.16/node_modules/hono/dist/utils/body.js
var MAX_NESTED_OBJECTS = 1e4;
var isRawRequest = (request) => "headers" in request;
var parseBody = async (request, options = /* @__PURE__ */ Object.create(null)) => {
  const { all = false, dot = false } = options;
  const mediaType = (isRawRequest(request) ? request.headers : request.raw.headers).get("Content-Type")?.split(";")[0].trim().toLowerCase();
  if (mediaType === "multipart/form-data" || mediaType === "application/x-www-form-urlencoded") return parseFormData(request, {
    all,
    dot
  });
  return {};
};
async function parseFormData(request, options) {
  if (!isRawRequest(request) && request.bodyCache.formData) return convertFormDataToBodyData(await request.bodyCache.formData, options);
  const headers = isRawRequest(request) ? request.headers : request.raw.headers;
  const arrayBuffer = await request.arrayBuffer();
  const formDataPromise = bufferToFormData(arrayBuffer, headers.get("Content-Type") || "");
  if (!isRawRequest(request)) request.bodyCache.formData = formDataPromise;
  const formData = await formDataPromise;
  if (formData) return convertFormDataToBodyData(formData, options);
  return {};
}
function convertFormDataToBodyData(formData, options) {
  const form = /* @__PURE__ */ Object.create(null);
  const nestingState = { count: 0 };
  formData.forEach((value, key) => {
    if (!(options.all || key.endsWith("[]"))) form[key] = value;
    else handleParsingAllValues(form, key, value);
  });
  if (options.dot) Object.entries(form).forEach(([key, value]) => {
    if (key.includes(".")) {
      handleParsingNestedValues(form, key, value, nestingState);
      delete form[key];
    }
  });
  return form;
}
var handleParsingAllValues = (form, key, value) => {
  if (form[key] !== void 0) {
    if (Array.isArray(form[key])) form[key].push(value);
    else form[key] = [form[key], value];
  } else if (!key.endsWith("[]")) form[key] = value;
  else form[key] = [value];
};
var handleParsingNestedValues = (form, key, value, state) => {
  if (/(?:^|\.)__proto__\./.test(key)) return;
  let nestedForm = form;
  const keys = key.split(".", 34);
  if (keys.length > 33) throwNestingLimitExceeded();
  keys.forEach((key2, index) => {
    if (index === keys.length - 1) nestedForm[key2] = value;
    else {
      if (!nestedForm[key2] || typeof nestedForm[key2] !== "object" || Array.isArray(nestedForm[key2]) || nestedForm[key2] instanceof File) {
        if (state.count++ >= MAX_NESTED_OBJECTS) throwNestingLimitExceeded();
        nestedForm[key2] = /* @__PURE__ */ Object.create(null);
      }
      nestedForm = nestedForm[key2];
    }
  });
};
var throwNestingLimitExceeded = () => {
  throw new Error("Nesting limit exceeded");
};

// node_modules/.pnpm/hono@4.13.16/node_modules/hono/dist/utils/url.js
var splitPath = (path) => {
  const paths = path.split("/");
  if (paths[0] === "") paths.shift();
  return paths;
};
var splitRoutingPath = (routePath) => {
  const { groups, path } = extractGroupsFromPath(routePath);
  const paths = splitPath(path);
  return replaceGroupMarks(paths, groups);
};
var extractGroupsFromPath = (path) => {
  const groups = [];
  path = path.replace(/\{[^}]+\}/g, (match2, index) => {
    const mark = `@${index}`;
    groups.push([mark, match2]);
    return mark;
  });
  return {
    groups,
    path
  };
};
var replaceGroupMarks = (paths, groups) => {
  for (let i = groups.length - 1; i >= 0; i--) {
    const [mark] = groups[i];
    for (let j = paths.length - 1; j >= 0; j--) if (paths[j].includes(mark)) {
      paths[j] = paths[j].replace(mark, groups[i][1]);
      break;
    }
  }
  return paths;
};
var patternCache = {};
var getPattern = (label, next) => {
  if (label === "*") return "*";
  const match2 = label.match(/^\:([^\{\}]+)(?:\{(.+)\})?$/);
  if (match2) {
    const cacheKey = `${label}#${next}`;
    if (!patternCache[cacheKey]) {
      if (match2[2]) patternCache[cacheKey] = next && next[0] !== ":" && next[0] !== "*" ? [
        cacheKey,
        match2[1],
        new RegExp(`^${match2[2]}(?=/${next})`)
      ] : [
        label,
        match2[1],
        new RegExp(`^${match2[2]}$`)
      ];
      else patternCache[cacheKey] = [
        label,
        match2[1],
        true
      ];
    }
    return patternCache[cacheKey];
  }
  return null;
};
var tryDecode = (str, decoder) => {
  try {
    return decoder(str);
  } catch {
    return str.replace(/(?:%[0-9A-Fa-f]{2})+/g, (match2) => {
      try {
        return decoder(match2);
      } catch {
        return match2;
      }
    });
  }
};
var tryDecodeURI = (str) => tryDecode(str, decodeURI);
var getPath = (request) => {
  const url = request.url;
  const start = url.indexOf("/", url.indexOf(":") + 4);
  let i = start;
  for (; i < url.length; i++) {
    const charCode = url.charCodeAt(i);
    if (charCode === 37) {
      const queryIndex = url.indexOf("?", i);
      const hashIndex = url.indexOf("#", i);
      const end = queryIndex === -1 ? hashIndex === -1 ? void 0 : hashIndex : hashIndex === -1 ? queryIndex : Math.min(queryIndex, hashIndex);
      const path = url.slice(start, end);
      return tryDecodeURI(path.includes("%25") ? path.replace(/%25/g, "%2525") : path);
    } else if (charCode === 63 || charCode === 35) break;
  }
  return url.slice(start, i);
};
var getPathNoStrict = (request) => {
  const result = getPath(request);
  return result.length > 1 && result.at(-1) === "/" ? result.slice(0, -1) : result;
};
var stripPathPrefix = (rawPath, decodedPath, prefixLength) => {
  if (rawPath.at(-1) === "/" && decodedPath.at(-1) !== "/") rawPath = rawPath.slice(0, -1);
  let index = 0;
  for (let i = decodedPath.indexOf("/"); i !== -1 && i < prefixLength; i = decodedPath.indexOf("/", i + 1)) {
    index = rawPath.indexOf("/", index + 1);
    if (index === -1) return "/";
  }
  return rawPath.slice(index) || "/";
};
var mergePath = (base, sub, ...rest) => {
  if (rest.length) sub = mergePath(sub, ...rest);
  return `${base?.[0] === "/" ? "" : "/"}${base}${sub === "/" ? "" : `${base?.at(-1) === "/" ? "" : "/"}${sub?.[0] === "/" ? sub.slice(1) : sub}`}`;
};
var checkOptionalParameter = (path) => {
  if (path.charCodeAt(path.length - 1) !== 63 || !path.includes(":")) return null;
  const segments = path.split("/");
  const results = [];
  let basePath = "";
  segments.forEach((segment) => {
    if (segment !== "" && !/\:/.test(segment)) basePath += "/" + segment;
    else if (/\:/.test(segment)) {
      if (segment.charCodeAt(segment.length - 1) === 63) {
        if (results.length === 0 && basePath === "") results.push("/");
        else results.push(basePath);
        const optionalSegment = segment.slice(0, -1);
        basePath += "/" + optionalSegment;
        results.push(basePath);
      } else basePath += "/" + segment;
    }
  });
  return results.filter((v, i, a) => a.indexOf(v) === i);
};
var tryDecodeURIComponent = (str) => str.indexOf("%") !== -1 ? tryDecode(str, decodeURIComponent_) : str;
var _decodeURI = (value) => {
  if (value.indexOf("+") !== -1) value = value.replace(/\+/g, " ");
  return tryDecodeURIComponent(value);
};
var _getQueryParam = (url, key, multiple) => {
  const hashIndex = url.indexOf("#", 8);
  if (hashIndex !== -1) url = url.slice(0, hashIndex);
  let encoded;
  if (!multiple && key && key.indexOf("%") === -1 && key.indexOf("+") === -1) {
    const queryIndex = url.indexOf("?", 8);
    let keyIndex2 = queryIndex;
    if (keyIndex2 === -1) return;
    if (!url.startsWith(key, keyIndex2 + 1)) keyIndex2 = url.indexOf(`&${key}`, keyIndex2 + 1);
    while (keyIndex2 !== -1) {
      const trailingKeyCode = url.charCodeAt(keyIndex2 + key.length + 1);
      if (trailingKeyCode === 61 || trailingKeyCode === 38 || isNaN(trailingKeyCode)) {
        if (keyIndex2 > queryIndex && /(?:^|&)[^=&]*[%+]/.test(url.slice(queryIndex + 1, keyIndex2))) break;
        if (trailingKeyCode === 61) {
          const valueIndex = keyIndex2 + key.length + 2;
          const endIndex = url.indexOf("&", valueIndex);
          return _decodeURI(url.slice(valueIndex, endIndex === -1 ? void 0 : endIndex));
        }
        return "";
      }
      keyIndex2 = url.indexOf(`&${key}`, keyIndex2 + 1);
    }
    encoded = /[%+]/.test(url);
    if (!encoded) return;
  }
  const results = /* @__PURE__ */ Object.create(null);
  encoded ??= /[%+]/.test(url);
  let keyIndex = url.indexOf("?", 8);
  while (keyIndex !== -1) {
    const nextKeyIndex = url.indexOf("&", keyIndex + 1);
    let valueIndex = url.indexOf("=", keyIndex);
    if (valueIndex > nextKeyIndex && nextKeyIndex !== -1) valueIndex = -1;
    let name = url.slice(keyIndex + 1, valueIndex === -1 ? nextKeyIndex === -1 ? void 0 : nextKeyIndex : valueIndex);
    if (encoded) name = _decodeURI(name);
    keyIndex = nextKeyIndex;
    if (name === "") continue;
    let value;
    if (valueIndex === -1) value = "";
    else {
      value = url.slice(valueIndex + 1, nextKeyIndex === -1 ? void 0 : nextKeyIndex);
      if (encoded) value = _decodeURI(value);
    }
    if (multiple) {
      if (!(results[name] && Array.isArray(results[name]))) results[name] = [];
      results[name].push(value);
    } else results[name] ??= value;
  }
  return key ? results[key] : results;
};
var getQueryParam = _getQueryParam;
var getQueryParams = (url, key) => {
  return _getQueryParam(url, key, true);
};
var decodeURIComponent_ = decodeURIComponent;

// node_modules/.pnpm/hono@4.13.16/node_modules/hono/dist/request.js
var HonoRequest = class {
  /**
  * `.raw` can get the raw Request object.
  *
  * @see {@link https://hono.dev/docs/api/request#raw}
  *
  * @example
  * ```ts
  * // For Cloudflare Workers
  * app.post('/', async (c) => {
  *   const metadata = c.req.raw.cf?.hostMetadata?
  *   ...
  * })
  * ```
  */
  raw;
  #validatedData;
  #matchResult;
  routeIndex = 0;
  /**
  * `.path` can get the pathname of the request.
  *
  * @see {@link https://hono.dev/docs/api/request#path}
  *
  * @example
  * ```ts
  * app.get('/about/me', (c) => {
  *   const pathname = c.req.path // `/about/me`
  * })
  * ```
  */
  path;
  bodyCache = {};
  constructor(request, path = "/", matchResult = [[]]) {
    this.raw = request;
    this.path = path;
    this.#matchResult = matchResult;
  }
  param(key) {
    return key ? this.#getDecodedParam(key) : this.#getAllDecodedParams();
  }
  #getDecodedParam(key) {
    const paramKey = this.#matchResult[0][this.routeIndex]?.[1][key];
    const param = this.#getParamValue(paramKey);
    return param && tryDecodeURIComponent(param);
  }
  #getAllDecodedParams() {
    const decoded = {};
    const keys = Object.keys(this.#matchResult[0][this.routeIndex]?.[1] ?? {});
    for (const key of keys) {
      const value = this.#getParamValue(this.#matchResult[0][this.routeIndex][1][key]);
      if (value !== void 0) decoded[key] = tryDecodeURIComponent(value);
    }
    return decoded;
  }
  #getParamValue(paramKey) {
    return this.#matchResult[1] ? this.#matchResult[1][paramKey] : paramKey;
  }
  query(key) {
    return getQueryParam(this.url, key);
  }
  queries(key) {
    return getQueryParams(this.url, key);
  }
  header(name) {
    if (name) return this.raw.headers.get(name) ?? void 0;
    const headerData = /* @__PURE__ */ Object.create(null);
    this.raw.headers.forEach((value, key) => {
      headerData[key] = value;
    });
    return headerData;
  }
  async parseBody(options) {
    return parseBody(this, options);
  }
  #cachedBody = (key) => {
    const { bodyCache, raw: raw2 } = this;
    const cachedBody = bodyCache[key];
    if (cachedBody) return cachedBody;
    for (const anyCachedKey in bodyCache) return bodyCache[anyCachedKey].then((body) => {
      if (anyCachedKey === "json") body = JSON.stringify(body);
      const contentType = anyCachedKey === "formData" ? void 0 : raw2.headers.get("content-type");
      return new Response(body, { headers: contentType ? { "Content-Type": contentType } : void 0 })[key]();
    });
    return bodyCache[key] = raw2[key]();
  };
  /**
  * `.json()` can parse Request body of type `application/json`
  *
  * @see {@link https://hono.dev/docs/api/request#json}
  *
  * @example
  * ```ts
  * app.post('/entry', async (c) => {
  *   const body = await c.req.json()
  * })
  * ```
  */
  json() {
    return this.#cachedBody("text").then((text2) => JSON.parse(text2));
  }
  /**
  * `.text()` can parse Request body of type `text/plain`
  *
  * @see {@link https://hono.dev/docs/api/request#text}
  *
  * @example
  * ```ts
  * app.post('/entry', async (c) => {
  *   const body = await c.req.text()
  * })
  * ```
  */
  text() {
    return this.#cachedBody("text");
  }
  /**
  * `.arrayBuffer()` parse Request body as an `ArrayBuffer`
  *
  * @see {@link https://hono.dev/docs/api/request#arraybuffer}
  *
  * @example
  * ```ts
  * app.post('/entry', async (c) => {
  *   const body = await c.req.arrayBuffer()
  * })
  * ```
  */
  arrayBuffer() {
    return this.#cachedBody("arrayBuffer");
  }
  /**
  * `.bytes()` parses the request body as a `Uint8Array`.
  *
  * @see {@link https://hono.dev/docs/api/request#bytes}
  *
  * @example
  * ```ts
  * app.post('/entry', async (c) => {
  *   const body = await c.req.bytes()
  * })
  * ```
  */
  bytes() {
    return this.#cachedBody("arrayBuffer").then((buffer) => new Uint8Array(buffer));
  }
  /**
  * Parses the request body as a `Blob`.
  * @example
  * ```ts
  * app.post('/entry', async (c) => {
  *   const body = await c.req.blob();
  * });
  * ```
  * @see https://hono.dev/docs/api/request#blob
  */
  blob() {
    return this.#cachedBody("blob");
  }
  /**
  * Parses the request body as `FormData`.
  * @example
  * ```ts
  * app.post('/entry', async (c) => {
  *   const body = await c.req.formData();
  * });
  * ```
  * @see https://hono.dev/docs/api/request#formdata
  */
  formData() {
    return this.#cachedBody("formData");
  }
  /**
  * Adds validated data to the request.
  *
  * @param target - The target of the validation.
  * @param data - The validated data to add.
  */
  addValidatedData(target, data) {
    (this.#validatedData ??= {})[target] = data;
  }
  valid(target) {
    return this.#validatedData?.[target];
  }
  /**
  * `.url` can get the request url strings.
  *
  * @see {@link https://hono.dev/docs/api/request#url}
  *
  * @example
  * ```ts
  * app.get('/about/me', (c) => {
  *   const url = c.req.url // `http://localhost:8787/about/me`
  *   ...
  * })
  * ```
  */
  get url() {
    return this.raw.url;
  }
  /**
  * `.method` can get the method name of the request.
  *
  * @see {@link https://hono.dev/docs/api/request#method}
  *
  * @example
  * ```ts
  * app.get('/about/me', (c) => {
  *   const method = c.req.method // `GET`
  * })
  * ```
  */
  get method() {
    return this.raw.method;
  }
  get [GET_MATCH_RESULT]() {
    return this.#matchResult;
  }
  /**
  * `.matchedRoutes` can return a matched route in the handler
  *
  * @deprecated
  *
  * Use matchedRoutes helper defined in "hono/route" instead.
  *
  * @see {@link https://hono.dev/docs/api/request#matchedroutes}
  *
  * @example
  * ```ts
  * app.use('*', async function logger(c, next) {
  *   await next()
  *   c.req.matchedRoutes.forEach(({ handler, method, path }, i) => {
  *     const name = handler.name || (handler.length < 2 ? '[handler]' : '[middleware]')
  *     console.log(
  *       method,
  *       ' ',
  *       path,
  *       ' '.repeat(Math.max(10 - path.length, 0)),
  *       name,
  *       i === c.req.routeIndex ? '<- respond from here' : ''
  *     )
  *   })
  * })
  * ```
  */
  get matchedRoutes() {
    return this.#matchResult[0].map(([[, route]]) => route);
  }
  /**
  * `.routePath` can retrieve the path registered within the handler
  *
  * @deprecated
  *
  * Use routePath helper defined in "hono/route" instead.
  *
  * @see {@link https://hono.dev/docs/api/request#routepath}
  *
  * @example
  * ```ts
  * app.get('/posts/:id', (c) => {
  *   return c.json({ path: c.req.routePath })
  * })
  * ```
  */
  get routePath() {
    return this.#matchResult[0].map(([[, route]]) => route)[this.routeIndex].path;
  }
};

// node_modules/.pnpm/hono@4.13.16/node_modules/hono/dist/utils/html.js
var HtmlEscapedCallbackPhase = {
  Stringify: 1,
  BeforeStream: 2,
  Stream: 3
};
var raw = (value, callbacks) => {
  const escapedString = new String(value);
  escapedString.isEscaped = true;
  escapedString.callbacks = callbacks;
  return escapedString;
};
var resolveCallback = async (str, phase, preserveCallbacks, context, buffer) => {
  if (typeof str === "object" && !(str instanceof String)) {
    if (!(str instanceof Promise)) str = str.toString();
    if (str instanceof Promise) str = await str;
  }
  const callbacks = str.callbacks;
  if (!callbacks?.length) return Promise.resolve(str);
  if (buffer) buffer[0] += str;
  else buffer = [str];
  const resStr = Promise.all(callbacks.map((c) => c({
    phase,
    buffer,
    context
  }))).then((res) => Promise.all(res.filter(Boolean).map((str2) => resolveCallback(str2, phase, false, context, buffer))).then(() => buffer[0]));
  if (preserveCallbacks) return raw(await resStr, callbacks);
  else return resStr;
};

// node_modules/.pnpm/hono@4.13.16/node_modules/hono/dist/context.js
var TEXT_PLAIN = "text/plain; charset=UTF-8";
var setDefaultContentType = (contentType, headers) => {
  return {
    "Content-Type": contentType,
    ...headers
  };
};
var createResponseInstance = (body, init2) => new Response(body, init2);
var Context = class {
  #rawRequest;
  #req;
  /**
  * `.env` can get bindings (environment variables, secrets, KV namespaces, D1 database, R2 bucket etc.) in Cloudflare Workers.
  *
  * @see {@link https://hono.dev/docs/api/context#env}
  *
  * @example
  * ```ts
  * // Environment object for Cloudflare Workers
  * app.get('*', async c => {
  *   const counter = c.env.COUNTER
  * })
  * ```
  */
  env = {};
  #var;
  finalized = false;
  /**
  * `.error` can get the error object from the middleware if the Handler throws an error.
  *
  * @see {@link https://hono.dev/docs/api/context#error}
  *
  * @example
  * ```ts
  * app.use('*', async (c, next) => {
  *   await next()
  *   if (c.error) {
  *     // do something...
  *   }
  * })
  * ```
  */
  error;
  #status;
  #executionCtx;
  #res;
  #layout;
  #renderer;
  #notFoundHandler;
  #preparedHeaders;
  #matchResult;
  #path;
  /**
  * Creates an instance of the Context class.
  *
  * @param req - The Request object.
  * @param options - Optional configuration options for the context.
  */
  constructor(req, options) {
    this.#rawRequest = req;
    if (options) {
      this.#executionCtx = options.executionCtx;
      this.env = options.env;
      this.#notFoundHandler = options.notFoundHandler;
      this.#path = options.path;
      this.#matchResult = options.matchResult;
    }
  }
  /**
  * `.req` is the instance of {@link HonoRequest}.
  */
  get req() {
    this.#req ??= new HonoRequest(this.#rawRequest, this.#path, this.#matchResult);
    return this.#req;
  }
  /**
  * @see {@link https://hono.dev/docs/api/context#event}
  * The FetchEvent associated with the current request.
  *
  * @throws Will throw an error if the context does not have a FetchEvent.
  */
  get event() {
    if (this.#executionCtx && "respondWith" in this.#executionCtx) return this.#executionCtx;
    else throw Error("This context has no FetchEvent");
  }
  /**
  * @see {@link https://hono.dev/docs/api/context#executionctx}
  * The ExecutionContext associated with the current request.
  *
  * @throws Will throw an error if the context does not have an ExecutionContext.
  */
  get executionCtx() {
    if (this.#executionCtx) return this.#executionCtx;
    else throw Error("This context has no ExecutionContext");
  }
  /**
  * @see {@link https://hono.dev/docs/api/context#res}
  * The Response object for the current request.
  */
  get res() {
    return this.#res ||= createResponseInstance(null, { headers: this.#preparedHeaders ??= new Headers() });
  }
  /**
  * Sets the Response object for the current request.
  *
  * @param _res - The Response object to set.
  */
  set res(_res) {
    if (this.#res && _res) {
      _res = createResponseInstance(_res.body, _res);
      for (const [k, v] of this.#res.headers.entries()) {
        if (k === "content-type") continue;
        if (k === "set-cookie") {
          const cookies = this.#res.headers.getSetCookie();
          _res.headers.delete("set-cookie");
          for (const cookie of cookies) _res.headers.append("set-cookie", cookie);
        } else _res.headers.set(k, v);
      }
    }
    this.#res = _res;
    this.finalized = true;
  }
  /**
  * `.render()` can create a response within a layout.
  *
  * @see {@link https://hono.dev/docs/api/context#render-setrenderer}
  *
  * @example
  * ```ts
  * app.get('/', (c) => {
  *   return c.render('Hello!')
  * })
  * ```
  */
  render = (...args) => {
    this.#renderer ??= (content) => this.html(content);
    return this.#renderer(...args);
  };
  /**
  * Sets the layout for the response.
  *
  * @param layout - The layout to set.
  * @returns The layout function.
  */
  setLayout = (layout) => this.#layout = layout;
  /**
  * Gets the current layout for the response.
  *
  * @returns The current layout function.
  */
  getLayout = () => this.#layout;
  /**
  * `.setRenderer()` can set the layout in the custom middleware.
  *
  * @see {@link https://hono.dev/docs/api/context#render-setrenderer}
  *
  * @example
  * ```tsx
  * app.use('*', async (c, next) => {
  *   c.setRenderer((content) => {
  *     return c.html(
  *       <html>
  *         <body>
  *           <p>{content}</p>
  *         </body>
  *       </html>
  *     )
  *   })
  *   await next()
  * })
  * ```
  */
  setRenderer = (renderer) => {
    this.#renderer = renderer;
  };
  /**
  * `.header()` can set headers.
  *
  * @see {@link https://hono.dev/docs/api/context#header}
  *
  * @example
  * ```ts
  * app.get('/welcome', (c) => {
  *   // Set headers
  *   c.header('X-Message', 'Hello!')
  *   c.header('Content-Type', 'text/plain')
  *
  *   // Append multiple headers using the append option (e.g. Vary)
  *   c.header('Vary', 'Accept-Encoding', { append: true })
  *   c.header('Vary', 'User-Agent', { append: true })
  *
  *   return c.body('Thank you for coming')
  * })
  * ```
  */
  header = (name, value, options) => {
    if (this.finalized && !this.#res.bodyUsed) this.#res = createResponseInstance(this.#res.body, this.#res);
    const headers = this.#res ? this.#res.headers : this.#preparedHeaders ??= new Headers();
    if (value === void 0) headers.delete(name);
    else if (options?.append) headers.append(name, value);
    else headers.set(name, value);
  };
  status = (status) => {
    this.#status = status;
  };
  /**
  * `.set()` can set the value specified by the key.
  *
  * @see {@link https://hono.dev/docs/api/context#set-get}
  *
  * @example
  * ```ts
  * app.use('*', async (c, next) => {
  *   c.set('message', 'Hono is hot!!')
  *   await next()
  * })
  * ```
  */
  set = (key, value) => {
    this.#var ??= /* @__PURE__ */ new Map();
    this.#var.set(key, value);
  };
  /**
  * `.get()` can use the value specified by the key.
  *
  * @see {@link https://hono.dev/docs/api/context#set-get}
  *
  * @example
  * ```ts
  * app.get('/', (c) => {
  *   const message = c.get('message')
  *   return c.text(`The message is "${message}"`)
  * })
  * ```
  */
  get = (key) => {
    return this.#var ? this.#var.get(key) : void 0;
  };
  /**
  * `.var` can access the value of a variable.
  *
  * @see {@link https://hono.dev/docs/api/context#var}
  *
  * @example
  * ```ts
  * const result = c.var.client.oneMethod()
  * ```
  */
  get var() {
    if (!this.#var) return {};
    return Object.fromEntries(this.#var);
  }
  #newResponse(data, arg, headers) {
    let responseHeaders = this.#res ? new Headers(this.#res.headers) : this.#preparedHeaders;
    if (typeof arg === "object" && arg.headers) {
      responseHeaders ??= new Headers();
      for (const [key, value] of new Headers(arg.headers)) if (key === "set-cookie") responseHeaders.append(key, value);
      else responseHeaders.set(key, value);
    }
    if (headers) {
      if (!responseHeaders) {
        let count = 0;
        for (const k in headers) if (++count > 1 || typeof headers[k] !== "string") {
          responseHeaders = new Headers();
          break;
        }
      }
      if (responseHeaders) for (const k in headers) {
        const v = headers[k];
        if (typeof v === "string") responseHeaders.set(k, v);
        else {
          responseHeaders.delete(k);
          for (const v2 of v) responseHeaders.append(k, v2);
        }
      }
    }
    const status = typeof arg === "number" ? arg : arg?.status ?? this.#status;
    return createResponseInstance(data, {
      status,
      headers: responseHeaders ?? headers
    });
  }
  newResponse = (...args) => this.#newResponse(...args);
  /**
  * `.body()` can return the HTTP response.
  * You can set headers with `.header()` and set HTTP status code with `.status`.
  * This can also be set in `.text()`, `.json()` and so on.
  *
  * @see {@link https://hono.dev/docs/api/context#body}
  *
  * @example
  * ```ts
  * app.get('/welcome', (c) => {
  *   // Set headers
  *   c.header('X-Message', 'Hello!')
  *   c.header('Content-Type', 'text/plain')
  *   // Set HTTP status code
  *   c.status(201)
  *
  *   // Return the response body
  *   return c.body('Thank you for coming')
  * })
  * ```
  */
  body = (data, arg, headers) => this.#newResponse(data, arg, headers);
  /**
  * `.text()` can render text as `Content-Type:text/plain`.
  *
  * @see {@link https://hono.dev/docs/api/context#text}
  *
  * @example
  * ```ts
  * app.get('/say', (c) => {
  *   return c.text('Hello!')
  * })
  * ```
  */
  text = (text2, arg, headers) => {
    return !this.#preparedHeaders && !this.#status && !arg && !headers && !this.finalized ? new Response(text2) : this.#newResponse(text2, arg, setDefaultContentType(TEXT_PLAIN, headers));
  };
  /**
  * `.json()` can render JSON as `Content-Type:application/json`.
  *
  * @see {@link https://hono.dev/docs/api/context#json}
  *
  * @example
  * ```ts
  * app.get('/api', (c) => {
  *   return c.json({ message: 'Hello!' })
  * })
  * ```
  */
  json = (object, arg, headers) => {
    return this.#newResponse(JSON.stringify(object), arg, setDefaultContentType("application/json", headers));
  };
  html = (html, arg, headers) => {
    const res = (html2) => this.#newResponse(html2, arg, setDefaultContentType("text/html; charset=UTF-8", headers));
    return typeof html === "object" ? resolveCallback(html, HtmlEscapedCallbackPhase.Stringify, false, {}).then(res) : res(html);
  };
  /**
  * `.redirect()` can Redirect, default status code is 302.
  *
  * @see {@link https://hono.dev/docs/api/context#redirect}
  *
  * @example
  * ```ts
  * app.get('/redirect', (c) => {
  *   return c.redirect('/')
  * })
  * app.get('/redirect-permanently', (c) => {
  *   return c.redirect('/', 301)
  * })
  * ```
  */
  redirect = (location, status) => {
    const locationString = String(location);
    this.header("Location", !/[^\x00-\xFF]/.test(locationString) ? locationString : encodeURI(locationString));
    return this.newResponse(null, status ?? 302);
  };
  /**
  * `.notFound()` can return the Not Found Response.
  *
  * @see {@link https://hono.dev/docs/api/context#notfound}
  *
  * @example
  * ```ts
  * app.get('/notfound', (c) => {
  *   return c.notFound()
  * })
  * ```
  */
  notFound = () => {
    this.#notFoundHandler ??= () => createResponseInstance();
    return this.#notFoundHandler(this);
  };
};

// node_modules/.pnpm/hono@4.13.16/node_modules/hono/dist/compose.js
var compose = (middleware, onError, onNotFound) => {
  return (context, next) => {
    let index = -1;
    return dispatch(0);
    async function dispatch(i) {
      if (i <= index) throw new Error("next() called multiple times");
      index = i;
      let res;
      let isError = false;
      let handler2;
      if (middleware[i]) {
        handler2 = middleware[i][0][0];
        context.req.routeIndex = i;
      } else handler2 = i === middleware.length && next || void 0;
      if (handler2) try {
        res = await handler2(context, () => dispatch(i + 1));
      } catch (err) {
        if (err instanceof Error && onError) {
          context.error = err;
          res = await onError(err, context);
          isError = true;
        } else throw err;
      }
      else if (context.finalized === false && onNotFound) res = await onNotFound(context);
      if (res && (context.finalized === false || isError)) context.res = res;
      return context;
    }
  };
};

// node_modules/.pnpm/hono@4.13.16/node_modules/hono/dist/router.js
var METHODS = [
  "get",
  "post",
  "put",
  "delete",
  "options",
  "patch",
  "query"
];
var MESSAGE_MATCHER_IS_ALREADY_BUILT = "Can not add a route since the matcher is already built.";
var UnsupportedPathError = class extends Error {
};

// node_modules/.pnpm/hono@4.13.16/node_modules/hono/dist/utils/constants.js
var COMPOSED_HANDLER = "__COMPOSED_HANDLER";

// node_modules/.pnpm/hono@4.13.16/node_modules/hono/dist/utils/mount.js
var getPathPrefixLength = (c, pathPrefix, routePath) => {
  if (!/[:*]/.test(pathPrefix)) return pathPrefix.length;
  const path = c.req.path;
  const matchResult = c.req[GET_MATCH_RESULT];
  const paramNames = /* @__PURE__ */ new Set();
  let length = 0;
  for (const part of splitRoutingPath(pathPrefix)) {
    const pattern = getPattern(part);
    if (pattern && pattern !== "*") {
      const name = pattern[1];
      if (paramNames.has(name)) throw new Error(`mount(): Duplicate path parameter "${name}" in "${routePath}".`);
      paramNames.add(name);
    }
    if (pattern && pattern !== "*" && pattern[2] !== true) {
      const value = matchResult.length === 2 ? matchResult[1][matchResult[0][c.req.routeIndex][1][pattern[1]]] : matchResult[0][c.req.routeIndex][1][pattern[1]];
      length += value.length + 1;
    } else if (pattern || part.endsWith("*")) {
      const end = path.indexOf("/", length + 1);
      length = end === -1 ? path.length : end;
    } else length += part.length + 1;
  }
  return length;
};
var createMountedRequest = (c, pathPrefix, routePath) => {
  if (/[^/]\*$/.test(routePath)) throw new Error(`mount(): Wildcard must follow "/" in "${routePath}".`);
  const url = new URL(c.req.raw.url);
  url.pathname = stripPathPrefix(url.pathname, c.req.path, getPathPrefixLength(c, pathPrefix, routePath));
  return new Request(url, c.req.raw);
};

// node_modules/.pnpm/hono@4.13.16/node_modules/hono/dist/hono-base.js
var notFoundHandler = (c) => {
  return c.text("404 Not Found", 404);
};
var errorHandler = (err, c) => {
  if ("getResponse" in err) {
    const res = err.getResponse();
    return c.newResponse(res.body, res);
  }
  console.error(err);
  return c.text("Internal Server Error", 500);
};
var Hono = class Hono2 {
  get;
  post;
  put;
  delete;
  options;
  patch;
  query;
  all;
  on;
  use;
  router;
  getPath;
  _basePath = "/";
  #path = "/";
  routes = [];
  constructor(options = {}) {
    [...METHODS, "all"].forEach((method) => {
      this[method] = (args1, ...args) => {
        const methodName = method.toUpperCase();
        if (typeof args1 === "string") this.#path = args1;
        else this.#addRoute(methodName, this.#path, args1);
        args.forEach((handler2) => {
          this.#addRoute(methodName, this.#path, handler2);
        });
        return this;
      };
    });
    this.on = (method, path, ...handlers) => {
      for (const p of [path].flat()) {
        this.#path = p;
        for (const m of [method].flat()) {
          const methodName = m.toUpperCase();
          for (const handler2 of handlers) this.#addRoute(methodName, this.#path, handler2);
        }
      }
      return this;
    };
    this.use = (arg1, ...handlers) => {
      if (typeof arg1 === "string") this.#path = arg1;
      else {
        this.#path = "*";
        handlers.unshift(arg1);
      }
      handlers.forEach((handler2) => {
        this.#addRoute("ALL", this.#path, handler2);
      });
      return this;
    };
    const { strict, ...optionsWithoutStrict } = options;
    Object.assign(this, optionsWithoutStrict);
    this.getPath = strict ?? true ? options.getPath ?? getPath : getPathNoStrict;
  }
  #clone() {
    const clone = new Hono2({
      router: this.router,
      getPath: this.getPath
    });
    clone.errorHandler = this.errorHandler;
    clone.#notFoundHandler = this.#notFoundHandler;
    clone.routes = this.routes;
    return clone;
  }
  #notFoundHandler = notFoundHandler;
  errorHandler = errorHandler;
  /**
  * `.route()` allows grouping other Hono instance in routes.
  *
  * @see {@link https://hono.dev/docs/api/routing#grouping}
  *
  * @param {string} path - base Path
  * @param {Hono} app - other Hono instance
  * @returns {Hono} routed Hono instance
  *
  * @example
  * ```ts
  * const app = new Hono()
  * const app2 = new Hono()
  *
  * app2.get("/user", (c) => c.text("user"))
  * app.route("/api", app2) // GET /api/user
  * ```
  */
  route(path, app2) {
    const subApp = this.basePath(path);
    app2.routes.map((r) => {
      let handler2;
      if (app2.errorHandler === errorHandler) handler2 = r.handler;
      else {
        handler2 = async (c, next) => (await compose([], app2.errorHandler)(c, () => r.handler(c, next))).res;
        handler2[COMPOSED_HANDLER] = r.handler;
      }
      subApp.#addRoute(r.method, r.path, handler2, r.basePath);
    });
    return this;
  }
  /**
  * `.basePath()` allows base paths to be specified.
  *
  * @see {@link https://hono.dev/docs/api/routing#base-path}
  *
  * @param {string} path - base Path
  * @returns {Hono} changed Hono instance
  *
  * @example
  * ```ts
  * const api = new Hono().basePath('/api')
  * ```
  */
  basePath(path) {
    const subApp = this.#clone();
    subApp._basePath = mergePath(this._basePath, path);
    return subApp;
  }
  /**
  * `.onError()` handles an error and returns a customized Response.
  *
  * @see {@link https://hono.dev/docs/api/hono#error-handling}
  *
  * @param {ErrorHandler} handler - request Handler for error
  * @returns {Hono} changed Hono instance
  *
  * @example
  * ```ts
  * app.onError((err, c) => {
  *   console.error(`${err}`)
  *   return c.text('Custom Error Message', 500)
  * })
  * ```
  */
  onError = (handler2) => {
    this.errorHandler = handler2;
    return this;
  };
  /**
  * `.notFound()` allows you to customize a Not Found Response.
  *
  * @see {@link https://hono.dev/docs/api/hono#not-found}
  *
  * @param {NotFoundHandler} handler - request handler for not-found
  * @returns {Hono} changed Hono instance
  *
  * @example
  * ```ts
  * app.notFound((c) => {
  *   return c.text('Custom 404 Message', 404)
  * })
  * ```
  */
  notFound = (handler2) => {
    this.#notFoundHandler = handler2;
    return this;
  };
  /**
  * `.mount()` allows you to mount applications built with other frameworks into your Hono application.
  *
  * @deprecated Use `mount()` from `hono/mount` instead. `.mount()` will be removed in v5.
  *
  * @see {@link https://hono.dev/docs/api/hono#mount}
  *
  * @param {string} path - base Path
  * @param {Function} applicationHandler - other Request Handler
  * @param {MountOptions} [options] - options of `.mount()`
  * @returns {Hono} mounted Hono instance
  *
  * @example
  * ```ts
  * import { Router as IttyRouter } from 'itty-router'
  * import { Hono } from 'hono'
  * // Create itty-router application
  * const ittyRouter = IttyRouter()
  * // GET /itty-router/hello
  * ittyRouter.get('/hello', () => new Response('Hello from itty-router'))
  *
  * const app = new Hono()
  * app.mount('/itty-router', ittyRouter.handle)
  * ```
  *
  * @example
  * ```ts
  * const app = new Hono()
  * // Send the request to another application without modification.
  * app.mount('/app', anotherApp, {
  *   replaceRequest: (req) => req,
  * })
  * ```
  */
  mount(path, applicationHandler, options) {
    let replaceRequest;
    let optionHandler;
    if (options) {
      if (typeof options === "function") optionHandler = options;
      else {
        optionHandler = options.optionHandler;
        if (options.replaceRequest === false) replaceRequest = (request) => request;
        else replaceRequest = options.replaceRequest;
      }
    }
    const getOptions = optionHandler ? (c) => {
      const options2 = optionHandler(c);
      return Array.isArray(options2) ? options2 : [options2];
    } : (c) => {
      let executionContext = void 0;
      try {
        executionContext = c.executionCtx;
      } catch {
      }
      return [c.env, executionContext];
    };
    const mergedPath = mergePath(this._basePath, path);
    const defaultReplaceRequest = (c) => createMountedRequest(c, mergedPath.replace(/\/$/, ""), mergePath(mergedPath, "*"));
    const handler2 = async (c, next) => {
      const res = await applicationHandler(replaceRequest ? replaceRequest(c.req.raw) : defaultReplaceRequest(c), ...getOptions(c));
      if (res) return res;
      await next();
    };
    this.#addRoute("ALL", mergePath(path, "*"), handler2);
    return this;
  }
  #addRoute(method, path, handler2, baseRoutePath) {
    path = mergePath(this._basePath, path);
    const r = {
      basePath: baseRoutePath !== void 0 ? mergePath(this._basePath, baseRoutePath) : this._basePath,
      path,
      method,
      handler: handler2
    };
    this.router.add(method, path, [handler2, r]);
    this.routes.push(r);
  }
  #handleError(err, c) {
    if (err instanceof Error) return this.errorHandler(err, c);
    throw err;
  }
  #dispatch(request, executionCtx, env, method) {
    if (method === "HEAD") return (async () => new Response(null, await this.#dispatch(request, executionCtx, env, "GET")))();
    const path = this.getPath(request, { env });
    const matchResult = this.router.match(method, path);
    const c = new Context(request, {
      path,
      matchResult,
      env,
      executionCtx,
      notFoundHandler: this.#notFoundHandler
    });
    if (matchResult[0].length === 1) {
      let res;
      try {
        res = matchResult[0][0][0][0](c, async () => {
          c.res = await this.#notFoundHandler(c);
        });
      } catch (err) {
        return this.#handleError(err, c);
      }
      return res instanceof Promise ? res.then((resolved) => resolved || (c.finalized ? c.res : this.#notFoundHandler(c))).catch((err) => this.#handleError(err, c)) : res ?? this.#notFoundHandler(c);
    }
    const composed = compose(matchResult[0], this.errorHandler, this.#notFoundHandler);
    return (async () => {
      try {
        const context = await composed(c);
        if (!context.finalized) throw new Error("Context is not finalized. Did you forget to return a Response object or `await next()`?");
        return context.res;
      } catch (err) {
        return this.#handleError(err, c);
      }
    })();
  }
  /**
  * `.fetch()` will be entry point of your app.
  *
  * @see {@link https://hono.dev/docs/api/hono#fetch}
  *
  * @param {Request} request - request Object of request
  * @param {Env} env - env Object
  * @param {ExecutionContext} executionCtx - context of execution
  * @returns {Response | Promise<Response>} response of request
  *
  */
  fetch = (request, ...rest) => {
    return this.#dispatch(request, rest[1], rest[0], request.method);
  };
  /**
  * `.request()` is a useful method for testing.
  * You can pass a URL or pathname to send a GET request.
  * app will return a Response object.
  * ```ts
  * test('GET /hello is ok', async () => {
  *   const res = await app.request('/hello')
  *   expect(res.status).toBe(200)
  * })
  * ```
  * @see https://hono.dev/docs/api/hono#request
  */
  request = (input, requestInit, Env, executionCtx) => {
    if (input instanceof Request) return this.fetch(requestInit ? new Request(input, requestInit) : input, Env, executionCtx);
    input = input.toString();
    return this.fetch(new Request(/^https?:\/\//.test(input) ? input : `http://localhost${mergePath("/", input)}`, requestInit), Env, executionCtx);
  };
  /**
  * `.fire()` automatically adds a global fetch event listener.
  * This can be useful for environments that adhere to the Service Worker API, such as non-ES module Cloudflare Workers.
  * @deprecated
  * Use `fire` from `hono/service-worker` instead.
  * ```ts
  * import { Hono } from 'hono'
  * import { fire } from 'hono/service-worker'
  *
  * const app = new Hono()
  * // ...
  * fire(app)
  * ```
  * @see https://hono.dev/docs/api/hono#fire
  * @see https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API
  * @see https://developers.cloudflare.com/workers/reference/migrate-to-module-workers/
  */
  fire = () => {
    addEventListener("fetch", (event) => {
      event.respondWith(this.#dispatch(event.request, event, void 0, event.request.method));
    });
  };
};

// node_modules/.pnpm/hono@4.13.16/node_modules/hono/dist/router/utils.js
var createNullObject = () => /* @__PURE__ */ Object.create(null);

// node_modules/.pnpm/hono@4.13.16/node_modules/hono/dist/router/reg-exp-router/matcher.js
var emptyParam = [];
function match(method, path) {
  const matchers = this.buildAllMatchers();
  const match2 = ((method2, path2) => {
    const matcher = matchers[method2] || matchers["ALL"];
    const staticMatch = matcher[2][path2];
    if (staticMatch) return staticMatch;
    const match3 = path2.match(matcher[0]);
    if (!match3) return [[], emptyParam];
    const index = match3.indexOf("", 1);
    return [matcher[1][index], match3];
  });
  this.match = match2;
  return match2(method, path);
}

// node_modules/.pnpm/hono@4.13.16/node_modules/hono/dist/router/reg-exp-router/node.js
var LABEL_REG_EXP_STR = "[^/]+";
var ONLY_WILDCARD_REG_EXP_STR = "[^]*";
var TAIL_WILDCARD_REG_EXP_STR = "(?:|/[^]*)";
var PATH_ERROR = /* @__PURE__ */ Symbol();
var regExpMetaChars = /* @__PURE__ */ new Set(".\\+*[^]$()");
function compareKey(a, b) {
  if (a.length === 1) return b.length === 1 ? a < b ? -1 : 1 : -1;
  if (b.length === 1) return 1;
  if (a === "[^]*" || a === "(?:|/[^]*)") return b === "[^]*" ? -1 : 1;
  else if (b === "[^]*" || b === "(?:|/[^]*)") return -1;
  if (a === "[^/]+") return 1;
  else if (b === "[^/]+") return -1;
  return a.length === b.length ? a < b ? -1 : 1 : b.length - a.length;
}
var Node = class Node2 {
  #index;
  #varIndex;
  #children = createNullObject();
  insert(tokens, index, paramMap, context, keys) {
    let node = this;
    for (let i = 0, len = tokens.length; i < len; i++) {
      const token = tokens[i];
      const pattern = token.length === 1 ? token === "*" ? i === len - 1 ? [
        "",
        "",
        ONLY_WILDCARD_REG_EXP_STR
      ] : [
        "",
        "",
        LABEL_REG_EXP_STR
      ] : null : token === "/*" ? [
        "",
        "",
        TAIL_WILDCARD_REG_EXP_STR
      ] : token.match(/^\:([^\{\}]+)(?:\{(.+)\})?$/);
      let nextNode;
      if (pattern) {
        const name = pattern[1];
        let regexpStr = pattern[2] || "[^/]+";
        if (name && pattern[2]) {
          if (new RegExp(regexpStr).test("")) throw PATH_ERROR;
          regexpStr = regexpStr.replace(/^\((?!\?:)(?=[^)]+\)$)/, "(?:");
          if (/\((?!\?:)/.test(regexpStr)) throw PATH_ERROR;
          if (regexpStr.length === 1 && regExpMetaChars.has(regexpStr)) throw PATH_ERROR;
        }
        keys.push(regexpStr);
        nextNode = node.#children[regexpStr];
        if (!nextNode) {
          if (regexpStr !== "[^]*" && regexpStr !== "(?:|/[^]*)") {
            for (const k in node.#children) if ((regexpStr.length > 1 || k.length > 1) && k !== "[^]*" && k !== "(?:|/[^]*)") throw PATH_ERROR;
          }
          nextNode = node.#children[regexpStr] = new Node2();
        }
        if (name !== "") {
          nextNode.#varIndex ??= context.varIndex++;
          paramMap.push([name, nextNode.#varIndex]);
        }
      } else {
        keys.push(token);
        nextNode = node.#children[token];
        if (!nextNode) {
          for (const k in node.#children) if (k.length > 1 && k !== "[^]*" && k !== "(?:|/[^]*)") throw PATH_ERROR;
          nextNode = node.#children[token] = new Node2();
        }
      }
      node = nextNode;
    }
    if (node.#index !== void 0) throw PATH_ERROR;
    node.#index = index;
  }
  buildRegExpStr() {
    const strList = Object.keys(this.#children).sort(compareKey).map((k) => {
      const c = this.#children[k];
      const childStr = c.buildRegExpStr();
      return childStr === "" ? "" : (typeof c.#varIndex === "number" ? `(${k})@${c.#varIndex}` : regExpMetaChars.has(k) ? `\\${k}` : k) + childStr;
    }).filter(Boolean);
    if (typeof this.#index === "number" && this.#index !== -1) strList.unshift(`#${this.#index}`);
    if (strList.length === 0) return "";
    if (strList.length === 1) return strList[0];
    return "(?:" + strList.join("|") + ")";
  }
};

// node_modules/.pnpm/hono@4.13.16/node_modules/hono/dist/router/reg-exp-router/trie.js
var Trie = class {
  #context = { varIndex: 0 };
  #root = new Node();
  #index = 0;
  paths = createNullObject();
  insert(path, isStatic) {
    const keys = [];
    if (isStatic) {
      this.#root.insert(path.split(""), -1, [], this.#context, keys);
      this.paths[path] = [
        -1,
        [],
        keys
      ];
      return;
    }
    const paramAssoc = [];
    const groups = [];
    let markedPath = path;
    for (let i = 0; ; ) {
      let replaced = false;
      markedPath = markedPath.replace(/\{(?:\{[\d,]+\}|[^}])+\}/g, (m) => {
        const mark = `@\\${i}`;
        groups[i] = [mark, m];
        i++;
        replaced = true;
        return mark;
      });
      if (!replaced) break;
    }
    const tokens = markedPath.match(/(?::[^\/]+)|(?:\/\*$)|./gs) || [];
    for (let i = groups.length - 1; i >= 0; i--) {
      const [mark] = groups[i];
      for (let j = tokens.length - 1; j >= 0; j--) if (tokens[j].indexOf(mark) !== -1) {
        tokens[j] = tokens[j].replace(mark, groups[i][1]);
        break;
      }
    }
    this.#root.insert(tokens, this.#index, paramAssoc, this.#context, keys);
    this.paths[path] = [
      this.#index++,
      paramAssoc,
      keys
    ];
  }
  buildRegExp() {
    let regexp = this.#root.buildRegExpStr();
    if (regexp === "") return [
      /^$/,
      [],
      []
    ];
    let captureIndex = 0;
    const indexReplacementMap = [];
    const paramReplacementMap = [];
    regexp = regexp.replace(/#(\d+)|@(\d+)|\.\*\$/g, (_, handlerIndex, paramIndex) => {
      if (handlerIndex !== void 0) {
        indexReplacementMap[++captureIndex] = Number(handlerIndex);
        return "$()";
      }
      if (paramIndex !== void 0) {
        paramReplacementMap[Number(paramIndex)] = ++captureIndex;
        return "";
      }
      return "";
    });
    return [
      new RegExp(`^${regexp}`),
      indexReplacementMap,
      paramReplacementMap
    ];
  }
};

// node_modules/.pnpm/hono@4.13.16/node_modules/hono/dist/router/reg-exp-router/router.js
function endsWithWildcard(keys) {
  const tail = keys[keys.length - 1];
  return tail === "[^]*" || tail === "(?:|/[^]*)";
}
function covers(wildcard, target) {
  const last = wildcard.length - 1;
  for (let i = 0; i < last; i++) if (wildcard[i] !== target[i]) return false;
  return wildcard[last] === "[^]*" || target.length === last || target[last] === "/";
}
var RegExpRouter = class {
  name = "RegExpRouter";
  #handlers;
  #tries;
  constructor() {
    this.#handlers = { ["ALL"]: [] };
    this.#tries = { ["ALL"]: new Trie() };
  }
  #insertPath(method, path) {
    try {
      this.#tries[method].insert(path, !/\*|\/:/.test(path));
    } catch (e) {
      throw e === PATH_ERROR ? new UnsupportedPathError(path) : e;
    }
  }
  add(method, path, handler2) {
    const handlers = this.#handlers;
    if (!handlers) throw new Error(MESSAGE_MATCHER_IS_ALREADY_BUILT);
    const tries = this.#tries;
    if (!handlers[method]) {
      tries[method] = new Trie();
      handlers[method] = [...handlers["ALL"]];
      for (const p in tries["ALL"].paths) this.#insertPath(method, p);
    }
    if (path === "/*") path = "*";
    const methods = method === "ALL" ? Object.keys(handlers) : [method];
    const paths = checkOptionalParameter(path) || [path];
    for (const path2 of paths) for (const m of methods) {
      if (!tries[m].paths[path2]) this.#insertPath(m, path2);
      handlers[m].push([handler2, path2]);
    }
  }
  match = match;
  buildAllMatchers() {
    const matchers = createNullObject();
    for (const method of Object.keys(this.#handlers)) matchers[method] = this.#buildMatcher(method);
    this.#handlers = this.#tries = void 0;
    return matchers;
  }
  #buildMatcher(method) {
    const handlers = this.#handlers[method];
    const trie = this.#tries[method];
    const staticMap = createNullObject();
    const handlerData = [];
    const [regexp, indexReplacementMap, paramReplacementMap] = trie.buildRegExp();
    const own = createNullObject();
    const entries = handlers.map(([h, p], i) => {
      (own[p] ??= []).push(i);
      return [h, trie.paths[p][1].reduceRight((map, [key, varIndex]) => {
        map[key] = paramReplacementMap[varIndex];
        return map;
      }, createNullObject())];
    });
    const wildcards = Object.keys(own).filter((p) => endsWithWildcard(trie.paths[p][2]));
    for (const path in trie.paths) {
      const [index, , keys] = trie.paths[path];
      const indexes = [...own[path]];
      for (const p of wildcards) if (p !== path && covers(trie.paths[p][2], keys)) indexes.push(...own[p]);
      const data = indexes.sort((a, b) => a - b).map((i) => entries[i]);
      if (index === -1) {
        const last = Math.max(-1, ...data.flatMap(([, map]) => Object.values(map)));
        staticMap[path] = [data, last === -1 ? emptyParam : path.match(regexp).slice(0, last + 1)];
      } else handlerData[index] = data;
    }
    return [
      regexp,
      indexReplacementMap.map((i) => handlerData[i]),
      staticMap
    ];
  }
};

// node_modules/.pnpm/hono@4.13.16/node_modules/hono/dist/router/smart-router/router.js
var SmartRouter = class {
  name = "SmartRouter";
  #routers = [];
  #routes = [];
  constructor(init2) {
    this.#routers = init2.routers;
  }
  add(method, path, handler2) {
    if (!this.#routes) throw new Error(MESSAGE_MATCHER_IS_ALREADY_BUILT);
    this.#routes.push([
      method,
      path,
      handler2
    ]);
  }
  match(method, path) {
    if (!this.#routes) throw new Error("Fatal error");
    const routers = this.#routers;
    const routes = this.#routes;
    const len = routers.length;
    let i = 0;
    let res;
    for (; i < len; i++) {
      const router = routers[i];
      try {
        for (let i2 = 0, len2 = routes.length; i2 < len2; i2++) router.add(...routes[i2]);
        res = router.match(method, path);
      } catch (e) {
        if (e instanceof UnsupportedPathError) continue;
        throw e;
      }
      this.match = router.match.bind(router);
      this.#routers = [router];
      this.#routes = void 0;
      break;
    }
    if (i === len) throw new Error("Fatal error");
    this.name = `SmartRouter + ${this.activeRouter.name}`;
    return res;
  }
  get activeRouter() {
    if (this.#routes || this.#routers.length !== 1) throw new Error("No active router has been determined yet.");
    return this.#routers[0];
  }
};

// node_modules/.pnpm/hono@4.13.16/node_modules/hono/dist/router/trie-router/node.js
var emptyParams = createNullObject();
var order = 0;
var Node3 = class Node4 {
  #methods = [];
  #children = createNullObject();
  #patterns = [];
  #pattern;
  #params = emptyParams;
  insert(method, path, handler2) {
    let curNode = this;
    const parts = splitRoutingPath(path);
    const possibleKeys = /* @__PURE__ */ new Set();
    let i = 0;
    for (const p of parts) {
      const nextP = parts[++i];
      const pattern = getPattern(p, nextP) || (nextP === void 0 && p && p.indexOf("*") === p.length - 1 ? p : null);
      const isParam = Array.isArray(pattern);
      const key = isParam ? pattern[0] : pattern || p;
      const child = curNode.#children[key] ||= new Node4();
      if (pattern && !child.#pattern) {
        child.#pattern = pattern;
        curNode.#patterns.push(child);
      }
      curNode = child;
      if (isParam) possibleKeys.add(pattern[1]);
    }
    curNode.#methods.push({ [method]: {
      handler: handler2,
      possibleKeys: [...possibleKeys],
      score: ++order
    } });
  }
  #pushHandlerSets(handlerSets, node, method, nodeParams, params) {
    for (let i = 0, len = node.#methods.length; i < len; i++) {
      const m = node.#methods[i];
      const handlerSet = m[method] || m["ALL"];
      if (handlerSet) {
        handlerSet.params = createNullObject();
        handlerSets.push(handlerSet);
        for (let i2 = 0, len2 = handlerSet.possibleKeys.length; i2 < len2; i2++) {
          const key = handlerSet.possibleKeys[i2];
          handlerSet.params[key] = params?.[key] && !i2 ? params[key] : nodeParams[key] ?? params?.[key];
        }
      }
    }
  }
  search(method, path) {
    const handlerSets = [];
    this.#params = emptyParams;
    let curNodes = [this];
    const parts = splitPath(path);
    const curNodesQueue = [];
    const len = parts.length;
    let partOffsets = null;
    for (let i = 0; i < len; i++) {
      const part = parts[i];
      const isLast = i === len - 1;
      const tempNodes = [];
      for (let j = 0, len2 = curNodes.length; j < len2; j++) {
        const node = curNodes[j];
        const nextNode = node.#children[part];
        if (nextNode) {
          nextNode.#params = node.#params;
          if (isLast) {
            if (nextNode.#children["*"]) this.#pushHandlerSets(handlerSets, nextNode.#children["*"], method, node.#params);
            this.#pushHandlerSets(handlerSets, nextNode, method, node.#params);
          } else tempNodes.push(nextNode);
        }
        for (const child of node.#patterns) {
          const pattern = child.#pattern;
          const params = node.#params === emptyParams ? {} : { ...node.#params };
          if (typeof pattern === "string") {
            if (pattern === "*" || part.startsWith(pattern.slice(0, -1))) {
              this.#pushHandlerSets(handlerSets, child, method, node.#params);
              if (pattern === "*") {
                child.#params = params;
                tempNodes.push(child);
              }
            }
            continue;
          }
          const [, name, matcher] = pattern;
          if (!part && matcher === true) continue;
          if (matcher !== true) {
            if (!partOffsets) {
              partOffsets = [];
              let offset = path[0] === "/" ? 1 : 0;
              for (let p = 0; p < len; p++) {
                partOffsets[p] = offset;
                offset += parts[p].length + 1;
              }
            }
            const restPathString = path.slice(partOffsets[i]);
            const m = matcher.exec(restPathString);
            if (m) {
              if (!Object.hasOwn(params, name)) params[name] = m[0];
              this.#pushHandlerSets(handlerSets, child, method, node.#params, params);
              if (m[0].length === restPathString.length && child.#children["*"]) this.#pushHandlerSets(handlerSets, child.#children["*"], method, node.#params, params);
              for (const _ in child.#children) {
                child.#params = params;
                const componentCount = m[0].match(/\//g)?.length ?? 0;
                (curNodesQueue[componentCount] ||= []).push(child);
                break;
              }
              continue;
            }
          }
          if (matcher === true || matcher.test(part)) {
            if (!Object.hasOwn(params, name)) params[name] = part;
            if (isLast) {
              this.#pushHandlerSets(handlerSets, child, method, params, node.#params);
              if (child.#children["*"]) this.#pushHandlerSets(handlerSets, child.#children["*"], method, params, node.#params);
            } else {
              child.#params = params;
              tempNodes.push(child);
            }
          }
        }
      }
      const shifted = curNodesQueue.shift();
      curNodes = shifted ? tempNodes.concat(shifted) : tempNodes;
    }
    if (handlerSets[1]) handlerSets.sort((a, b) => {
      return a.score - b.score;
    });
    return [handlerSets.map(({ handler: handler2, params }) => [handler2, params])];
  }
};

// node_modules/.pnpm/hono@4.13.16/node_modules/hono/dist/router/trie-router/router.js
var TrieRouter = class {
  name = "TrieRouter";
  #node = new Node3();
  add(method, path, handler2) {
    for (const result of checkOptionalParameter(path) || [path]) this.#node.insert(method, result, handler2);
  }
  match(method, path) {
    return this.#node.search(method, path);
  }
};

// node_modules/.pnpm/hono@4.13.16/node_modules/hono/dist/hono.js
var Hono3 = class extends Hono {
  /**
  * Creates an instance of the Hono class.
  *
  * @param options - Optional configuration options for the Hono instance.
  */
  constructor(options = {}) {
    super(options);
    this.router = options.router ?? new SmartRouter({ routers: [new RegExpRouter(), new TrieRouter()] });
  }
};

// src/lib/id.ts
function createId(prefix = "id") {
  const raw2 = typeof crypto !== "undefined" && typeof crypto.randomUUID === "function" ? crypto.randomUUID() : `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 12)}`;
  return `${prefix}_${raw2.replace(/-/g, "").slice(0, 12)}`;
}

// server/api/password.ts
import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
function hashPassword(password) {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}
function verifyPassword(password, stored) {
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;
  const expected = Buffer.from(hash, "hex");
  const candidate = scryptSync(password, salt, 64);
  return candidate.length === expected.length && timingSafeEqual(candidate, expected);
}

// server/api/auth.ts
import { randomBytes as randomBytes2 } from "node:crypto";

// node_modules/.pnpm/hono@4.13.16/node_modules/hono/dist/utils/cookie.js
var validCookieNameRegEx = /^[\w!#$%&'*.^`|~+-]+$/;
var relaxedCookieNameRegEx = /^[!#-:<>-[\]-~]+$/;
var validCookieValueRegEx = /^[ !#-:<-[\]-~]*$/;
var trimCookieWhitespace = (value) => {
  let start = 0;
  let end = value.length;
  while (start < end) {
    const charCode = value.charCodeAt(start);
    if (charCode !== 32 && charCode !== 9) break;
    start++;
  }
  while (end > start) {
    const charCode = value.charCodeAt(end - 1);
    if (charCode !== 32 && charCode !== 9) break;
    end--;
  }
  return start === 0 && end === value.length ? value : value.slice(start, end);
};
var parse = (cookie, name) => {
  if (name && cookie.indexOf(name) === -1) return {};
  const pairs = cookie.split(";");
  const parsedCookie = /* @__PURE__ */ Object.create(null);
  for (const pairStr of pairs) {
    const valueStartPos = pairStr.indexOf("=");
    if (valueStartPos === -1) continue;
    const cookieName = trimCookieWhitespace(pairStr.substring(0, valueStartPos));
    if (name && name !== cookieName || !relaxedCookieNameRegEx.test(cookieName) || cookieName in parsedCookie) continue;
    let cookieValue = trimCookieWhitespace(pairStr.substring(valueStartPos + 1));
    if (cookieValue.startsWith('"') && cookieValue.endsWith('"')) cookieValue = cookieValue.slice(1, -1);
    if (validCookieValueRegEx.test(cookieValue)) {
      parsedCookie[cookieName] = tryDecodeURIComponent(cookieValue);
      if (name) break;
    }
  }
  return parsedCookie;
};
var _serialize = (name, value, opt = {}) => {
  if (!validCookieNameRegEx.test(name)) throw new Error("Invalid cookie name");
  let cookie = `${name}=${value}`;
  if (name.startsWith("__Secure-") && !opt.secure) throw new Error("__Secure- Cookie must have Secure attributes");
  if (name.startsWith("__Host-")) {
    if (!opt.secure) throw new Error("__Host- Cookie must have Secure attributes");
    if (opt.path !== "/") throw new Error('__Host- Cookie must have Path attributes with "/"');
    if (opt.domain) throw new Error("__Host- Cookie must not have Domain attributes");
  }
  for (const key of [
    "domain",
    "path",
    "sameSite",
    "priority"
  ]) if (opt[key] && /[;\r\n]/.test(opt[key])) throw new Error(`${key} must not contain ";", "\\r", or "\\n"`);
  if (opt && typeof opt.maxAge === "number" && opt.maxAge >= 0) {
    if (opt.maxAge > 3456e4) throw new Error("Cookies Max-Age SHOULD NOT be greater than 400 days (34560000 seconds) in duration.");
    cookie += `; Max-Age=${opt.maxAge | 0}`;
  }
  if (opt.domain && opt.prefix !== "host") cookie += `; Domain=${opt.domain}`;
  if (opt.path) cookie += `; Path=${opt.path}`;
  if (opt.expires) {
    if (opt.expires.getTime() - Date.now() > 3456e7) throw new Error("Cookies Expires SHOULD NOT be greater than 400 days (34560000 seconds) in the future.");
    cookie += `; Expires=${opt.expires.toUTCString()}`;
  }
  if (opt.httpOnly) cookie += "; HttpOnly";
  if (opt.secure) cookie += "; Secure";
  if (opt.sameSite) cookie += `; SameSite=${opt.sameSite.charAt(0).toUpperCase() + opt.sameSite.slice(1)}`;
  if (opt.priority) cookie += `; Priority=${opt.priority.charAt(0).toUpperCase() + opt.priority.slice(1)}`;
  if (opt.partitioned) {
    if (!opt.secure) throw new Error("Partitioned Cookie must have Secure attributes");
    cookie += "; Partitioned";
  }
  return cookie;
};
var serialize = (name, value, opt) => {
  value = encodeURIComponent(value);
  return _serialize(name, value, opt);
};

// node_modules/.pnpm/hono@4.13.16/node_modules/hono/dist/helper/cookie/index.js
var getCookie = (c, key, prefix) => {
  const cookie = c.req.raw.headers.get("Cookie");
  if (typeof key === "string") {
    if (!cookie) return;
    let finalKey = key;
    if (prefix === "secure") finalKey = "__Secure-" + key;
    else if (prefix === "host") finalKey = "__Host-" + key;
    return parse(cookie, finalKey)[finalKey];
  }
  if (!cookie) return {};
  return parse(cookie);
};
var generateCookie = (name, value, opt) => {
  let cookie;
  if (opt?.prefix === "secure") cookie = serialize("__Secure-" + name, value, {
    path: "/",
    ...opt,
    secure: true
  });
  else if (opt?.prefix === "host") cookie = serialize("__Host-" + name, value, {
    ...opt,
    path: "/",
    secure: true,
    domain: void 0
  });
  else cookie = serialize(name, value, {
    path: "/",
    ...opt
  });
  return cookie;
};
var setCookie = (c, name, value, opt) => {
  const cookie = generateCookie(name, value, opt);
  c.header("Set-Cookie", cookie, { append: true });
};
var deleteCookie = (c, name, opt) => {
  const deletedCookie = getCookie(c, name, opt?.prefix);
  setCookie(c, name, "", {
    ...opt,
    maxAge: 0
  });
  return deletedCookie;
};

// node_modules/.pnpm/@tursodatabase+serverless@1.4.1/node_modules/@tursodatabase/serverless/dist/compat/index.js
var DatabaseError = class _DatabaseError extends Error {
  constructor(message, code, rawCode, cause) {
    super(message);
    this.name = "DatabaseError";
    this.code = code;
    this.rawCode = rawCode;
    this.cause = cause;
    Object.setPrototypeOf(this, _DatabaseError.prototype);
  }
};
var TimeoutError = class _TimeoutError extends DatabaseError {
  constructor(message = "Query timed out", cause) {
    super(message, "TIMEOUT", void 0, cause);
    this.name = "TimeoutError";
    Object.setPrototypeOf(this, _TimeoutError.prototype);
  }
};
function toBase64(uint8) {
  return Buffer.from(uint8.buffer, uint8.byteOffset, uint8.byteLength).toString("base64");
}
function encodeValue(value) {
  if (value === null || value === void 0) {
    return { type: "null" };
  }
  if (typeof value === "number") {
    if (!Number.isFinite(value)) {
      throw new Error("Only finite numbers (not Infinity or NaN) can be passed as arguments");
    }
    if (Number.isSafeInteger(value)) {
      return { type: "integer", value: value.toString() };
    }
    return { type: "float", value };
  }
  if (typeof value === "bigint") {
    if (value < -(1n << 63n) || value > (1n << 63n) - 1n) {
      throw new Error("BigInt value is outside SQLite's signed 64-bit integer range");
    }
    return { type: "integer", value: value.toString() };
  }
  if (typeof value === "boolean") {
    return { type: "integer", value: value ? "1" : "0" };
  }
  if (typeof value === "string") {
    return { type: "text", value };
  }
  if (value instanceof ArrayBuffer) {
    return { type: "blob", base64: toBase64(new Uint8Array(value)) };
  }
  if (value instanceof Uint8Array) {
    return { type: "blob", base64: toBase64(value) };
  }
  return { type: "text", value: String(value) };
}
function decodeValue(value, safeIntegers = false) {
  switch (value.type) {
    case "null":
      return null;
    case "integer":
      if (safeIntegers) {
        return BigInt(value.value);
      }
      return parseInt(value.value, 10);
    case "float":
      return value.value;
    case "text":
      return value.value;
    case "blob":
      if (value.base64 !== void 0 && value.base64 !== null) {
        let b64 = value.base64;
        while (b64.length % 4 !== 0) {
          b64 += "=";
        }
        const binaryString = atob(b64);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        return Buffer.from(bytes);
      }
      return Buffer.alloc(0);
    default:
      return null;
  }
}
var ENCRYPTION_KEY_HEADER = "x-turso-encryption-key";
function buildHeaders(ctx) {
  const headers = {
    "Content-Type": "application/json"
  };
  if (ctx.authToken) {
    headers["Authorization"] = `Bearer ${ctx.authToken}`;
  }
  if (ctx.remoteEncryptionKey) {
    headers[ENCRYPTION_KEY_HEADER] = ctx.remoteEncryptionKey;
  }
  for (const [name, value] of Object.entries(ctx.requestHeaders ?? {})) {
    if (name.toLowerCase() === "host") {
      throw new DatabaseError("overwriting the 'Host' header is not supported");
    }
    headers[name] = value;
  }
  return headers;
}
function buildFetchOptions(ctx, body, signal) {
  return {
    method: "POST",
    headers: buildHeaders(ctx),
    body,
    signal
  };
}
function wrapAbortError(error) {
  if (error instanceof Error && (error.name === "AbortError" || error.name === "TimeoutError")) {
    throw new TimeoutError("Query timed out");
  }
  throw error;
}
async function executeCursor(ctx, request, signal) {
  let response;
  try {
    response = await fetch(`${ctx.url}/v3/cursor`, buildFetchOptions(ctx, JSON.stringify(request), signal));
  } catch (error) {
    wrapAbortError(error);
  }
  if (!response.ok) {
    let errorMessage = `HTTP error! status: ${response.status}`;
    try {
      const errorBody = await response.text();
      const errorData = JSON.parse(errorBody);
      if (errorData.message) {
        errorMessage = errorData.message;
      }
    } catch {
    }
    throw new DatabaseError(errorMessage);
  }
  const reader = response.body?.getReader();
  if (!reader) {
    throw new DatabaseError("No response body");
  }
  const decoder = new TextDecoder();
  let buffer = "";
  let cursorResponse;
  try {
    while (!cursorResponse) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const newlineIndex = buffer.indexOf("\n");
      if (newlineIndex !== -1) {
        const line = buffer.slice(0, newlineIndex).trim();
        buffer = buffer.slice(newlineIndex + 1);
        if (line) {
          cursorResponse = JSON.parse(line);
          break;
        }
      }
    }
  } catch (error) {
    reader.releaseLock();
    wrapAbortError(error);
  }
  if (!cursorResponse) {
    reader.releaseLock();
    throw new DatabaseError("No cursor response received");
  }
  async function* parseEntries() {
    try {
      let newlineIndex;
      while ((newlineIndex = buffer.indexOf("\n")) !== -1) {
        const line = buffer.slice(0, newlineIndex).trim();
        buffer = buffer.slice(newlineIndex + 1);
        if (line) {
          yield JSON.parse(line);
        }
      }
      while (true) {
        let readResult;
        try {
          readResult = await reader.read();
        } catch (error) {
          wrapAbortError(error);
        }
        if (readResult.done) break;
        buffer += decoder.decode(readResult.value, { stream: true });
        while ((newlineIndex = buffer.indexOf("\n")) !== -1) {
          const line = buffer.slice(0, newlineIndex).trim();
          buffer = buffer.slice(newlineIndex + 1);
          if (line) {
            yield JSON.parse(line);
          }
        }
      }
      if (buffer.trim()) {
        yield JSON.parse(buffer.trim());
      }
    } finally {
      reader.releaseLock();
    }
  }
  return { response: cursorResponse, entries: parseEntries() };
}
async function executePipeline(ctx, request, signal) {
  let response;
  try {
    response = await fetch(`${ctx.url}/v3/pipeline`, buildFetchOptions(ctx, JSON.stringify(request), signal));
  } catch (error) {
    wrapAbortError(error);
  }
  if (!response.ok) {
    throw new DatabaseError(`HTTP error! status: ${response.status}`);
  }
  return response.json();
}
function encodeSqlArgs(args = []) {
  let positionalArgs = [];
  let namedArgs = [];
  if (Array.isArray(args)) {
    positionalArgs = args.map(encodeValue);
  } else {
    const keys = Object.keys(args);
    const isNumericKeys = keys.length > 0 && keys.every((key) => /^\d+$/.test(key));
    if (isNumericKeys) {
      const sortedKeys = keys.sort((a, b) => parseInt(a, 10) - parseInt(b, 10));
      const maxIndex = parseInt(sortedKeys[sortedKeys.length - 1], 10);
      positionalArgs = new Array(maxIndex);
      for (const key of sortedKeys) {
        const index = parseInt(key, 10) - 1;
        positionalArgs[index] = encodeValue(args[key]);
      }
      for (let i = 0; i < positionalArgs.length; i++) {
        if (positionalArgs[i] === void 0) {
          positionalArgs[i] = { type: "null" };
        }
      }
    } else {
      namedArgs = Object.entries(args).map(([name, value]) => ({
        name,
        value: encodeValue(value)
      }));
    }
  }
  return { args: positionalArgs, namedArgs };
}
var TRANSACTION_CONTROL_KEYWORDS = /* @__PURE__ */ new Set([
  "BEGIN",
  "COMMIT",
  "END",
  "ROLLBACK",
  "SAVEPOINT",
  "RELEASE"
]);
function normalizeBatchMode(mode) {
  switch (String(mode).toLowerCase()) {
    case "write":
      return "IMMEDIATE";
    case "read":
    case "deferred":
      return "DEFERRED";
    case "immediate":
      return "IMMEDIATE";
    case "exclusive":
      return "EXCLUSIVE";
    case "concurrent":
      return "CONCURRENT";
    default:
      return String(mode).toUpperCase();
  }
}
function firstSqlKeyword(sql) {
  let offset = 0;
  while (offset < sql.length) {
    if (/\s/.test(sql[offset]) || sql[offset] === ";") {
      offset++;
      continue;
    }
    if (sql.startsWith("--", offset)) {
      const newline = sql.indexOf("\n", offset + 2);
      if (newline < 0) return void 0;
      offset = newline + 1;
      continue;
    }
    if (sql.startsWith("/*", offset)) {
      const end = sql.indexOf("*/", offset + 2);
      if (end < 0) return void 0;
      offset = end + 2;
      continue;
    }
    break;
  }
  return /^[A-Za-z]+/.exec(sql.slice(offset))?.[0].toUpperCase();
}
function batchInputError(index, message) {
  const error = new DatabaseError(`batch statement ${index} failed: ${message}`);
  error.batchIndex = index;
  error.batchResults = [];
  return error;
}
function normalizeUrl(url) {
  return url.replace(/^(libsql|turso):\/\//, "https://").replace(/\/+$/, "");
}
function isValidIdentifier(str) {
  return /^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(str);
}
var Session = class _Session {
  constructor(config) {
    this.baton = null;
    this.autocommit = true;
    for (const name of Object.keys(config.requestHeaders ?? {})) {
      if (name.toLowerCase() === "host") {
        throw new DatabaseError("overwriting the 'Host' header is not supported");
      }
    }
    this.config = config;
    this.baseUrl = normalizeUrl(config.url);
  }
  httpContext(queryOptions) {
    let requestHeaders = this.config.requestHeaders;
    if (queryOptions?.requestHeaders) {
      requestHeaders = { ...requestHeaders, ...queryOptions.requestHeaders };
    }
    return {
      url: this.baseUrl,
      authToken: this.config.authToken,
      remoteEncryptionKey: this.config.remoteEncryptionKey,
      requestHeaders
    };
  }
  /**
   * Whether the connection is currently inside a transaction.
   *
   * Derived from the server's authoritative `get_autocommit` answer (the same
   * value as `sqlite3_get_autocommit()`), which we refresh on every pipeline
   * request. This is the only reliable signal: a non-null baton does NOT imply
   * a transaction — the server also keeps the stream open for stored SQL or
   * pragma side effects.
   */
  get inTransaction() {
    return !this.autocommit;
  }
  /**
   * Refresh the cached autocommit status from a pipeline response, reading the
   * answer to the `get_autocommit` request we append to every pipeline call.
   */
  updateAutocommit(response) {
    if (!response.results) {
      return;
    }
    for (const result of response.results) {
      if (result.type === "ok" && result.response?.type === "get_autocommit" && typeof result.response.is_autocommit === "boolean") {
        this.autocommit = result.response.is_autocommit;
        return;
      }
    }
  }
  createAbortSignal(queryOptions) {
    const timeout = queryOptions?.queryTimeout ?? this.config.defaultQueryTimeout;
    if (timeout != null && timeout > 0) {
      return AbortSignal.timeout(timeout);
    }
    return void 0;
  }
  /**
   * Describe a SQL statement to get its column metadata.
   * 
   * @param sql - The SQL statement to describe
   * @returns Promise resolving to the statement description
   */
  async describe(sql, queryOptions) {
    const request = {
      baton: this.baton,
      requests: [
        { type: "describe", sql },
        { type: "get_autocommit" }
      ]
    };
    let response;
    try {
      response = await executePipeline(this.httpContext(queryOptions), request, this.createAbortSignal(queryOptions));
    } catch (e) {
      this.baton = null;
      this.autocommit = true;
      throw e;
    }
    this.baton = response.baton;
    if (response.base_url) {
      this.baseUrl = normalizeUrl(response.base_url);
    }
    this.updateAutocommit(response);
    if (response.results && response.results[0]) {
      const result = response.results[0];
      if (result.type === "error") {
        throw new DatabaseError(result.error?.message || "Describe execution failed", result.error?.code);
      }
      if (result.response?.type === "describe" && result.response.result) {
        return result.response.result;
      }
    }
    throw new DatabaseError("Unexpected describe response");
  }
  /**
   * Execute a SQL statement and return all results.
   *
   * @param sql - The SQL statement to execute
   * @param args - Optional array of parameter values or object with named parameters
   * @param safeIntegers - Whether to return integers as BigInt
   * @returns Promise resolving to the complete result set
   */
  async execute(sql, args = [], safeIntegers = false, queryOptions) {
    const { response, entries } = await this.executeRaw(sql, args, queryOptions);
    const result = await this.processCursorEntries(entries, safeIntegers);
    return result;
  }
  /**
   * A trailing batch step gated on `is_autocommit`, appended to every cursor
   * request. The cursor endpoint cannot carry a `get_autocommit` probe, so
   * whether this step executed tells us the connection's transaction state
   * without an extra round trip.
   */
  static autocommitProbeStep() {
    return {
      stmt: { sql: "SELECT 1", args: [], named_args: [], want_rows: false },
      condition: { type: "is_autocommit" }
    };
  }
  /**
   * Filter the probe step's entries out of a cursor stream and update the
   * cached transaction state from whether the probe executed. The probe is
   * always the last step, so everything after its step_begin belongs to it.
   *
   * If the stream ends abnormally (fatal error entry, a probe error, or the
   * consumer stops iterating early) the probe answer is unreliable, so the
   * state is refreshed with a fallback pipeline request instead.
   */
  async *trackAutocommit(entries, probeIdx, queryOptions) {
    let sawProbe = false;
    let unreliable = false;
    let completed = false;
    try {
      for await (const entry of entries) {
        if (entry.type === "step_begin" && entry.step === probeIdx) {
          sawProbe = true;
          continue;
        }
        if (sawProbe && (entry.type === "row" || entry.type === "step_end")) {
          continue;
        }
        if (entry.type === "error" || entry.type === "step_error" && entry.step === probeIdx) {
          unreliable = true;
          if (entry.type === "step_error") {
            continue;
          }
        }
        yield entry;
      }
      completed = true;
    } finally {
      if (completed && !unreliable) {
        this.autocommit = sawProbe;
      } else {
        await this.refreshAutocommit(queryOptions);
      }
    }
  }
  /**
   * Execute a SQL statement and return the raw response and entries.
   *
   * @param sql - The SQL statement to execute
   * @param args - Optional array of parameter values or object with named parameters
   * @returns Promise resolving to the raw response and cursor entries
   */
  async executeRaw(sql, args = [], queryOptions) {
    const encodedArgs = encodeSqlArgs(args);
    const request = {
      baton: this.baton,
      batch: {
        steps: [{
          stmt: {
            sql,
            args: encodedArgs.args,
            named_args: encodedArgs.namedArgs,
            want_rows: true
          }
        }, _Session.autocommitProbeStep()]
      }
    };
    let result;
    try {
      result = await executeCursor(this.httpContext(queryOptions), request, this.createAbortSignal(queryOptions));
    } catch (e) {
      this.baton = null;
      this.autocommit = true;
      throw e;
    }
    const { response, entries } = result;
    this.baton = response.baton;
    if (response.base_url) {
      this.baseUrl = normalizeUrl(response.base_url);
    }
    return { response, entries: this.trackAutocommit(entries, 1, queryOptions) };
  }
  /**
   * Refresh the cached transaction state with a standalone `get_autocommit`
   * pipeline request. Errors are not rethrown — this runs from generator
   * cleanup where an exception would mask the original failure; a dead stream
   * means the server rolled back, so the state resets to autocommit instead.
   */
  async refreshAutocommit(queryOptions) {
    const request = {
      baton: this.baton,
      requests: [{ type: "get_autocommit" }]
    };
    let response;
    try {
      response = await executePipeline(this.httpContext(), request, this.createAbortSignal(queryOptions));
    } catch {
      this.baton = null;
      this.autocommit = true;
      return;
    }
    this.baton = response.baton;
    if (response.base_url) {
      this.baseUrl = normalizeUrl(response.base_url);
    }
    this.updateAutocommit(response);
  }
  /**
   * Process cursor entries into a structured result.
   *
   * @param entries - Async generator of cursor entries
   * @returns Promise resolving to the processed result
   */
  async processCursorEntries(entries, safeIntegers = false) {
    let columns = [];
    let columnTypes = [];
    let rows = [];
    let rowsAffected = 0;
    let lastInsertRowid;
    for await (const entry of entries) {
      switch (entry.type) {
        case "step_begin":
          if (entry.cols) {
            columns = entry.cols.map((col) => col.name);
            columnTypes = entry.cols.map((col) => col.decltype || "");
          }
          break;
        case "row":
          if (entry.row) {
            const decodedRow = entry.row.map((value) => decodeValue(value, safeIntegers));
            const rowObject = this.createRowObject(decodedRow, columns);
            rows.push(rowObject);
          }
          break;
        case "step_end":
          if (entry.affected_row_count !== void 0) {
            rowsAffected = entry.affected_row_count;
          }
          if (entry.last_insert_rowid !== void 0 && entry.last_insert_rowid !== null) {
            lastInsertRowid = typeof entry.last_insert_rowid === "number" ? entry.last_insert_rowid : parseInt(entry.last_insert_rowid, 10);
          }
          break;
        case "step_error":
        case "error":
          throw new DatabaseError(entry.error?.message || "SQL execution failed", entry.error?.code);
      }
    }
    return {
      columns,
      columnTypes,
      rows,
      rowsAffected,
      lastInsertRowid
    };
  }
  /**
   * Create a row object with both array and named property access.
   * 
   * @param values - Array of column values
   * @param columns - Array of column names
   * @returns Row object with dual access patterns
   */
  createRowObject(values, columns) {
    const row = [...values];
    columns.forEach((column, index) => {
      if (column && isValidIdentifier(column) && !Object.prototype.hasOwnProperty.call(row, column)) {
        Object.defineProperty(row, column, {
          value: values[index],
          enumerable: false,
          writable: false,
          configurable: true
        });
      }
    });
    return row;
  }
  createObjectRow(values, columns) {
    const row = {};
    columns.forEach((column, index) => {
      row[column] = values[index];
    });
    return row;
  }
  /**
   * Execute multiple SQL statements in a batch.
   *
   * The batch is sent as a single `batch` request on the pipeline
   * endpoint (PROTOCOL.md section 6.2), so the whole batch completes in
   * one round-trip. Each statement is gated on its predecessor
   * succeeding, so execution stops at the first failure. When `mode` is
   * set, the request also carries `BEGIN <mode>` / `COMMIT` / `ROLLBACK`
   * steps using the server-side condition chain, giving atomic
   * execution. When `mode` is omitted, the statements run under
   * autocommit (or whatever transaction is already active on this
   * stream).
   *
   * @param statements - Array of SQL statements to execute.
   * @param mode - Optional locking mode; when set, the batch executes
   *   atomically. Accepts the same values as `Database.transaction(...)`
   *   variants: `"deferred"`, `"immediate"`, `"exclusive"`, `"concurrent"`.
   * @param safeIntegers - When true, integer column values are decoded as
   *   BigInt rather than Number.
   * @returns Promise resolving to an array of per-statement results — one
   *   per input statement, in order — each carrying that statement's
   *   `columns`, `columnTypes`, `rows`, `rowsAffected`, `lastInsertRowid`,
   *   and the server-side execution statistics `rowsRead`, `rowsWritten`,
   *   and `queryDurationMs`. On failure the thrown `DatabaseError` carries
   *   `batchIndex` (the failing statement) and `batchResults` (the results
   *   of the statements that completed).
   */
  async batch(statements, mode, queryOptions, safeIntegers = false, raw2 = false) {
    const userSteps = statements.map((statement, index) => {
      if (typeof statement === "string") {
        return {
          stmt: { sql: statement, args: [], named_args: [], want_rows: true }
        };
      }
      let encodedArgs;
      try {
        encodedArgs = encodeSqlArgs(statement.args ?? []);
      } catch (e) {
        throw batchInputError(index, e?.message ?? String(e));
      }
      return {
        stmt: {
          sql: statement.sql,
          args: encodedArgs.args,
          named_args: encodedArgs.namedArgs,
          want_rows: true
        }
      };
    });
    if (mode !== void 0) {
      for (let index = 0; index < statements.length; index++) {
        const statement = statements[index];
        const sql = typeof statement === "string" ? statement : statement.sql;
        const keyword = firstSqlKeyword(sql);
        if (keyword !== void 0 && TRANSACTION_CONTROL_KEYWORDS.has(keyword)) {
          throw batchInputError(index, `${keyword} is not allowed in an atomic batch`);
        }
      }
    }
    let steps;
    let firstUserStepIdx = 0;
    let beginIdx = -1;
    let commitIdx = -1;
    let rollbackIdx = -1;
    if (mode === void 0) {
      steps = userSteps.map(
        (step, i) => i === 0 ? step : { ...step, condition: { type: "ok", step: i - 1 } }
      );
    } else {
      beginIdx = 0;
      firstUserStepIdx = 1;
      const lastUserStepIdx = userSteps.length;
      commitIdx = lastUserStepIdx + 1;
      rollbackIdx = commitIdx + 1;
      steps = [
        { stmt: { sql: `BEGIN ${normalizeBatchMode(mode)}`, args: [], named_args: [], want_rows: false } },
        ...userSteps.map((step, i) => ({
          ...step,
          condition: { type: "ok", step: i === 0 ? beginIdx : firstUserStepIdx + i - 1 }
        })),
        {
          stmt: { sql: "COMMIT", args: [], named_args: [], want_rows: false },
          condition: { type: "ok", step: lastUserStepIdx }
        },
        {
          stmt: { sql: "ROLLBACK", args: [], named_args: [], want_rows: false },
          condition: {
            type: "and",
            conds: [
              { type: "ok", step: beginIdx },
              { type: "not", cond: { type: "ok", step: commitIdx } }
            ]
          }
        }
      ];
    }
    const request = {
      baton: this.baton,
      requests: [
        { type: "batch", batch: { steps } },
        { type: "get_autocommit" }
      ]
    };
    let response;
    try {
      response = await executePipeline(this.httpContext(queryOptions), request, this.createAbortSignal(queryOptions));
    } catch (e) {
      this.baton = null;
      this.autocommit = true;
      throw e;
    }
    this.baton = response.baton;
    if (response.base_url) {
      this.baseUrl = normalizeUrl(response.base_url);
    }
    this.updateAutocommit(response);
    const first = response.results?.[0];
    if (!first) {
      throw new DatabaseError("missing batch result in pipeline response");
    }
    if (first.type === "error") {
      throw new DatabaseError(first.error?.message || "Batch execution failed", first.error?.code);
    }
    if (first.response?.type !== "batch") {
      throw new DatabaseError(`expected batch result in pipeline response, got ${first.response?.type}`);
    }
    const batchResult = first.response.result;
    const stepResults = batchResult?.step_results;
    const stepErrors = batchResult?.step_errors;
    if (!Array.isArray(stepResults) || !Array.isArray(stepErrors) || stepResults.length !== steps.length || stepErrors.length !== steps.length) {
      throw new DatabaseError("batch response does not have one result and one error per step");
    }
    const results = statements.map((_, i) => {
      const stepResult = stepResults[firstUserStepIdx + i];
      return stepResult ? this.decodeBatchStepResult(stepResult, safeIntegers, raw2) : null;
    });
    const rollbackError = rollbackIdx >= 0 ? stepErrors[rollbackIdx] : null;
    const throwStepError = (error, batchIndex) => {
      const e = new DatabaseError(error?.message || "Batch execution failed", error?.code);
      if (batchIndex !== void 0) {
        e.batchIndex = batchIndex;
      }
      e.batchResults = results;
      if (rollbackError) {
        e.rollbackError = new DatabaseError(
          rollbackError.message || "Batch rollback failed",
          rollbackError.code
        );
      }
      throw e;
    };
    if (beginIdx >= 0 && stepErrors[beginIdx]) {
      throwStepError(stepErrors[beginIdx]);
    }
    for (let i = 0; i < userSteps.length; i++) {
      const stepError = stepErrors[firstUserStepIdx + i];
      if (stepError) {
        throwStepError(stepError, i);
      }
    }
    if (commitIdx >= 0 && stepErrors[commitIdx]) {
      throwStepError(stepErrors[commitIdx]);
    }
    if (rollbackError) {
      const error = new DatabaseError(
        rollbackError.message || "Batch rollback failed",
        rollbackError.code
      );
      error.batchResults = results;
      throw error;
    }
    if (results.some((result) => result === null)) {
      throw new DatabaseError("batch response is missing statement results");
    }
    return results;
  }
  /** Decode one statement result of a batch response (section 8.4) into
   * the per-statement result shape returned by `batch()`. */
  decodeBatchStepResult(stepResult, safeIntegers, raw2) {
    const columns = (stepResult.cols ?? []).map((col) => col.name ?? "");
    const columnTypes = (stepResult.cols ?? []).map((col) => col.decltype || "");
    const rows = (stepResult.rows ?? []).map((row) => {
      const decoded = row.map((value) => decodeValue(value, safeIntegers));
      return raw2 ? decoded : this.createObjectRow(decoded, columns);
    });
    let lastInsertRowid;
    if (stepResult.last_insert_rowid !== void 0 && stepResult.last_insert_rowid !== null) {
      lastInsertRowid = typeof stepResult.last_insert_rowid === "number" ? stepResult.last_insert_rowid : parseInt(stepResult.last_insert_rowid, 10);
    }
    const resultSet = {
      columns,
      columnTypes,
      rows,
      rowsAffected: columns.length > 0 ? 0 : stepResult.affected_row_count ?? 0,
      rowsRead: stepResult.rows_read,
      rowsWritten: stepResult.rows_written,
      queryDurationMs: stepResult.query_duration_ms
    };
    if (lastInsertRowid !== void 0) {
      resultSet.lastInsertRowid = lastInsertRowid;
    }
    return resultSet;
  }
  /**
   * Execute a sequence of SQL statements separated by semicolons.
   * 
   * @param sql - SQL string containing multiple statements separated by semicolons
   * @returns Promise resolving when all statements are executed
   */
  async sequence(sql, queryOptions) {
    const request = {
      baton: this.baton,
      requests: [
        { type: "sequence", sql },
        { type: "get_autocommit" }
      ]
    };
    let seqResponse;
    try {
      seqResponse = await executePipeline(this.httpContext(queryOptions), request, this.createAbortSignal(queryOptions));
    } catch (e) {
      this.baton = null;
      this.autocommit = true;
      throw e;
    }
    this.baton = seqResponse.baton;
    if (seqResponse.base_url) {
      this.baseUrl = normalizeUrl(seqResponse.base_url);
    }
    this.updateAutocommit(seqResponse);
    if (seqResponse.results && seqResponse.results[0]) {
      const result = seqResponse.results[0];
      if (result.type === "error") {
        throw new DatabaseError(result.error?.message || "Sequence execution failed", result.error?.code);
      }
    }
  }
  /**
   * Close the session.
   *
   * This sends a close request to the server to properly clean up the stream
   * before resetting the local state.
   */
  async close() {
    if (this.baton) {
      try {
        const request = {
          baton: this.baton,
          requests: [{
            type: "close"
          }]
        };
        await executePipeline(this.httpContext(), request);
      } catch {
      }
    }
    this.baton = null;
    this.baseUrl = "";
    this.autocommit = true;
  }
};
var AsyncLock = class {
  constructor() {
    this.locked = false;
    this.queue = [];
  }
  async acquire() {
    if (!this.locked) {
      this.locked = true;
      return;
    }
    return new Promise((resolve) => {
      this.queue.push(resolve);
    });
  }
  release() {
    const next = this.queue.shift();
    if (next) {
      next();
    } else {
      this.locked = false;
    }
  }
};
var LibsqlError = class extends Error {
  constructor(message, code, extendedCode, rawCode, cause) {
    super(message);
    this.name = "LibsqlError";
    this.code = code;
    this.extendedCode = extendedCode;
    this.rawCode = rawCode;
    this.cause = cause;
  }
};
var LibSQLClient = class {
  constructor(config) {
    this.execLock = new AsyncLock();
    this._closed = false;
    this._defaultSafeIntegers = false;
    this.validateConfig(config);
    const sessionConfig = {
      url: config.url,
      authToken: config.authToken || "",
      remoteEncryptionKey: config.remoteEncryptionKey
    };
    this.sessionConfig = sessionConfig;
    this.session = new Session(sessionConfig);
  }
  validateConfig(config) {
    const unsupportedOptions = [];
    if (config.encryptionKey !== void 0) {
      unsupportedOptions.push({ key: "encryptionKey", value: config.encryptionKey });
    }
    if (config.syncUrl !== void 0) {
      unsupportedOptions.push({ key: "syncUrl", value: config.syncUrl });
    }
    if (config.syncInterval !== void 0) {
      unsupportedOptions.push({ key: "syncInterval", value: config.syncInterval });
    }
    if (config.readYourWrites !== void 0) {
      unsupportedOptions.push({ key: "readYourWrites", value: config.readYourWrites });
    }
    if (config.offline !== void 0) {
      unsupportedOptions.push({ key: "offline", value: config.offline });
    }
    if (config.tls !== void 0) {
      unsupportedOptions.push({ key: "tls", value: config.tls });
    }
    if (config.intMode !== void 0) {
      unsupportedOptions.push({ key: "intMode", value: config.intMode });
    }
    if (config.fetch !== void 0) {
      unsupportedOptions.push({ key: "fetch", value: config.fetch });
    }
    if (config.concurrency !== void 0) {
      unsupportedOptions.push({ key: "concurrency", value: config.concurrency });
    }
    if (unsupportedOptions.length > 0) {
      const optionsList = unsupportedOptions.map((opt) => `'${opt.key}'`).join(", ");
      throw new LibsqlError(
        `Unsupported configuration options: ${optionsList}. Only 'url', 'authToken', and 'remoteEncryptionKey' are supported in the serverless compatibility layer.`,
        "UNSUPPORTED_CONFIG"
      );
    }
    if (!config.url) {
      throw new LibsqlError("Missing required 'url' configuration option", "MISSING_URL");
    }
  }
  get closed() {
    return this._closed;
  }
  get protocol() {
    return "http";
  }
  normalizeStatement(stmt) {
    if (typeof stmt === "string") {
      return { sql: stmt, args: [] };
    }
    const args = stmt.args || [];
    if (Array.isArray(args)) {
      return { sql: stmt.sql, args };
    }
    return { sql: stmt.sql, args: Object.values(args) };
  }
  convertResult(result) {
    const resultSet = {
      columns: result.columns || [],
      columnTypes: result.columnTypes || [],
      rows: result.rows || [],
      rowsAffected: result.rowsAffected || 0,
      lastInsertRowid: result.lastInsertRowid != null ? BigInt(result.lastInsertRowid) : void 0,
      toJSON() {
        return {
          columns: this.columns,
          columnTypes: this.columnTypes,
          rows: this.rows,
          rowsAffected: this.rowsAffected,
          lastInsertRowid: this.lastInsertRowid?.toString()
        };
      }
    };
    return resultSet;
  }
  /** Wrap a batch failure in a LibsqlError, preserving the per-statement
   * metadata batch() attaches. */
  wrapBatchError(error) {
    const wrapped = mapDatabaseError(error, "BATCH_ERROR");
    if (error?.batchIndex !== void 0) {
      wrapped.batchIndex = error.batchIndex;
    }
    if (error?.batchResults !== void 0) {
      wrapped.batchResults = error.batchResults.map(
        (result) => result === null ? null : this.convertBatchResult(result)
      );
    }
    return wrapped;
  }
  convertBatchResult(result) {
    return this.convertResult(result);
  }
  normalizeBatchOptions(options) {
    if (options != null && typeof options === "object") {
      return {
        mode: options.mode,
        raw: options.raw === true
      };
    }
    return {
      mode: options,
      raw: false
    };
  }
  async execute(stmtOrSql, args) {
    await this.execLock.acquire();
    try {
      if (this._closed) {
        throw new LibsqlError("Client is closed", "CLIENT_CLOSED");
      }
      let normalizedStmt;
      if (typeof stmtOrSql === "string") {
        const normalizedArgs = args ? Array.isArray(args) ? args : Object.values(args) : [];
        normalizedStmt = { sql: stmtOrSql, args: normalizedArgs };
      } else {
        normalizedStmt = this.normalizeStatement(stmtOrSql);
      }
      const result = await this.session.execute(normalizedStmt.sql, normalizedStmt.args, this._defaultSafeIntegers);
      return this.convertResult(result);
    } catch (error) {
      if (error instanceof LibsqlError) {
        throw error;
      }
      throw mapDatabaseError(error, "EXECUTE_ERROR");
    } finally {
      this.execLock.release();
    }
  }
  async batch(stmts, options) {
    await this.execLock.acquire();
    try {
      if (this._closed) {
        throw new LibsqlError("Client is closed", "CLIENT_CLOSED");
      }
      if (!Array.isArray(stmts)) {
        throw new TypeError("Expected first argument to be an array of statements");
      }
      const { mode, raw: raw2 } = this.normalizeBatchOptions(options);
      const batchMode = mode ?? "deferred";
      const results = await this.session.batch(
        stmts,
        batchMode,
        void 0,
        this._defaultSafeIntegers,
        raw2
      );
      return results.map((result) => this.convertBatchResult(result));
    } catch (error) {
      if (error instanceof LibsqlError) {
        throw error;
      }
      throw this.wrapBatchError(error);
    } finally {
      this.execLock.release();
    }
  }
  async migrate(stmts) {
    return this.batch(stmts, "write");
  }
  modeToBeginSql(mode) {
    switch (mode) {
      case "write":
        return "BEGIN IMMEDIATE";
      case "deferred":
        return "BEGIN DEFERRED";
      case "read":
      default:
        return "BEGIN";
    }
  }
  async transaction(mode) {
    await this.execLock.acquire();
    if (this._closed) {
      this.execLock.release();
      throw new LibsqlError("Client is closed", "CLIENT_CLOSED");
    }
    const txSession = new Session(this.sessionConfig);
    let txClosed = false;
    let cleanupStarted = false;
    const ensureOpen = () => {
      if (txClosed) {
        throw new LibsqlError("Transaction is closed", "TRANSACTION_CLOSED");
      }
    };
    const closeTx = async () => {
      if (cleanupStarted) return;
      cleanupStarted = true;
      txClosed = true;
      try {
        await txSession.close();
      } finally {
        this.execLock.release();
      }
    };
    const executeInTx = async (stmt) => {
      ensureOpen();
      const normalized = this.normalizeStatement(stmt);
      try {
        const result = await txSession.execute(normalized.sql, normalized.args, this._defaultSafeIntegers);
        return this.convertResult(result);
      } catch (error) {
        throw mapDatabaseError(error, "EXECUTE_ERROR");
      }
    };
    try {
      await txSession.sequence(this.modeToBeginSql(mode));
    } catch (error) {
      await closeTx();
      throw mapDatabaseError(error, "BEGIN_ERROR");
    }
    return {
      execute: async (stmtOrSql, args) => {
        if (typeof stmtOrSql === "string") {
          const normalizedArgs = args ? Array.isArray(args) ? args : Object.values(args) : [];
          return executeInTx({ sql: stmtOrSql, args: normalizedArgs });
        }
        return executeInTx(stmtOrSql);
      },
      batch: async (stmts) => {
        ensureOpen();
        if (!Array.isArray(stmts)) {
          throw new TypeError("Expected first argument to be an array of statements");
        }
        try {
          const results = await txSession.batch(
            stmts,
            void 0,
            void 0,
            this._defaultSafeIntegers
          );
          return results.map((result) => this.convertBatchResult(result));
        } catch (error) {
          if (error instanceof LibsqlError) {
            throw error;
          }
          throw this.wrapBatchError(error);
        }
      },
      executeMultiple: async (sql) => {
        ensureOpen();
        try {
          await txSession.sequence(sql);
        } catch (error) {
          throw mapDatabaseError(error, "EXECUTE_MULTIPLE_ERROR");
        }
      },
      commit: async () => {
        ensureOpen();
        try {
          await txSession.sequence("COMMIT");
        } catch (error) {
          throw mapDatabaseError(error, "COMMIT_ERROR");
        } finally {
          await closeTx();
        }
      },
      rollback: async () => {
        ensureOpen();
        try {
          await txSession.sequence("ROLLBACK");
        } catch (error) {
          throw mapDatabaseError(error, "ROLLBACK_ERROR");
        } finally {
          await closeTx();
        }
      },
      close: () => {
        if (txClosed) return;
        txClosed = true;
        void txSession.sequence("ROLLBACK").catch(() => void 0).finally(() => {
          void closeTx();
        });
      },
      get closed() {
        return txClosed;
      }
    };
  }
  async executeMultiple(sql) {
    await this.execLock.acquire();
    try {
      if (this._closed) {
        throw new LibsqlError("Client is closed", "CLIENT_CLOSED");
      }
      await this.session.sequence(sql);
    } catch (error) {
      if (error instanceof LibsqlError) {
        throw error;
      }
      throw mapDatabaseError(error, "EXECUTE_MULTIPLE_ERROR");
    } finally {
      this.execLock.release();
    }
  }
  async sync() {
    throw new LibsqlError("Sync not supported for remote databases", "NOT_SUPPORTED");
  }
  close() {
    this._closed = true;
    this.session.close().catch((error) => {
      console.error("Error closing session:", error);
    });
  }
  reconnect() {
    const wasOpen = !this._closed;
    this._closed = false;
    if (wasOpen) {
      this.session.close().catch((error) => {
        console.error("Error closing session during reconnect:", error);
      });
    }
    this.session = new Session(this.sessionConfig);
  }
};
function createClient(config) {
  return new LibSQLClient(config);
}
var sqliteBaseErrorCodes = /* @__PURE__ */ new Set([
  "SQLITE_ERROR",
  "SQLITE_INTERNAL",
  "SQLITE_PERM",
  "SQLITE_ABORT",
  "SQLITE_BUSY",
  "SQLITE_LOCKED",
  "SQLITE_NOMEM",
  "SQLITE_READONLY",
  "SQLITE_INTERRUPT",
  "SQLITE_IOERR",
  "SQLITE_CORRUPT",
  "SQLITE_NOTFOUND",
  "SQLITE_FULL",
  "SQLITE_CANTOPEN",
  "SQLITE_PROTOCOL",
  "SQLITE_EMPTY",
  "SQLITE_SCHEMA",
  "SQLITE_TOOBIG",
  "SQLITE_CONSTRAINT",
  "SQLITE_MISMATCH",
  "SQLITE_MISUSE",
  "SQLITE_NOLFS",
  "SQLITE_AUTH",
  "SQLITE_FORMAT",
  "SQLITE_RANGE",
  "SQLITE_NOTADB",
  "SQLITE_NOTICE",
  "SQLITE_WARNING"
]);
function parseErrorCode(serverCode) {
  if (sqliteBaseErrorCodes.has(serverCode)) {
    return { code: serverCode };
  }
  for (const base of sqliteBaseErrorCodes) {
    if (serverCode.startsWith(base + "_")) {
      return { code: base, extendedCode: serverCode };
    }
  }
  return { code: serverCode };
}
function mapDatabaseError(error, fallbackCode) {
  if (error instanceof DatabaseError && error.code) {
    const { code, extendedCode } = parseErrorCode(error.code);
    return new LibsqlError(error.message, code, extendedCode, error.rawCode, error);
  }
  const cause = error instanceof Error ? error : void 0;
  return new LibsqlError(error.message ?? String(error), fallbackCode, void 0, void 0, cause);
}

// src/state/defaults.ts
var DEFAULT_THEME = "\u5386\u53F2\u59D4\u5458\u4F1A";
var SCHEMA_VERSION = 1;
var DEFAULT_AUTHOR = {
  name: "\u{1F31F}\u5929\u9A6C\u53F8\u6211\u795D\u4F60\u661F\u9014\u7480\u74A8",
  xiaohongshuId: "4277718409",
  xiaohongshuUrl: ""
};
var DEFAULT_SETTINGS = {
  defaultMajority: "SIMPLE",
  skipVetoStep: false,
  skipMajorityStep: false
};
function createInitialState() {
  return {
    schemaVersion: SCHEMA_VERSION,
    theme: DEFAULT_THEME,
    author: { ...DEFAULT_AUTHOR },
    attendanceRule: "ALL",
    delegations: [],
    sessions: [],
    currentSessionId: null,
    currentTopicId: null,
    resolutions: [],
    settings: { ...DEFAULT_SETTINGS },
    updatedAt: Date.now()
  };
}

// server/api/db.ts
var SCHEMA = [
  `CREATE TABLE IF NOT EXISTS accounts (
    id TEXT PRIMARY KEY,
    username TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    name TEXT NOT NULL,
    role TEXT NOT NULL,
    created_at INTEGER NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS sessions (
    token TEXT PRIMARY KEY,
    account_id TEXT NOT NULL,
    expires_at INTEGER NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS meeting (
    id INTEGER PRIMARY KEY,
    state TEXT NOT NULL,
    revision INTEGER NOT NULL DEFAULT 0,
    updated_at INTEGER NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS time_state (
    id INTEGER PRIMARY KEY,
    now_ms INTEGER NOT NULL,
    rate REAL NOT NULL,
    running INTEGER NOT NULL,
    anchor_ms INTEGER NOT NULL,
    crisis_paused INTEGER NOT NULL DEFAULT 0,
    crisis_event_id TEXT,
    updated_at INTEGER NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS events (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    event_time INTEGER NOT NULL,
    is_crisis INTEGER NOT NULL DEFAULT 0,
    published_at INTEGER,
    created_at INTEGER NOT NULL,
    created_by TEXT NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS event_recipients (
    event_id TEXT NOT NULL,
    account_id TEXT NOT NULL,
    read INTEGER NOT NULL DEFAULT 0,
    PRIMARY KEY (event_id, account_id)
  )`,
  `CREATE TABLE IF NOT EXISTS files (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    filename TEXT NOT NULL,
    mime TEXT NOT NULL,
    size INTEGER NOT NULL,
    data BLOB NOT NULL,
    submitted_by TEXT NOT NULL,
    submitted_at INTEGER NOT NULL,
    read INTEGER NOT NULL DEFAULT 0
  )`
];
var localClient = null;
var remotePromise = null;
var resolvedClient = null;
var initPromise = null;
function createRemoteClient() {
  const url = process.env.TURSO_DATABASE_URL;
  if (!url) {
    throw new Error("\u672A\u914D\u7F6E TURSO_DATABASE_URL\uFF0C\u8BF7\u5728 Vercel \u73AF\u5883\u53D8\u91CF\u4E2D\u8BBE\u7F6E\u6570\u636E\u5E93\u5730\u5740");
  }
  return createClient({
    url,
    authToken: process.env.TURSO_AUTH_TOKEN
  });
}
function getClient() {
  if (localClient) return Promise.resolve(localClient);
  if (resolvedClient) return Promise.resolve(resolvedClient);
  if (!remotePromise) {
    remotePromise = Promise.resolve().then(() => createRemoteClient()).then((client) => {
      resolvedClient = client;
      return client;
    }).catch((error) => {
      remotePromise = null;
      throw error;
    });
  }
  return remotePromise;
}
var clientProxy = new Proxy({}, {
  get(_target, property) {
    if (property === "then") return void 0;
    return (...args) => getClient().then((client) => {
      const value = client[property];
      if (typeof value === "function") {
        return value.apply(client, args);
      }
      return value;
    });
  }
});
function getDb() {
  return clientProxy;
}
async function seed() {
  const db = getDb();
  const chair = await db.execute(
    "SELECT id FROM accounts WHERE role = 'chair' LIMIT 1"
  );
  if (chair.rows.length === 0) {
    const now = Date.now();
    await db.execute({
      sql: `INSERT OR IGNORE INTO accounts (id, username, password, name, role, created_at)
            VALUES (?, ?, ?, ?, ?, ?)`,
      args: ["chair", "123456", hashPassword("abcd"), "\u4E3B\u5E2D\u56E2", "chair", now]
    });
  }
  const meeting = await db.execute("SELECT id FROM meeting WHERE id = 1");
  if (meeting.rows.length === 0) {
    const state = createInitialState();
    await db.execute({
      sql: "INSERT OR IGNORE INTO meeting (id, state, revision, updated_at) VALUES (1, ?, 0, ?)",
      args: [JSON.stringify(state), Date.now()]
    });
  }
  const time = await db.execute("SELECT id FROM time_state WHERE id = 1");
  if (time.rows.length === 0) {
    const now = Date.now();
    await db.execute({
      sql: `INSERT OR IGNORE INTO time_state
            (id, now_ms, rate, running, anchor_ms, crisis_paused, crisis_event_id, updated_at)
            VALUES (1, ?, 1, 0, ?, 0, NULL, ?)`,
      args: [now, now, now]
    });
  }
}
async function init() {
  const db = getDb();
  await db.batch(SCHEMA);
  await seed();
}
function ensureDb() {
  if (!initPromise) {
    initPromise = init().catch((error) => {
      initPromise = null;
      throw error;
    });
  }
  return initPromise;
}

// server/api/auth.ts
var SESSION_COOKIE = "mun_session";
var SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1e3;
function toUser(row) {
  return {
    id: row.id,
    username: row.username,
    name: row.name,
    role: row.role === "chair" ? "chair" : "delegate"
  };
}
var secureCookies = Boolean(process.env.VERCEL);
async function loginUser(c, usernameRaw, password) {
  const username = usernameRaw.trim();
  if (!username || !password) {
    throw new HTTPException(400, { message: "\u8BF7\u8F93\u5165\u8D26\u53F7\u548C\u5BC6\u7801" });
  }
  const db = getDb();
  const result = await db.execute({
    sql: "SELECT * FROM accounts WHERE username = ? LIMIT 1",
    args: [username]
  });
  const row = result.rows[0];
  if (!row || !verifyPassword(password, row.password)) {
    throw new HTTPException(401, { message: "\u8D26\u53F7\u6216\u5BC6\u7801\u9519\u8BEF" });
  }
  const token = randomBytes2(32).toString("hex");
  const expiresAt = Date.now() + SESSION_TTL_MS;
  await db.execute({
    sql: "DELETE FROM sessions WHERE expires_at < ?",
    args: [Date.now()]
  });
  await db.execute({
    sql: "INSERT INTO sessions (token, account_id, expires_at) VALUES (?, ?, ?)",
    args: [token, row.id, expiresAt]
  });
  setCookie(c, SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "Lax",
    path: "/",
    maxAge: Math.floor(SESSION_TTL_MS / 1e3),
    secure: secureCookies
  });
  return toUser(row);
}
async function logoutUser(c) {
  const token = getCookie(c, SESSION_COOKIE);
  if (token) {
    await getDb().execute({
      sql: "DELETE FROM sessions WHERE token = ?",
      args: [token]
    });
  }
  deleteCookie(c, SESSION_COOKIE, { path: "/" });
}
async function getSessionUser(c) {
  const token = getCookie(c, SESSION_COOKIE);
  if (!token) return null;
  const db = getDb();
  const result = await db.execute({
    sql: `SELECT a.id, a.username, a.name, a.role, s.expires_at
          FROM sessions s
          JOIN accounts a ON a.id = s.account_id
          WHERE s.token = ?
          LIMIT 1`,
    args: [token]
  });
  const row = result.rows[0];
  if (!row) return null;
  if (Number(row.expires_at) < Date.now()) {
    await db.execute({ sql: "DELETE FROM sessions WHERE token = ?", args: [token] });
    return null;
  }
  return toUser(row);
}
async function requireUser(c) {
  const user = await getSessionUser(c);
  if (!user) throw new HTTPException(401, { message: "\u8BF7\u5148\u767B\u5F55" });
  return user;
}
async function requireChair(c) {
  const user = await requireUser(c);
  if (user.role !== "chair") {
    throw new HTTPException(403, { message: "\u53EA\u6709\u4E3B\u5E2D\u53EF\u4EE5\u6267\u884C\u6B64\u64CD\u4F5C" });
  }
  return user;
}
async function setAccountPassword(accountId, password) {
  const db = getDb();
  await db.execute({
    sql: "UPDATE accounts SET password = ? WHERE id = ?",
    args: [hashPassword(password), accountId]
  });
  await db.execute({
    sql: "DELETE FROM sessions WHERE account_id = ?",
    args: [accountId]
  });
}

// server/api/time.ts
var DEFAULT_RATE = 1;
async function loadRow() {
  const db = getDb();
  const result = await db.execute("SELECT * FROM time_state WHERE id = 1 LIMIT 1");
  const row = result.rows[0];
  if (row) {
    return {
      now_ms: Number(row.now_ms),
      rate: Number(row.rate),
      running: Number(row.running),
      anchor_ms: Number(row.anchor_ms),
      crisis_paused: Number(row.crisis_paused),
      crisis_event_id: row.crisis_event_id ? String(row.crisis_event_id) : null,
      updated_at: Number(row.updated_at)
    };
  }
  const now = Date.now();
  await db.execute({
    sql: `INSERT OR IGNORE INTO time_state
          (id, now_ms, rate, running, anchor_ms, crisis_paused, crisis_event_id, updated_at)
          VALUES (1, ?, ?, 0, ?, 0, NULL, ?)`,
    args: [now, DEFAULT_RATE, now, now]
  });
  return {
    now_ms: now,
    rate: DEFAULT_RATE,
    running: 0,
    anchor_ms: now,
    crisis_paused: 0,
    crisis_event_id: null,
    updated_at: now
  };
}
function currentFromRow(row, at = Date.now()) {
  if (!row.running) return row.now_ms;
  return row.now_ms + Math.max(0, at - row.anchor_ms) * row.rate;
}
async function saveRow(row) {
  await getDb().execute({
    sql: `UPDATE time_state SET
            now_ms = ?, rate = ?, running = ?, anchor_ms = ?,
            crisis_paused = ?, crisis_event_id = ?, updated_at = ?
          WHERE id = 1`,
    args: [
      Math.round(row.now_ms),
      row.rate,
      row.running,
      row.anchor_ms,
      row.crisis_paused,
      row.crisis_event_id,
      row.updated_at
    ]
  });
}
async function getTimeState() {
  const row = await loadRow();
  const at = Date.now();
  return {
    nowMs: row.now_ms,
    rate: row.rate,
    running: row.running === 1,
    crisisPaused: row.crisis_paused === 1,
    crisisEventId: row.crisis_event_id,
    currentMs: Math.round(currentFromRow(row, at)),
    updatedAt: row.updated_at
  };
}
async function getCurrentTime() {
  const row = await loadRow();
  return Math.round(currentFromRow(row));
}
async function setCurrentTime(ms) {
  const row = await loadRow();
  const at = Date.now();
  await saveRow({
    ...row,
    now_ms: Math.round(ms),
    anchor_ms: at,
    updated_at: at
  });
}
async function startTimeFlow() {
  const row = await loadRow();
  const at = Date.now();
  await saveRow({
    ...row,
    now_ms: Math.round(currentFromRow(row, at)),
    anchor_ms: at,
    running: 1,
    updated_at: at
  });
}
async function pauseTimeFlow() {
  const row = await loadRow();
  const at = Date.now();
  await saveRow({
    ...row,
    now_ms: Math.round(currentFromRow(row, at)),
    anchor_ms: at,
    running: 0,
    updated_at: at
  });
}
async function setTimeRate(rate) {
  const row = await loadRow();
  const at = Date.now();
  await saveRow({
    ...row,
    now_ms: Math.round(currentFromRow(row, at)),
    anchor_ms: at,
    rate,
    updated_at: at
  });
}
async function pauseForCrisis(eventId) {
  const row = await loadRow();
  const at = Date.now();
  await saveRow({
    ...row,
    now_ms: Math.round(currentFromRow(row, at)),
    anchor_ms: at,
    running: 0,
    crisis_paused: 1,
    crisis_event_id: eventId,
    updated_at: at
  });
}
async function clearCrisisPause(eventId) {
  const row = await loadRow();
  if (row.crisis_paused !== 1) return false;
  if (eventId && row.crisis_event_id && row.crisis_event_id !== eventId) return false;
  await saveRow({
    ...row,
    crisis_paused: 0,
    crisis_event_id: null,
    updated_at: Date.now()
  });
  return true;
}

// server/api/events.ts
function toEventRow(row) {
  return {
    id: String(row.id),
    title: String(row.title),
    content: String(row.content),
    event_time: Number(row.event_time),
    is_crisis: Number(row.is_crisis),
    published_at: row.published_at === null ? null : Number(row.published_at),
    created_at: Number(row.created_at),
    created_by: String(row.created_by)
  };
}
async function publishDueEvents() {
  const db = getDb();
  const now = await getCurrentTime();
  const due = await db.execute({
    sql: "SELECT id, is_crisis FROM events WHERE published_at IS NULL AND event_time <= ?",
    args: [now]
  });
  for (const row of due.rows) {
    const eventId = String(row.id);
    const updated = await db.execute({
      sql: "UPDATE events SET published_at = ? WHERE id = ? AND published_at IS NULL",
      args: [Date.now(), eventId]
    });
    if (updated.rowsAffected > 0 && Number(row.is_crisis) === 1) {
      await pauseForCrisis(eventId);
    }
  }
}
async function getRecipients(eventId) {
  const result = await getDb().execute({
    sql: `SELECT r.account_id, r.read, COALESCE(a.name, '\u5DF2\u5220\u9664\u8D26\u53F7') AS name
          FROM event_recipients r
          LEFT JOIN accounts a ON a.id = r.account_id
          WHERE r.event_id = ?
          ORDER BY a.created_at ASC`,
    args: [eventId]
  });
  return result.rows.map((row) => ({
    accountId: String(row.account_id),
    name: String(row.name),
    read: Number(row.read) === 1
  }));
}
function baseEvent(row) {
  return {
    id: row.id,
    title: row.title,
    content: row.content,
    eventTime: row.event_time,
    isCrisis: row.is_crisis === 1,
    publishedAt: row.published_at,
    createdAt: row.created_at,
    createdBy: row.created_by
  };
}
async function listEventsForChair() {
  const result = await getDb().execute(
    "SELECT * FROM events ORDER BY event_time DESC, created_at DESC"
  );
  const events = [];
  for (const raw2 of result.rows) {
    const row = toEventRow(raw2);
    const recipients = await getRecipients(row.id);
    events.push({
      ...baseEvent(row),
      recipients,
      read: null,
      readCount: recipients.filter((item) => item.read).length,
      recipientCount: recipients.length
    });
  }
  return events;
}
async function listEventsForDelegate(user) {
  const result = await getDb().execute({
    sql: `SELECT e.*, r.read AS my_read
          FROM events e
          JOIN event_recipients r ON r.event_id = e.id
          WHERE r.account_id = ? AND e.published_at IS NOT NULL
          ORDER BY e.event_time DESC, e.created_at DESC`,
    args: [user.id]
  });
  return result.rows.map((raw2) => {
    const row = toEventRow(raw2);
    return {
      ...baseEvent(row),
      recipients: [],
      read: Number(raw2.my_read) === 1,
      readCount: Number(raw2.my_read) === 1 ? 1 : 0,
      recipientCount: 0
    };
  });
}
async function listEvents(user) {
  return user.role === "chair" ? listEventsForChair() : listEventsForDelegate(user);
}
async function replaceRecipients(eventId, recipientIds) {
  const db = getDb();
  await db.execute({
    sql: "DELETE FROM event_recipients WHERE event_id = ?",
    args: [eventId]
  });
  for (const accountId of recipientIds) {
    await db.execute({
      sql: "INSERT OR IGNORE INTO event_recipients (event_id, account_id, read) VALUES (?, ?, 0)",
      args: [eventId, accountId]
    });
  }
}
async function createEvent(user, input) {
  const db = getDb();
  const id = createId("evt");
  const createdAt = Date.now();
  await db.execute({
    sql: `INSERT INTO events
          (id, title, content, event_time, is_crisis, published_at, created_at, created_by)
          VALUES (?, ?, ?, ?, ?, NULL, ?, ?)`,
    args: [
      id,
      input.title,
      input.content,
      input.eventTime,
      input.isCrisis ? 1 : 0,
      createdAt,
      user.id
    ]
  });
  await replaceRecipients(id, input.recipientIds);
  await publishDueEvents();
  return id;
}
async function updateEvent(eventId, input) {
  const db = getDb();
  const existing = await db.execute({
    sql: "SELECT * FROM events WHERE id = ? LIMIT 1",
    args: [eventId]
  });
  const raw2 = existing.rows[0];
  if (!raw2) return false;
  const row = toEventRow(raw2);
  await db.execute({
    sql: `UPDATE events SET title = ?, content = ?, event_time = ?, is_crisis = ?
          WHERE id = ?`,
    args: [
      input.title,
      input.content,
      row.published_at ? row.event_time : input.eventTime,
      input.isCrisis ? 1 : 0,
      eventId
    ]
  });
  await replaceRecipients(eventId, input.recipientIds);
  if (row.published_at && !input.isCrisis) {
    await clearCrisisPause(eventId);
  }
  if (row.published_at && input.isCrisis) {
    await pauseForCrisis(eventId);
  }
  await publishDueEvents();
  return true;
}
async function deleteEvent(eventId) {
  const db = getDb();
  const existing = await db.execute({
    sql: "SELECT id FROM events WHERE id = ? LIMIT 1",
    args: [eventId]
  });
  if (existing.rows.length === 0) return false;
  await db.execute({ sql: "DELETE FROM event_recipients WHERE event_id = ?", args: [eventId] });
  await db.execute({ sql: "DELETE FROM events WHERE id = ?", args: [eventId] });
  await clearCrisisPause(eventId);
  return true;
}
async function setEventRead(user, eventId, read) {
  const db = getDb();
  const result = await db.execute({
    sql: "SELECT read FROM event_recipients WHERE event_id = ? AND account_id = ? LIMIT 1",
    args: [eventId, user.id]
  });
  if (result.rows.length === 0) return false;
  await db.execute({
    sql: "UPDATE event_recipients SET read = ? WHERE event_id = ? AND account_id = ?",
    args: [read ? 1 : 0, eventId, user.id]
  });
  return true;
}

// server/api/files.ts
function toFile(row) {
  return {
    id: String(row.id),
    title: String(row.title),
    filename: String(row.filename),
    mime: String(row.mime),
    size: Number(row.size),
    submittedAt: Number(row.submitted_at),
    submittedById: String(row.submitted_by),
    submittedByName: row.submitted_name ? String(row.submitted_name) : "\u5DF2\u5220\u9664\u8D26\u53F7",
    read: Number(row.read) === 1
  };
}
async function listFiles(user) {
  const db = getDb();
  const sql = user.role === "chair" ? `SELECT f.*, a.name AS submitted_name
       FROM files f LEFT JOIN accounts a ON a.id = f.submitted_by
       ORDER BY f.submitted_at DESC` : `SELECT f.*, a.name AS submitted_name
       FROM files f LEFT JOIN accounts a ON a.id = f.submitted_by
       WHERE f.submitted_by = ?
       ORDER BY f.submitted_at DESC`;
  const result = await db.execute(
    user.role === "chair" ? { sql } : { sql, args: [user.id] }
  );
  return result.rows.map((row) => toFile(row));
}
async function createFile(user, input) {
  const db = getDb();
  const id = createId("file");
  await db.execute({
    sql: `INSERT INTO files
          (id, title, filename, mime, size, data, submitted_by, submitted_at, read)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0)`,
    args: [
      id,
      input.title,
      input.filename,
      input.mime,
      input.size,
      input.bytes,
      user.id,
      Date.now()
    ]
  });
  return id;
}
async function getFileForDownload(user, fileId) {
  const db = getDb();
  const result = await db.execute({
    sql: `SELECT f.*, a.name AS submitted_name
          FROM files f LEFT JOIN accounts a ON a.id = f.submitted_by
          WHERE f.id = ? LIMIT 1`,
    args: [fileId]
  });
  const row = result.rows[0];
  if (!row) return null;
  const file = toFile(row);
  if (user.role !== "chair" && file.submittedById !== user.id) return null;
  const dataResult = await db.execute({
    sql: "SELECT data FROM files WHERE id = ? LIMIT 1",
    args: [fileId]
  });
  const data = dataResult.rows[0]?.data;
  if (!data) return null;
  const bytes = data instanceof Uint8Array ? data : data instanceof ArrayBuffer ? new Uint8Array(data) : new Uint8Array(Buffer.from(String(data), "base64"));
  return { file, bytes };
}
async function setFileRead(user, fileId, read) {
  if (user.role !== "chair") return false;
  const db = getDb();
  const result = await db.execute({
    sql: "SELECT id FROM files WHERE id = ? LIMIT 1",
    args: [fileId]
  });
  if (result.rows.length === 0) return false;
  await db.execute({
    sql: "UPDATE files SET read = ? WHERE id = ?",
    args: [read ? 1 : 0, fileId]
  });
  return true;
}

// src/lib/format.ts
function clampInt(value, min, max) {
  if (!Number.isFinite(value)) return min;
  return Math.min(max, Math.max(min, Math.round(value)));
}
function toInt(value, fallback = 0) {
  if (typeof value === "number") {
    return Number.isFinite(value) ? Math.trunc(value) : fallback;
  }
  const parsed = Number.parseInt(String(value ?? ""), 10);
  return Number.isFinite(parsed) ? parsed : fallback;
}

// src/state/reducer.ts
function clean(value, maxLength) {
  return value.trim().slice(0, maxLength);
}
function mapDelegation(state, id, updater) {
  return {
    ...state,
    delegations: state.delegations.map(
      (delegation) => delegation.id === id ? updater(delegation) : delegation
    )
  };
}
function baseReducer(state, action) {
  switch (action.type) {
    case "theme/set": {
      const theme = clean(action.theme, 80);
      if (!theme || theme === state.theme) return state;
      return { ...state, theme };
    }
    case "author/set": {
      const patch = action.patch;
      const author = {
        name: patch.name === void 0 ? state.author.name : clean(patch.name, 40) || state.author.name,
        xiaohongshuId: patch.xiaohongshuId === void 0 ? state.author.xiaohongshuId : clean(patch.xiaohongshuId, 40),
        xiaohongshuUrl: patch.xiaohongshuUrl === void 0 ? state.author.xiaohongshuUrl : clean(patch.xiaohongshuUrl, 200)
      };
      return { ...state, author };
    }
    case "attendanceRule/set":
      return state.attendanceRule === action.rule ? state : { ...state, attendanceRule: action.rule };
    case "delegation/add":
      return { ...state, delegations: [...state.delegations, action.delegation] };
    case "delegation/rename": {
      const name = clean(action.name, 40);
      if (!name) return state;
      return mapDelegation(
        state,
        action.id,
        (delegation) => delegation.name === name ? delegation : { ...delegation, name }
      );
    }
    case "delegation/delete":
      return {
        ...state,
        delegations: state.delegations.filter((delegation) => delegation.id !== action.id)
      };
    case "delegation/setVotes": {
      const votes = clampInt(action.votes, 0, 999);
      return mapDelegation(
        state,
        action.id,
        (delegation) => delegation.votes === votes ? delegation : { ...delegation, votes }
      );
    }
    case "delegation/toggleVeto":
      return mapDelegation(state, action.id, (delegation) => ({
        ...delegation,
        globalVeto: !delegation.globalVeto
      }));
    case "seat/add":
      return mapDelegation(state, action.delegationId, (delegation) => ({
        ...delegation,
        seats: [...delegation.seats, action.seat]
      }));
    case "seat/rename": {
      const name = clean(action.name, 30);
      if (!name) return state;
      return mapDelegation(state, action.delegationId, (delegation) => ({
        ...delegation,
        seats: delegation.seats.map(
          (seat) => seat.id === action.seatId ? seat.name === name ? seat : { ...seat, name } : seat
        )
      }));
    }
    case "seat/delete":
      return mapDelegation(state, action.delegationId, (delegation) => {
        if (delegation.seats.length <= 1) return delegation;
        return {
          ...delegation,
          seats: delegation.seats.filter((seat) => seat.id !== action.seatId)
        };
      });
    case "seat/togglePresent":
      return mapDelegation(state, action.delegationId, (delegation) => ({
        ...delegation,
        seats: delegation.seats.map(
          (seat) => seat.id === action.seatId ? { ...seat, present: !seat.present } : seat
        )
      }));
    case "session/add":
      return { ...state, sessions: [...state.sessions, action.session] };
    case "session/rename": {
      const name = clean(action.name, 40);
      if (!name) return state;
      return {
        ...state,
        sessions: state.sessions.map(
          (session) => session.id === action.id ? session.name === name ? session : { ...session, name } : session
        )
      };
    }
    case "session/delete": {
      const removed = state.sessions.find((session) => session.id === action.id);
      if (!removed) return state;
      const removedTopicIds = new Set(removed.topics.map((topic) => topic.id));
      const isCurrent = state.currentSessionId === action.id;
      return {
        ...state,
        sessions: state.sessions.filter((session) => session.id !== action.id),
        resolutions: state.resolutions.filter(
          (resolution) => resolution.sessionId !== action.id && !removedTopicIds.has(resolution.topicId)
        ),
        currentSessionId: isCurrent ? null : state.currentSessionId,
        currentTopicId: isCurrent ? null : state.currentTopicId
      };
    }
    case "topic/add":
      return {
        ...state,
        sessions: state.sessions.map(
          (session) => session.id === action.sessionId ? { ...session, topics: [...session.topics, action.topic] } : session
        )
      };
    case "topic/rename": {
      const name = clean(action.name, 60);
      if (!name) return state;
      return {
        ...state,
        sessions: state.sessions.map(
          (session) => session.id === action.sessionId ? {
            ...session,
            topics: session.topics.map(
              (topic) => topic.id === action.topicId ? topic.name === name ? topic : { ...topic, name } : topic
            )
          } : session
        )
      };
    }
    case "topic/delete":
      return {
        ...state,
        sessions: state.sessions.map(
          (session) => session.id === action.sessionId ? {
            ...session,
            topics: session.topics.filter((topic) => topic.id !== action.topicId)
          } : session
        ),
        resolutions: state.resolutions.filter(
          (resolution) => resolution.topicId !== action.topicId
        ),
        currentTopicId: state.currentTopicId === action.topicId ? null : state.currentTopicId
      };
    case "current/set": {
      const session = state.sessions.find((item) => item.id === action.sessionId);
      const topic = session?.topics.find((item) => item.id === action.topicId);
      if (!session || !topic) return state;
      return {
        ...state,
        currentSessionId: session.id,
        currentTopicId: topic.id
      };
    }
    case "current/clear":
      return { ...state, currentSessionId: null, currentTopicId: null };
    case "resolution/add":
      return { ...state, resolutions: [...state.resolutions, action.resolution] };
    case "resolution/rename": {
      const title = clean(action.title, 80);
      if (!title) return state;
      return {
        ...state,
        resolutions: state.resolutions.map(
          (resolution) => resolution.id === action.id ? resolution.title === title ? resolution : { ...resolution, title } : resolution
        )
      };
    }
    case "resolution/delete":
      return {
        ...state,
        resolutions: state.resolutions.filter(
          (resolution) => resolution.id !== action.id
        )
      };
    case "resolution/finish":
      return {
        ...state,
        resolutions: state.resolutions.map(
          (resolution) => resolution.id === action.id ? {
            ...resolution,
            result: action.result,
            status: action.result.passed ? "PASSED" : "FAILED"
          } : resolution
        )
      };
    case "settings/patch":
      return { ...state, settings: { ...state.settings, ...action.patch } };
    case "state/replace":
      return action.state;
    case "state/reset":
      return createInitialState();
    default:
      return state;
  }
}
function reducer(state, action) {
  const next = baseReducer(state, action);
  if (next === state) return state;
  return { ...next, updatedAt: Date.now() };
}

// src/lib/voting.ts
function tallyBallots(ballots) {
  let yesVotes = 0;
  let noVotes = 0;
  let abstainVotes = 0;
  let presentVotes = 0;
  for (const record of ballots) {
    if (record.ballot === "ABSENT") continue;
    presentVotes += record.votes;
    if (record.ballot === "YES") yesVotes += record.votes;
    else if (record.ballot === "NO") noVotes += record.votes;
    else abstainVotes += record.votes;
  }
  return {
    yesVotes,
    noVotes,
    abstainVotes,
    totalCast: yesVotes + noVotes,
    presentVotes
  };
}
function judgeVote(majority, vetoDelegationIds, ballots) {
  const tally = tallyBallots(ballots);
  const vetoedBy = ballots.filter(
    (record) => record.ballot === "NO" && (record.veto || vetoDelegationIds.includes(record.delegationId))
  ).map((record) => record.name);
  if (tally.totalCast <= 0) {
    return {
      ...tally,
      vetoedBy,
      passed: false,
      reason: "NO_VALID_VOTES"
    };
  }
  if (vetoedBy.length > 0) {
    return {
      ...tally,
      vetoedBy,
      passed: false,
      reason: "VETOED"
    };
  }
  let passed = false;
  switch (majority) {
    case "SIMPLE":
      passed = tally.yesVotes > tally.noVotes;
      break;
    case "TWO_THIRDS":
      passed = tally.yesVotes >= Math.ceil(tally.totalCast * 2 / 3);
      break;
    case "UNANIMOUS":
      passed = tally.noVotes === 0;
      break;
  }
  return {
    ...tally,
    vetoedBy,
    passed,
    reason: passed ? "MAJORITY_MET" : "MAJORITY_NOT_MET"
  };
}

// src/state/storage.ts
function isRecord(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
function asText(value) {
  return typeof value === "string" ? value : "";
}
function isAttendanceRule(value) {
  return value === "ALL" || value === "HALF" || value === "TWO_THIRDS";
}
function isMajorityRule(value) {
  return value === "SIMPLE" || value === "TWO_THIRDS" || value === "UNANIMOUS";
}
function isResolutionStatus(value) {
  return value === "PENDING" || value === "PASSED" || value === "FAILED";
}
function isBallot(value) {
  return value === "YES" || value === "NO" || value === "ABSTAIN" || value === "ABSENT";
}
function isVoteReason(value) {
  return value === "MAJORITY_MET" || value === "MAJORITY_NOT_MET" || value === "VETOED" || value === "NO_VALID_VOTES";
}
function normalizeSeat(value, index) {
  if (!isRecord(value)) return null;
  const name = asText(value.name).trim().slice(0, 30) || `\u4EE3\u8868 ${index + 1}`;
  return {
    id: asText(value.id) || createId("seat"),
    name,
    present: value.present === true
  };
}
function normalizeDelegation(value, index) {
  if (!isRecord(value)) return null;
  const name = asText(value.name).trim().slice(0, 40) || `\u672A\u547D\u540D\u4EE3\u8868\u56E2 ${index + 1}`;
  const rawSeats = Array.isArray(value.seats) ? value.seats : [];
  const seats = rawSeats.map((seat, seatIndex) => normalizeSeat(seat, seatIndex)).filter((seat) => seat !== null);
  if (seats.length === 0) {
    seats.push({ id: createId("seat"), name: "\u4EE3\u8868 1", present: false });
  }
  return {
    id: asText(value.id) || createId("dlg"),
    name,
    votes: clampInt(toInt(value.votes, 1), 0, 999),
    globalVeto: value.globalVeto === true,
    seats
  };
}
function normalizeTopic(value, index) {
  if (!isRecord(value)) return null;
  return {
    id: asText(value.id) || createId("topic"),
    name: asText(value.name).trim().slice(0, 60) || `\u8BAE\u9898 ${index + 1}`
  };
}
function normalizeSession(value, index) {
  if (!isRecord(value)) return null;
  const rawTopics = Array.isArray(value.topics) ? value.topics : [];
  return {
    id: asText(value.id) || createId("session"),
    name: asText(value.name).trim().slice(0, 40) || `\u7B2C ${index + 1} \u4F1A\u671F`,
    topics: rawTopics.map((topic, topicIndex) => normalizeTopic(topic, topicIndex)).filter((topic) => topic !== null)
  };
}
function normalizeBallot(value) {
  if (!isRecord(value)) return null;
  return {
    delegationId: asText(value.delegationId) || createId("dlg"),
    name: asText(value.name).trim().slice(0, 40) || "\u672A\u547D\u540D\u4EE3\u8868\u56E2",
    votes: clampInt(toInt(value.votes, 0), 0, 999),
    ballot: isBallot(value.ballot) ? value.ballot : "ABSENT",
    veto: value.veto === true
  };
}
function normalizeResult(value) {
  if (!isRecord(value)) return null;
  const majority = isMajorityRule(value.majority) ? value.majority : "SIMPLE";
  const rawBallots = Array.isArray(value.ballots) ? value.ballots : [];
  const ballots = rawBallots.map(normalizeBallot).filter((ballot) => ballot !== null);
  if (ballots.length === 0) return null;
  const vetoDelegationIds = Array.isArray(value.vetoDelegationIds) ? value.vetoDelegationIds.filter(
    (item) => typeof item === "string" && item.length > 0
  ) : [];
  const outcome = judgeVote(majority, vetoDelegationIds, ballots);
  return {
    majority,
    vetoDelegationIds,
    ballots,
    yesVotes: outcome.yesVotes,
    noVotes: outcome.noVotes,
    abstainVotes: outcome.abstainVotes,
    totalCast: outcome.totalCast,
    vetoedBy: outcome.vetoedBy,
    passed: outcome.passed,
    reason: isVoteReason(value.reason) && value.reason === outcome.reason ? value.reason : outcome.reason,
    votedAt: toInt(value.votedAt, Date.now())
  };
}
function normalizeResolution(value) {
  if (!isRecord(value)) return null;
  const sessionId = asText(value.sessionId);
  const topicId = asText(value.topicId);
  if (!sessionId || !topicId) return null;
  const result = normalizeResult(value.result);
  const status = result ? result.passed ? "PASSED" : "FAILED" : isResolutionStatus(value.status) && value.status === "PENDING" ? "PENDING" : "PENDING";
  return {
    id: asText(value.id) || createId("res"),
    title: asText(value.title).trim().slice(0, 80) || "\u672A\u547D\u540D\u51B3\u8BAE",
    sessionId,
    topicId,
    status,
    result,
    createdAt: toInt(value.createdAt, Date.now())
  };
}
function normalizeState(input) {
  if (!isRecord(input)) return null;
  if (!("theme" in input) && !("delegations" in input) && !("sessions" in input) && !("resolutions" in input)) {
    return null;
  }
  const fallback = createInitialState();
  const theme = asText(input.theme).trim().slice(0, 80) || fallback.theme || DEFAULT_THEME;
  const rawAuthor = isRecord(input.author) ? input.author : {};
  const author = {
    name: asText(rawAuthor.name).trim().slice(0, 40) || DEFAULT_AUTHOR.name,
    xiaohongshuId: asText(rawAuthor.xiaohongshuId).trim().slice(0, 40) || DEFAULT_AUTHOR.xiaohongshuId,
    xiaohongshuUrl: asText(rawAuthor.xiaohongshuUrl).trim().slice(0, 200)
  };
  const attendanceRule = isAttendanceRule(input.attendanceRule) ? input.attendanceRule : "ALL";
  const rawDelegations = Array.isArray(input.delegations) ? input.delegations : [];
  const delegations = rawDelegations.map((delegation, index) => normalizeDelegation(delegation, index)).filter((delegation) => delegation !== null);
  const rawSessions = Array.isArray(input.sessions) ? input.sessions : [];
  const sessions = rawSessions.map((session, index) => normalizeSession(session, index)).filter((session) => session !== null);
  const sessionById = new Map(sessions.map((session) => [session.id, session]));
  const topicOwner = /* @__PURE__ */ new Map();
  for (const session of sessions) {
    for (const topic of session.topics) topicOwner.set(topic.id, session.id);
  }
  let currentSessionId = asText(input.currentSessionId) || null;
  let currentTopicId = asText(input.currentTopicId) || null;
  if (currentSessionId && !sessionById.has(currentSessionId)) {
    currentSessionId = null;
  }
  if (currentTopicId) {
    const ownerId = topicOwner.get(currentTopicId);
    if (!ownerId) {
      currentTopicId = null;
    } else if (currentSessionId !== ownerId) {
      currentSessionId = ownerId;
    }
  }
  if (currentSessionId && !currentTopicId) {
  }
  const rawResolutions = Array.isArray(input.resolutions) ? input.resolutions : [];
  const resolutions = rawResolutions.map(normalizeResolution).filter(
    (resolution) => resolution !== null && topicOwner.get(resolution.topicId) === resolution.sessionId
  );
  const rawSettings = isRecord(input.settings) ? input.settings : {};
  const settings = {
    defaultMajority: isMajorityRule(rawSettings.defaultMajority) ? rawSettings.defaultMajority : DEFAULT_SETTINGS.defaultMajority,
    skipVetoStep: typeof rawSettings.skipVetoStep === "boolean" ? rawSettings.skipVetoStep : DEFAULT_SETTINGS.skipVetoStep,
    skipMajorityStep: typeof rawSettings.skipMajorityStep === "boolean" ? rawSettings.skipMajorityStep : DEFAULT_SETTINGS.skipMajorityStep
  };
  return {
    schemaVersion: SCHEMA_VERSION,
    theme,
    author,
    attendanceRule,
    delegations,
    sessions,
    currentSessionId,
    currentTopicId,
    resolutions,
    settings,
    updatedAt: toInt(input.updatedAt, Date.now())
  };
}

// server/api/meeting.ts
async function loadMeeting() {
  const result = await getDb().execute("SELECT state, revision FROM meeting WHERE id = 1");
  const row = result.rows[0];
  if (!row) {
    return { state: createInitialState(), revision: 0 };
  }
  let parsed;
  try {
    parsed = JSON.parse(String(row.state));
  } catch {
    parsed = null;
  }
  return {
    state: normalizeState(parsed) ?? createInitialState(),
    revision: Number(row.revision)
  };
}
async function applyConferenceAction(action) {
  const current = await loadMeeting();
  const next = reducer(current.state, action);
  const normalized = normalizeState(next) ?? next;
  const revision = current.revision + 1;
  await getDb().execute({
    sql: "UPDATE meeting SET state = ?, revision = ?, updated_at = ? WHERE id = 1",
    args: [JSON.stringify(normalized), revision, Date.now()]
  });
  return { state: normalized, revision };
}

// server/api/app.ts
var app = new Hono3();
function isHealthRequest(c) {
  return c.req.path === "/api/health" || c.req.path === "/api" && c.req.query("route") === "/health";
}
app.use("*", async (c, next) => {
  if (isHealthRequest(c)) return next();
  await ensureDb();
  await next();
});
app.get("/api/health", async (c) => {
  const env = {
    hasDatabaseUrl: Boolean(process.env.TURSO_DATABASE_URL),
    hasAuthToken: Boolean(process.env.TURSO_AUTH_TOKEN),
    vercel: Boolean(process.env.VERCEL),
    node: process.version
  };
  try {
    await ensureDb();
    const result = await getDb().execute("SELECT 1 AS ok");
    return c.json({
      ok: true,
      env,
      database: "ok",
      probe: Number(result.rows[0]?.ok ?? 0)
    });
  } catch (error) {
    console.error("[health]", error);
    return c.json(
      {
        ok: false,
        env,
        database: "error",
        error: error instanceof Error ? error.message : String(error)
      },
      500
    );
  }
});
app.all("/api", async (c) => {
  const route = c.req.query("route");
  if (!route || !route.startsWith("/")) {
    throw new HTTPException(400, { message: "\u7F3A\u5C11\u63A5\u53E3\u8DEF\u7531" });
  }
  const url = new URL(c.req.url);
  url.pathname = `/api${route}`;
  url.searchParams.delete("route");
  const request = new Request(url.toString(), {
    method: c.req.method,
    headers: c.req.raw.headers,
    body: c.req.method === "GET" || c.req.method === "HEAD" ? null : c.req.raw.body,
    // Node 的 fetch 在流式请求体上要求 duplex
    duplex: "half"
  });
  return app.fetch(request);
});
var ALLOWED_ACTIONS = /* @__PURE__ */ new Set([
  "theme/set",
  "author/set",
  "attendanceRule/set",
  "delegation/add",
  "delegation/rename",
  "delegation/delete",
  "delegation/setVotes",
  "delegation/toggleVeto",
  "seat/add",
  "seat/rename",
  "seat/delete",
  "seat/togglePresent",
  "session/add",
  "session/rename",
  "session/delete",
  "topic/add",
  "topic/rename",
  "topic/delete",
  "current/set",
  "current/clear",
  "resolution/add",
  "resolution/rename",
  "resolution/delete",
  "resolution/finish",
  "settings/patch",
  "state/replace",
  "state/reset"
]);
async function readJson(c) {
  try {
    const value = await c.req.json();
    if (!value || typeof value !== "object" || Array.isArray(value)) {
      throw new Error("not object");
    }
    return value;
  } catch {
    throw new HTTPException(400, { message: "\u8BF7\u6C42\u4F53\u683C\u5F0F\u9519\u8BEF" });
  }
}
function text(value, maxLength) {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
}
async function listAccounts() {
  const result = await getDb().execute(
    `SELECT id, username, name, role, created_at FROM accounts
     ORDER BY CASE role WHEN 'chair' THEN 0 ELSE 1 END, created_at ASC`
  );
  return result.rows.map((row) => ({
    id: String(row.id),
    username: String(row.username),
    name: String(row.name),
    role: row.role === "chair" ? "chair" : "delegate",
    createdAt: Number(row.created_at)
  }));
}
async function validateRecipients(ids) {
  if (!Array.isArray(ids)) return [];
  const unique = [...new Set(ids.filter((item) => typeof item === "string"))];
  if (unique.length === 0) return [];
  const placeholders = unique.map(() => "?").join(",");
  const result = await getDb().execute({
    sql: `SELECT id FROM accounts WHERE role = 'delegate' AND id IN (${placeholders})`,
    args: unique
  });
  const found = new Set(result.rows.map((row) => String(row.id)));
  return unique.filter((id) => found.has(id));
}
async function validateEventInput(body, currentTime) {
  const title = text(body.title, 80);
  const content = text(body.content, 8e3);
  if (!title) throw new HTTPException(400, { message: "\u4E8B\u4EF6\u6807\u9898\u4E0D\u80FD\u4E3A\u7A7A" });
  const eventTimeRaw = Number(body.eventTime);
  const eventTime = Number.isFinite(eventTimeRaw) && Math.abs(eventTimeRaw) <= 864e13 ? Math.round(eventTimeRaw) : currentTime;
  const isCrisis = body.isCrisis === true;
  const recipientIds = await validateRecipients(body.recipientIds);
  return { title, content, eventTime, isCrisis, recipientIds };
}
app.post("/api/auth/login", async (c) => {
  const body = await readJson(c);
  const user = await loginUser(c, text(body.username, 40), String(body.password ?? ""));
  return c.json({ me: user });
});
app.post("/api/auth/logout", async (c) => {
  await logoutUser(c);
  return c.json({ ok: true });
});
app.get("/api/auth/me", async (c) => {
  const user = await getSessionUser(c);
  return c.json({ me: user });
});
app.get("/api/bootstrap", async (c) => {
  const user = await requireUser(c);
  await publishDueEvents();
  const [meeting, time] = await Promise.all([loadMeeting(), getTimeState()]);
  const [events, files] = await Promise.all([listEvents(user), listFiles(user)]);
  const accounts = user.role === "chair" ? await listAccounts() : [];
  return c.json({
    me: user,
    conference: meeting.state,
    time,
    events,
    files,
    accounts,
    revision: meeting.revision,
    serverNow: Date.now()
  });
});
app.post("/api/conference/action", async (c) => {
  await requireChair(c);
  const body = await readJson(c);
  const action = body.action;
  if (!action || typeof action !== "object" || !ALLOWED_ACTIONS.has(String(action.type))) {
    throw new HTTPException(400, { message: "\u672A\u77E5\u64CD\u4F5C" });
  }
  try {
    const snapshot = await applyConferenceAction(action);
    return c.json({ conference: snapshot.state, revision: snapshot.revision });
  } catch (error) {
    console.error("[conference action]", error);
    throw new HTTPException(400, { message: "\u64CD\u4F5C\u672A\u80FD\u5B8C\u6210" });
  }
});
app.post("/api/time", async (c) => {
  await requireChair(c);
  const body = await readJson(c);
  const action = String(body.action ?? "");
  const value = Number(body.value);
  if (action === "set") {
    if (!Number.isFinite(value) || Math.abs(value) > 864e13) {
      throw new HTTPException(400, { message: "\u65F6\u95F4\u683C\u5F0F\u4E0D\u6B63\u786E" });
    }
    await setCurrentTime(value);
  } else if (action === "start") {
    await startTimeFlow();
  } else if (action === "pause") {
    await pauseTimeFlow();
  } else if (action === "rate") {
    if (!Number.isFinite(value) || value <= 0 || value > 1e3) {
      throw new HTTPException(400, { message: "\u6D41\u901F\u9700\u5728 0\u20131000 \u4E4B\u95F4" });
    }
    await setTimeRate(value);
  } else if (action === "clearCrisis") {
    await clearCrisisPause();
  } else {
    throw new HTTPException(400, { message: "\u672A\u77E5\u65F6\u95F4\u64CD\u4F5C" });
  }
  await publishDueEvents();
  return c.json({ time: await getTimeState() });
});
app.post("/api/events", async (c) => {
  const user = await requireChair(c);
  const body = await readJson(c);
  const current = await getTimeState();
  const input = await validateEventInput(body, current.currentMs);
  const id = await createEvent(user, input);
  return c.json({ id, time: await getTimeState() });
});
app.patch("/api/events/:id", async (c) => {
  await requireChair(c);
  const body = await readJson(c);
  const current = await getTimeState();
  const input = await validateEventInput(body, current.currentMs);
  const ok = await updateEvent(c.req.param("id"), input);
  if (!ok) throw new HTTPException(404, { message: "\u4E8B\u4EF6\u4E0D\u5B58\u5728" });
  return c.json({ ok: true, time: await getTimeState() });
});
app.delete("/api/events/:id", async (c) => {
  await requireChair(c);
  const ok = await deleteEvent(c.req.param("id"));
  if (!ok) throw new HTTPException(404, { message: "\u4E8B\u4EF6\u4E0D\u5B58\u5728" });
  return c.json({ ok: true, time: await getTimeState() });
});
app.post("/api/events/:id/read", async (c) => {
  const user = await requireUser(c);
  const body = await readJson(c);
  const ok = await setEventRead(user, c.req.param("id"), body.read === true);
  if (!ok) throw new HTTPException(404, { message: "\u6CA1\u6709\u627E\u5230\u8BE5\u4E8B\u4EF6" });
  return c.json({ ok: true });
});
var MAX_FILE_SIZE = 2 * 1024 * 1024;
app.post("/api/files", async (c) => {
  const user = await requireUser(c);
  let form;
  try {
    form = await c.req.formData();
  } catch {
    throw new HTTPException(400, { message: "\u6587\u4EF6\u4E0A\u4F20\u683C\u5F0F\u9519\u8BEF" });
  }
  const file = form.get("file");
  if (!file || typeof file === "string" || !("arrayBuffer" in file)) {
    throw new HTTPException(400, { message: "\u8BF7\u9009\u62E9\u8981\u63D0\u4EA4\u7684\u6587\u4EF6" });
  }
  const actual = file;
  if (actual.size <= 0) throw new HTTPException(400, { message: "\u6587\u4EF6\u4E3A\u7A7A" });
  if (actual.size > MAX_FILE_SIZE) {
    throw new HTTPException(400, { message: "\u6587\u4EF6\u4E0D\u80FD\u8D85\u8FC7 2 MB" });
  }
  const title = text(form.get("title"), 80) || actual.name;
  const bytes = new Uint8Array(await actual.arrayBuffer());
  await createFile(user, {
    title,
    filename: actual.name.slice(0, 200),
    mime: actual.type || "application/octet-stream",
    size: actual.size,
    bytes
  });
  return c.json({ ok: true });
});
app.get("/api/files/:id/download", async (c) => {
  const user = await requireUser(c);
  const found = await getFileForDownload(user, c.req.param("id"));
  if (!found) throw new HTTPException(404, { message: "\u6587\u4EF6\u4E0D\u5B58\u5728\u6216\u65E0\u6743\u4E0B\u8F7D" });
  const encoded = encodeURIComponent(found.file.filename);
  const body = new Blob([found.bytes], {
    type: found.file.mime
  });
  return new Response(body, {
    headers: {
      "Content-Type": found.file.mime,
      "Content-Length": String(found.file.size),
      "Content-Disposition": `attachment; filename*=UTF-8''${encoded}`,
      "Cache-Control": "private, no-store"
    }
  });
});
app.post("/api/files/:id/read", async (c) => {
  const user = await requireChair(c);
  const body = await readJson(c);
  const ok = await setFileRead(user, c.req.param("id"), body.read === true);
  if (!ok) throw new HTTPException(404, { message: "\u6587\u4EF6\u4E0D\u5B58\u5728" });
  return c.json({ ok: true });
});
app.post("/api/accounts", async (c) => {
  await requireChair(c);
  const body = await readJson(c);
  const username = text(body.username, 32);
  const password = String(body.password ?? "");
  const name = text(body.name, 40) || username;
  if (username.length < 2) throw new HTTPException(400, { message: "\u8D26\u53F7\u81F3\u5C11 2 \u4E2A\u5B57\u7B26" });
  if (password.length < 4) throw new HTTPException(400, { message: "\u5BC6\u7801\u81F3\u5C11 4 \u4E2A\u5B57\u7B26" });
  const db = getDb();
  const exists = await db.execute({
    sql: "SELECT id FROM accounts WHERE username = ? LIMIT 1",
    args: [username]
  });
  if (exists.rows.length > 0) {
    throw new HTTPException(409, { message: "\u8BE5\u8D26\u53F7\u5DF2\u5B58\u5728" });
  }
  await db.execute({
    sql: `INSERT INTO accounts (id, username, password, name, role, created_at)
          VALUES (?, ?, ?, ?, 'delegate', ?)`,
    args: [createId("acc"), username, hashPassword(password), name, Date.now()]
  });
  return c.json({ ok: true });
});
app.patch("/api/accounts/:id", async (c) => {
  const chair = await requireChair(c);
  const id = c.req.param("id");
  const body = await readJson(c);
  const db = getDb();
  const target = await db.execute({
    sql: "SELECT * FROM accounts WHERE id = ? LIMIT 1",
    args: [id]
  });
  if (target.rows.length === 0) throw new HTTPException(404, { message: "\u8D26\u53F7\u4E0D\u5B58\u5728" });
  const name = text(body.name, 40);
  if (name) {
    await db.execute({ sql: "UPDATE accounts SET name = ? WHERE id = ?", args: [name, id] });
  }
  if (typeof body.password === "string" && body.password.length > 0) {
    if (body.password.length < 4) {
      throw new HTTPException(400, { message: "\u5BC6\u7801\u81F3\u5C11 4 \u4E2A\u5B57\u7B26" });
    }
    await setAccountPassword(id, body.password);
    if (id === chair.id) {
      await logoutUser(c);
    }
  }
  return c.json({ ok: true });
});
app.delete("/api/accounts/:id", async (c) => {
  const chair = await requireChair(c);
  const id = c.req.param("id");
  if (id === chair.id) throw new HTTPException(400, { message: "\u4E0D\u80FD\u5220\u9664\u5F53\u524D\u767B\u5F55\u8D26\u53F7" });
  const db = getDb();
  const target = await db.execute({
    sql: "SELECT role FROM accounts WHERE id = ? LIMIT 1",
    args: [id]
  });
  if (target.rows.length === 0) throw new HTTPException(404, { message: "\u8D26\u53F7\u4E0D\u5B58\u5728" });
  if (target.rows[0].role === "chair") {
    throw new HTTPException(400, { message: "\u4E0D\u80FD\u5220\u9664\u4E3B\u5E2D\u8D26\u53F7" });
  }
  await db.execute({ sql: "DELETE FROM sessions WHERE account_id = ?", args: [id] });
  await db.execute({ sql: "DELETE FROM event_recipients WHERE account_id = ?", args: [id] });
  await db.execute({ sql: "DELETE FROM accounts WHERE id = ?", args: [id] });
  return c.json({ ok: true });
});
app.notFound((c) => c.json({ error: "\u63A5\u53E3\u4E0D\u5B58\u5728" }, 404));
app.onError((error, c) => {
  if (error instanceof HTTPException) {
    return c.json({ error: error.message || "\u8BF7\u6C42\u5931\u8D25" }, error.status);
  }
  console.error("[api]", error);
  return c.json({ error: error instanceof Error ? error.message : "\u670D\u52A1\u5668\u9519\u8BEF" }, 500);
});

// server/vercel-handler.ts
var handler = (request) => app.fetch(request);
var GET = handler;
var HEAD = handler;
var POST = handler;
var PUT = handler;
var PATCH = handler;
var DELETE = handler;
var OPTIONS = handler;
export {
  DELETE,
  GET,
  HEAD,
  OPTIONS,
  PATCH,
  POST,
  PUT
};
