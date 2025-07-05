
export interface TabManagerConfig {
    enforceSingleTab?: boolean;
    observeAllTabs?: boolean;
    tabIdKey?: string;
    activeTabKey?: string;
    tabCountKey?: string;
    lastActiveKey?: string;
    heartbeatInterval?: number;
    cleanupInterval?: number;
    tabTimeout?: number;
    redirectOnViolation?: boolean;
    redirectUrl?: string;
    showWarnings?: boolean;
    customWarningMessage?: string | null;
    allowedDomains?: string[];
    excludedPaths?: string[];
    debugMode?: boolean;
    onTabViolation?: ((data: TabViolationData) => void) | null;
    onTabActivated?: ((data: TabActivatedData) => void) | null;
    onTabDeactivated?: ((data: TabDeactivatedData) => void) | null;
    onTabCountChanged?: ((count: number) => void) | null;
    preferLocalStorage?: boolean;
    fallbackToSessionStorage?: boolean;
    supportLegacyBrowsers?: boolean;
}

export interface TabViolationData {
    currentTab: string;
    existingTab: string;
    action: string;
}

export interface TabActivatedData {
    tabId: string;
    timestamp: number;
}

export interface TabDeactivatedData {
    tabId: string;
    timestamp: number;
}

export interface TabInfo {
    tabId: string;
    isActive: boolean;
    url: string;
    timestamp: number;
    browserInfo: BrowserInfo;
    storageSupport: StorageSupport;
}

export interface BrowserInfo {
    name: string;
    version: number;
    isLegacy: boolean;
}

export interface StorageSupport {
    localStorage: boolean;
    sessionStorage: boolean;
    broadcastChannel: boolean;
    sharedWorker: boolean;
}

export interface ActiveTabData {
    tabId: string;
    timestamp: number;
}

export type ObserverCallback = (event: string, data: any) => void;

export declare class TabManager {
    constructor(options?: TabManagerConfig);
    
    // Core methods
    init(): void;
    cleanup(): void;
    
    // Tab management
    registerTab(): void;
    markAsActive(): void;
    updateTabCount(): void;
    
    // Single tab enforcement
    startEnforcement(): void;
    checkExistingTabs(): void;
    handleTabViolation(existingTab: ActiveTabData): void;
    
    // Tab observation
    startObserving(): void;
    addObserver(observer: ObserverCallback): boolean;
    removeObserver(observer: ObserverCallback): boolean;
    
    // Utility methods
    getTabInfo(): TabInfo;
    getActiveTab(): ActiveTabData | null;
    getTabCount(): number;
    isCurrentTabActive(): boolean;
    
    // Configuration
    updateConfig(newConfig: Partial<TabManagerConfig>): void;
    getConfig(): TabManagerConfig;
    
    // Static factory methods
    static createSingleTabEnforcer(options?: TabManagerConfig): TabManager;
    static createTabObserver(options?: TabManagerConfig): TabManager;
    static createFullManager(options?: TabManagerConfig): TabManager;
}

export default TabManager;
