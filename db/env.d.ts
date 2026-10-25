declare namespace Cloudflare {
  interface Env {
    DB: D1Database;
    R2?: R2Bucket;
  }
}

declare module 'cloudflare:workers' {
  export const env: {
    DB: D1Database;
    [key: string]: any;
  };
}
