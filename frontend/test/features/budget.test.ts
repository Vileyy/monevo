describe("Budget progress calculations", () => {
  it("should calculate remaining and percentages accurately", () => {
    const amount = 2000000;
    const spent = 1500000;
    const remaining = amount - spent;
    const percentage = Number(((spent / amount) * 100).toFixed(1));

    expect(remaining).toBe(500000);
    expect(percentage).toBe(75);
  });

  it("should handle over budget calculations", () => {
    const amount = 1000000;
    const spent = 1200000;
    const remaining = amount - spent;
    const percentage = Number(((spent / amount) * 100).toFixed(1));

    expect(remaining).toBe(-200000);
    expect(percentage).toBe(120);
  });

  it("should identify overspending impact when adding a new transaction", () => {
    const budgetAmount = 3000000;
    const currentSpent = 2500000;
    const newTransaction = 700000;

    const projectedSpent = currentSpent + newTransaction;
    const overAmount = projectedSpent - budgetAmount;
    const isOver = projectedSpent > budgetAmount;
    const projectedPercentage = (projectedSpent / budgetAmount) * 100;

    expect(isOver).toBe(true);
    expect(overAmount).toBe(200000);
    expect(projectedPercentage).toBeCloseTo(106.67, 1);
  });

  it("should detect when transaction keeps spending within safe limits", () => {
    const budgetAmount = 3000000;
    const currentSpent = 1000000;
    const newTransaction = 500000;

    const projectedSpent = currentSpent + newTransaction;
    const isOver = projectedSpent > budgetAmount;
    const projectedRemaining = budgetAmount - projectedSpent;

    expect(isOver).toBe(false);
    expect(projectedRemaining).toBe(1500000);
  });
});
