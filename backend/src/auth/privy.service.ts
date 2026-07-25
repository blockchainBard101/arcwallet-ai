import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrivyClient, User } from '@privy-io/node';

@Injectable()
export class PrivyService implements OnModuleInit {
  private client: PrivyClient;
  private appId: string;
  private appSecret: string;

  onModuleInit() {
    const appId = process.env.PRIVY_APP_ID;
    const appSecret = process.env.PRIVY_APP_SECRET;

    if (!appId || !appSecret) {
      throw new Error('Missing PRIVY_APP_ID or PRIVY_APP_SECRET in environment variables');
    }

    this.appId = appId;
    this.appSecret = appSecret;

    // PrivyClient constructor takes an options object
    this.client = new PrivyClient({
      appId: this.appId,
      appSecret: this.appSecret,
    });
  }

  /**
   * Verifies the client-side Privy Access Token (JWT) sent via authorization headers.
   * @param token Bearer access token
   * @returns Claims containing the user's Privy DID / User ID
   */
  async verifyToken(token: string) {
    try {
      // Use the client's internal utils service to verify the token automatically
      const claims = await this.client.utils().auth().verifyAuthToken(token);
      return claims;
    } catch (error) {
      console.error('Privy token verification failed details:', {
        message: error.message,
        stack: error.stack,
        errorObject: error,
      });
      throw new Error(`Privy token verification failed: ${error.message}`);
    }
  }

  /**
   * Retrieves the full user profile including linked accounts (emails, wallets, socials)
   * @param userId The Privy user's DID
   */
  async getUser(userId: string): Promise<User> {
    try {
      // client.users() is a method that returns the PrivyUsersService
      return await this.client.users()._get(userId);
    } catch (error) {
      throw new Error(`Failed to fetch Privy user profile for ${userId}: ${error.message}`);
    }
  }
}
