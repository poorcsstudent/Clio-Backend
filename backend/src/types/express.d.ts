declare global {
  namespace Express {
    interface Request {
      device?: {
        id: string;
        tokenId: string;
      };
    }
  }
}

export {};
