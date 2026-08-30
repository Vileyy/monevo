import { useSettingsStore } from "@/store/settings.store";

describe("settings.store", () => {
  beforeEach(() => {
    useSettingsStore.setState({
      currency: "VND",
      hideBalance: false,
      isHydrated: false,
    });
  });

  it("should initialize with default state", () => {
    const state = useSettingsStore.getState();
    expect(state.currency).toBe("VND");
    expect(state.hideBalance).toBe(false);
  });

  it("should update currency", () => {
    useSettingsStore.getState().setCurrency("USD");
    expect(useSettingsStore.getState().currency).toBe("USD");
  });

  it("should toggle hideBalance", () => {
    expect(useSettingsStore.getState().hideBalance).toBe(false);
    useSettingsStore.getState().toggleHideBalance();
    expect(useSettingsStore.getState().hideBalance).toBe(true);
    useSettingsStore.getState().toggleHideBalance();
    expect(useSettingsStore.getState().hideBalance).toBe(false);
  });

  it("should set hideBalance directly", () => {
    useSettingsStore.getState().setHideBalance(true);
    expect(useSettingsStore.getState().hideBalance).toBe(true);
  });
});
