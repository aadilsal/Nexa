import { Module } from "@nestjs/common";
import { APP_INTERCEPTOR } from "@nestjs/core";
import { RequestLoggingInterceptor } from "./request-logging.interceptor";

@Module({
  providers: [
    RequestLoggingInterceptor,
    {
      provide: APP_INTERCEPTOR,
      useClass: RequestLoggingInterceptor,
    },
  ],
})
export class MonitoringModule {}
