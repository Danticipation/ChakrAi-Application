import "express";
declare module "express-serve-static-core" {
  interface Request {
    auth?: {
      token: string;
      user: { sub: string; email?: string; roles?: string[]; [k: string]: unknown };
    };
  }
}
