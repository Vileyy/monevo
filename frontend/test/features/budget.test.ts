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
});
