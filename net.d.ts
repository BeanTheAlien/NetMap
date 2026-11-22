type AnyMap = {
    [x: string]: any;
};
type FormalMethod = "GET" | "POST" | "PUT" | "DELETE";
type InformalMethod = "get" | "post" | "put" | "delete" | FormalMethod;
interface NativeDTMap {
    text: string;
    varchar: string;
    varbinary: string;
    bit: 0 | 1 | null;
    json: object;
    uuid: string;
    date: `${string}-${string}-${string}`;
    time: `${number}${number}:${number}${number}:${number}${number}`;
}
type __PostgreSQLRawTime = `${number}${number}:${number}${number}` | `${number}${number}`;
type __PostgreSQLTimeZone = `+${__PostgreSQLRawTime}` | `-${__PostgreSQLRawTime}`;
interface SQLDTMap extends NativeDTMap {
    timestamp: number;
    datetime: `${NativeDTMap["date"]} ${NativeDTMap["time"]}`;
    numeric: number;
    datetime2: `${NativeDTMap["date"]} ${NativeDTMap["time"]}` | `${NativeDTMap["date"]} ${NativeDTMap["time"]}.${number}`;
    smalldatetime: `${NativeDTMap["date"]} ${NativeDTMap["time"]}`;
    datetimeoffset: `${NativeDTMap["date"]} ${NativeDTMap["time"]}${__PostgreSQLTimeZone}`;
}
interface MySQLDTMap extends NativeDTMap {
    timestamp: `${NativeDTMap["date"]} ${NativeDTMap["time"]}`;
    datetime: `${NativeDTMap["date"]} ${NativeDTMap["time"]}`;
    bool: boolean;
    boolean: boolean;
    decimal: number;
    year: string;
}
interface PostgreSQLDTMap extends Omit<NativeDTMap, "time"> {
    time: NativeDTMap["time"] | `${NativeDTMap["time"]}.${number}`;
    timetz: `${PostgreSQLDTMap["time"]}${__PostgreSQLTimeZone}`;
    timestamp: `${NativeDTMap["date"]} ${PostgreSQLDTMap["time"]}`;
    timestamptz: `${PostgreSQLDTMap["timestamp"]}${__PostgreSQLTimeZone}`;
    numeric: number;
    bool: boolean;
    bytea: string;
    jsonb: object;
}
interface DataTypesMap {
    sql: SQLDTMap;
    mysql: MySQLDTMap;
    postgresql: PostgreSQLDTMap;
}
type DataTypes = {
    [M in keyof DataTypesMap]: keyof DataTypesMap[M];
};
interface BasicDataTypesMap {
    string: string;
    num: number;
    bool: boolean;
    json: BasicTypeRecord | Record<string, unknown>;
}
interface MoreDataTypesMap {
    email: `${string}@${string}.${string}`;
}
type SQLTypeMapDef = {
    [M in keyof DataTypesMap]: {
        readonly style: M;
        readonly map: Readonly<Record<string, DataTypes[M]>>;
    };
}[keyof DataTypesMap];
type BasicTypeMapDef = {
    readonly style: "basic";
    readonly map: BasicTypeRecord;
};
type MoreTypesMapDef = {
    readonly style: "more";
    readonly map: MoreDataTypesMap;
};
type TypeMapDef = SQLTypeMapDef | BasicTypeMapDef | MoreTypesMapDef;
type RouteDef = TypeMapDef | readonly [TypeMapDef, TypeMapDef];
type RoutesSchema = Readonly<Record<string, RouteDef>>;
type Prettify<T> = {
    [K in keyof T]: T[K];
} & {};
type DefFieldType<T> = Extract<keyof T, string | number> | `${Extract<keyof T, string | number>}[]` | `${Extract<keyof T, string | number>}?`;
type BasicFieldType = DefFieldType<BasicDataTypesMap>;
type BasicTypeRecord = {
    readonly [key: string]: BasicFieldType | BasicTypeRecord;
};
type MoreFieldType = DefFieldType<MoreDataTypesMap>;
type MoreTypeRecord = {
    readonly [x: string]: MoreFieldType | MoreTypeRecord;
};
type ResolveBasicValue<V> = V extends `${infer Base extends keyof BasicDataTypesMap}[]` ? BasicDataTypesMap[Base][] : V extends `${infer Base extends keyof BasicDataTypesMap}?` ? BasicDataTypesMap[Base] : V extends keyof BasicDataTypesMap ? BasicDataTypesMap[V] : V extends BasicTypeRecord ? FromBasicTypeMap<V> : never;
type ResolveMoreValue<V> = V extends `${infer Base extends keyof MoreDataTypesMap}[]` ? MoreDataTypesMap[Base][] : V extends `${infer Base extends keyof MoreDataTypesMap}?` ? MoreDataTypesMap[Base] : V extends keyof MoreDataTypesMap ? MoreDataTypesMap[V] : V extends MoreTypeRecord ? FromMoreTypeMap<V> : never;
type FromBasicTypeMap<T extends BasicTypeRecord> = Prettify<{
    -readonly [X in keyof T as T[X] extends `${string}?` ? never : X]: ResolveBasicValue<T[X]>;
} & {
    -readonly [X in keyof T as T[X] extends `${string}?` ? X : never]?: ResolveBasicValue<T[X]>;
}>;
type FromMoreTypeMap<T extends MoreTypeRecord> = Prettify<{
    -readonly [X in keyof T as T[X] extends `${string}?` ? never : X]: ResolveMoreValue<T[X]>;
} & {
    -readonly [X in keyof T as T[X] extends `${string}?` ? X : never]?: ResolveMoreValue<T[X]>;
}>;
type SQLFieldType<M extends keyof DataTypesMap> = DataTypes[M] | `${DataTypes[M]}?`;
type ResolveSQLValue<M extends keyof DataTypesMap, V> = V extends `${infer Base extends DataTypes[M]}?` ? DataTypesMap[M][Base] : V extends DataTypes[M] ? DataTypesMap[M][V] : never;
type FromSchemaMap<M extends keyof DataTypesMap, T extends Readonly<Record<string, SQLFieldType<M>>>> = Prettify<{
    -readonly [X in keyof T as T[X] extends `${string}?` ? never : X]: ResolveSQLValue<M, T[X]>;
} & {
    -readonly [X in keyof T as T[X] extends `${string}?` ? X : never]?: ResolveSQLValue<M, T[X]>;
}>;
type ResolveTypeMapDef<D extends TypeMapDef> = D extends {
    readonly style: "basic";
    readonly map: infer M extends BasicTypeRecord;
} ? FromBasicTypeMap<M> : D extends {
    readonly style: "more";
    readonly map: infer M extends MoreTypeRecord;
} ? FromMoreTypeMap<M> : {
    [S in keyof DataTypesMap]: D extends {
        readonly style: S;
        readonly map: infer M extends Readonly<Record<string, DataTypes[S]>>;
    } ? FromSchemaMap<S, M> : never;
}[keyof DataTypesMap];
type FromRoutesSchema<S extends RoutesSchema> = {
    -readonly [K in keyof S]: S[K] extends readonly [
        infer Pay extends TypeMapDef,
        infer Res extends TypeMapDef
    ] ? [ResolveTypeMapDef<Pay>, ResolveTypeMapDef<Res>] : S[K] extends TypeMapDef ? ResolveTypeMapDef<S[K]> : never;
};
type ResolveRoutes<T> = (0 extends 1 & T[keyof T] ? T : T extends RoutesSchema ? FromRoutesSchema<T> : T) & AnyMap;
/**
 * Source for requests through the Fetch API.
 *
 * Useful for reducing overhead boilerplate and streamlining requests.
 *
 * @example Using `Net` with a server.
 * ```
 * import { Net } from "@beanthealien/net";
 * // create a Net object with the base URL
 * // pointing to the BeanTheAlien Server
 * const net = new Net("https://beanthealien-server.onrender.com/");
 * // assuming we're logged in on BeanTheAlien.github.io
 * // printing "/getuser" should print the active user
 * // since "/getuser" returns a JSON object, we can use
 * // the json method to get a JSON object returned
 * const user = await net.json("getuser");
 * console.log(user);
 * ```
 */
declare class Net {
    /**
     * The base URL to use.
     *
     * @example Pointing the URL to different locations.
     * ```
     * import { Net } from "@beanthealien/net";
     * const net = new Net();
     * // point at BeanTheAlien Server
     * net.url = "https://beanthealien-server.onrender.com/";
     * // ...now point at Cool Math Games
     * net.url = "https://coolmathgames.com/";
     * // ...finally, point at BeanTheAlien
     * net.url = "https://beanthealien.github.io/";
     * ```
     */
    url: string;
    /**
     * The default headers to use.
     *
     * @example Setting default headers.
     * ```
     * import { Net } from "@beanthealien/net";
     * const net = new Net();
     * // use some default headers
     * net.headers = {
     *  "credentials": "include",
     *  "headers": {
     *      "Content-Type": "application/json"
     *  }
     * };
     * ```
     */
    headers: RequestInit;
    /**
     * Creates a net object.
     * @default url ""
     * @default headers { "credentials": "include", "headers": { "Content-Type": "application/json" } }
     */
    constructor();
    /**
     * Creates a net object with a URL.
     * @param baseURL The URL to use.
     * @default headers { "credentials": "include", "headers": { "Content-Type": "application/json" } }
     */
    constructor(baseURL: string);
    /**
     * Creates a net object with a URL.
     * @param baseURL The URL to use.
     * @default headers { "credentials": "include", "headers": { "Content-Type": "application/json" } }
     */
    constructor(baseURL: URL);
    /**
     * Creates a net object with headers.
     * @param defaultHeaders The headers to use.
     * @default url ""
     */
    constructor(defaultHeaders: RequestInit);
    /**
     * Creates a net object with headers.
     * @param defaultHeaders The headers to use.
     * @default url ""
     */
    constructor(defaultHeaders: AnyMap);
    /**
     * Creates a net object with a URL and headers.
     * @param baseURL The URL to use.
     * @param defaultHeaders The headers to use.
     */
    constructor(baseURL: string, defaultHeaders: RequestInit);
    /**
     * Creates a net object with a URL and headers.
     * @param baseURL The URL to use.
     * @param defaultHeaders The headers to use.
     */
    constructor(baseURL: URL, defaultHeaders: RequestInit);
    /**
     * Creates a net object with a URL and headers.
     * @param baseURL The URL to use.
     * @param defaultHeaders The headers to use.
     */
    constructor(baseURL: string, defaultHeaders: AnyMap);
    /**
     * Creates a net object with a URL and headers.
     * @param baseURL The URL to use.
     * @param defaultHeaders The headers to use.
     */
    constructor(baseURL: URL, defaultHeaders: AnyMap);
    isRequestInit(h: AnyMap): h is RequestInit;
    isMethod(m: any): m is InformalMethod;
    formURL(url: string): string;
    formHeaders(method: FormalMethod, headers?: RequestInit): RequestInit;
    /**
     * Sends a GET request to the URL provided.
     *
     * Uses the syntax `${baseURL}${url}`.
     * @param url The URL to request.
     */
    get(url: string): Promise<Response>;
    /**
     * Sends a GET request to the URL provided.
     *
     * Uses the syntax `${baseURL}${url}`.
     * @param url The URL to request.
     */
    get(url: URL): Promise<Response>;
    /**
     * Sends a GET request to the URL provided.
     *
     * Uses the syntax `${baseURL}${url}`.
     * @param url The URL to request.
     * @param headers The headers to include.
     */
    get(url: string, headers: RequestInit): Promise<Response>;
    /**
     * Sends a GET request to the URL provided.
     *
     * Uses the syntax `${baseURL}${url}`.
     * @param url The URL to request.
     * @param headers The headers to include.
     */
    get(url: URL, headers: RequestInit): Promise<Response>;
    /**
     * Sends a POST request to the URL provided.
     *
     * Uses the syntax `${baseURL}${url}`.
     * @param url The URL to request.
     */
    post(url: string): Promise<Response>;
    /**
     * Sends a POST request to the URL provided.
     *
     * Uses the syntax `${baseURL}${url}`.
     * @param url The URL to request.
     */
    post(url: URL): Promise<Response>;
    /**
     * Sends a POST request to the URL provided.
     *
     * Uses the syntax `${baseURL}${url}`.
     * @param url The URL to request.
     * @param headers The headers to include.
     */
    post(url: string, headers: RequestInit): Promise<Response>;
    /**
     * Sends a POST request to the URL provided.
     *
     * Uses the syntax `${baseURL}${url}`.
     * @param url The URL to request.
     * @param headers The headers to include.
     */
    post(url: URL, headers: RequestInit): Promise<Response>;
    /**
     * Sends a PUT request to the URL provided.
     *
     * Uses the syntax `${baseURL}${url}`.
     * @param url The URL to request.
     */
    put(url: string): Promise<Response>;
    /**
     * Sends a PUT request to the URL provided.
     *
     * Uses the syntax `${baseURL}${url}`.
     * @param url The URL to request.
     */
    put(url: URL): Promise<Response>;
    /**
     * Sends a PUT request to the URL provided.
     *
     * Uses the syntax `${baseURL}${url}`.
     * @param url The URL to request.
     * @param headers The headers to include.
     */
    put(url: string, headers: RequestInit): Promise<Response>;
    /**
     * Sends a PUT request to the URL provided.
     *
     * Uses the syntax `${baseURL}${url}`.
     * @param url The URL to request.
     * @param headers The headers to include.
     */
    put(url: URL, headers: RequestInit): Promise<Response>;
    /**
     * Sends a DELETE request to the URL provided.
     *
     * Uses the syntax `${baseURL}${url}`.
     * @param url The URL to request.
     */
    del(url: string): Promise<Response>;
    /**
     * Sends a DELETE request to the URL provided.
     *
     * Uses the syntax `${baseURL}${url}`.
     * @param url The URL to request.
     */
    del(url: URL): Promise<Response>;
    /**
     * Sends a DELETE request to the URL provided.
     *
     * Uses the syntax `${baseURL}${url}`.
     * @param url The URL to request.
     * @param headers The headers to include.
     */
    del(url: string, headers: RequestInit): Promise<Response>;
    /**
     * Sends a DELETE request to the URL provided.
     *
     * Uses the syntax `${baseURL}${url}`.
     * @param url The URL to request.
     * @param headers The headers to include.
     */
    del(url: URL, headers: RequestInit): Promise<Response>;
    __prepare(arg1?: InformalMethod | RequestInit, arg2?: InformalMethod | RequestInit): [InformalMethod, RequestInit];
    __send(url: string | URL, arg1?: InformalMethod | RequestInit, arg2?: InformalMethod | RequestInit): Promise<Response>;
    /**
     * Sends a POST request to the URL provided.
     *
     * Uses the syntax `${baseURL}${url}`.
     *
     * Returns the response's text.
     * @param url The URL to request.
     */
    text(url: string): Promise<string>;
    /**
     * Sends a POST request to the URL provided.
     *
     * Uses the syntax `${baseURL}${url}`.
     *
     * Returns the response's text.
     * @param url The URL to request.
     */
    text(url: URL): Promise<string>;
    /**
     * Sends a POST request to the URL provided.
     *
     * Uses the syntax `${baseURL}${url}`.
     *
     * Returns the response's text.
     * @param url The URL to request.
     * @param headers The headers to include.
     */
    text(url: string, headers: RequestInit): Promise<string>;
    /**
     * Sends a POST request to the URL provided.
     *
     * Uses the syntax `${baseURL}${url}`.
     *
     * Returns the response's text.
     * @param url The URL to request.
     * @param headers The headers to include.
     */
    text(url: URL, headers: RequestInit): Promise<string>;
    /**
     * Sends a request to the URL provided.
     *
     * Uses the syntax `${baseURL}${url}`.
     *
     * Returns the response's text.
     * @param url The URL to request.
     * @param method The method to use (GET/POST).
     */
    text(url: string, method: InformalMethod): Promise<string>;
    /**
     * Sends a request to the URL provided.
     *
     * Uses the syntax `${baseURL}${url}`.
     *
     * Returns the response's text.
     * @param url The URL to request.
     * @param method The method to use (GET/POST).
     */
    text(url: URL, method: InformalMethod): Promise<string>;
    /**
     * Sends a request to the URL provided.
     *
     * Uses the syntax `${baseURL}${url}`.
     *
     * Returns the response's text.
     * @param url The URL to request.
     * @param headers The headers to include.
     * @param method The method to use (GET/POST).
     */
    text(url: string, headers: RequestInit, method: InformalMethod): Promise<string>;
    /**
     * Sends a request to the URL provided.
     *
     * Uses the syntax `${baseURL}${url}`.
     *
     * Returns the response's text.
     * @param url The URL to request.
     * @param headers The headers to include.
     * @param method The method to use (GET/POST).
     */
    text(url: URL, headers: RequestInit, method: InformalMethod): Promise<string>;
    /**
     * Sends a request to the URL provided.
     *
     * Uses the syntax `${baseURL}${url}`.
     *
     * Returns the response's text.
     * @param url The URL to request.
     * @param method The method to use (GET/POST).
     * @param headers The headers to include.
     */
    text(url: string, method: InformalMethod, headers: RequestInit): Promise<string>;
    /**
     * Sends a request to the URL provided.
     *
     * Uses the syntax `${baseURL}${url}`.
     *
     * Returns the response's text.
     * @param url The URL to request.
     * @param method The method to use (GET/POST).
     * @param headers The headers to include.
     */
    text(url: URL, method: InformalMethod, headers: RequestInit): Promise<string>;
    /**
     * Sends a POST request to the URL provided.
     *
     * Uses the syntax `${baseURL}${url}`.
     *
     * Returns the response's JSON.
     * @param url The URL to request.
     */
    json(url: string): Promise<any>;
    /**
     * Sends a POST request to the URL provided.
     *
     * Uses the syntax `${baseURL}${url}`.
     *
     * Returns the response's JSON.
     * @param url The URL to request.
     */
    json(url: URL): Promise<any>;
    /**
     * Sends a POST request to the URL provided.
     *
     * Uses the syntax `${baseURL}${url}`.
     *
     * Returns the response's JSON.
     * @param url The URL to request.
     * @param headers The headers to include.
     */
    json(url: string, headers: RequestInit): Promise<any>;
    /**
     * Sends a POST request to the URL provided.
     *
     * Uses the syntax `${baseURL}${url}`.
     *
     * Returns the response's JSON.
     * @param url The URL to request.
     * @param headers The headers to include.
     */
    json(url: URL, headers: RequestInit): Promise<any>;
    /**
     * Sends a request to the URL provided.
     *
     * Uses the syntax `${baseURL}${url}`.
     *
     * Returns the response's JSON.
     * @param url The URL to request.
     * @param method The method to use (GET/POST).
     */
    json(url: string, method: InformalMethod): Promise<any>;
    /**
     * Sends a request to the URL provided.
     *
     * Uses the syntax `${baseURL}${url}`.
     *
     * Returns the response's JSON.
     * @param url The URL to request.
     * @param method The method to use (GET/POST).
     */
    json(url: URL, method: InformalMethod): Promise<any>;
    /**
     * Sends a request to the URL provided.
     *
     * Uses the syntax `${baseURL}${url}`.
     *
     * Returns the response's JSON.
     * @param url The URL to request.
     * @param headers The headers to include.
     * @param method The method to use (GET/POST).
     */
    json(url: string, headers: RequestInit, method: InformalMethod): Promise<any>;
    /**
     * Sends a request to the URL provided.
     *
     * Uses the syntax `${baseURL}${url}`.
     *
     * Returns the response's JSON.
     * @param url The URL to request.
     * @param headers The headers to include.
     * @param method The method to use (GET/POST).
     */
    json(url: URL, headers: RequestInit, method: InformalMethod): Promise<any>;
    /**
     * Sends a request to the URL provided.
     *
     * Uses the syntax `${baseURL}${url}`.
     *
     * Returns the response's JSON.
     * @param url The URL to request.
     * @param method The method to use (GET/POST).
     * @param headers The headers to include.
     */
    json(url: string, method: InformalMethod, headers: RequestInit): Promise<any>;
    /**
     * Sends a request to the URL provided.
     *
     * Uses the syntax `${baseURL}${url}`.
     *
     * Returns the response's JSON.
     * @param url The URL to request.
     * @param method The method to use (GET/POST).
     * @param headers The headers to include.
     */
    json(url: URL, method: InformalMethod, headers: RequestInit): Promise<any>;
    /**
     * Sends a POST request to the URL provided.
     *
     * Uses the syntax `${baseURL}${url}`.
     *
     * Returns the response's `ArrayBuffer`.
     * @param url The URL to request.
     */
    buf(url: string): Promise<ArrayBuffer>;
    /**
     * Sends a POST request to the URL provided.
     *
     * Uses the syntax `${baseURL}${url}`.
     *
     * Returns the response's `ArrayBuffer`.
     * @param url The URL to request.
     */
    buf(url: URL): Promise<ArrayBuffer>;
    /**
     * Sends a POST request to the URL provided.
     *
     * Uses the syntax `${baseURL}${url}`.
     *
     * Returns the response's `ArrayBuffer`.
     * @param url The URL to request.
     * @param headers The headers to include.
     */
    buf(url: string, headers: RequestInit): Promise<ArrayBuffer>;
    /**
     * Sends a POST request to the URL provided.
     *
     * Uses the syntax `${baseURL}${url}`.
     *
     * Returns the response's `ArrayBuffer`.
     * @param url The URL to request.
     * @param headers The headers to include.
     */
    buf(url: URL, headers: RequestInit): Promise<ArrayBuffer>;
    /**
     * Sends a request to the URL provided.
     *
     * Uses the syntax `${baseURL}${url}`.
     *
     * Returns the response's `ArrayBuffer`.
     * @param url The URL to request.
     * @param method The method to use (GET/POST).
     */
    buf(url: string, method: InformalMethod): Promise<ArrayBuffer>;
    /**
     * Sends a request to the URL provided.
     *
     * Uses the syntax `${baseURL}${url}`.
     *
     * Returns the response's `ArrayBuffer`.
     * @param url The URL to request.
     * @param method The method to use (GET/POST).
     */
    buf(url: URL, method: InformalMethod): Promise<ArrayBuffer>;
    /**
     * Sends a request to the URL provided.
     *
     * Uses the syntax `${baseURL}${url}`.
     *
     * Returns the response's `ArrayBuffer`.
     * @param url The URL to request.
     * @param headers The headers to include.
     * @param method The method to use (GET/POST).
     */
    buf(url: string, headers: RequestInit, method: InformalMethod): Promise<ArrayBuffer>;
    /**
     * Sends a request to the URL provided.
     *
     * Uses the syntax `${baseURL}${url}`.
     *
     * Returns the response's `ArrayBuffer`.
     * @param url The URL to request.
     * @param headers The headers to include.
     * @param method The method to use (GET/POST).
     */
    buf(url: URL, headers: RequestInit, method: InformalMethod): Promise<ArrayBuffer>;
    /**
     * Sends a request to the URL provided.
     *
     * Uses the syntax `${baseURL}${url}`.
     *
     * Returns the response's `ArrayBuffer`.
     * @param url The URL to request.
     * @param method The method to use (GET/POST).
     * @param headers The headers to include.
     */
    buf(url: string, method: InformalMethod, headers: RequestInit): Promise<ArrayBuffer>;
    /**
     * Sends a request to the URL provided.
     *
     * Uses the syntax `${baseURL}${url}`.
     *
     * Returns the response's `ArrayBuffer`.
     * @param url The URL to request.
     * @param method The method to use (GET/POST).
     * @param headers The headers to include.
     */
    buf(url: URL, method: InformalMethod, headers: RequestInit): Promise<ArrayBuffer>;
    /**
     * Sends a POST request to the URL provided.
     *
     * Uses the syntax `${baseURL}${url}`.
     *
     * Returns the response's `FormData`.
     * @param url The URL to request.
     */
    formData(url: string): Promise<FormData>;
    /**
     * Sends a POST request to the URL provided.
     *
     * Uses the syntax `${baseURL}${url}`.
     *
     * Returns the response's `FormData`.
     * @param url The URL to request.
     */
    formData(url: URL): Promise<FormData>;
    /**
     * Sends a POST request to the URL provided.
     *
     * Uses the syntax `${baseURL}${url}`.
     *
     * Returns the response's `FormData`.
     * @param url The URL to request.
     * @param headers The headers to include.
     */
    formData(url: string, headers: RequestInit): Promise<FormData>;
    /**
     * Sends a POST request to the URL provided.
     *
     * Uses the syntax `${baseURL}${url}`.
     *
     * Returns the response's `FormData`.
     * @param url The URL to request.
     * @param headers The headers to include.
     */
    formData(url: URL, headers: RequestInit): Promise<FormData>;
    /**
     * Sends a request to the URL provided.
     *
     * Uses the syntax `${baseURL}${url}`.
     *
     * Returns the response's `FormData`.
     * @param url The URL to request.
     * @param method The method to use (GET/POST).
     */
    formData(url: string, method: InformalMethod): Promise<FormData>;
    /**
     * Sends a request to the URL provided.
     *
     * Uses the syntax `${baseURL}${url}`.
     *
     * Returns the response's `FormData`.
     * @param url The URL to request.
     * @param method The method to use (GET/POST).
     */
    formData(url: URL, method: InformalMethod): Promise<FormData>;
    /**
     * Sends a request to the URL provided.
     *
     * Uses the syntax `${baseURL}${url}`.
     *
     * Returns the response's `FormData`.
     * @param url The URL to request.
     * @param headers The headers to include.
     * @param method The method to use (GET/POST).
     */
    formData(url: string, headers: RequestInit, method: InformalMethod): Promise<FormData>;
    /**
     * Sends a request to the URL provided.
     *
     * Uses the syntax `${baseURL}${url}`.
     *
     * Returns the response's `FormData`.
     * @param url The URL to request.
     * @param headers The headers to include.
     * @param method The method to use (GET/POST).
     */
    formData(url: URL, headers: RequestInit, method: InformalMethod): Promise<FormData>;
    /**
     * Sends a request to the URL provided.
     *
     * Uses the syntax `${baseURL}${url}`.
     *
     * Returns the response's `FormData`.
     * @param url The URL to request.
     * @param method The method to use (GET/POST).
     * @param headers The headers to include.
     */
    formData(url: string, method: InformalMethod, headers: RequestInit): Promise<FormData>;
    /**
     * Sends a request to the URL provided.
     *
     * Uses the syntax `${baseURL}${url}`.
     *
     * Returns the response's `FormData`.
     * @param url The URL to request.
     * @param method The method to use (GET/POST).
     * @param headers The headers to include.
     */
    formData(url: URL, method: InformalMethod, headers: RequestInit): Promise<FormData>;
    /**
     * Sends a POST request to the URL provided.
     *
     * Uses the syntax `${baseURL}${url}`.
     *
     * Returns the response's `Blob`.
     * @param url The URL to request.
     */
    blob(url: string): Promise<Blob>;
    /**
     * Sends a POST request to the URL provided.
     *
     * Uses the syntax `${baseURL}${url}`.
     *
     * Returns the response's `Blob`.
     * @param url The URL to request.
     */
    blob(url: URL): Promise<Blob>;
    /**
     * Sends a POST request to the URL provided.
     *
     * Uses the syntax `${baseURL}${url}`.
     *
     * Returns the response's `Blob`.
     * @param url The URL to request.
     * @param headers The headers to include.
     */
    blob(url: string, headers: RequestInit): Promise<Blob>;
    /**
     * Sends a POST request to the URL provided.
     *
     * Uses the syntax `${baseURL}${url}`.
     *
     * Returns the response's `Blob`.
     * @param url The URL to request.
     * @param headers The headers to include.
     */
    blob(url: URL, headers: RequestInit): Promise<Blob>;
    /**
     * Sends a request to the URL provided.
     *
     * Uses the syntax `${baseURL}${url}`.
     *
     * Returns the response's `Blob`.
     * @param url The URL to request.
     * @param method The method to use (GET/POST).
     */
    blob(url: string, method: InformalMethod): Promise<Blob>;
    /**
     * Sends a request to the URL provided.
     *
     * Uses the syntax `${baseURL}${url}`.
     *
     * Returns the response's `Blob`.
     * @param url The URL to request.
     * @param method The method to use (GET/POST).
     */
    blob(url: URL, method: InformalMethod): Promise<Blob>;
    /**
     * Sends a request to the URL provided.
     *
     * Uses the syntax `${baseURL}${url}`.
     *
     * Returns the response's `Blob`.
     * @param url The URL to request.
     * @param headers The headers to include.
     * @param method The method to use (GET/POST).
     */
    blob(url: string, headers: RequestInit, method: InformalMethod): Promise<Blob>;
    /**
     * Sends a request to the URL provided.
     *
     * Uses the syntax `${baseURL}${url}`.
     *
     * Returns the response's `Blob`.
     * @param url The URL to request.
     * @param headers The headers to include.
     * @param method The method to use (GET/POST).
     */
    blob(url: URL, headers: RequestInit, method: InformalMethod): Promise<Blob>;
    /**
     * Sends a request to the URL provided.
     *
     * Uses the syntax `${baseURL}${url}`.
     *
     * Returns the response's `FormData`.
     * @param url The URL to request.
     * @param method The method to use (GET/POST).
     * @param headers The headers to include.
     */
    blob(url: string, method: InformalMethod, headers: RequestInit): Promise<Blob>;
    /**
     * Sends a request to the URL provided.
     *
     * Uses the syntax `${baseURL}${url}`.
     *
     * Returns the response's `FormData`.
     * @param url The URL to request.
     * @param method The method to use (GET/POST).
     * @param headers The headers to include.
     */
    blob(url: URL, method: InformalMethod, headers: RequestInit): Promise<Blob>;
    /**
     * Sends a POST request to the URL provided.
     *
     * Uses the syntax `${baseURL}${url}`.
     *
     * Returns the response's `Uint8Array`.
     * @param url The URL to request.
     */
    bytes(url: string): Promise<Uint8Array>;
    /**
     * Sends a POST request to the URL provided.
     *
     * Uses the syntax `${baseURL}${url}`.
     *
     * Returns the response's `Uint8Array`.
     * @param url The URL to request.
     */
    bytes(url: URL): Promise<Uint8Array>;
    /**
     * Sends a POST request to the URL provided.
     *
     * Uses the syntax `${baseURL}${url}`.
     *
     * Returns the response's `Uint8Array`.
     * @param url The URL to request.
     * @param headers The headers to include.
     */
    bytes(url: string, headers: RequestInit): Promise<Uint8Array>;
    /**
     * Sends a POST request to the URL provided.
     *
     * Uses the syntax `${baseURL}${url}`.
     *
     * Returns the response's `Uint8Array`.
     * @param url The URL to request.
     * @param headers The headers to include.
     */
    bytes(url: URL, headers: RequestInit): Promise<Uint8Array>;
    /**
     * Sends a request to the URL provided.
     *
     * Uses the syntax `${baseURL}${url}`.
     *
     * Returns the response's `Uint8Array`.
     * @param url The URL to request.
     * @param method The method to use (GET/POST).
     */
    bytes(url: string, method: InformalMethod): Promise<Uint8Array>;
    /**
     * Sends a request to the URL provided.
     *
     * Uses the syntax `${baseURL}${url}`.
     *
     * Returns the response's `Uint8Array`.
     * @param url The URL to request.
     * @param method The method to use (GET/POST).
     */
    bytes(url: URL, method: InformalMethod): Promise<Uint8Array>;
    /**
     * Sends a request to the URL provided.
     *
     * Uses the syntax `${baseURL}${url}`.
     *
     * Returns the response's `Uint8Array`.
     * @param url The URL to request.
     * @param headers The headers to include.
     * @param method The method to use (GET/POST).
     */
    bytes(url: string, headers: RequestInit, method: InformalMethod): Promise<Uint8Array>;
    /**
     * Sends a request to the URL provided.
     *
     * Uses the syntax `${baseURL}${url}`.
     *
     * Returns the response's `Uint8Array`.
     * @param url The URL to request.
     * @param headers The headers to include.
     * @param method The method to use (GET/POST).
     */
    bytes(url: URL, headers: RequestInit, method: InformalMethod): Promise<Uint8Array>;
    /**
     * Sends a request to the URL provided.
     *
     * Uses the syntax `${baseURL}${url}`.
     *
     * Returns the response's `Uint8Array`.
     * @param url The URL to request.
     * @param method The method to use (GET/POST).
     * @param headers The headers to include.
     */
    bytes(url: string, method: InformalMethod, headers: RequestInit): Promise<Uint8Array>;
    /**
     * Sends a request to the URL provided.
     *
     * Uses the syntax `${baseURL}${url}`.
     *
     * Returns the response's `Uint8Array`.
     * @param url The URL to request.
     * @param method The method to use (GET/POST).
     * @param headers The headers to include.
     */
    bytes(url: URL, method: InformalMethod, headers: RequestInit): Promise<Uint8Array>;
    /**
     * Constructs a new, forked `Net` from this `Net`
     * with the URL appending the `urlPart` supplied.
     * @param urlPart The URL-part to append.
     */
    fork(urlPart: string): Net;
    /**
     * Constructs a new, forked `Net` from this `Net`
     * with the URL appending the `urlPart` supplied.
     * @param urlPart The URL-part to append.
     */
    fork(urlPart: URL): Net;
}
type Key<T> = Extract<keyof T, string>;
/**
 * Created as part of the Net API for mapped-out routes.
 *
 * Useful for when you already have routes setup.
 *
 * @example Using `NetMap` with a server.
 * ```
 * import { NetMap } from "@beanthealien/net";
 * // define some routes (sourced from BeanTheAlien Server)
 * interface Routes {
 *  getuser: { u: object };
 * }
 * // net object with mappings
 * const net = new NetMap<Routes>("https://beanthealien-server.onrender.com/");
 * // we can now see <"getuser", { u: object }> show up
 * // (promises a result of { u: object } as well)
 * const user = await net.json("getuser");
 * // user is an object
 * console.log(user);
 * ```
 */
declare class NetMap<R extends AnyMap> extends Net {
    constructor();
    constructor(baseURL: string);
    constructor(baseURL: URL);
    constructor(baseURL: Key<R>);
    constructor(defaultHeaders: RequestInit);
    constructor(defaultHeaders: AnyMap);
    constructor(baseURL: Key<R>, defaultHeaders: RequestInit);
    constructor(baseURL: Key<R>, defaultHeaders: AnyMap);
    /**
     * Sends a GET request to the URL provided.
     *
     * Uses the syntax `${baseURL}${url}`.
     * @param url The URL to request.
     */
    get<U extends Key<R>>(url: U): Promise<Response>;
    /**
     * Sends a GET request to the URL provided.
     *
     * Uses the syntax `${baseURL}${url}`.
     * @param url The URL to request.
     * @param headers The headers to include.
     */
    get<U extends Key<R>>(url: U, headers: RequestInit): Promise<Response>;
    /**
     * Sends a POST request to the URL provided.
     *
     * Uses the syntax `${baseURL}${url}`.
     * @param url The URL to request.
     */
    post<U extends Key<R>>(url: U): Promise<Response>;
    /**
     * Sends a POST request to the URL provided.
     *
     * Uses the syntax `${baseURL}${url}`.
     * @param url The URL to request.
     * @param headers The headers to include.
     */
    post<U extends Key<R>>(url: U, headers: RequestInit): Promise<Response>;
    /**
     * Sends a PUT request to the URL provided.
     *
     * Uses the syntax `${baseURL}${url}`.
     * @param url The URL to request.
     */
    put<U extends Key<R>>(url: U): Promise<Response>;
    /**
     * Sends a PUT request to the URL provided.
     *
     * Uses the syntax `${baseURL}${url}`.
     * @param url The URL to request.
     * @param headers The headers to include.
     */
    put<U extends Key<R>>(url: U, headers: RequestInit): Promise<Response>;
    /**
     * Sends a DELETE request to the URL provided.
     *
     * Uses the syntax `${baseURL}${url}`.
     * @param url The URL to request.
     */
    del<U extends Key<R>>(url: U): Promise<Response>;
    /**
     * Sends a DELETE request to the URL provided.
     *
     * Uses the syntax `${baseURL}${url}`.
     * @param url The URL to request.
     * @param headers The headers to include.
     */
    del<U extends Key<R>>(url: U, headers: RequestInit): Promise<Response>;
    /**
     * Sends a POST request to the URL provided.
     *
     * Uses the syntax `${baseURL}${url}`.
     *
     * Returns the response's text.
     * @param url The URL to request.
     */
    text<U extends Key<R>>(url: U): Promise<string>;
    /**
     * Sends a POST request to the URL provided.
     *
     * Uses the syntax `${baseURL}${url}`.
     *
     * Returns the response's text.
     * @param url The URL to request.
     * @param headers The headers to include.
     */
    text<U extends Key<R>>(url: U, headers: RequestInit): Promise<string>;
    /**
     * Sends a request to the URL provided.
     *
     * Uses the syntax `${baseURL}${url}`.
     *
     * Returns the response's text.
     * @param url The URL to request.
     * @param method The method to use (GET/POST).
     */
    text<U extends Key<R>>(url: U, method: InformalMethod): Promise<string>;
    /**
     * Sends a request to the URL provided.
     *
     * Uses the syntax `${baseURL}${url}`.
     *
     * Returns the response's text.
     * @param url The URL to request.
     * @param headers The headers to include.
     * @param method The method to use (GET/POST).
     */
    text<U extends Key<R>>(url: U, headers: RequestInit, method: InformalMethod): Promise<string>;
    /**
     * Sends a request to the URL provided.
     *
     * Uses the syntax `${baseURL}${url}`.
     *
     * Returns the response's text.
     * @param url The URL to request.
     * @param method The method to use (GET/POST).
     * @param headers The headers to include.
     */
    text<U extends Key<R>>(url: U, method: InformalMethod, headers: RequestInit): Promise<string>;
    /**
     * Sends a POST request to the URL provided.
     *
     * Uses the syntax `${baseURL}${url}`.
     *
     * Returns the response's JSON.
     * @param url The URL to request.
     */
    json<U extends Key<R>, O extends R[U]>(url: U): Promise<O>;
    /**
     * Sends a POST request to the URL provided.
     *
     * Uses the syntax `${baseURL}${url}`.
     *
     * Returns the response's JSON.
     * @param url The URL to request.
     * @param headers The headers to include.
     */
    json<U extends Key<R>, O extends R[U]>(url: U, headers: RequestInit): Promise<O>;
    /**
     * Sends a request to the URL provided.
     *
     * Uses the syntax `${baseURL}${url}`.
     *
     * Returns the response's JSON.
     * @param url The URL to request.
     * @param method The method to use (GET/POST).
     */
    json<U extends Key<R>, O extends R[U]>(url: U, method: InformalMethod): Promise<O>;
    /**
     * Sends a request to the URL provided.
     *
     * Uses the syntax `${baseURL}${url}`.
     *
     * Returns the response's JSON.
     * @param url The URL to request.
     * @param headers The headers to include.
     * @param method The method to use (GET/POST).
     */
    json<U extends Key<R>, O extends R[U]>(url: U, headers: RequestInit, method: InformalMethod): Promise<O>;
    /**
     * Sends a request to the URL provided.
     *
     * Uses the syntax `${baseURL}${url}`.
     *
     * Returns the response's JSON.
     * @param url The URL to request.
     * @param method The method to use (GET/POST).
     * @param headers The headers to include.
     */
    json<U extends Key<R>, O extends R[U]>(url: U, method: InformalMethod, headers: RequestInit): Promise<O>;
    /**
     * Sends a POST request to the URL provided.
     *
     * Uses the syntax `${baseURL}${url}`.
     *
     * Returns the response's `ArrayBuffer`.
     * @param url The URL to request.
     */
    buf<U extends Key<R>>(url: U): Promise<ArrayBuffer>;
    /**
     * Sends a POST request to the URL provided.
     *
     * Uses the syntax `${baseURL}${url}`.
     *
     * Returns the response's `ArrayBuffer`.
     * @param url The URL to request.
     * @param headers The headers to include.
     */
    buf<U extends Key<R>>(url: U, headers: RequestInit): Promise<ArrayBuffer>;
    /**
     * Sends a request to the URL provided.
     *
     * Uses the syntax `${baseURL}${url}`.
     *
     * Returns the response's `ArrayBuffer`.
     * @param url The URL to request.
     * @param method The method to use (GET/POST).
     */
    buf<U extends Key<R>>(url: U, method: InformalMethod): Promise<ArrayBuffer>;
    /**
     * Sends a request to the URL provided.
     *
     * Uses the syntax `${baseURL}${url}`.
     *
     * Returns the response's `ArrayBuffer`.
     * @param url The URL to request.
     * @param headers The headers to include.
     * @param method The method to use (GET/POST).
     */
    buf<U extends Key<R>>(url: U, headers: RequestInit, method: InformalMethod): Promise<ArrayBuffer>;
    /**
     * Sends a request to the URL provided.
     *
     * Uses the syntax `${baseURL}${url}`.
     *
     * Returns the response's `ArrayBuffer`.
     * @param url The URL to request.
     * @param method The method to use (GET/POST).
     * @param headers The headers to include.
     */
    buf<U extends Key<R>>(url: U, method: InformalMethod, headers: RequestInit): Promise<ArrayBuffer>;
    /**
     * Sends a POST request to the URL provided.
     *
     * Uses the syntax `${baseURL}${url}`.
     *
     * Returns the response's `FormData`.
     * @param url The URL to request.
     */
    formData<U extends Key<R>>(url: U): Promise<FormData>;
    /**
     * Sends a POST request to the URL provided.
     *
     * Uses the syntax `${baseURL}${url}`.
     *
     * Returns the response's `FormData`.
     * @param url The URL to request.
     * @param headers The headers to include.
     */
    formData<U extends Key<R>>(url: U, headers: RequestInit): Promise<FormData>;
    /**
     * Sends a request to the URL provided.
     *
     * Uses the syntax `${baseURL}${url}`.
     *
     * Returns the response's `FormData`.
     * @param url The URL to request.
     * @param method The method to use (GET/POST).
     */
    formData<U extends Key<R>>(url: U, method: InformalMethod): Promise<FormData>;
    /**
     * Sends a request to the URL provided.
     *
     * Uses the syntax `${baseURL}${url}`.
     *
     * Returns the response's `FormData`.
     * @param url The URL to request.
     * @param headers The headers to include.
     * @param method The method to use (GET/POST).
     */
    formData<U extends Key<R>>(url: U, headers: RequestInit, method: InformalMethod): Promise<FormData>;
    /**
     * Sends a request to the URL provided.
     *
     * Uses the syntax `${baseURL}${url}`.
     *
     * Returns the response's `FormData`.
     * @param url The URL to request.
     * @param method The method to use (GET/POST).
     * @param headers The headers to include.
     */
    formData<U extends Key<R>>(url: U, method: InformalMethod, headers: RequestInit): Promise<FormData>;
    /**
     * Sends a POST request to the URL provided.
     *
     * Uses the syntax `${baseURL}${url}`.
     *
     * Returns the response's `Blob`.
     * @param url The URL to request.
     */
    blob<U extends Key<R>>(url: U): Promise<Blob>;
    /**
     * Sends a POST request to the URL provided.
     *
     * Uses the syntax `${baseURL}${url}`.
     *
     * Returns the response's `Blob`.
     * @param url The URL to request.
     * @param headers The headers to include.
     */
    blob<U extends Key<R>>(url: U, headers: RequestInit): Promise<Blob>;
    /**
     * Sends a request to the URL provided.
     *
     * Uses the syntax `${baseURL}${url}`.
     *
     * Returns the response's `Blob`.
     * @param url The URL to request.
     * @param method The method to use (GET/POST).
     */
    blob<U extends Key<R>>(url: U, method: InformalMethod): Promise<Blob>;
    /**
     * Sends a request to the URL provided.
     *
     * Uses the syntax `${baseURL}${url}`.
     *
     * Returns the response's `Blob`.
     * @param url The URL to request.
     * @param headers The headers to include.
     * @param method The method to use (GET/POST).
     */
    blob<U extends Key<R>>(url: U, headers: RequestInit, method: InformalMethod): Promise<Blob>;
    /**
     * Sends a request to the URL provided.
     *
     * Uses the syntax `${baseURL}${url}`.
     *
     * Returns the response's `FormData`.
     * @param url The URL to request.
     * @param method The method to use (GET/POST).
     * @param headers The headers to include.
     */
    blob<U extends Key<R>>(url: U, method: InformalMethod, headers: RequestInit): Promise<Blob>;
    /**
     * Sends a POST request to the URL provided.
     *
     * Uses the syntax `${baseURL}${url}`.
     *
     * Returns the response's `Uint8Array`.
     * @param url The URL to request.
     */
    bytes<U extends Key<R>>(url: U): Promise<Uint8Array>;
    /**
     * Sends a POST request to the URL provided.
     *
     * Uses the syntax `${baseURL}${url}`.
     *
     * Returns the response's `Uint8Array`.
     * @param url The URL to request.
     * @param headers The headers to include.
     */
    bytes<U extends Key<R>>(url: string, headers: RequestInit): Promise<Uint8Array>;
    /**
     * Sends a request to the URL provided.
     *
     * Uses the syntax `${baseURL}${url}`.
     *
     * Returns the response's `Uint8Array`.
     * @param url The URL to request.
     * @param method The method to use (GET/POST).
     */
    bytes<U extends Key<R>>(url: string, method: InformalMethod): Promise<Uint8Array>;
    /**
     * Sends a request to the URL provided.
     *
     * Uses the syntax `${baseURL}${url}`.
     *
     * Returns the response's `Uint8Array`.
     * @param url The URL to request.
     * @param headers The headers to include.
     * @param method The method to use (GET/POST).
     */
    bytes<U extends Key<R>>(url: U, headers: RequestInit, method: InformalMethod): Promise<Uint8Array>;
    /**
     * Sends a request to the URL provided.
     *
     * Uses the syntax `${baseURL}${url}`.
     *
     * Returns the response's `Uint8Array`.
     * @param url The URL to request.
     * @param method The method to use (GET/POST).
     * @param headers The headers to include.
     */
    bytes<U extends Key<R>>(url: U, method: InformalMethod, headers: RequestInit): Promise<Uint8Array>;
    /**
     * Constructs a new, forked `Net` from this `Net`
     * with the URL appending the `urlPart` supplied.
     * @param urlPart The URL-part to append.
     */
    fork<T extends AnyMap>(urlPart: string): NetMap<T>;
    /**
     * Constructs a new, forked `Net` from this `Net`
     * with the URL appending the `urlPart` supplied.
     * @param urlPart The URL-part to append.
     */
    fork<T extends AnyMap>(urlPart: URL): NetMap<T>;
}
type Result<R, K extends keyof R> = R[K] extends [any, infer Res] ? Res : R[K];
type Payload<R, K extends keyof R> = R[K] extends [infer Pay, any] ? Pay : never;
type JsonOptions<R, K extends keyof R> = R[K] extends [infer Pay, any] ? {
    body: Pay;
    headers?: RequestInit;
    method?: InformalMethod;
} : {
    headers?: RequestInit;
    method?: InformalMethod;
};
/**
 * Created as part of the Net API for mapped-out routes which may or may not contain a required body.
 *
 * Interfaces used with `AdvancedNetMap` should be `AnyMap` | [any, `RequestInit` | `AnyMap`]
 *
 * In a tuple, element 0 is the required body, element 1 is the return type.
 *
 * @example Using `AdvancedNetMap` with a server.
 * ```
 * import { AdvancedNetMap } from "@beanthealien/net";
 * // define some routes (sourced from BeanTheAlien Server)
 * interface Routes {
 *  signup: [{ username: string, email: string, password: string }, { success: boolean, message?: string }];
 * }
 * // net object with mappings
 * const net = new AdvancedNetMap<Routes>("https://beanthealien-server.onrender.com/");
 * // throws an error (property 'username' of type 'number' cannot be assigned to type 'string')
 * const out = net.json("signup", { username: 42, email: "hi", password: "123" });
 * // if username were a string, then we can print the output
 * console.log(out.success); // sample output: true
 * ```
 */
declare class AdvancedNetMap<const T extends AnyMap | RoutesSchema = AnyMap, R extends AnyMap = ResolveRoutes<T>> extends NetMap<R> {
    constructor(url: string | URL);
    constructor(url: string | URL, routes: T);
    json<K extends Key<R>>(url: K, body: Payload<R, K>): Promise<Result<R, K>>;
    json<K extends Key<R>>(url: K, options?: JsonOptions<R, K>): Promise<Result<R, K>>;
    json<K extends Key<R>>(url: K, arg1?: RequestInit | InformalMethod, arg2?: InformalMethod | RequestInit): Promise<Result<R, K>>;
    /**
     * Constructs a new, forked `AdvancedNetMap` from this `AdvancedNetMap`
     * with the URL appending the `urlPart` supplied.
     * @param urlPart The URL-part to append.
     */
    fork<const U extends AnyMap | RoutesSchema = AnyMap>(urlPart: string, routes?: U): AdvancedNetMap<U>;
    /**
     * Constructs a new, forked `AdvancedNetMap` from this `AdvancedNetMap`
     * with the URL appending the `urlPart` supplied.
     * @param urlPart The URL-part to append.
     */
    fork<const U extends AnyMap | RoutesSchema = AnyMap>(urlPart: URL, routes?: U): AdvancedNetMap<U>;
}
declare function defRoutes<const T extends RoutesSchema>(routes: T): T;
export { Net, NetMap, AdvancedNetMap, defRoutes };
//# sourceMappingURL=net.d.ts.map