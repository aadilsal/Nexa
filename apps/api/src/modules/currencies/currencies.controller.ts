import { Controller, Get } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { CURRENCY_LABELS, SUPPORTED_CURRENCIES } from "@nexa/shared";
import { ExchangeRatesService } from "../../common/currency/exchange-rates.service";

@ApiTags("currencies")
@Controller("currencies")
export class CurrenciesController {
  constructor(private readonly exchangeRates: ExchangeRatesService) {}

  @Get()
  async list() {
    const rates = await this.exchangeRates.getRates();
    return {
      currencies: SUPPORTED_CURRENCIES.map((code) => ({
        code,
        label: CURRENCY_LABELS[code],
      })),
      ...rates,
    };
  }
}
