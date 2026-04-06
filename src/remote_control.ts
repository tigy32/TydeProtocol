import type {
  CommandName,
  CommandParams,
  RuntimeAgent,
  SessionRecord,
} from "./commands";
import type { EventName, EventPayload } from "./events";
import type { TydeVersionHeader } from "./version";

export type WireReqId = number | string;

export interface ClientInvokeFrame<K extends CommandName = CommandName> {
  type: "Invoke";
  req_id: WireReqId;
  command: K;
  params: CommandParams<K>;
}

export interface ClientHandshakeFrame extends TydeVersionHeader {
  type: "Handshake";
  req_id: WireReqId;
  last_agent_event_seq: number;
  last_chat_event_seqs: Record<string, number>;
}

export type ClientFrame = ClientInvokeFrame | ClientHandshakeFrame;

export interface ConversationSnapshot {
  conversation_id: number;
  backend_kind: string;
  workspace_roots: string[];
  chat_event_seq: number;
}

export interface ProjectRecord {
  id: string;
  name: string;
  workspace_path: string;
  roots: string[];
  parent_project_id?: string | null;
  workbench_kind?: string | null;
}

export interface HandshakeResult extends TydeVersionHeader {
  agents: RuntimeAgent[];
  conversations: ConversationSnapshot[];
  instance_id?: string | null;
  session_records?: SessionRecord[];
  projects?: ProjectRecord[];
}

export interface ServerResultFrame<T = unknown> {
  type: "Result";
  req_id: WireReqId;
  data: T;
}

export interface ServerErrorFrame {
  type: "Error";
  req_id: WireReqId;
  error: string;
}

export interface KnownServerEventFrame<K extends EventName = EventName> {
  type: "Event";
  event: K;
  seq?: number;
  payload: EventPayload<K>;
}

export interface ServerEventFrame {
  type: "Event";
  event: string;
  seq?: number;
  payload: unknown;
}

export interface ServerShutdownFrame {
  type: "Shutdown";
  reason: string;
}

export type ServerFrame =
  | ServerResultFrame
  | ServerErrorFrame
  | ServerEventFrame
  | ServerShutdownFrame;
