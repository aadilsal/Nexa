import { NestFactory } from "@nestjs/core";
import { ValidationPipe } from "@nestjs/common";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import cookieParser from "cookie-parser";
import { AppModule } from "./app.module";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.setGlobalPrefix("api/v1");
  app.use(cookieParser());

  const allowedOrigins = (process.env.CORS_ORIGIN ?? "http://localhost:3000")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);

  app.enableCors({
    origin: (origin, callback) => {
      // Server-to-server or same-origin requests may omit Origin.
      if (!origin) {
        callback(null, true);
        return;
      }

      if (allowedOrigins.includes(origin)) {
        callback(null, origin);
        return;
      }

      // Allow local dev against a remote API when explicitly configured.
      if (
        process.env.CORS_ALLOW_LOCALHOST === "true" &&
        /^http:\/\/localhost(:\d+)?$/.test(origin)
      ) {
        callback(null, origin);
        return;
      }

      callback(new Error(`Origin ${origin} not allowed by CORS`));
    },
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization", "x-analytics-signature"],
  });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  const swaggerConfig = new DocumentBuilder()
    .setTitle("Nexa API")
    .setDescription("Know what you can spend. Stay on track. — Pakistan's AI-powered financial intelligence platform.")
    .setVersion("1.0")
    .addCookieAuth("better-auth.session_token")
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup("api/v1/docs", app, document);

  const port = Number(process.env.PORT ?? process.env.API_PORT ?? 4000);
  await app.listen(port);
  console.log(`Nexa API running on http://localhost:${port}/api/v1`);
}

bootstrap();
