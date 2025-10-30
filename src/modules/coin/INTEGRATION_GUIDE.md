# Coin System Integration Guide

## Overview
This guide explains how to integrate the coin system with Ticket and Travel Document modules when they are created.

## Business Rules
- **Ticket Booking**: 10,000 coins per passenger
- **Travel Document**: 10,000 coins per document

## Integration Steps

### 1. Ticket Module Integration

When creating the Ticket module, follow these steps:

#### Import CoinModule in TicketModule

```typescript
// src/modules/tickets/tickets.module.ts
import { Module } from '@nestjs/common';
import { CoinModule } from '../coin/coin.module';

@Module({
  imports: [PrismaModule, CoinModule], // Import CoinModule
  controllers: [TicketsController],
  providers: [TicketsService],
})
export class TicketsModule {}
```

#### Inject CoinTransactionService in TicketsService

```typescript
// src/modules/tickets/tickets.service.ts
import { Injectable } from '@nestjs/common';
import { CoinTransactionService } from '../coin/services/coin-transaction.service';
import { CoinTransactionReason } from '../../../generated/prisma';

@Injectable()
export class TicketsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly coinTransactionService: CoinTransactionService,
  ) {}

  async createTicket(adminId: string, createTicketDto: CreateTicketDto) {
    const totalPassengers = createTicketDto.totalPassengers;
    const coinCost = totalPassengers * 10000; // 10,000 per passenger

    // Validate sufficient balance
    const hasBalance = await this.coinTransactionService.validateBalance(
      adminId,
      coinCost,
    );

    if (!hasBalance) {
      throw new BadRequestException('Insufficient coin balance');
    }

    // Use transaction to ensure atomicity
    return this.prisma.$transaction(async (prisma) => {
      // Create the ticket
      const ticket = await prisma.ticket.create({
        data: {
          // ... ticket data
          adminId,
          totalPassengers,
          // ... other fields
        },
      });

      // Deduct coins
      await this.coinTransactionService.deductCoins(
        adminId,
        coinCost,
        CoinTransactionReason.TICKET_BOOKING,
        {
          referenceId: ticket.id,
          referenceType: 'ticket',
          notes: `Ticket booking: ${totalPassengers} passengers`,
          createdBy: adminId,
          prismaClient: prisma,
        },
      );

      return ticket;
    });
  }

  // Handle ticket cancellation with refund
  async cancelTicket(ticketId: string, adminId: string) {
    const ticket = await this.prisma.ticket.findUnique({
      where: { id: ticketId },
    });

    if (!ticket) {
      throw new NotFoundException('Ticket not found');
    }

    // Calculate refund amount
    const refundAmount = ticket.totalPassengers * 10000;

    return this.prisma.$transaction(async (prisma) => {
      // Update ticket status
      const updatedTicket = await prisma.ticket.update({
        where: { id: ticketId },
        data: { status: 'CANCELLED' },
      });

      // Refund coins
      await this.coinTransactionService.refundCoins(
        ticket.adminId,
        refundAmount,
        CoinTransactionReason.TICKET_CANCELLATION,
        {
          referenceId: ticketId,
          referenceType: 'ticket',
          notes: `Ticket cancellation refund: ${ticket.totalPassengers} passengers`,
          createdBy: adminId,
        },
      );

      return updatedTicket;
    });
  }
}
```

### 2. Travel Document Module Integration

When creating the Travel Document module:

#### Import CoinModule in TravelDocumentModule

```typescript
// src/modules/travel-documents/travel-documents.module.ts
import { Module } from '@nestjs/common';
import { CoinModule } from '../coin/coin.module';

@Module({
  imports: [PrismaModule, CoinModule], // Import CoinModule
  controllers: [TravelDocumentsController],
  providers: [TravelDocumentsService],
})
export class TravelDocumentsModule {}
```

#### Inject CoinTransactionService in TravelDocumentsService

```typescript
// src/modules/travel-documents/travel-documents.service.ts
import { Injectable } from '@nestjs/common';
import { CoinTransactionService } from '../coin/services/coin-transaction.service';
import { CoinTransactionReason } from '../../../generated/prisma';

@Injectable()
export class TravelDocumentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly coinTransactionService: CoinTransactionService,
  ) {}

  async createTravelDocument(
    adminId: string,
    createDocumentDto: CreateTravelDocumentDto,
  ) {
    const coinCost = 10000; // 10,000 per document

    // Validate sufficient balance
    const hasBalance = await this.coinTransactionService.validateBalance(
      adminId,
      coinCost,
    );

    if (!hasBalance) {
      throw new BadRequestException('Insufficient coin balance');
    }

    // Use transaction to ensure atomicity
    return this.prisma.$transaction(async (prisma) => {
      // Create the travel document
      const document = await prisma.travelDocument.create({
        data: {
          // ... document data
          adminId,
          status: 'ISSUED',
          issuedAt: new Date(),
          // ... other fields
        },
      });

      // Deduct coins
      await this.coinTransactionService.deductCoins(
        adminId,
        coinCost,
        CoinTransactionReason.TRAVEL_DOCUMENT,
        {
          referenceId: document.id,
          referenceType: 'travel_document',
          notes: `Travel document issued: ${document.documentNumber}`,
          createdBy: adminId,
          prismaClient: prisma,
        },
      );

      return document;
    });
  }
}
```

## Available CoinTransactionService Methods

### `validateBalance(adminId: string, requiredAmount: number): Promise<boolean>`
Checks if an admin has sufficient coin balance.

### `deductCoins(adminId, amount, reason, options?)`
Deducts coins from admin balance. Always use within a Prisma transaction.

**Options:**
- `referenceId`: ID of the related entity (ticketId, documentId, etc.)
- `referenceType`: Type of reference ('ticket', 'travel_document', etc.)
- `notes`: Additional notes
- `createdBy`: User ID who performed the action
- `prismaClient`: Prisma transaction client (required for atomic operations)

### `refundCoins(adminId, amount, reason, options?)`
Refunds coins to admin balance.

### `getBalance(adminId: string)`
Gets the current coin balance for an admin.

## Important Notes

1. **Always use Prisma transactions** when deducting coins to ensure atomicity
2. **Validate balance first** before creating the entity
3. **Pass prismaClient** in options when calling deductCoins inside a transaction
4. **Use appropriate CoinTransactionReason** enums:
   - `TICKET_BOOKING` - For ticket creation
   - `TRAVEL_DOCUMENT` - For travel document issuance
   - `TICKET_CANCELLATION` - For ticket cancellation refunds

## Testing

After integration, test the following scenarios:
1. Creating ticket/document with sufficient balance
2. Attempting to create ticket/document with insufficient balance
3. Canceling ticket and verifying refund
4. Checking transaction history after operations
