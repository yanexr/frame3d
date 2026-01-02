import { RenderOption } from "../types/api";
export interface RenderResult {
    images: Buffer[];
    warnings: string[];
}
export declare function render(modelUrl: string, renderOptions: RenderOption[], modelBuffer?: ArrayBuffer | Buffer, options?: {
    signal?: AbortSignal;
    timeoutMs?: number;
}): Promise<RenderResult>;
export declare function closeBrowser(): Promise<void>;
//# sourceMappingURL=renderService.d.ts.map