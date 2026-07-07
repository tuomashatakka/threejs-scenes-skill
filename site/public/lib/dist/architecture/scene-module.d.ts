import type { FrameCallback, SceneContext, SceneModule } from '../types.js';
export interface SceneModuleDefinition {
    name: string;
    build(ctx: SceneContext, registerUpdate: (cb: FrameCallback) => void): void | (() => void);
}
export declare function createSceneModule(def: SceneModuleDefinition): SceneModule;
//# sourceMappingURL=scene-module.d.ts.map