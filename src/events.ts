import type { ChatEvent } from "./types";

export interface ConversationRegisteredData {
  agent_id: string | null;
  workspace_roots: string[];
  backend_kind: string;
  name: string;
  agent_type: string | null;
  parent_agent_id: string | null;
  ui_owner_project_id?: string | null;
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

export type TydeServerConnectionStateValue =
  | "connecting"
  | "connected"
  | { reconnecting: { attempt: number } }
  | { disconnected: { reason: string } };

export interface TydeServerConnectionState {
  host_id: string;
  state: TydeServerConnectionStateValue;
}

export interface TydeServerVersionWarning {
  host_id: string;
  host: string;
  local_version: string;
  remote_version: string;
}

export interface EventMap {
  "chat-event": ChatEventPayload;
  "admin-event": AdminEventPayload;
  "file-changed": FileChangedPayload;
  "terminal-output": TerminalOutputPayload;
  "terminal-exit": TerminalExitPayload;
  "remote-connection-progress": RemoteConnectionProgress;
  "tyde-server-connection-state": TydeServerConnectionState;
  "tyde-server-version-warning": TydeServerVersionWarning;
}

export type EventName = keyof EventMap;
export type EventPayload<K extends EventName> = EventMap[K];

export type DesktopOnlyEvent = "terminal-output" | "terminal-exit";
export type SharedEvent = Exclude<EventName, DesktopOnlyEvent>;
