import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/**
 * Account-owned data. Every function runs server-side behind the Supabase
 * auth middleware, so the signed-in user can only ever reach their own rows.
 */

export interface Profile {
  id: string;
  displayName: string | null;
  avatarUrl: string | null;
}

export interface HistoryEntry {
  id: string;
  kind: string;
  title: string;
  createdAt: string;
  payload: unknown;
}

export const getProfileFn = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<Profile> => {
    const { supabase, userId } = context;
    const { data, error } = await supabase
      .from("profiles")
      .select("id, display_name, avatar_url")
      .eq("id", userId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (data) {
      return { id: data.id, displayName: data.display_name, avatarUrl: data.avatar_url };
    }
    // The signup trigger normally creates this row; fall back for linked accounts.
    const { error: insertError } = await supabase.from("profiles").insert({ id: userId });
    if (insertError) throw new Error(insertError.message);
    return { id: userId, displayName: null, avatarUrl: null };
  });

const ProfileInput = z.object({
  displayName: z.string().trim().max(80).nullable().optional(),
  avatarUrl: z.string().trim().max(2000).nullable().optional(),
});

export const updateProfileFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => ProfileInput.parse(data))
  .handler(async ({ data, context }): Promise<Profile> => {
    const { supabase, userId } = context;
    const patch: Record<string, unknown> = { id: userId, updated_at: new Date().toISOString() };
    if (data.displayName !== undefined) patch["display_name"] = data.displayName || null;
    if (data.avatarUrl !== undefined) patch["avatar_url"] = data.avatarUrl || null;

    const { data: row, error } = await supabase
      .from("profiles")
      .upsert(patch as never)
      .select("id, display_name, avatar_url")
      .single();
    if (error) throw new Error(error.message);
    return { id: row.id, displayName: row.display_name, avatarUrl: row.avatar_url };
  });

export const listHistoryFn = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<HistoryEntry[]> => {
    const { supabase, userId } = context;
    const { data, error } = await supabase
      .from("history_entries")
      .select("id, kind, title, payload, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(50);
    if (error) throw new Error(error.message);
    return (data ?? []).map((row) => ({
      id: row.id,
      kind: row.kind,
      title: row.title,
      createdAt: row.created_at,
      payload: row.payload,
    }));
  });

const HistoryInput = z.object({
  kind: z.enum(["analyse", "compose"]),
  title: z.string().trim().min(1).max(160),
  payload: z.unknown(),
});

export const saveHistoryFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => HistoryInput.parse(data))
  .handler(async ({ data, context }): Promise<{ id: string }> => {
    const { supabase, userId } = context;
    const { data: row, error } = await supabase
      .from("history_entries")
      .insert({
        user_id: userId,
        kind: data.kind,
        title: data.title,
        payload: (data.payload ?? {}) as never,
      })
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    return { id: row.id };
  });

export const deleteHistoryFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => z.object({ id: z.string().uuid() }).parse(data))
  .handler(async ({ data, context }): Promise<{ ok: true }> => {
    const { supabase, userId } = context;
    const { error } = await supabase
      .from("history_entries")
      .delete()
      .eq("id", data.id)
      .eq("user_id", userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
