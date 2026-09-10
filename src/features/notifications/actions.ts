"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUserOrganization } from "@/features/projects/actions";
import { getSupabaseConfig } from "@/lib/supabase/env";
import type { Database } from "@/types/database";

export type NotificationRow = Database["public"]["Tables"]["notifications"]["Row"];

export async function getNotifications(): Promise<{
  notifications: NotificationRow[];
  unreadCount: number;
}> {
  if (!getSupabaseConfig()) return { notifications: [], unreadCount: 0 };
  const membership = await getCurrentUserOrganization();
  if (!membership) return { notifications: [], unreadCount: 0 };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { notifications: [], unreadCount: 0 };

  const { data, error } = await supabase
    .from("notifications")
    .select("*")
    .eq("organization_id", membership.organizationId)
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(30);

  if (error || !data) return { notifications: [], unreadCount: 0 };

  const unreadCount = data.filter((n) => !n.is_read).length;
  return { notifications: data, unreadCount };
}

export async function markNotificationAsRead(id: string): Promise<{ success: boolean }> {
  if (!getSupabaseConfig()) return { success: false };
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { success: false };

  const { error } = await supabase
    .from("notifications")
    .update({ is_read: true })
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) return { success: false };

  revalidatePath("/dashboard");
  return { success: true };
}

export async function markAllNotificationsAsRead(): Promise<{ success: boolean }> {
  if (!getSupabaseConfig()) return { success: false };
  const membership = await getCurrentUserOrganization();
  if (!membership) return { success: false };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { success: false };

  const { error } = await supabase
    .from("notifications")
    .update({ is_read: true })
    .eq("organization_id", membership.organizationId)
    .eq("user_id", user.id)
    .eq("is_read", false);

  if (error) return { success: false };

  revalidatePath("/dashboard");
  return { success: true };
}

export async function createNotification({
  userId,
  title,
  message,
  type = "INFO",
  linkUrl,
}: {
  userId: string;
  title: string;
  message: string;
  type?: string;
  linkUrl?: string;
}): Promise<{ success: boolean; error?: string }> {
  if (!getSupabaseConfig()) return { success: false, error: "DB not configured" };
  const membership = await getCurrentUserOrganization();
  if (!membership) return { success: false, error: "No membership" };

  const supabase = await createClient();
  const { error } = await supabase.from("notifications").insert({
    organization_id: membership.organizationId,
    user_id: userId,
    title,
    message,
    type,
    link_url: linkUrl ?? null,
  });

  if (error) return { success: false, error: error.message };
  return { success: true };
}
