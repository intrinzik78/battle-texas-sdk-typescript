# Battle Texas TypeScript SDK

A small, opinionated TypeScript SDK for talking to the **battle-texas-server** API.

- **Framework-agnostic**: written in plain TS, works with SvelteKit, React, Node, etc.
- **Strongly typed**: types generated from your OpenAPI spec.
- **Opinionated errors**: success returns typed models, failures throw a single `ApiError` type.

This repo is intended primarily for internal use by Battle Texas apps.

---

## Table of contents

- [Requirements](#requirements)
- [Installation](#installation)
- [Initialization](#initialization)
  - [Imports](#imports)
  - [Setup](#setup)
- [Clients](#clients)
- [Sessions](#sessions)
- [Locations](#locations)
- [Email & SMS Verifications](#email--sms-verifications)
- [Error Handling](#error-handling)

---

## Requirements
- TypeScript ES2020
- Supports runtimes with `fetch`
	- Browser
	- Node 18+
	- Node with fetch polyfill

## Installation

While this is an internal package, it is public for review and comment.

### With published package
```bash
npm install @battle-texas/sdk
```

### Via private local path
Clone package to local drive, then install with:
```bash
npm install ../path_to/battle-texas-sdk
```

## Initialization

### Imports
```ts
import {
  HttpCore,
  type ClientOptions,
  LocationsClient,
  SessionsClient,
  VerificationsClient,
  ApiError
} from "@battle-texas/sdk";
```

### Setup
```ts
const opts: ClientOptions = {
	baseUrl: "https://api.your-domain.com",
	timeoutMs: 2000,
	getAccessToken: () => sessionStorage.getItem("access_token") ?? undefined
};

const core = new HttpCore(opts);
```

# Clients
Each client scope exposes the available endpoints for a resource type
Road map:
- [x] sessions
- [x] locations (in progress)
- [x] verifications (in progress)
- [ ] business accounts
- [ ] bookings
- [ ] quotes


```ts
const locations = new LocationsClient(core);
const sessions = new SessionsClient(core);
const verifications = new VerificationsClient(core);
```

## Sessions
Road map:
- [x] create session `login`
- [x] delete session `logout`

### Begin Session

#### Imports
```ts
import type { CreateSessionBody } from "@battle-texas/sdk/generated/map";
```

#### Body
```ts
const body: CreateSessionBody = {
	username: "name@example.com",
	password: "correct-horse-battery-staple"
};
```

#### Usage
```ts
await sessions.create(body); // AccessToken | throws ApiError
```

### End session
#### Usage
```ts
await sessions.delete(); // void | throws ApiError
```

## Locations
Road map:
- [x] List nearest locations by zipcode
- [x] Public location by id
- [x] Private location by id
- [ ] List private locations by business id (coming soon)
- [ ] Create new location
- [ ] Update location
- [ ] Delete location

### List nearest locations by zipcode
```ts
const params = { nearestZipcode: "valid zipcode" };
await locations.listNearestByZipcode(params); // PublicLocation[] | throws ApiError
```

### Get public location by id
```ts
const id: number = 0;
await locations.publicById(id); // PublicLocation | throws ApiError
```

### Get private location by id
```ts
const id: number = 0;
await locations.privateById(id); // PrivateLocation | throws ApiError
```

## Email & SMS Verifications
Road map:
- [x] Email
- [ ] SMS

### Request a verification email

#### Imports
```ts
import type { EmailVerificationPost } from "@battle-texas/sdk/generated/map";
```

#### Body
```ts
const body: EmailVerificationPost = { email: "name@example.com" };
```

#### Usage
```ts
await verifications.createEmailVerification(body); // void | throws ApiError
```

### Verify email
Required params: uuid:string,id:number

#### Usage
```ts
await verifications.patchEmailVerification(uuid, id); // void | throws ApiError
```

## Error Handling

### Imports

```ts
import { ApiError } from "@battle-texas/sdk/error";
```

### Pattern
```ts
try {
	const response = await object.method(dataBody);
} catch (err) {
  	if (err instanceof ApiError) {
  		console.error("HTTP:", err.httpStatus);
  		console.error("API code:", err.apiCode);
  		console.error("API reason:", err.apiReason);
  		console.error("Message:", err.message);
  	} else {
  		console.error("Unexpected error:", err);
  	}
}
```