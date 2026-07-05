import { Module } from "@nestjs/common";
import { CyclesModule } from "../cycles/cycles.module";
import { EngineModule } from "../engine/engine.module";
import { OnboardingController } from "./onboarding.controller";
import { OnboardingService } from "./onboarding.service";

@Module({
  imports: [CyclesModule, EngineModule],
  controllers: [OnboardingController],
  providers: [OnboardingService],
})
export class OnboardingModule {}
