import { IMLBClient } from "@/src/domain/interfaces/IMLBClient";
import { MLBClient } from "@/src/infrastructure/mlb/MLBClient";
import { PlayerPointsService } from "@/src/application/services/PlayerPointsService";

/** Lazily wires the app's services. No configuration needed: the MLB API is public. */
export class Container {
  private static instance: Container;
  private mlbClient?: IMLBClient;
  private playerPointsService?: PlayerPointsService;

  private constructor() {}

  public static getInstance(): Container {
    if (!Container.instance) Container.instance = new Container();
    return Container.instance;
  }

  public getMLBClient(): IMLBClient {
    return (this.mlbClient ??= new MLBClient());
  }

  public getPlayerPointsService(): PlayerPointsService {
    return (this.playerPointsService ??= new PlayerPointsService(this.getMLBClient()));
  }
}
