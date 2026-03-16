import { GENERATED_CHAT_EVENT_KINDS } from "./generated/protocol_kinds";
import type { ChatEvent } from "./types";

const CORE_EVENT_KIND_SET = new Set<string>(GENERATED_CHAT_EVENT_KINDS);

const DATA_REQUIRED: Record<string, boolean> = Object.fromEntries(
  GENERATED_CHAT_EVENT_KINDS.map((kind) => [
    kind,
    kind !== "ConversationCleared",
  ]),
);

export class ProtocolParseError extends Error {
  payload: unknown;

  constructor(message: string, payload: unknown) {
    super(message);
    this.name = "ProtocolParseError";
    this.payload = payload;
  }
}

export function parseChatEvent(payload: unknown): ChatEvent {
  if (
    typeof payload !== "object" ||
    payload === null ||
    typeof (payload as any).kind !== "string"
  ) {
    throw new ProtocolParseError("ChatEvent must include string kind", payload);
  }

  const kind: string = (payload as any).kind;
  const data: unknown = (payload as any).data;

  if (
    kind === "SubprocessStderr" ||
    kind === "SubprocessExit" ||
    CORE_EVENT_KIND_SET.has(kind)
  ) {
    if (DATA_REQUIRED[kind] && !("data" in (payload as any))) {
      throw new ProtocolParseError(
        `ChatEvent '${kind}' requires data`,
        payload,
      );
    }
    return { kind, data } as ChatEvent;
  }

  throw new ProtocolParseError(
    `Unknown ChatEvent kind '${kind}'`,
    payload,
  );
}
