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
### Example
This example demonstrates the usage of `Net`.
```
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
### Example
This example demonstrates the usage of `NetMap`.
```
import { NetMap } from "@beanthealien/net";
// define a route mapping interface (<=v1.0.0)
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
When a route pair is a tuple, the first element (0th index) is the required headers, the second element (1st index) is the returned type.
| Feature | Inclusion |
| :---: | :---: |
| Response Wrappers | Yes |
| Excplicit Routes | Yes |
| Typed JSON | Yes |
| Required Headers | Yes |
### Example
This example demonstrates the usage of `AdvancedNetMap`.
```
import { AdvancedNetMap } from "@beanthealien/net";
// define a route mapping interface (<=v1.0.0)
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