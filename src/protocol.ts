import { GENERATED_CHAT_EVENT_KINDS } from "./generated/protocol_kinds";
import type { GeneratedChatEventKind } from "./generated/protocol_kinds";
import type { ChatEvent } from "./types";

type UnknownRecord = Record<string, unknown>;

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === "object" && value !== null;
}

function isString(value: unknown): value is string {
  return typeof value === "string";
}

function isNumber(value: unknown): value is number {
  return typeof value === "number";
}

function isBoolean(value: unknown): value is boolean {
  return typeof value === "boolean";
}

function isArray(value: unknown): value is unknown[] {
  return Array.isArray(value);
}

const CORE_EVENT_KIND_SET = new Set<string>(GENERATED_CHAT_EVENT_KINDS);

const CORE_EVENT_REQUIRES_DATA: Record<string, boolean> = Object.fromEntries(
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

/**
 * Per-kind data shape validators for core ChatEvent kinds.
 *
 * Each validator checks the top-level required fields and their types.
 * Deeply nested structures (e.g. ChatMessage internals) are validated
 * at their structural boundary — required fields and primitive types —
 * without full recursive descent.
 */
const DATA_VALIDATORS: Record<
  string,
  ((data: unknown, payload: unknown) => void) | undefined
> = {
  MessageAdded(data: unknown, payload: unknown) {
    if (!isRecord(data)) throw fail("MessageAdded data must be an object", payload);
    if (!isNumber(data.timestamp)) throw fail("MessageAdded.timestamp must be a number", payload);
    if (data.sender === undefined) throw fail("MessageAdded.sender is required", payload);
    if (!isString(data.content)) throw fail("MessageAdded.content must be a string", payload);
    if (!isArray(data.tool_calls)) throw fail("MessageAdded.tool_calls must be an array", payload);
  },

  StreamStart(data: unknown, payload: unknown) {
    if (!isRecord(data)) throw fail("StreamStart data must be an object", payload);
    if (!isString(data.message_id)) throw fail("StreamStart.message_id must be a string", payload);
    if (!isString(data.agent)) throw fail("StreamStart.agent must be a string", payload);
    if (!isString(data.model)) throw fail("StreamStart.model must be a string", payload);
  },

  StreamDelta(data: unknown, payload: unknown) {
    if (!isRecord(data)) throw fail("StreamDelta data must be an object", payload);
    if (!isString(data.message_id)) throw fail("StreamDelta.message_id must be a string", payload);
    if (!isString(data.text)) throw fail("StreamDelta.text must be a string", payload);
  },

  StreamReasoningDelta(data: unknown, payload: unknown) {
    if (!isRecord(data)) throw fail("StreamReasoningDelta data must be an object", payload);
    if (!isString(data.message_id)) throw fail("StreamReasoningDelta.message_id must be a string", payload);
    if (!isString(data.text)) throw fail("StreamReasoningDelta.text must be a string", payload);
  },

  StreamEnd(data: unknown, payload: unknown) {
    if (!isRecord(data)) throw fail("StreamEnd data must be an object", payload);
    if (!isRecord(data.message)) throw fail("StreamEnd.message must be an object", payload);
  },

  Settings(_data: unknown, _payload: unknown) {
    // Settings data is typed as `unknown` — no shape constraint.
  },

  TypingStatusChanged(data: unknown, payload: unknown) {
    if (!isBoolean(data)) throw fail("TypingStatusChanged data must be a boolean", payload);
  },

  ToolRequest(data: unknown, payload: unknown) {
    if (!isRecord(data)) throw fail("ToolRequest data must be an object", payload);
    if (!isString(data.tool_call_id)) throw fail("ToolRequest.tool_call_id must be a string", payload);
    if (!isString(data.tool_name)) throw fail("ToolRequest.tool_name must be a string", payload);
    if (data.tool_type === undefined) throw fail("ToolRequest.tool_type is required", payload);
  },

  ToolExecutionCompleted(data: unknown, payload: unknown) {
    if (!isRecord(data)) throw fail("ToolExecutionCompleted data must be an object", payload);
    if (!isString(data.tool_call_id)) throw fail("ToolExecutionCompleted.tool_call_id must be a string", payload);
    if (!isString(data.tool_name)) throw fail("ToolExecutionCompleted.tool_name must be a string", payload);
    if (data.tool_result === undefined) throw fail("ToolExecutionCompleted.tool_result is required", payload);
    if (!isBoolean(data.success)) throw fail("ToolExecutionCompleted.success must be a boolean", payload);
  },

  OperationCancelled(data: unknown, payload: unknown) {
    if (!isRecord(data)) throw fail("OperationCancelled data must be an object", payload);
    if (!isString(data.message)) throw fail("OperationCancelled.message must be a string", payload);
  },

  RetryAttempt(data: unknown, payload: unknown) {
    if (!isRecord(data)) throw fail("RetryAttempt data must be an object", payload);
    if (!isNumber(data.attempt)) throw fail("RetryAttempt.attempt must be a number", payload);
    if (!isNumber(data.max_retries)) throw fail("RetryAttempt.max_retries must be a number", payload);
    if (!isString(data.error)) throw fail("RetryAttempt.error must be a string", payload);
    if (!isNumber(data.backoff_ms)) throw fail("RetryAttempt.backoff_ms must be a number", payload);
  },

  TaskUpdate(data: unknown, payload: unknown) {
    if (!isRecord(data)) throw fail("TaskUpdate data must be an object", payload);
    if (!isString(data.title)) throw fail("TaskUpdate.title must be a string", payload);
    if (!isArray(data.tasks)) throw fail("TaskUpdate.tasks must be an array", payload);
  },

  SessionsList(data: unknown, payload: unknown) {
    if (!isRecord(data)) throw fail("SessionsList data must be an object", payload);
    if (!isArray(data.sessions)) throw fail("SessionsList.sessions must be an array", payload);
  },

  ProfilesList(data: unknown, payload: unknown) {
    if (!isRecord(data)) throw fail("ProfilesList data must be an object", payload);
    if (!isArray(data.profiles)) throw fail("ProfilesList.profiles must be an array", payload);
  },

  ModelsList(data: unknown, payload: unknown) {
    if (!isRecord(data)) throw fail("ModelsList data must be an object", payload);
    if (!isArray(data.models)) throw fail("ModelsList.models must be an array", payload);
  },

  TimingUpdate(data: unknown, payload: unknown) {
    if (!isRecord(data)) throw fail("TimingUpdate data must be an object", payload);
    if (!isRecord(data.waiting_for_human)) throw fail("TimingUpdate.waiting_for_human must be an object", payload);
    if (!isRecord(data.ai_processing)) throw fail("TimingUpdate.ai_processing must be an object", payload);
    if (!isRecord(data.tool_execution)) throw fail("TimingUpdate.tool_execution must be an object", payload);
  },

  ModuleSchemas(data: unknown, payload: unknown) {
    if (!isRecord(data)) throw fail("ModuleSchemas data must be an object", payload);
    if (!isArray(data.schemas)) throw fail("ModuleSchemas.schemas must be an array", payload);
  },

  Error(data: unknown, payload: unknown) {
    if (!isString(data)) throw fail("Error data must be a string", payload);
  },
};

function fail(message: string, payload: unknown): ProtocolParseError {
  return new ProtocolParseError(message, payload);
}

function validateCoreEventData(
  kind: GeneratedChatEventKind,
  data: unknown,
  payload: unknown,
): void {
  const validator = DATA_VALIDATORS[kind];
  if (validator) {
    validator(data, payload);
  }
}

export function parseChatEvent(payload: unknown): ChatEvent {
  if (!isRecord(payload) || !isString(payload.kind)) {
    throw new ProtocolParseError("ChatEvent must include string kind", payload);
  }

  if (payload.kind === "SubprocessStderr") {
    if (!isString(payload.data)) {
      throw new ProtocolParseError(
        "SubprocessStderr must include string data",
        payload,
      );
    }
    return { kind: "SubprocessStderr", data: payload.data };
  }

  if (payload.kind === "SubprocessExit") {
    if (!isRecord(payload.data)) {
      throw new ProtocolParseError(
        "SubprocessExit must include object data",
        payload,
      );
    }
    const code = payload.data.exit_code;
    if (!(typeof code === "number" || code === null)) {
      throw new ProtocolParseError(
        "SubprocessExit.exit_code must be number or null",
        payload,
      );
    }
    return { kind: "SubprocessExit", data: { exit_code: code } };
  }

  if (!CORE_EVENT_KIND_SET.has(payload.kind)) {
    throw new ProtocolParseError(
      `Unknown core ChatEvent kind '${payload.kind}'`,
      payload,
    );
  }

  const kind = payload.kind as GeneratedChatEventKind;

  if (CORE_EVENT_REQUIRES_DATA[kind] && !("data" in payload)) {
    throw new ProtocolParseError(
      `Core ChatEvent '${kind}' requires data`,
      payload,
    );
  }

  if (!CORE_EVENT_REQUIRES_DATA[kind]) {
    return { kind } as ChatEvent;
  }

  validateCoreEventData(kind, payload.data, payload);

  return {
    kind,
    data: payload.data,
  } as ChatEvent;
}
