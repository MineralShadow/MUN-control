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
  async batch(statements, mode, queryOptions, safeIntegers = false, raw = false) {
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
      return stepResult ? this.decodeBatchStepResult(stepResult, safeIntegers, raw) : null;
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
  decodeBatchStepResult(stepResult, safeIntegers, raw) {
    const columns = (stepResult.cols ?? []).map((col) => col.name ?? "");
    const columnTypes = (stepResult.cols ?? []).map((col) => col.decltype || "");
    const rows = (stepResult.rows ?? []).map((row) => {
      const decoded = row.map((value) => decodeValue(value, safeIntegers));
      return raw ? decoded : this.createObjectRow(decoded, columns);
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
      const { mode, raw } = this.normalizeBatchOptions(options);
      const batchMode = mode ?? "deferred";
      const results = await this.session.batch(
        stmts,
        batchMode,
        void 0,
        this._defaultSafeIntegers,
        raw
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
var SCHEMA_VERSION = 2;
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
    voteMode: "DELEGATION",
    delegations: [],
    sessions: [],
    currentSessionId: null,
    currentTopicId: null,
    resolutions: [],
    settings: { ...DEFAULT_SETTINGS },
    updatedAt: Date.now()
  };
}

// server/api/password.ts
import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
function hashPassword(password) {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

// server/api/db.ts
var SCHEMA = [
  `CREATE TABLE IF NOT EXISTS accounts (
    id TEXT PRIMARY KEY,
    username TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    name TEXT NOT NULL,
    role TEXT NOT NULL,
    seat_id TEXT,
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
    visibility TEXT NOT NULL DEFAULT 'SECRET',
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
  `CREATE TABLE IF NOT EXISTS event_reads (
    event_id TEXT NOT NULL,
    account_id TEXT NOT NULL,
    read INTEGER NOT NULL DEFAULT 0,
    PRIMARY KEY (event_id, account_id)
  )`,
  `CREATE TABLE IF NOT EXISTS archives (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    created_at INTEGER NOT NULL,
    data BLOB NOT NULL
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
async function ensureColumn(table, column, definition) {
  const db = getDb();
  const info = await db.execute(`PRAGMA table_info(${table})`);
  if (!info.rows.some((row) => String(row.name) === column)) {
    await db.execute(`ALTER TABLE ${table} ADD COLUMN ${definition}`);
  }
}
async function init() {
  const db = getDb();
  await db.batch(SCHEMA);
  await ensureColumn("accounts", "seat_id", "seat_id TEXT");
  await ensureColumn(
    "events",
    "visibility",
    "visibility TEXT NOT NULL DEFAULT 'SECRET'"
  );
  await db.execute(
    `INSERT OR IGNORE INTO event_reads (event_id, account_id, read)
     SELECT event_id, account_id, read FROM event_recipients`
  );
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
async function getCurrentTime() {
  const row = await loadRow();
  return Math.round(currentFromRow(row));
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

// server/api/events.ts
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

// server/cron-handler.ts
var handler = async (request) => {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const auth = request.headers.get("authorization") ?? "";
    if (auth !== `Bearer ${secret}`) {
      return Response.json({ ok: false, error: "unauthorized" }, { status: 401 });
    }
  }
  await ensureDb();
  await publishDueEvents();
  return Response.json({ ok: true, at: Date.now() });
};
var GET = handler;
var POST = handler;
export {
  GET,
  POST
};
