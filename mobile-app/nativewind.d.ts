import 'nativewind/types';

declare module 'nativewind' {
  export interface ClassName {}
}

declare global {
  namespace JSX {
    interface IntrinsicAttributes {
      className?: string;
    }
  }
}

export {};
