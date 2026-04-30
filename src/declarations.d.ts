declare module 'html-to-image' {
  export function toPng(node: HTMLElement, options?: any): Promise<string>;
  export function toJpeg(node: HTMLElement, options?: any): Promise<string>;
  export function toSvg(node: HTMLElement, options?: any): Promise<string>;
  export function toBlob(node: HTMLElement, options?: any): Promise<Blob>;
}

declare module 'jspdf' {
  interface jsPDFOptions {
    orientation?: 'portrait' | 'landscape';
    unit?: string;
    format?: string | number[];
  }
  class jsPDF {
    constructor(options?: jsPDFOptions);
    addImage(data: string, format: string, x: number, y: number, w: number, h: number): void;
    save(filename: string): void;
  }
  export default jsPDF;
}
