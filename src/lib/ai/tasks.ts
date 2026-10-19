import type { z } from "zod";
import type { Tool } from "@/lib/db/schema/enums";
import type { TaskId } from "./models";
import { ideasExpandV1 } from "./prompts/ideas-expand/v1";
import { ideasV1 } from "./prompts/ideas/v1";
import { scriptSectionV1 } from "./prompts/script-section/v1";
import { scriptV1 } from "./prompts/script/v1";
import type { PromptTemplate } from "./prompts/types";
import {
  ideaExpandInputSchema,
  ideaExpansionSchema,
  ideasInputSchema,
  ideasOutputSchema,
} from "./schemas/ideas";
import {
  scriptInputSchema,
  scriptOutputSchema,
  scriptSectionInputSchema,
  scriptSectionSchema,
} from "./schemas/script";

export type TaskDefinition<I extends z.ZodType = z.ZodType, O extends z.ZodType = z.ZodType> = {
  id: TaskId;
  /** Which dashboard tool the generation is recorded under. */
  tool: Tool;
  inputSchema: I;
  outputSchema: O;
  prompt: PromptTemplate<z.infer<I>>;
};

function defineTask<I extends z.ZodType, O extends z.ZodType>(
  task: TaskDefinition<I, O>,
): TaskDefinition<I, O> {
  return task;
}

export const TASKS = {
  ideas: defineTask({
    id: "ideas",
    tool: "ideas",
    inputSchema: ideasInputSchema,
    outputSchema: ideasOutputSchema,
    prompt: ideasV1,
  }),
  "ideas-expand": defineTask({
    id: "ideas-expand",
    tool: "ideas",
    inputSchema: ideaExpandInputSchema,
    outputSchema: ideaExpansionSchema,
    prompt: ideasExpandV1,
  }),
  script: defineTask({
    id: "script",
    tool: "script",
    inputSchema: scriptInputSchema,
    outputSchema: scriptOutputSchema,
    prompt: scriptV1,
  }),
  "script-section": defineTask({
    id: "script-section",
    tool: "script",
    inputSchema: scriptSectionInputSchema,
    outputSchema: scriptSectionSchema,
    prompt: scriptSectionV1,
  }),
} satisfies Record<TaskId, TaskDefinition>;

export function getTask(id: string): TaskDefinition | undefined {
  return Object.hasOwn(TASKS, id) ? (TASKS as Record<string, TaskDefinition>)[id] : undefined;
}
