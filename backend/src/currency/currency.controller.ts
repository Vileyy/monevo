import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrencyRates, CurrencyService } from './currency.service';

@ApiTags('currency')
@Controller('currency')
export class CurrencyController {
  constructor(private readonly currencyService: CurrencyService) {}

  /** Public: the app needs rates on the login screen too. */
  @Get('rates')
  @ApiOperation({
    summary: 'Get VND exchange rates used for display conversion',
  })
  getRates(): Promise<CurrencyRates> {
    return this.currencyService.getRates();
  }
}
