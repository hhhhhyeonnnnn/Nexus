"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUserOrganization } from "@/features/projects/actions";
import { getSupabaseConfig } from "@/lib/supabase/env";
import type { Database } from "@/types/database";

export type VendorRow = Database["public"]["Tables"]["vendors"]["Row"];

export interface VendorWithStats extends VendorRow {
  totalSpent: number;
  transactionCount: number;
}

export interface VendorsPageData {
  vendors: VendorWithStats[];
  categoryCounts: Record<string, number>;
  isAdmin: boolean;
}

export async function getVendors(categoryFilter?: string): Promise<VendorsPageData> {
  if (!getSupabaseConfig()) {
    return { vendors: [], categoryCounts: {}, isAdmin: false };
  }

  const membership = await getCurrentUserOrganization();
  if (!membership) {
    return { vendors: [], categoryCounts: {}, isAdmin: false };
  }

  const isAdmin = ["PRESIDENT", "VICE_PRESIDENT", "ADMIN"].includes(membership.role);
  const supabase = await createClient();

  // 1. Fetch vendors
  let query = supabase
    .from("vendors")
    .select("*")
    .eq("organization_id", membership.organizationId)
    .order("created_at", { ascending: false });

  if (categoryFilter && categoryFilter !== "ALL") {
    query = query.eq("category", categoryFilter);
  }

  const { data: rawVendors } = await query;

  // 2. Fetch budget spending associated with vendors
  const { data: budgetsData } = await supabase
    .from("budgets")
    .select("vendor_id, actual_amount")
    .eq("organization_id", membership.organizationId)
    .not("vendor_id", "is", null);

  const spentMap = new Map<string, { total: number; count: number }>();
  if (budgetsData) {
    for (const b of budgetsData) {
      if (!b.vendor_id) continue;
      const cur = spentMap.get(b.vendor_id) ?? { total: 0, count: 0 };
      cur.total += Number(b.actual_amount ?? 0);
      cur.count += 1;
      spentMap.set(b.vendor_id, cur);
    }
  }

  const vendors: VendorWithStats[] = (rawVendors ?? []).map((v) => {
    const stats = spentMap.get(v.id) ?? { total: 0, count: 0 };
    return {
      ...v,
      totalSpent: stats.total,
      transactionCount: stats.count,
    };
  });

  // Calculate category counts across all vendors in this org
  const { data: allVendors } = await supabase
    .from("vendors")
    .select("category")
    .eq("organization_id", membership.organizationId);

  const categoryCounts: Record<string, number> = { ALL: allVendors?.length ?? 0 };
  if (allVendors) {
    for (const v of allVendors) {
      const cat = v.category || "기타";
      categoryCounts[cat] = (categoryCounts[cat] ?? 0) + 1;
    }
  }

  return { vendors, categoryCounts, isAdmin };
}

export async function createVendor(
  _prevState: { error: string | null; success?: boolean },
  formData: FormData,
): Promise<{ error: string | null; success?: boolean }> {
  const name = formData.get("name");
  const category = formData.get("category");
  const contactName = formData.get("contact_name");
  const phone = formData.get("phone");
  const ratingRaw = formData.get("rating");
  const memo = formData.get("memo");

  if (typeof name !== "string" || !name.trim()) {
    return { error: "업체명을 입력해 주세요." };
  }

  const rating = ratingRaw ? Math.min(5, Math.max(1, parseInt(String(ratingRaw), 10))) : 5;

  const membership = await getCurrentUserOrganization();
  if (!membership) {
    return { error: "학생회 조직 정보를 찾을 수 없습니다." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("vendors").insert({
    organization_id: membership.organizationId,
    name: name.trim(),
    category: typeof category === "string" && category.trim() ? category.trim() : "기타",
    contact_name: typeof contactName === "string" ? contactName.trim() : null,
    phone: typeof phone === "string" ? phone.trim() : null,
    rating,
    memo: typeof memo === "string" ? memo.trim() : "",
  });

  if (error) {
    return { error: "업체 등록에 실패했습니다: " + error.message };
  }

  revalidatePath("/vendors");
  revalidatePath("/finance");
  return { error: null, success: true };
}

export async function updateVendor(
  _prevState: { error: string | null; success?: boolean },
  formData: FormData,
): Promise<{ error: string | null; success?: boolean }> {
  const vendorId = formData.get("vendor_id");
  const name = formData.get("name");
  const category = formData.get("category");
  const contactName = formData.get("contact_name");
  const phone = formData.get("phone");
  const ratingRaw = formData.get("rating");
  const memo = formData.get("memo");

  if (typeof vendorId !== "string" || !vendorId) {
    return { error: "업체 ID가 올바르지 않습니다." };
  }
  if (typeof name !== "string" || !name.trim()) {
    return { error: "업체명을 입력해 주세요." };
  }

  const rating = ratingRaw ? Math.min(5, Math.max(1, parseInt(String(ratingRaw), 10))) : 5;

  const membership = await getCurrentUserOrganization();
  if (!membership) {
    return { error: "학생회 조직 정보를 찾을 수 없습니다." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("vendors")
    .update({
      name: name.trim(),
      category: typeof category === "string" && category.trim() ? category.trim() : "기타",
      contact_name: typeof contactName === "string" ? contactName.trim() : null,
      phone: typeof phone === "string" ? phone.trim() : null,
      rating,
      memo: typeof memo === "string" ? memo.trim() : "",
    })
    .eq("organization_id", membership.organizationId)
    .eq("id", vendorId);

  if (error) {
    return { error: "업체 정보 수정에 실패했습니다: " + error.message };
  }

  revalidatePath("/vendors");
  revalidatePath("/finance");
  return { error: null, success: true };
}

export async function deleteVendor(
  vendorId: string,
): Promise<{ error: string | null; success?: boolean }> {
  const membership = await getCurrentUserOrganization();
  if (!membership) {
    return { error: "학생회 조직 정보를 찾을 수 없습니다." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("vendors")
    .delete()
    .eq("organization_id", membership.organizationId)
    .eq("id", vendorId);

  if (error) {
    return { error: "업체 삭제에 실패했습니다: " + error.message };
  }

  revalidatePath("/vendors");
  revalidatePath("/finance");
  return { error: null, success: true };
}
