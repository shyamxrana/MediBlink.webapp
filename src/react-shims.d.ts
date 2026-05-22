// Minimal shims to avoid missing @types/react in development environments
declare module 'react' {
  export function useState<S>(initial: S | (() => S)): [S, (value: S | ((prev: S) => S)) => void];
  export function useEffect(effect: () => void | (() => void), deps?: any[]): void;
  export const useRef: any;
  export const useMemo: any;
  export const useCallback: any;
  export const Fragment: any;
  export type ChangeEvent<T = any> = { target: { value: any } };
  export type FormEvent = any;
  const React: any;
  export default React;
}

declare module 'react/jsx-runtime' {
  export function jsx(type: any, props: any, key?: any): any;
  export function jsxs(type: any, props: any, key?: any): any;
  export function jsxDEV(type: any, props: any, key?: any): any;
}

declare namespace JSX {
  interface IntrinsicElements {
    [elemName: string]: any;
  }
}
