import { BudgetItem } from "@/store/budget.store";
import { formatCurrency } from "./format";

export type BudgetWarningStatus = "NONE" | "OK" | "WARNING" | "EXCEEDED";

export interface BudgetWarningDetails {
  status: BudgetWarningStatus;
  budgetAmount: number;
  currentSpent: number;
  currentRemaining: number;
  projectedSpent: number;
  projectedRemaining: number;
  projectedPercentage: number;
  overAmount: number;
  message: string;
}

/**
 * Calculates budget impact and warning level for an expense transaction.
 */
export function calculateBudgetWarning(
  budget: BudgetItem | null | undefined,
  expenseAmount: number = 0,
): BudgetWarningDetails {
  if (!budget || budget.amount <= 0) {
    return {
      status: "NONE",
      budgetAmount: budget?.amount ?? 0,
      currentSpent: budget?.spent ?? 0,
      currentRemaining: budget?.remaining ?? 0,
      projectedSpent: 0,
      projectedRemaining: 0,
      projectedPercentage: 0,
      overAmount: 0,
      message: "",
    };
  }

  const validAmount = Math.max(0, Number(expenseAmount) || 0);
  const currentSpent = budget.spent;
  const currentRemaining = budget.remaining;
  const projectedSpent = currentSpent + validAmount;
  const projectedRemaining = budget.amount - projectedSpent;
  const projectedPercentage = Number(
    ((projectedSpent / budget.amount) * 100).toFixed(1),
  );

  // If projected spending exceeds the budget amount
  if (projectedSpent > budget.amount) {
    const overAmount = projectedSpent - budget.amount;
    const message =
      currentSpent > budget.amount
        ? `This category is already over budget. This expense increases overspending to ${formatCurrency(overAmount)} (${Math.round(projectedPercentage)}% of limit).`
        : `This expense exceeds your remaining budget of ${formatCurrency(currentRemaining)} by ${formatCurrency(overAmount)} (${Math.round(projectedPercentage)}% of limit).`;

    return {
      status: "EXCEEDED",
      budgetAmount: budget.amount,
      currentSpent,
      currentRemaining,
      projectedSpent,
      projectedRemaining,
      projectedPercentage,
      overAmount,
      message,
    };
  }

  // If projected spending is between 80% and 100%
  if (projectedPercentage >= 80) {
    return {
      status: "WARNING",
      budgetAmount: budget.amount,
      currentSpent,
      currentRemaining,
      projectedSpent,
      projectedRemaining,
      projectedPercentage,
      overAmount: 0,
      message: `This expense will use ${Math.round(projectedPercentage)}% of your monthly budget. Remaining: ${formatCurrency(projectedRemaining)}.`,
    };
  }

  // Under 80%
  return {
    status: "OK",
    budgetAmount: budget.amount,
    currentSpent,
    currentRemaining,
    projectedSpent,
    projectedRemaining,
    projectedPercentage,
    overAmount: 0,
    message: `Remaining budget after this expense: ${formatCurrency(projectedRemaining)}.`,
  };
}

/**
 * Convenience check to see if an expense would exceed the category's budget.
 */
export function isBudgetOverspent(
  budget: BudgetItem | null | undefined,
  expenseAmount: number = 0,
): boolean {
  if (!budget || budget.amount <= 0) return false;
  const validAmount = Math.max(0, Number(expenseAmount) || 0);
  return budget.spent + validAmount > budget.amount;
}
