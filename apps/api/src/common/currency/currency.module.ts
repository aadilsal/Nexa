import { Global, Module } from "@nestjs/common";
import { CurrencyService } from "./currency.service";
import { ExchangeRatesService } from "./exchange-rates.service";

@Global()
@Module({
  providers: [ExchangeRatesService, CurrencyService],
  exports: [ExchangeRatesService, CurrencyService],
})
export class CurrencyModule {}
