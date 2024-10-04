declare module Express {
  export interface Request {
    user?: any | null;
  }
}

declare module '*.json' {
  const value: any;
  export default value;
}
