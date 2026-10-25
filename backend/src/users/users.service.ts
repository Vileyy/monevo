import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClerkClient } from '@clerk/backend';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateUserDto } from './dto/update-user.dto';

function isClerkPlaceholderEmail(email: string | null | undefined): boolean {
  return Boolean(email?.endsWith('@clerk.user'));
}

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {}

  async create(data: { email: string; name?: string; passwordHash: string }) {
    return this.prisma.user.create({
      data: {
        email: data.email,
        name: data.name,
        password: data.passwordHash,
      },
    });
  }

  async findByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: { email },
    });
  }

  async findById(id: string) {
    return this.prisma.user.findUnique({
      where: { id },
    });
  }

  async findByClerkId(clerkId: string) {
    return this.prisma.user.findUnique({
      where: { clerkId },
    });
  }

  async findOrCreateByClerk(clerkId: string, email?: string, name?: string) {
    let user = await this.prisma.user.findUnique({
      where: { clerkId },
    });

    if (
      user &&
      email &&
      user.email !== email &&
      isClerkPlaceholderEmail(user.email)
    ) {
      try {
        user = await this.prisma.user.update({
          where: { id: user.id },
          data: { email },
        });
      } catch {
        // The address may already belong to another row; keep the stored one.
      }
    }

    if (!user && email) {
      user = await this.prisma.user.findUnique({
        where: { email },
      });
      if (user) {
        user = await this.prisma.user.update({
          where: { id: user.id },
          data: { clerkId },
        });
      }
    }

    if (!user) {
      user = await this.prisma.user.create({
        data: {
          clerkId,
          email: email || `${clerkId}@clerk.user`,
          name: name || 'Monevo Member',
        },
      });
    }

    const { password, ...result } = user;
    void password;
    return result;
  }

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async deleteAccount(userId: string) {
    const user = await this.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Delete the identity first: if this succeeds but the DB delete fails,
    // the worst case is an orphaned row (retryable). The reverse order would
    // leave a live Clerk identity that can recreate the account on next login.
    await this.deleteClerkIdentity(user.clerkId);

    // Every finance table uses onDelete: Cascade, so deleting the user
    // removes wallets, categories, transactions, budgets and reminders.
    await this.prisma.user.delete({ where: { id: userId } });

    return { deleted: true };
  }

  private async deleteClerkIdentity(clerkId: string | null): Promise<void> {
    if (!clerkId) return;

    const secretKey =
      this.configService.get<string>('CLERK_SECRET_KEY') ||
      process.env.CLERK_SECRET_KEY;

    if (!secretKey) {
      this.logger.warn(
        `CLERK_SECRET_KEY is not set; local data deleted but Clerk identity ${clerkId} remains.`,
      );
      return;
    }

    try {
      const clerk = createClerkClient({ secretKey });
      await clerk.users.deleteUser(clerkId);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      this.logger.error(
        `Failed to delete Clerk identity ${clerkId}: ${message}`,
      );
    }
  }

  async updateProfile(userId: string, updateUserDto: UpdateUserDto) {
    const user = await this.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    return this.prisma.user.update({
      where: { id: userId },
      data: {
        ...(updateUserDto.name !== undefined && { name: updateUserDto.name }),
      },
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }
}
