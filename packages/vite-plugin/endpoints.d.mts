export declare const fromOtherSite: (req: { headers: Record<string, string | undefined> }) => boolean;
export declare const devEndpoints: (root: string, statusFile: string) => (req: any, res: any, next: () => void) => void;
