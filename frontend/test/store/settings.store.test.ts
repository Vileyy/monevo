import { useSettingsStore } from '@/store/settings.store';

describe('settings.store', () => {
  beforeEach(() => {
    useSettingsStore.setState({
      currency: 'VND',
      hideBalance: false,
      reminderNotifications: true,
      shareAnalytics: true,
      isHydrated: false,
    });
  });

  it('should initialize with default state', () => {
    const state = useSettingsStore.getState();
    expect(state.currency).toBe('VND');
    expect(state.hideBalance).toBe(false);
    expect(state.shareAnalytics).toBe(true);
  });

  it('should update currency', () => {
    useSettingsStore.getState().setCurrency('USD');
    expect(useSettingsStore.getState().currency).toBe('USD');
  });

  it('should toggle hideBalance', () => {
    expect(useSettingsStore.getState().hideBalance).toBe(false);
    useSettingsStore.getState().toggleHideBalance();
    expect(useSettingsStore.getState().hideBalance).toBe(true);
    useSettingsStore.getState().toggleHideBalance();
    expect(useSettingsStore.getState().hideBalance).toBe(false);
  });

  it('should set hideBalance directly', () => {
    useSettingsStore.getState().setHideBalance(true);
    expect(useSettingsStore.getState().hideBalance).toBe(true);
  });

  it('should keep analytics on by default', async () => {
    await useSettingsStore.getState().restoreSettings();
    expect(useSettingsStore.getState().shareAnalytics).toBe(true);
    expect(useSettingsStore.getState().isHydrated).toBe(true);
  });

  it('should update the analytics preference', () => {
    useSettingsStore.getState().setShareAnalytics(false);
    expect(useSettingsStore.getState().shareAnalytics).toBe(false);
    useSettingsStore.getState().setShareAnalytics(true);
    expect(useSettingsStore.getState().shareAnalytics).toBe(true);
  });

  it('should toggle the analytics preference', () => {
    expect(useSettingsStore.getState().shareAnalytics).toBe(true);
    useSettingsStore.getState().toggleShareAnalytics();
    expect(useSettingsStore.getState().shareAnalytics).toBe(false);
    useSettingsStore.getState().toggleShareAnalytics();
    expect(useSettingsStore.getState().shareAnalytics).toBe(true);
  });
});
