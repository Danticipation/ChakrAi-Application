declare module 'class-variance-authority' {
  import { type ClassProp, type VariantProps } from 'clsx';
  export type { ClassProp, VariantProps };
  export function cva<T>(base: T, config?: any): any;
}

