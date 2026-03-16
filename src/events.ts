import type { ChatEvent } from "./types";

export interface ConversationRegisteredData {
  agent_id: number | null;
  workspace_roots: string[];
  backend_kind: string;
  name: string;
  agent_type: string | null;
  parent_agent_id: number | null;
}

export interface ChatEventPayload {
  conversation_id: number;
  event: ChatEvent;
}

export interface ConversationRegisteredPayload {
  conversation_id: number;
  data: ConversationRegisteredData;
}

export interface AdminEventPayload {
  admin_id: number;
  event: ChatEvent;
}

export interface FileChangedPayload {
  path: string;
}

export interface TerminalOutputPayload {
  terminal_id: number;
  data: string;
}

export interface TerminalExitPayload {
  terminal_id: number;
  exit_code: number | null;
}

export interface RemoteConnectionProgress {
  host: string;
  step: string;
  status: string;
  message: string;
}

export interface EventMap {
  "chat-event": ChatEventPayload;
  "admin-event": AdminEventPayload;
  "file-changed": FileChangedPayload;
  "terminal-output": TerminalOutputPayload;
  "terminal-exit": TerminalExitPayload;
  "remote-connection-progress": RemoteConnectionProgress;
}

export type EventName = keyof EventMap;
export type EventPayload<K extends EventName> = EventMap[K];

export type DesktopOnlyEvent = "terminal-output" | "terminal-exit";
export type SharedEvent = Exclude<EventName, DesktopOnlyEvent>;
