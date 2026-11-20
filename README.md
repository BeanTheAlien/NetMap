# NetMap
NetMap is a package designed for both web and Node.js to provide simple, reusable Net Maps.\
NetMap is designed to connect the front and back end.

Ever found yourself having to type out the same, long URL?\
Or the pains of `Response.json` being simply `any`, so your TypeScript infrastructure can't provide hints?\
That's what NetMap is here to solve!\
Check the implementation docs for information.

# Usage Note
NetMap is designed for personal/team usage. It is **not** designed to enable bad actors.\
**Always** keep your server secure.

For users of NetMap, make sure to check the Terms and Conditions or `ROBOTS.txt` for endpoints.\
Request flooding is a serious cybercrime.

# Install
Install with npm:
```
npm install @beanthealien/net
```

# Implementations
## Net
The `Net` class is the most simple - it merely wraps around `fetch`.
| Feature | Inclusion |
| :---: | :---: |
| Response Wrappers | Yes |
| Excplicit Routes | No |
| Typed JSON | No |
| Required Headers | No |
| Routed Definitions | No |
### Example
This example demonstrates the usage of `Net`.
```javascript
import { Net } from "@beanthealien/net";
// construct a net object
// using the BeanTheAlien Server
// as an endpoint
const net = new Net("https://beanthealien-server.onrender.com");
// query the server
// (assuming we're logged in)
// (should respond with a User object)
const user = await net.json("getuser");
console.log(user);
```
## NetMap
The `NetMap` class is a little more complex; it offers custom routes, at the drawback of route pairs only mapping to the JSON response (no require header support).
| Feature | Inclusion |
| :---: | :---: |
| Response Wrappers | Yes |
| Excplicit Routes | Yes |
| Typed JSON | Yes |
| Required Headers | No |
| Routed Definitions | No |
### Example
This example demonstrates the usage of `NetMap`.
```typescript
import { NetMap } from "@beanthealien/net";
// define a route mapping interface (<=v1.1.0)
// sample response for getuser
interface Routes {
    getuser: { u: { username: string, email: string } }
}
// construct a NetMap object
// using the BeanTheAlien Server
// as an endpoint
// include Routes as the mapping
const net = new NetMap<Routes>("https://beanthealien-server.onrender.com");
// query the server
// (assuming we're logged in)
// (should respond with a User object)
const user = await net.json("getuser");
// safe (should have u property, which would have username)
console.log(user.u.username); // sample output: me
```
## AdvancedNetMap
The `AdvancedNetMap` class is the most comprehensive. It extends the capabilities of `NetMap` and offers tuple-mapped route pairs.\
When supplying via TypeScript, each route pair is a single which represents the return type or tuple where the first element (0th index) is the required headers and the second element (1st index) is the returned type.\
When supplying via JavaScript, each route contains a name, which either maps to a single object, which contains a style ("sql", "mysql", "postgresql", "basic", "more") and the mapping or a tuple where the first element (0th index) is the required headers and the second element (1st index) is the returned type.
| Feature | Inclusion |
| :---: | :---: |
| Response Wrappers | Yes |
| Excplicit Routes | Yes |
| Typed JSON | Yes |
| Required Headers | Yes |
| Routed Definitions | Yes |
### Example
This example demonstrates the usage of `AdvancedNetMap` (prior to v2.0.0).
```typescript
import { AdvancedNetMap } from "@beanthealien/net";
// define a route mapping interface (<=v1.1.0)
// sample headers/response for signup
// requires { username, email, string }
// responds with a success and a potential message
interface Routes {
    signup: [{ username: string, email: string, password: string }, { success: boolean, message?: string }];
}
// construct an AdvancedNetMap object
// using the BeanTheAlien Server
// as an endpoint
// include Routes as the mapping
const net = new AdvancedNetMap<Routes>("https://beanthealien-server.onrender.com");
// query the server
// include some headers
const user = await net.json("signup", { username: "thisisthegreatestplan", email: "myemail@service.com", password: "wheresmywater" });
// safe (should success in response)
console.log(user.success); // sample output: true
```
### Example (>=v2.0.0)
This example demonstrates the usage of `AdvancedNetMap` (v2.0.0 and onward).
```javascript
import { AdvancedNetMap, defRoutes } from "@beanthealien/net";
// define AdvancedNetMap object
// (use defRoutes for IntelliSense)
// (which just returns input)
const routes = defRoutes({
    // IN: { username: string, email: string, password: string }
    // OUT: { success: boolean, message?: string }
    signup: [
        { style: "basic", map: { username: "string", email: "string", password: "string" } },
        { style: "basic", map: { success: "bool", message: "string?" } }
    ]
});
// define object here
// (routes is stubbed internally)
// (but captures routes: T)
const net = new AdvancedNetMap("https://beanthealien-server.onrender.com", routes);
// query
// error: number cannot be assigned to string
const user = await net.json("signup", { username: 123, email: "myemail@service.com", password: "thecakeisalie" });
// ...if we fixed the error, we still
// get intelligent responses
// even in JS!
console.log(user.success); // sample output: true
```

# Changelog
## v1.0.1
- Add support for `PUT`, `DELETE` as methods.
## v1.1.0
- Add new `fork` method to each `Net` class.
## v2.0.0
- Add routed definition for JavaScript users in `AdvancedNetMap`.