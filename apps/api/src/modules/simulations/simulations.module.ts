import { Module } from "@nestjs/common";
import { EngineModule } from "../engine/engine.module";
import { SimulationsController } from "./simulations.controller";
import { SimulationsService } from "./simulations.service";

@Module({
  imports: [EngineModule],
  controllers: [SimulationsController],
  providers: [SimulationsService],
})
export class SimulationsModule {}
