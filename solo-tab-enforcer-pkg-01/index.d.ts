// index.d.ts (TypeScript definitions)
export interface TabEnforcerOptions {
  appId: string;
  storageKey?: string;
  checkInterval?: number;
  onDuplicateTab?: (tabId: string) => void;
  onTabBecomeActive?: (tabId: string) => void;
  onTabDestroyed?: (tabId: string) => void;
  autoRedirect?: boolean;
  redirectUrl?: string;
  warningMessage?: string;
  debugMode?: boolean;
  customStorage?: Storage;
  heartbeatInterval?: number;
  tabTimeout?: number;
}

export interface TabObserverOptions {
  appId: string;
  storageKey?: string;
  onTabAdded?: (tabId: string, tabInfo: TabInfo) => void;
  onTabRemoved?: (tabId: string) => void;
  onTabsChanged?: (tabs: TabInfo[]) => void;
  checkInterval?: number;
  debugMode?: boolean;
  customStorage?: Storage;
  heartbeatInterval?: number;
  tabTimeout?: number;
}

export interface TabInfo {
  id: string;
  url: string;
  title: string;
  timestamp: number;
  lastHeartbeat: number;
  isActive: boolean;
  userAgent: string;
  sessionId: string;
}

export interface ReactSoloTabEnforcerProps extends TabEnforcerOptions {
  children: React.ReactNode;
  fallbackComponent?: React.ComponentType<{ tabId: string; message: string }>;
}

export declare class SoloTabEnforcer {
  constructor(options: TabEnforcerOptions);
  static create(options: TabEnforcerOptions): SoloTabEnforcer;
  start(): void;
  stop(): void;
  destroy(): void;
  isCurrentTabActive(): boolean;
  getCurrentTabId(): string;
  getActiveTabs(): TabInfo[];
  forceActivateTab(): void;
}

export declare class TabObserver {
  constructor(options: TabObserverOptions);
  static create(options: TabObserverOptions): TabObserver;
  start(): void;
  stop(): void;
  destroy(): void;
  getAllTabs(): TabInfo[];
  getTabById(tabId: string): TabInfo | null;
  removeTab(tabId: string): boolean;
}

export declare const ReactSoloTabEnforcer: React.FC<ReactSoloTabEnforcerProps>;
