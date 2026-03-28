import {
  serializeStatus,
  deserializeStatus,
  deserializePriority,
  deserializeParentType,
} from "../utils";

describe("serializeStatus", () => {
  it("converts in_progress to in-progress", () => {
    expect(serializeStatus("in_progress")).toBe("in-progress");
  });

  it("converts in_review to in-review", () => {
    expect(serializeStatus("in_review")).toBe("in-review");
  });

  it("passes through simple statuses unchanged", () => {
    expect(serializeStatus("backlog")).toBe("backlog");
    expect(serializeStatus("todo")).toBe("todo");
    expect(serializeStatus("done")).toBe("done");
  });
});

describe("deserializeStatus", () => {
  it("converts in-progress to in_progress", () => {
    expect(deserializeStatus("in-progress")).toBe("in_progress");
  });

  it("converts in-review to in_review", () => {
    expect(deserializeStatus("in-review")).toBe("in_review");
  });

  it("passes through simple statuses unchanged", () => {
    expect(deserializeStatus("backlog")).toBe("backlog");
    expect(deserializeStatus("todo")).toBe("todo");
    expect(deserializeStatus("done")).toBe("done");
  });

  it("roundtrips correctly with serializeStatus", () => {
    const statuses = ["backlog", "todo", "in-progress", "in-review", "done"];
    for (const status of statuses) {
      expect(serializeStatus(deserializeStatus(status))).toBe(status);
    }
  });
});

describe("deserializePriority", () => {
  it("passes through all priority values", () => {
    expect(deserializePriority("urgent")).toBe("urgent");
    expect(deserializePriority("high")).toBe("high");
    expect(deserializePriority("medium")).toBe("medium");
    expect(deserializePriority("low")).toBe("low");
    expect(deserializePriority("none")).toBe("none");
  });
});

describe("deserializeParentType", () => {
  it("passes through board and ticket", () => {
    expect(deserializeParentType("board")).toBe("board");
    expect(deserializeParentType("ticket")).toBe("ticket");
  });
});
