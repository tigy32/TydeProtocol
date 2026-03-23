import type {
  ChatEvent,
  ChatMessage,
  ContextBreakdown,
  MessageSender,
  Model,
  TaskList,
  TokenUsage,
  ToolExecutionResult,
  ToolRequest,
  ToolRequestType,
  ToolUseData,
} from "./core_types";

const MOCK_MODEL: Model = "ClaudeSonnet46";

// ---------------------------------------------------------------------------
// MockBehavior — declarative description of what a turn should produce
// ---------------------------------------------------------------------------

export type MockBehavior =
  | { kind: "Success"; text?: string }
  | { kind: "Error"; message: string }
  | {
      kind: "ToolUse";
      tool_name: string;
      tool_arguments: unknown;
      text?: string;
    }
  | {
      kind: "ToolUseThenSuccess";
      tool_name: string;
      tool_arguments: unknown;
      text?: string;
      result?: ToolExecutionResult;
    }
  | {
      kind: "MultipleToolUses";
      tool_uses: Array<{
        tool_name: string;
        tool_arguments: unknown;
        result?: ToolExecutionResult;
      }>;
      text?: string;
    }
  | { kind: "Reasoning"; reasoning_text: string; text?: string }
  | {
      kind: "TaskUpdate";
      tasks: TaskList;
      text?: string;
    }
  | { kind: "RetryableErrorThenSuccess"; remaining_errors: number }
  | { kind: "AlwaysError"; message?: string }
  | { kind: "Queue"; behaviors: MockBehavior[] };

// ---------------------------------------------------------------------------
// MockBackend — simulation-style mock that produces ChatEvent sequences
// ---------------------------------------------------------------------------

export class MockBackend {
  private behavior: MockBehavior;
  private turnCount = 0;
  private nextToolId = 1;

  constructor(behavior: MockBehavior = { kind: "Success" }) {
    this.behavior = behavior;
  }

  setBehavior(behavior: MockBehavior): void {
    this.behavior = behavior;
    this.turnCount = 0;
    this.nextToolId = 1;
  }

  getTurnCount(): number {
    return this.turnCount;
  }

  /**
   * Simulate one turn of conversation. Returns the full ordered sequence
   * of ChatEvents that a backend would emit in response to a user message.
   */
  turn(userMessage: string): ChatEvent[] {
    this.turnCount++;
    const effective = this.popBehavior();
    return this.executeBehavior(effective, userMessage);
  }

  // -------------------------------------------------------------------------
  // Internal
  // -------------------------------------------------------------------------

  private popBehavior(): MockBehavior {
    if (this.behavior.kind === "Queue") {
      if (this.behavior.behaviors.length === 0) {
        return { kind: "Success" };
      }
      return this.behavior.behaviors.shift()!;
    }
    return this.behavior;
  }

  private executeBehavior(
    behavior: MockBehavior,
    userMessage: string,
  ): ChatEvent[] {
    switch (behavior.kind) {
      case "Success":
        return this.buildSuccessSequence(
          behavior.text ?? `Mock response to: ${userMessage}`,
        );

      case "Error":
        return [
          this.typingChanged(true),
          this.event("Error", behavior.message),
          this.typingChanged(false),
        ];

      case "ToolUse":
        return this.buildToolUseSequence(
          behavior.tool_name,
          behavior.tool_arguments,
          behavior.text ?? "I'll use a tool.",
          undefined,
          false,
        );

      case "ToolUseThenSuccess": {
        const result = behavior.result ?? defaultToolResult(behavior.tool_name);
        return this.buildToolUseSequence(
          behavior.tool_name,
          behavior.tool_arguments,
          behavior.text ?? "I'll use a tool.",
          result,
          true,
        );
      }

      case "MultipleToolUses":
        return this.buildMultiToolSequence(
          behavior.tool_uses,
          behavior.text ?? "I'll use several tools.",
        );

      case "Reasoning":
        return this.buildReasoningSequence(
          behavior.reasoning_text,
          behavior.text ?? "Response after reasoning.",
        );

      case "TaskUpdate":
        return this.buildTaskUpdateSequence(
          behavior.tasks,
          behavior.text ?? "Working on tasks.",
        );

      case "RetryableErrorThenSuccess": {
        if (behavior.remaining_errors > 0) {
          behavior.remaining_errors--;
          return [
            this.event("RetryAttempt", {
              attempt: this.turnCount,
              max_retries: 3,
              error: "Mock retryable error",
              backoff_ms: 0,
            }),
          ];
        }
        return this.buildSuccessSequence("Success after retries.");
      }

      case "AlwaysError":
        return [
          this.typingChanged(true),
          this.event("Error", behavior.message ?? "Mock error (always fails)"),
          this.typingChanged(false),
        ];

      case "Queue":
        // Nested queue — should not happen after popBehavior, but handle gracefully.
        return this.buildSuccessSequence("Mock response");
    }
  }

  // -------------------------------------------------------------------------
  // Sequence builders
  // -------------------------------------------------------------------------

  private buildSuccessSequence(text: string): ChatEvent[] {
    const message = this.buildAssistantMessage(text, []);
    return [
      this.typingChanged(true),
      this.event("StreamStart", {
        agent: "mock",
        model: MOCK_MODEL,
      }),
      ...this.streamText(text),
      this.event("StreamEnd", { message }),
      this.typingChanged(false),
    ];
  }

  private buildToolUseSequence(
    toolName: string,
    toolArguments: unknown,
    text: string,
    result: ToolExecutionResult | undefined,
    emitCompletion: boolean,
  ): ChatEvent[] {
    const toolCallId = this.allocToolId(toolName);
    const toolCall: ToolUseData = {
      id: toolCallId,
      name: toolName,
      arguments: toolArguments,
    };
    const toolType = toolRequestTypeFromName(toolName, toolArguments);
    const message = this.buildAssistantMessage(text, [toolCall]);

    const events: ChatEvent[] = [
      this.typingChanged(true),
      this.event("StreamStart", {
        agent: "mock",
        model: MOCK_MODEL,
      }),
      ...this.streamText(text),
      this.event("StreamEnd", { message }),
      this.event("ToolRequest", {
        tool_call_id: toolCallId,
        tool_name: toolName,
        tool_type: toolType,
      } satisfies ToolRequest),
    ];

    if (emitCompletion && result) {
      events.push(
        this.event("ToolExecutionCompleted", {
          tool_call_id: toolCallId,
          tool_name: toolName,
          tool_result: result,
          success: result.kind !== "Error",
        }),
      );
    }

    events.push(this.typingChanged(false));
    return events;
  }

  private buildMultiToolSequence(
    toolUses: Array<{
      tool_name: string;
      tool_arguments: unknown;
      result?: ToolExecutionResult;
    }>,
    text: string,
  ): ChatEvent[] {
    const toolCalls: ToolUseData[] = toolUses.map((t) => ({
      id: this.allocToolId(t.tool_name),
      name: t.tool_name,
      arguments: t.tool_arguments,
    }));
    const message = this.buildAssistantMessage(text, toolCalls);

    const events: ChatEvent[] = [
      this.typingChanged(true),
      this.event("StreamStart", {
        agent: "mock",
        model: MOCK_MODEL,
      }),
      ...this.streamText(text),
      this.event("StreamEnd", { message }),
    ];

    for (let i = 0; i < toolUses.length; i++) {
      const t = toolUses[i];
      const call = toolCalls[i];
      const toolType = toolRequestTypeFromName(t.tool_name, t.tool_arguments);

      events.push(
        this.event("ToolRequest", {
          tool_call_id: call.id,
          tool_name: call.name,
          tool_type: toolType,
        } satisfies ToolRequest),
      );

      const result = t.result ?? defaultToolResult(t.tool_name);
      events.push(
        this.event("ToolExecutionCompleted", {
          tool_call_id: call.id,
          tool_name: call.name,
          tool_result: result,
          success: result.kind !== "Error",
        }),
      );
    }

    events.push(this.typingChanged(false));
    return events;
  }

  private buildReasoningSequence(
    reasoningText: string,
    responseText: string,
  ): ChatEvent[] {
    const message = this.buildAssistantMessage(responseText, []);
    message.reasoning = { text: reasoningText };

    return [
      this.typingChanged(true),
      this.event("StreamStart", {
        agent: "mock",
        model: MOCK_MODEL,
      }),
      ...this.streamReasoning(reasoningText),
      ...this.streamText(responseText),
      this.event("StreamEnd", { message }),
      this.typingChanged(false),
    ];
  }

  private buildTaskUpdateSequence(
    tasks: TaskList,
    text: string,
  ): ChatEvent[] {
    const message = this.buildAssistantMessage(text, []);
    return [
      this.typingChanged(true),
      this.event("StreamStart", {
        agent: "mock",
        model: MOCK_MODEL,
      }),
      this.event("TaskUpdate", tasks),
      ...this.streamText(text),
      this.event("StreamEnd", { message }),
      this.typingChanged(false),
    ];
  }

  // -------------------------------------------------------------------------
  // Helpers
  // -------------------------------------------------------------------------

  private streamText(text: string): ChatEvent[] {
    const mid = Math.floor(text.length / 2);
    if (mid === 0) {
      return [this.event("StreamDelta", { text })];
    }
    return [
      this.event("StreamDelta", { text: text.slice(0, mid) }),
      this.event("StreamDelta", { text: text.slice(mid) }),
    ];
  }

  private streamReasoning(text: string): ChatEvent[] {
    return [this.event("StreamReasoningDelta", { text })];
  }

  private buildAssistantMessage(
    content: string,
    toolCalls: ToolUseData[],
  ): ChatMessage {
    const usage: TokenUsage = {
      input_tokens: Math.min(this.turnCount * 50_000, 180_000),
      output_tokens: Math.max(100, content.length * 4),
      total_tokens: 0,
    };
    usage.total_tokens = usage.input_tokens + usage.output_tokens;

    const breakdown: ContextBreakdown = {
      system_prompt_bytes: 2000,
      tool_io_bytes: toolCalls.length > 0 ? 500 * toolCalls.length : 0,
      conversation_history_bytes: this.turnCount * 1000,
      reasoning_bytes: 0,
      context_injection_bytes: 0,
      input_tokens: usage.input_tokens,
      context_window: 200_000,
    };

    const sender: MessageSender = { Assistant: { agent: "mock" } };

    return {
      timestamp: Date.now(),
      sender,
      content,
      tool_calls: toolCalls,
      model_info: { model: MOCK_MODEL },
      token_usage: usage,
      context_breakdown: breakdown,
    };
  }

  private event<K extends ChatEvent["kind"]>(
    kind: K,
    data: Extract<ChatEvent, { kind: K }> extends { data: infer D } ? D : never,
  ): ChatEvent {
    return { kind, data } as ChatEvent;
  }

  private typingChanged(value: boolean): ChatEvent {
    return { kind: "TypingStatusChanged", data: value } as ChatEvent;
  }

  private allocToolId(toolName: string): string {
    return `mock-tool-${toolName}-${this.nextToolId++}`;
  }
}

// ---------------------------------------------------------------------------
// Utility functions
// ---------------------------------------------------------------------------

function toolRequestTypeFromName(
  toolName: string,
  toolArguments: unknown,
): ToolRequestType {
  const args =
    typeof toolArguments === "object" && toolArguments !== null
      ? toolArguments
      : {};

  switch (toolName) {
    case "ReadFiles":
      return {
        kind: "ReadFiles",
        file_paths: (args as any).file_paths ?? ["/mock/file.ts"],
      };
    case "ModifyFile":
      return {
        kind: "ModifyFile",
        file_path: (args as any).file_path ?? "/mock/file.ts",
        before: (args as any).before ?? "old",
        after: (args as any).after ?? "new",
      };
    case "RunCommand":
      return {
        kind: "RunCommand",
        command: (args as any).command ?? "echo hello",
        working_directory: (args as any).working_directory ?? "/mock",
      };
    default:
      return { kind: "Other", args: toolArguments };
  }
}

function defaultToolResult(toolName: string): ToolExecutionResult {
  switch (toolName) {
    case "ReadFiles":
      return {
        kind: "ReadFiles",
        files: [{ path: "/mock/file.ts", bytes: 42 }],
      };
    case "ModifyFile":
      return { kind: "ModifyFile", lines_added: 5, lines_removed: 2 };
    case "RunCommand":
      return {
        kind: "RunCommand",
        exit_code: 0,
        stdout: "ok\n",
        stderr: "",
      };
    default:
      return { kind: "Other", result: null };
  }
}
