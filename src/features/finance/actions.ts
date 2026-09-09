"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUserOrganization } from "@/features/projects/actions";
import { getSupabaseConfig } from "@/lib/supabase/env";
import type { Database } from "@/types/database";

export type BudgetRow = Database["public"]["Tables"]["budgets"]["Row"];

export interface LedgerEntry extends BudgetRow {
  vendorName?: string | null;
  projectName?: string | null;
}

export interface LedgerSummary {
  totalIncome: number;
  totalExpense: number;
  currentBalance: number;
  totalBudget: number;
  incomeCount: number;
  expenseCount: number;
}

export interface FinancePageData {
  entries: LedgerEntry[];
  summary: LedgerSummary;
  vendors: Array<{ id: string; name: string }>;
  projects: Array<{ id: string; name: string }>;
  isAdmin: boolean;
}

export async function getFinanceData(): Promise<FinancePageData> {
  const emptyResult: FinancePageData = {
    entries: [],
    summary: {
      totalIncome: 0,
      totalExpense: 0,
      currentBalance: 0,
      totalBudget: 0,
      incomeCount: 0,
      expenseCount: 0,
    },
    vendors: [],
    projects: [],
    isAdmin: false,
  };

  if (!getSupabaseConfig()) {
    return emptyResult;
  }

  const membership = await getCurrentUserOrganization();
  if (!membership) {
    return emptyResult;
  }

  const isAdmin = ["PRESIDENT", "VICE_PRESIDENT", "ADMIN"].includes(membership.role);
  const supabase = await createClient();

  // 1. Fetch all budget/ledger entries for the organization
  const { data: rawEntries } = await supabase
    .from("budgets")
    .select("*, vendors(id, name), projects(id, name)")
    .eq("organization_id", membership.organizationId)
    .order("transaction_date", { ascending: false })
    .order("created_at", { ascending: false });

  // 2. Fetch available vendors for dropdowns
  const { data: rawVendors } = await supabase
    .from("vendors")
    .select("id, name")
    .eq("organization_id", membership.organizationId)
    .order("name", { ascending: true });

  // 3. Fetch available projects for dropdowns
  const { data: rawProjects } = await supabase
    .from("projects")
    .select("id, name")
    .eq("organization_id", membership.organizationId)
    .order("name", { ascending: true });

  let totalIncome = 0;
  let totalExpense = 0;
  let totalBudget = 0;
  let incomeCount = 0;
  let expenseCount = 0;

  const entries: LedgerEntry[] = (rawEntries ?? []).map((row) => {
    const isIncome = row.type === "INCOME";
    const amount = Number(row.actual_amount ?? 0);
    const planned = Number(row.planned_amount ?? 0);

    if (isIncome) {
      totalIncome += amount;
      incomeCount += 1;
    } else {
      totalExpense += amount;
      expenseCount += 1;
    }
    totalBudget += planned;

    // Supabase join resolution
    // row.vendors may be an object or null depending on FK
    const vendorObj = row.vendors as { id: string; name: string } | null;
    const projectObj = row.projects as { id: string; name: string } | null;

    return {
      ...row,
      vendorName: vendorObj?.name ?? null,
      projectName: projectObj?.name ?? null,
    };
  });

  const summary: LedgerSummary = {
    totalIncome,
    totalExpense,
    currentBalance: totalIncome - totalExpense,
    totalBudget,
    incomeCount,
    expenseCount,
  };

  return {
    entries,
    summary,
    vendors: rawVendors ?? [],
    projects: rawProjects ?? [],
    isAdmin,
  };
}

export async function createLedgerEntry(
  _prevState: { error: string | null; success?: boolean },
  formData: FormData,
): Promise<{ error: string | null; success?: boolean }> {
  const title = formData.get("title");
  const type = formData.get("type");
  const amountRaw = formData.get("amount");
  const plannedAmountRaw = formData.get("planned_amount");
  const category = formData.get("category");
  const transactionDate = formData.get("transaction_date");
  const vendorId = formData.get("vendor_id");
  const projectId = formData.get("project_id");
  const receiptUrl = formData.get("receipt_url");

  if (typeof title !== "string" || !title.trim()) {
    return { error: "항목명(내역)을 입력해 주세요." };
  }

  const amount = parseInt(String(amountRaw || 0), 10);
  if (isNaN(amount) || amount < 0) {
    return { error: "금액을 올바르게 입력해 주세요 (0원 이상)." };
  }

  const plannedAmount = plannedAmountRaw ? parseInt(String(plannedAmountRaw), 10) : amount;
  const entryType = type === "INCOME" ? "INCOME" : "EXPENSE";

  const membership = await getCurrentUserOrganization();
  if (!membership) {
    return { error: "학생회 조직 정보를 찾을 수 없습니다." };
  }

  const supabase = await createClient();

  const insertPayload: Database["public"]["Tables"]["budgets"]["Insert"] = {
    organization_id: membership.organizationId,
    title: title.trim(),
    type: entryType,
    actual_amount: amount,
    planned_amount: isNaN(plannedAmount) ? amount : plannedAmount,
    category: typeof category === "string" && category.trim() ? category.trim() : "기타",
    transaction_date:
      typeof transactionDate === "string" && transactionDate.trim()
        ? transactionDate.trim()
        : new Date().toISOString().slice(0, 10),
    vendor_id: typeof vendorId === "string" && vendorId.trim() ? vendorId.trim() : null,
    project_id: typeof projectId === "string" && projectId.trim() ? projectId.trim() : null,
    receipt_url: typeof receiptUrl === "string" && receiptUrl.trim() ? receiptUrl.trim() : null,
  };

  const { error } = await supabase.from("budgets").insert(insertPayload);

  if (error) {
    return { error: "장부 항목 등록에 실패했습니다: " + error.message };
  }

  revalidatePath("/finance");
  revalidatePath("/vendors");
  return { error: null, success: true };
}

export async function updateLedgerEntry(
  _prevState: { error: string | null; success?: boolean },
  formData: FormData,
): Promise<{ error: string | null; success?: boolean }> {
  const entryId = formData.get("entry_id");
  const title = formData.get("title");
  const type = formData.get("type");
  const amountRaw = formData.get("amount");
  const plannedAmountRaw = formData.get("planned_amount");
  const category = formData.get("category");
  const transactionDate = formData.get("transaction_date");
  const vendorId = formData.get("vendor_id");
  const projectId = formData.get("project_id");
  const receiptUrl = formData.get("receipt_url");

  if (typeof entryId !== "string" || !entryId) {
    return { error: "항목 ID가 올바르지 않습니다." };
  }
  if (typeof title !== "string" || !title.trim()) {
    return { error: "항목명(내역)을 입력해 주세요." };
  }

  const amount = parseInt(String(amountRaw || 0), 10);
  if (isNaN(amount) || amount < 0) {
    return { error: "금액을 올바르게 입력해 주세요." };
  }

  const plannedAmount = plannedAmountRaw ? parseInt(String(plannedAmountRaw), 10) : amount;
  const entryType = type === "INCOME" ? "INCOME" : "EXPENSE";

  const membership = await getCurrentUserOrganization();
  if (!membership) {
    return { error: "학생회 조직 정보를 찾을 수 없습니다." };
  }

  const supabase = await createClient();

  const updatePayload: Database["public"]["Tables"]["budgets"]["Update"] = {
    title: title.trim(),
    type: entryType,
    actual_amount: amount,
    planned_amount: isNaN(plannedAmount) ? amount : plannedAmount,
    category: typeof category === "string" && category.trim() ? category.trim() : "기타",
    transaction_date:
      typeof transactionDate === "string" && transactionDate.trim()
        ? transactionDate.trim()
        : new Date().toISOString().slice(0, 10),
    vendor_id: typeof vendorId === "string" && vendorId.trim() ? vendorId.trim() : null,
    project_id: typeof projectId === "string" && projectId.trim() ? projectId.trim() : null,
    receipt_url: typeof receiptUrl === "string" && receiptUrl.trim() ? receiptUrl.trim() : null,
  };

  const { error } = await supabase
    .from("budgets")
    .update(updatePayload)
    .eq("organization_id", membership.organizationId)
    .eq("id", entryId);

  if (error) {
    return { error: "장부 항목 수정에 실패했습니다: " + error.message };
  }

  revalidatePath("/finance");
  revalidatePath("/vendors");
  return { error: null, success: true };
}

export async function deleteLedgerEntry(
  entryId: string,
): Promise<{ error: string | null; success?: boolean }> {
  const membership = await getCurrentUserOrganization();
  if (!membership) {
    return { error: "학생회 조직 정보를 찾을 수 없습니다." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("budgets")
    .delete()
    .eq("organization_id", membership.organizationId)
    .eq("id", entryId);

  if (error) {
    return { error: "장부 항목 삭제에 실패했습니다: " + error.message };
  }

  revalidatePath("/finance");
  revalidatePath("/vendors");
  return { error: null, success: true };
}
