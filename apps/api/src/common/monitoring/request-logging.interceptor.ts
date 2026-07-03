import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from "@nestjs/common";
import type { Request, Response } from "express";
import { Observable, tap } from "rxjs";
import { AnalyticsPrismaService } from "../prisma/analytics-prisma.module";

const SLOW_THRESHOLD_MS = 1000;

@Injectable()
export class RequestLoggingInterceptor implements NestInterceptor {
  constructor(private readonly analyticsPrisma: AnalyticsPrismaService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const http = context.switchToHttp();
    const request = http.getRequest<Request>();
    const response = http.getResponse<Response>();
    const start = Date.now();

    const path = request.route?.path
      ? `/api/v1${request.route.path}`
      : request.path;

    return next.handle().pipe(
      tap({
        next: () => {
          void this.record(request.method, path, response.statusCode, start);
        },
        error: (err: { status?: number }) => {
          const status = err?.status ?? 500;
          void this.record(request.method, path, status, start);
        },
      }),
    );
  }

  private async record(
    method: string,
    path: string,
    statusCode: number,
    start: number,
  ) {
    const durationMs = Date.now() - start;

    try {
      await this.analyticsPrisma.apiRequestMetric.create({
        data: { method, path, statusCode, durationMs },
      });
    } catch {
      // non-blocking
    }

    if (durationMs >= SLOW_THRESHOLD_MS) {
      console.warn(`[slow] ${method} ${path} ${statusCode} ${durationMs}ms`);
    }
  }
}
