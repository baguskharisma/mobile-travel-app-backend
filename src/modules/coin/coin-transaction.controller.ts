import { Controller, Get, Param, Query, HttpCode, HttpStatus } from '@nestjs/common';
import { CoinTransactionService } from './services/coin-transaction.service';
import { QueryCoinTransactionsDto } from './dto';
import { Roles, CurrentUser } from '../../auth/decorators';
import type { CurrentUserType } from '../../auth/decorators';
import { UserRole } from '@prisma/client';

@Controller('coin-transactions')
export class CoinTransactionController {
  constructor(
    private readonly coinTransactionService: CoinTransactionService,
  ) {}

  @Get()
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  findAll(
    @CurrentUser() user: CurrentUserType,
    @Query() query: QueryCoinTransactionsDto,
  ) {
    // If super admin, return all transactions
    if (user.role === UserRole.SUPER_ADMIN) {
      return this.coinTransactionService.findAllTransactions(query);
    }

    // If regular admin, return only their transactions
    return this.coinTransactionService.findAll(user.profile!.id, query);
  }

  @Get('balance')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @HttpCode(HttpStatus.OK)
  getMyBalance(@CurrentUser() user: CurrentUserType) {
    // Get the current admin's balance
    return this.coinTransactionService.getBalance(user.profile!.id);
  }
}

@Controller('admins/:adminId')
export class AdminCoinController {
  constructor(
    private readonly coinTransactionService: CoinTransactionService,
  ) {}

  @Get('coin-balance')
  @Roles(UserRole.SUPER_ADMIN) // Only super admin can check other admin's balance
  getAdminBalance(@Param('adminId') adminId: string) {
    return this.coinTransactionService.getBalance(adminId);
  }

  @Get('coin-transactions')
  @Roles(UserRole.SUPER_ADMIN) // Only super admin can view other admin's transactions
  getAdminTransactions(
    @Param('adminId') adminId: string,
    @Query() query: QueryCoinTransactionsDto,
  ) {
    return this.coinTransactionService.findAll(adminId, query);
  }
}
