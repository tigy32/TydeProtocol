# @tyde/protocol

Shared TypeScript types and runtime parsers for the Tyde IPC/event protocol. This package defines the canonical wire format used between the Tyde desktop client and its backends — chat events, commands, tool requests, session metadata, and more.

## What's in the box

- **Type definitions** — discriminated unions for `ChatEvent`, `ChatActorMessage`, `CommandMap`, `EventMap`, and all associated payload types.
- **Generated protocol kinds** — enum-like string literal types generated from the Rust backend (`src/generated/protocol_kinds.ts`).
- **Runtime parser** — `parseChatEvent()` validates unknown payloads from IPC/network boundaries and returns typed `ChatEvent` objects (or throws `ProtocolParseError`).
- **Remote handshake metadata** — shared `TYDE_PROTOCOL_VERSION`, `TydeVersionHeader`, and wire frame types for remote control handshakes.

## Install

```
npm install @tyde/protocol
```

## Usage

```ts
import { parseChatEvent, type ChatEvent } from "@tyde/protocol";

// Parse an unknown payload from IPC/WebSocket/etc.
const event: ChatEvent = parseChatEvent(raw);
```

## Build

```
npm run build
```

## License

MIT
