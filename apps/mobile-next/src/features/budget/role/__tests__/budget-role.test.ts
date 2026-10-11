import { ApiError } from "@/data/http";

import {
  PLAN_ADMIN_ONLY,
  VIEW_ONLY,
  budgetRole,
  canAddSpending,
  canEditPlan,
  roleErrorMessage,
} from "../budget-role";

const household = { kind: "household", householdId: "h1" } as const;

describe("budgetRole", () => {
  it("makes a Personal budget the caller's to edit, whatever any household says", () => {
    expect(budgetRole({ kind: "personal" }, undefined)).toBe("owner-like");
    expect(budgetRole({ kind: "personal" }, "viewer")).toBe("owner-like");
  });

  it("maps the household roles", () => {
    expect(budgetRole(household, "admin")).toBe("owner-like");
    expect(budgetRole(household, "member")).toBe("member");
    expect(budgetRole(household, "viewer")).toBe("viewer");
  });

  it("reads a household whose role is not known yet as read-only", () => {
    expect(budgetRole(household, undefined)).toBe("viewer");
  });
});

describe("what each role may do", () => {
  it("lets only owner-like roles edit the plan", () => {
    expect(canEditPlan("owner-like")).toBe(true);
    expect(canEditPlan("member")).toBe(false);
    expect(canEditPlan("viewer")).toBe(false);
  });

  it("lets owners and members add spending and move money, never viewers", () => {
    expect(canAddSpending("owner-like")).toBe(true);
    expect(canAddSpending("member")).toBe(true);
    expect(canAddSpending("viewer")).toBe(false);
  });
});

describe("roleErrorMessage", () => {
  it("explains a plan change refused to a member", () => {
    const refused = new ApiError(403, "Forbidden", "budget_role_forbidden", null);
    expect(roleErrorMessage(refused)).toBe(PLAN_ADMIN_ONLY);
  });

  it("explains a write refused to a viewer", () => {
    const refused = new ApiError(403, "Forbidden", "household_write_required", null);
    expect(roleErrorMessage(refused)).toBe(VIEW_ONLY);
  });

  it("leaves every other failure to its own copy", () => {
    expect(roleErrorMessage(new ApiError(409, "Conflict", "budget_overplanned", null))).toBeNull();
    expect(roleErrorMessage(new Error("boom"))).toBeNull();
  });
});
