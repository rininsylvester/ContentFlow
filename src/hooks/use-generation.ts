"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { AI_ERROR_MESSAGES, type AiErrorCode } from "@/lib/ai/errors";
import type { TaskId } from "@/lib/ai/models";
import { parsePartialJson } from "@/lib/ai/partial-json";
import type { StreamEvent } from "@/lib/ai/protocol";
import type { UsageSummary } from "@/lib/billing/usage-summary";

export type GenerationError = { code: AiErrorCode; message: string; retryAfterSeconds?: number };

export type GenerationState<T> = {
  status: "idle" | "streaming" | "done" | "error";
  /** Best-effort parse of the JSON received so far (while streaming). */
  partial: unknown;
  output: T | undefined;
  generationId: string | undefined;
  error: GenerationError | undefined;
  usage: UsageSummary | null;
};

export type GenerationRequestBody = {
  input: unknown;
  useBrandVoice?: boolean;
  parentId?: string;
};

const initialState = {
  status: "idle",
  partial: undefined,
  output: undefined,
  generationId: undefined,
  error: undefined,
  usage: null,
} as const;

/**
 * Calls POST /api/ai/[task] and consumes its NDJSON stream. The caller keeps
 * ownership of the form state, so input is never lost on failure.
 */
export function useGeneration<T>(
  taskId: TaskId,
  options?: {
    onDone?: (output: T, generationId: string) => void;
    onError?: (error: GenerationError) => void;
  },
) {
  const router = useRouter();
  const [state, setState] = useState<GenerationState<T>>(initialState);
  const abortRef = useRef<AbortController | null>(null);
  const onDoneRef = useRef(options?.onDone);
  const onErrorRef = useRef(options?.onError);

  useEffect(() => {
    onDoneRef.current = options?.onDone;
    onErrorRef.current = options?.onError;
  });

  useEffect(() => () => abortRef.current?.abort(), []);

  const fail = useCallback((error: GenerationError) => {
    setState((s) => ({ ...s, status: "error", error }));
    onErrorRef.current?.(error);
  }, []);

  const start = useCallback(
    async (body: GenerationRequestBody) => {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;
      setState({ ...initialState, status: "streaming" });

      let raw = "";
      let frame = 0;
      const flushPartial = () => {
        frame = 0;
        const partial = parsePartialJson(raw);
        setState((s) => (s.status === "streaming" ? { ...s, partial } : s));
      };

      try {
        const res = await fetch(`/api/ai/${taskId}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
          signal: controller.signal,
        });

        if (!res.ok || !res.body) {
          const event = (await res.json().catch(() => null)) as StreamEvent | null;
          if (event?.type === "error")
            fail({
              code: event.code,
              message: event.message,
              retryAfterSeconds: event.retryAfterSeconds,
            });
          else fail({ code: "provider_error", message: AI_ERROR_MESSAGES.provider_error });
          return;
        }

        const reader = res.body.pipeThrough(new TextDecoderStream()).getReader();
        let buffer = "";
        let finished = false;
        while (!finished) {
          const { value, done } = await reader.read();
          if (done) break;
          buffer += value;
          let newline = buffer.indexOf("\n");
          while (newline !== -1) {
            const line = buffer.slice(0, newline).trim();
            buffer = buffer.slice(newline + 1);
            newline = buffer.indexOf("\n");
            if (!line) continue;

            const event = JSON.parse(line) as StreamEvent;
            switch (event.type) {
              case "start":
                setState((s) => ({ ...s, generationId: event.generationId }));
                break;
              case "delta":
                raw += event.text;
                frame ||= requestAnimationFrame(flushPartial);
                break;
              case "reset":
                raw = "";
                setState((s) => ({ ...s, partial: undefined }));
                break;
              case "done":
                cancelAnimationFrame(frame);
                setState({
                  status: "done",
                  partial: event.output,
                  output: event.output as T,
                  generationId: event.generationId,
                  error: undefined,
                  usage: event.usage,
                });
                onDoneRef.current?.(event.output as T, event.generationId);
                router.refresh(); // update the sidebar usage meter
                finished = true;
                break;
              case "error":
                cancelAnimationFrame(frame);
                fail({ code: event.code, message: event.message });
                router.refresh();
                finished = true;
                break;
            }
          }
        }
        if (!finished) {
          fail({ code: "provider_error", message: AI_ERROR_MESSAGES.provider_error });
        }
      } catch (error) {
        cancelAnimationFrame(frame);
        if (controller.signal.aborted) {
          setState((s) => (s.status === "streaming" ? { ...initialState } : s));
          return;
        }
        console.error(error);
        fail({
          code: "provider_error",
          message: "Network error. Check your connection and try again.",
        });
      }
    },
    [taskId, fail, router],
  );

  const stop = useCallback(() => abortRef.current?.abort(), []);
  const reset = useCallback(() => {
    abortRef.current?.abort();
    setState(initialState);
  }, []);

  return { ...state, start, stop, reset };
}
