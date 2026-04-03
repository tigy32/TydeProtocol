import type { FileContent, FileEntry, GitFileStatus, ImageAttachment } from "./types";

// --- Shared enums/types used by commands ---

export type BackendKind = "tycode" | "codex" | "claude" | "kiro" | "gemini";

export interface RuntimeAgent {
  agent_id: string;
  conversation_id: number;
  workspace_roots: string[];
  backend_kind: string;
  parent_agent_id: string | null;
  name: string;
  agent_type: string | null;
  agent_definition_id: string | null;
  is_running: boolean;
  summary: string;
  created_at_ms: number;
  updated_at_ms: number;
  ended_at_ms: number | null;
  last_error: string | null;
  last_message: string | null;
}

export type ToolPolicy =
  | { mode: "Unrestricted" }
  | { mode: "AllowList"; tools: string[] }
  | { mode: "DenyList"; tools: string[] };

export interface AgentMcpTransportHttp {
  type: "http";
  url: string;
  headers?: Record<string, string>;
}

export interface AgentMcpTransportStdio {
  type: "stdio";
  command: string;
  args?: string[];
  env?: Record<string, string>;
}

export interface AgentMcpServer {
  name: string;
  transport: AgentMcpTransportHttp | AgentMcpTransportStdio;
}

export interface AgentDefinition {
  id: string;
  name: string;
  description: string;
  instructions?: string;
  bootstrap_prompt?: string;
  mcp_servers: AgentMcpServer[];
  tool_policy: ToolPolicy;
  default_backend?: string;
  include_agent_control: boolean;
  builtin: boolean;
}

export interface AgentDefinitionEntry extends AgentDefinition {
  scope: "builtin" | "global" | "project";
}

export interface RuntimeAgentEvent {
  seq: number;
  agent_id: string;
  conversation_id: number;
  kind: string;
  is_running: boolean;
  timestamp_ms: number;
  message: string | null;
}

export interface RuntimeAgentEventBatch {
  events: RuntimeAgentEvent[];
  latest_seq: number;
}

export interface SpawnAgentResponse {
  agent_id: string;
  conversation_id: number;
}

export interface CollectedAgentResult {
  agent: RuntimeAgent;
  final_message: string | null;
  changed_files: string[];
  tool_results: unknown[];
}

export interface McpHttpServerSettings {
  enabled: boolean;
  running: boolean;
  url: string | null;
}

export interface DriverMcpHttpServerSettings {
  enabled: boolean;
  autoload: boolean;
  running: boolean;
  url: string | null;
}

export interface BackendDepResult {
  available: boolean;
  binary_name: string;
}

export interface BackendDependencyStatus {
  tycode: BackendDepResult;
  codex: BackendDepResult;
  claude: BackendDepResult;
  kiro: BackendDepResult;
  gemini: BackendDepResult;
}

// --- Dev instance types (driver MCP tools) ---

export interface DevInstanceStartParams {
  project_dir: string;
  workspace_path?: string;
  ssh_host?: string;
  agent_id?: string;
}

export interface DevInstanceStartResult {
  instance_id: number;
  debug_mcp_url: string;
  status: string;
}

export interface DevInstanceStopParams {
  instance_id?: number;
}

export interface DevInstanceStopResult {
  status: string;
}

export interface DevInstanceInfo {
  instance_id: number;
  project_dir: string;
  ssh_host: string | null;
  agent_id: string | null;
  debug_mcp_url: string;
}

// --- Workflow types ---

export interface WorkflowEntry {
  id: string;
  name: string;
  description: string;
  trigger: string;
  steps: WorkflowStepEntry[];
  scope: "global" | "project";
}

export interface WorkflowStepEntry {
  name: string;
  actions: WorkflowActionEntry[];
}

export type WorkflowActionEntry =
  | { type: "run_command"; command: string }
  | { type: "spawn_agent"; prompt: string; name: string }
  | { type: "run_workflow"; workflowId: string };

export interface ShellCommandResult {
  stdout: string;
  stderr: string;
  exit_code: number | null;
  success: boolean;
}

export interface SessionRecord {
  id: string;
  backend_session_id: string | null;
  backend_kind: string;
  alias: string | null;
  user_alias: string | null;
  parent_id: string | null;
  workspace_root: string | null;
  created_at_ms: number;
  updated_at_ms: number;
  message_count: number;
}

export interface CreateConversationResponse {
  conversation_id: number;
  session_id: string;
}

export interface Host {
  id: string;
  label: string;
  hostname: string;
  is_local: boolean;
  remote_kind: "ssh_pipe" | "tyde_server";
  enabled_backends: string[];
  default_backend: string;
}

export interface RemoteControlSettings {
  enabled: boolean;
  running: boolean;
  socket_path: string | null;
  connected_clients: number;
}

export interface BackendUsageWindow {
  id: string;
  label: string;
  used_percent: number | null;
  reset_at_text: string | null;
  reset_at_unix: number | null;
  window_minutes: number | null;
}

export interface BackendUsageResult {
  backend_kind: BackendKind;
  source: string;
  captured_at_ms: number;
  plan: string | null;
  status: string | null;
  windows: BackendUsageWindow[];
  details: string[];
}

// --- The command map ---

export interface CommandMap {
  // Conversation management
  create_conversation: {
    params: {
      workspaceRoots: string[];
      backendKind?: BackendKind;
      ephemeral?: boolean;
      agentDefinitionId?: string;
    };
    response: CreateConversationResponse;
  };
  send_message: {
    params: {
      conversationId: number;
      message: string;
      images?: ImageAttachment[];
    };
    response: void;
  };
  cancel_conversation: {
    params: { conversationId: number };
    response: void;
  };
  close_conversation: {
    params: { conversationId: number };
    response: void;
  };

  // Sessions
  list_sessions: {
    params: { conversationId: number };
    response: void;
  };
  resume_session: {
    params: { conversationId: number; sessionId: string };
    response: void;
  };
  get_session_id: {
    params: { conversationId: number };
    response: string | null;
  };
  delete_session: {
    params: { conversationId: number; sessionId: string };
    response: void;
  };
  list_session_records: {
    params: Record<string, never>;
    response: SessionRecord[];
  };
  rename_session: {
    params: { id: string; name: string };
    response: void;
  };
  set_session_alias: {
    params: { id: string; alias: string };
    response: void;
  };
  export_session_json: {
    params: { sessionId: string };
    response: string;
  };

  // Settings & models
  get_settings: {
    params: { conversationId: number };
    response: void;
  };
  update_settings: {
    params: {
      conversationId: number;
      settings: Record<string, unknown>;
      persist?: boolean;
    };
    response: void;
  };
  list_models: {
    params: { conversationId: number };
    response: void;
  };
  list_profiles: {
    params: { conversationId: number };
    response: void;
  };
  switch_profile: {
    params: { conversationId: number; profileName: string };
    response: void;
  };
  get_module_schemas: {
    params: { conversationId: number };
    response: void;
  };

  // Agent control
  spawn_agent: {
    params: {
      workspaceRoots: string[];
      prompt: string;
      backendKind?: BackendKind;
      parentAgentId?: string;
      name?: string;
      ephemeral?: boolean;
    };
    response: SpawnAgentResponse;
  };
  send_agent_message: {
    params: { agentId: string; message: string };
    response: void;
  };
  interrupt_agent: {
    params: { agentId: string };
    response: void;
  };
  terminate_agent: {
    params: { agentId: string };
    response: void;
  };
  rename_agent: {
    params: { agentId: string; name: string };
    response: void;
  };
  get_agent: {
    params: { agentId: string };
    response: RuntimeAgent | null;
  };
  list_agents: {
    params: Record<string, never>;
    response: RuntimeAgent[];
  };
  wait_for_agent: {
    params: { agentId: string; timeoutMs?: number };
    response: RuntimeAgent;
  };
  agent_events_since: {
    params: { sinceSeq?: number; limit?: number };
    response: RuntimeAgentEventBatch;
  };
  collect_agent_result: {
    params: { agentId: string };
    response: CollectedAgentResult;
  };

  // Admin subprocess
  create_admin_subprocess: {
    params: { workspaceRoots: string[]; backendKind?: BackendKind };
    response: number;
  };
  close_admin_subprocess: {
    params: { adminId: number };
    response: void;
  };
  admin_list_sessions: {
    params: { adminId: number };
    response: void;
  };
  admin_get_settings: {
    params: { adminId: number };
    response: void;
  };
  admin_update_settings: {
    params: { adminId: number; settings: Record<string, unknown> };
    response: void;
  };
  admin_list_profiles: {
    params: { adminId: number };
    response: void;
  };
  admin_switch_profile: {
    params: { adminId: number; profileName: string };
    response: void;
  };
  admin_get_module_schemas: {
    params: { adminId: number };
    response: void;
  };
  admin_delete_session: {
    params: { adminId: number; sessionId: string };
    response: void;
  };

  // Git operations
  discover_git_repos: {
    params: { workspaceDir: string };
    response: string[];
  };
  git_current_branch: {
    params: { workingDir: string };
    response: string;
  };
  git_status: {
    params: { workingDir: string };
    response: GitFileStatus[];
  };
  git_stage: {
    params: { workingDir: string; paths: string[] };
    response: void;
  };
  git_unstage: {
    params: { workingDir: string; paths: string[] };
    response: void;
  };
  git_commit: {
    params: { workingDir: string; message: string };
    response: string;
  };
  git_diff: {
    params: { workingDir: string; path: string; staged: boolean };
    response: string;
  };
  git_diff_base_content: {
    params: { workingDir: string; path: string; staged: boolean };
    response: string;
  };
  git_discard: {
    params: { workingDir: string; paths: string[] };
    response: void;
  };
  git_worktree_add: {
    params: { workingDir: string; path: string; branch: string };
    response: void;
  };
  git_worktree_remove: {
    params: { workingDir: string; path: string };
    response: void;
  };

  // File operations
  list_directory: {
    params: { path: string; showHidden?: boolean };
    response: FileEntry[];
  };
  read_file_content: {
    params: { path: string };
    response: FileContent;
  };
  sync_file_watch_paths: {
    params: { paths: string[] };
    response: void;
  };
  watch_workspace_dir: {
    params: { path: string };
    response: void;
  };
  unwatch_workspace_dir: {
    params: Record<string, never>;
    response: void;
  };

  // Terminal
  create_terminal: {
    params: { workspacePath: string };
    response: number;
  };
  write_terminal: {
    params: { terminalId: number; data: string };
    response: void;
  };
  resize_terminal: {
    params: { terminalId: number; cols: number; rows: number };
    response: void;
  };
  close_terminal: {
    params: { terminalId: number };
    response: void;
  };

  // MCP HTTP server
  get_mcp_http_server_settings: {
    params: Record<string, never>;
    response: McpHttpServerSettings;
  };
  set_mcp_http_server_enabled: {
    params: { enabled: boolean };
    response: McpHttpServerSettings;
  };
  get_driver_mcp_http_server_settings: {
    params: Record<string, never>;
    response: DriverMcpHttpServerSettings;
  };
  set_driver_mcp_http_server_enabled: {
    params: { enabled: boolean };
    response: DriverMcpHttpServerSettings;
  };
  set_driver_mcp_http_server_autoload_enabled: {
    params: { enabled: boolean };
    response: DriverMcpHttpServerSettings;
  };

  // Host management
  list_hosts: {
    params: Record<string, never>;
    response: Host[];
  };
  add_host: {
    params: { label: string; hostname: string; remote_kind?: string };
    response: Host;
  };
  remove_host: {
    params: { id: string };
    response: void;
  };
  update_host_label: {
    params: { id: string; label: string };
    response: void;
  };
  update_host_enabled_backends: {
    params: { id: string; backends: string[] };
    response: void;
  };
  update_host_default_backend: {
    params: { id: string; backend: string };
    response: void;
  };
  get_host_for_workspace: {
    params: { workspacePath: string };
    response: Host;
  };

  // MCP control
  set_mcp_control_enabled: {
    params: { enabled: boolean };
    response: void;
  };

  // Remote control
  get_remote_control_settings: {
    params: Record<string, never>;
    response: RemoteControlSettings;
  };
  set_remote_control_enabled: {
    params: { enabled: boolean };
    response: RemoteControlSettings;
  };

  // Backend management
  query_backend_usage: {
    params: { backendKind: BackendKind; hostId?: string };
    response: BackendUsageResult;
  };
  check_backend_dependencies: {
    params: Record<string, never>;
    response: BackendDependencyStatus;
  };
  set_disabled_backends: {
    params: { backends: string[] };
    response: void;
  };
  install_backend_dependency: {
    params: { backendKind: string };
    response: void;
  };

  // Process management
  restart_subprocess: {
    params: { conversationId: number };
    response: void;
  };
  list_active_conversations: {
    params: Record<string, never>;
    response: number[];
  };
  shutdown_all_subprocesses: {
    params: Record<string, never>;
    response: void;
  };

  // Workspace
  get_initial_workspace: {
    params: Record<string, never>;
    response: string | null;
  };

  // Other
  submit_feedback: {
    params: { feedback: string };
    response: void;
  };
  submit_debug_ui_response: {
    params: { requestId: string; ok: boolean; result?: unknown; error?: string };
    response: void;
  };
  submit_create_workbench_response: {
    params: { requestId: string; ok: boolean; workspacePath?: string; error?: string };
    response: void;
  };
  set_default_backend: {
    params: { backend: string };
    response: void;
  };

  // Workflow operations
  list_workflows: {
    params: { workspacePath?: string };
    response: WorkflowEntry[];
  };
  save_workflow: {
    params: { workflowJson: string; scope: string; workspacePath?: string };
    response: void;
  };
  delete_workflow: {
    params: { id: string; scope: string; workspacePath?: string };
    response: void;
  };
  run_shell_command: {
    params: { command: string; cwd: string };
    response: ShellCommandResult;
  };

  // Agent definition operations
  list_agent_definitions: {
    params: { workspacePath?: string };
    response: AgentDefinitionEntry[];
  };
  save_agent_definition: {
    params: { definitionJson: string; scope: string; workspacePath?: string };
    response: void;
  };
  delete_agent_definition: {
    params: { id: string; scope: string; workspacePath?: string };
    response: void;
  };
}

// --- Utility types ---

export type CommandName = keyof CommandMap;
export type CommandParams<K extends CommandName> = CommandMap[K]["params"];
export type CommandResponse<K extends CommandName> = CommandMap[K]["response"];

// --- Platform subsets ---

export type DesktopOnlyCommand =
  | "get_initial_workspace"
  | "discover_git_repos"
  | "list_hosts"
  | "add_host"
  | "remove_host"
  | "update_host_label"
  | "update_host_enabled_backends"
  | "update_host_default_backend"
  | "get_host_for_workspace"
  | "set_mcp_control_enabled"
  | "get_remote_control_settings"
  | "set_remote_control_enabled"
  | "query_backend_usage"
  | "create_terminal"
  | "write_terminal"
  | "resize_terminal"
  | "close_terminal"
  | "watch_workspace_dir"
  | "unwatch_workspace_dir"
  | "sync_file_watch_paths"
  | "git_worktree_add"
  | "git_worktree_remove"
  | "get_mcp_http_server_settings"
  | "set_mcp_http_server_enabled"
  | "get_driver_mcp_http_server_settings"
  | "set_driver_mcp_http_server_enabled"
  | "set_driver_mcp_http_server_autoload_enabled"
  | "submit_debug_ui_response"
  | "submit_create_workbench_response"
  | "set_default_backend"
  | "list_workflows"
  | "save_workflow"
  | "delete_workflow"
  | "run_shell_command"
  | "list_agent_definitions"
  | "save_agent_definition"
  | "delete_agent_definition";

export type SharedCommand = Exclude<CommandName, DesktopOnlyCommand>;
