import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateWalletDto } from './dto/create-wallet.dto';
import { UpdateWalletDto } from './dto/update-wallet.dto';

@Injectable()
export class WalletsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, createWalletDto: CreateWalletDto) {
    return this.prisma.wallet.create({
      data: {
        ...createWalletDto,
        userId,
      },
    });
  }

  async findAll(userId: string) {
    return this.prisma.wallet.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(userId: string, walletId: string) {
    const wallet = await this.prisma.wallet.findUnique({
      where: { id: walletId },
    });

    if (!wallet || wallet.userId !== userId) {
      throw new NotFoundException(`Wallet with ID "${walletId}" not found`);
    }

    return wallet;
  }

  async update(
    userId: string,
    walletId: string,
    updateWalletDto: UpdateWalletDto,
  ) {
    // Ensure wallet exists and belongs to the user
    await this.findOne(userId, walletId);

    return this.prisma.wallet.update({
      where: { id: walletId },
      data: updateWalletDto,
    });
  }

  async remove(userId: string, walletId: string) {
    // Ensure wallet exists and belongs to the user
    await this.findOne(userId, walletId);

    return this.prisma.wallet.delete({
      where: { id: walletId },
    });
  }
}
