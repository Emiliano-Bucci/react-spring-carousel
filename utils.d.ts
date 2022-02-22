declare type Callback = () => void | (() => void)
export declare function useMount(callback: Callback): void
export declare function getIsBrowser(): boolean
export {}
