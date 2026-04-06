// Re-export everything from types.ts (the primary consumer-facing module).
// types.ts already re-exports the core_types it needs (ChatMessage, etc.).
export type {
  ChatMessage,
  ContextBreakdown,
  ImageData,
  MessageSender,
  ModuleSchemaInfo,
  Task,
  TaskList,
  TokenUsage,
  ToolExecutionResult,
  ToolRequest,
  ToolRequestType,
  TaskItem,
  SessionMetadata,
  ModelInfo,
  ImageAttachment,
  ChatEvent,
  ChatEventTag,
  GitFileStatus,
  FileEntry,
  FileContent,
} from "./types";

// Additional core_types exports not covered by types.ts.
export type {
  DurationLike,
  FileInfo,
  ContextInfo,
  Model,
  ReasoningData,
  ToolUseData,
  TaskStatus,
  SessionData,
  ChatEventDataByKind,
  ChatEvent as CoreChatEvent,
  ChatEventTag as CoreChatEventTag,
  SessionMetadata as CoreSessionMetadata,
  ModelInfo as CoreModelInfo,
  ChatActorMessagePayloadByVariant,
  ChatActorMessage,
} from "./core_types";
export {
  getChatEventTag,
  GENERATED_CHAT_EVENT_KINDS,
  GENERATED_CHAT_ACTOR_MESSAGE_VARIANTS,
  GENERATED_MODEL_VARIANTS,
  MODEL_VARIANTS,
} from "./core_types";

// Generated discriminant types.
export type {
  GeneratedChatEventKind,
  GeneratedChatActorMessageVariant,
  GeneratedModelVariant,
} from "./generated/protocol_kinds";

// Runtime protocol parser.
export { ProtocolParseError, parseChatEvent } from "./protocol";

// Command protocol.
export type {
  AgentDefinition,
  AgentDefinitionEntry,
  AgentMcpServer,
  AgentMcpTransportHttp,
  AgentMcpTransportStdio,
  BackendDependencyStatus,
  BackendDepResult,
  BackendKind,
  BackendUsageResult,
  BackendUsageWindow,
  CollectedAgentResult,
  CommandMap,
  CreateConversationResponse,
  CommandName,
  CommandParams,
  CommandResponse,
  DesktopOnlyCommand,
  DevInstanceInfo,
  DevInstanceStartParams,
  DevInstanceStartResult,
  DevInstanceStopParams,
  DevInstanceStopResult,
  DriverMcpHttpServerSettings,
  Host,
  McpHttpServerSettings,
  RemoteServerStatus,
  RemoteControlSettings,
  RuntimeAgent,
  RuntimeAgentEvent,
  SessionRecord,
  RuntimeAgentEventBatch,
  SharedCommand,
  ShellCommandResult,
  SpawnAgentResponse,
  ToolPolicy,
  WorkflowActionEntry,
  WorkflowEntry,
  WorkflowStepEntry,
} from "./commands";

// Remote control wire protocol.
export type {
  ClientFrame,
  ClientHandshakeFrame,
  ClientInvokeFrame,
  ConversationSnapshot,
  HandshakeResult,
  KnownServerEventFrame,
  ProjectRecord,
  ServerErrorFrame,
  ServerEventFrame,
  ServerFrame,
  ServerResultFrame,
  ServerShutdownFrame,
  WireReqId,
} from "./remote_control";

// Event protocol.
export type {
  AdminEventPayload,
  ChatEventPayload,
  ConversationRegisteredData,
  ConversationRegisteredPayload,
  DesktopOnlyEvent,
  EventMap,
  EventName,
  EventPayload,
  FileChangedPayload,
  RemoteConnectionProgress,
  TydeServerConnectionState,
  TydeServerConnectionStateValue,
  TydeServerVersionWarning,
  SharedEvent,
  TerminalExitPayload,
  TerminalOutputPayload,
} from "./events";

// Version metadata.
export { TYDE_PROTOCOL_VERSION, compareTydeVersionHeaders } from "./version";
export type { TydeVersionCompatibility, TydeVersionHeader } from "./version";

// Mock backend for testing.
export { MockBackend } from "./mock";
export type { MockBehavior } from "./mock";
