import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PrivyService } from './privy.service';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly privy: PrivyService,
  ) {}

  /**
   * Authenticates a Privy user, provisions their record in PostgreSQL,
   * and syncs their human signer embedded wallets.
   * @param privyUserId The Privy DID (e.g. did:privy:...)
   */
  async syncUser(privyUserId: string) {
    try {
      // 1. Fetch complete user profile from Privy
      const privyUser = await this.privy.getUser(privyUserId);

      // 2. Identify email address from linked accounts
      const emailAccount = privyUser.linked_accounts.find(
        (acc) => acc.type === 'email',
      ) as any;
      
      const email = emailAccount?.address || `${privyUserId}@placeholder.privy.io`;

      // 3. Upsert User in database
      const user = await this.prisma.user.upsert({
        where: { id: privyUserId },
        update: { email }, // Update email if it changed (e.g., user linked one later)
        create: {
          id: privyUserId, // Set Privy DID as the database user ID
          email,
        },
      });

      // 4. Sync linked wallets (Human Signer Wallets)
      const linkedWallets = privyUser.linked_accounts.filter(
        (acc) => acc.type === 'wallet',
      ) as any[];

      for (const walletAcc of linkedWallets) {
        // We only care about Ethereum/EVM compatible wallets for human signing on Arc
        if (walletAcc.chain_type === 'ethereum') {
          await this.prisma.wallet.upsert({
            where: { address: walletAcc.address },
            update: {},
            create: {
              userId: user.id,
              address: walletAcc.address,
              type: 'human',
              chain: 'arc',
            },
          });
        }
      }

      return user;
    } catch (error) {
      this.logger.error(`Failed to sync Privy user: ${error.message}`, error.stack);
      throw error;
    }
  }
}
