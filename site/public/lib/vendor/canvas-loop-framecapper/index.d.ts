declare class FrameLoopManager {
    private _syncCallbacks;
    private _asyncCallbacks;
    private _listeners;
    private _animationFrameId;
    private _lastFrameTime;
    private _elapsedTimeAccumulator;
    totalTime: number;
    deltaTime: number;
    isPaused: boolean;
    private _fixedFrameRate;
    private _msPerFrame;
    constructor();
    setFixedFrameRate(fps: number): void;
    getFramerate(): number;
    registerSyncCallback(callback: (manager: FrameLoopManager) => void): void;
    unregisterSyncCallback(callback: (manager: FrameLoopManager) => void): void;
    registerAsyncCallback(callback: (manager: FrameLoopManager) => void): void;
    unregisterAsyncCallback(callback: (manager: FrameLoopManager) => void): void;
    resume(): void;
    pause(): void;
    reset(): void;
    subscribe(listener: () => void): () => void;
    private _notify;
    private _manageLoop;
    private _start;
    private _stop;
    private _loop;
}

export declare const frameLoopManager: FrameLoopManager;

export declare const useFrameLoop: (callback: (manager: FrameLoopManager) => void) => void;

export declare const useFrameLoopManager: () => FrameLoopManager;

export { }
