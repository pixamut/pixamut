export interface IUser {
  accessToken?: string | undefined;
  tokenType?: string | undefined;
  techId?: number | undefined;
  username?: string | undefined;
  email?: string | undefined;
  walletAddress?: string | undefined;
}

export interface IUserWithPassword extends IUser {
  password?: string;
}
