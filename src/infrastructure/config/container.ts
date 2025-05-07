import { IMLBClient } from "../../domain/interfaces/IMLBClient";
import { MLBClient } from "../mlb/MLBClient";
import { PlayerStatsService } from "../../application/services/PlayerStatsService";

export class Container {
  private static instance: Container;
  private mlbClient: IMLBClient | null = null;
  private playerStatsService: PlayerStatsService | null = null;

  private constructor() {}

  public static getInstance(): Container {
    if (!Container.instance) {
      Container.instance = new Container();
    }
    return Container.instance;
  }

  public initialize(databaseUrl: string): void {
    this.mlbClient = new MLBClient();
    this.playerStatsService = new PlayerStatsService(
      this.mlbClient,
      databaseUrl
    );
  }

  public getMLBClient(): IMLBClient {
    if (!this.mlbClient) {
      throw new Error("Container not initialized");
    }
    return this.mlbClient;
  }

  public getPlayerStatsService(): PlayerStatsService {
    if (!this.playerStatsService) {
      throw new Error("Container not initialized");
    }
    return this.playerStatsService;
  }
}
