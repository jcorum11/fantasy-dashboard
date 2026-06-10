import { IMLBClient } from "../../domain/interfaces/IMLBClient";
import { MLBClient } from "../mlb/MLBClient";
import { PlayerStatsService } from "../../application/services/PlayerStatsService";
import { StreamingPickIngestService } from "../../application/services/StreamingPickIngestService";
import { StreamingPickScoringService } from "../../application/services/StreamingPickScoringService";
import { StreamingComparisonService } from "../../application/services/StreamingComparisonService";
import { DailyBreakdownService } from "../../application/services/DailyBreakdownService";
import { IStreamingPickRepository } from "../../domain/repositories/IStreamingPickRepository";
import { PostgresStreamingPickRepository } from "../repositories/PostgresStreamingPickRepository";
import { DailyWaiversClient } from "../streaming/DailyWaiversClient";
import { FantasyProsClient } from "../streaming/FantasyProsClient";
import { PitcherListClient } from "../streaming/PitcherListClient";

export class Container {
  private static instance: Container;
  private mlbClient: IMLBClient | null = null;
  private playerStatsService: PlayerStatsService | null = null;
  private streamingPickRepository: IStreamingPickRepository | null = null;
  private streamingPickIngestService: StreamingPickIngestService | null = null;
  private streamingPickScoringService: StreamingPickScoringService | null =
    null;
  private streamingComparisonService: StreamingComparisonService | null = null;
  private dailyBreakdownService: DailyBreakdownService | null = null;

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
    this.streamingPickRepository = new PostgresStreamingPickRepository(
      databaseUrl
    );
    this.streamingPickIngestService = new StreamingPickIngestService(
      {
        fantasypros: new FantasyProsClient(),
        pitcherlist: new PitcherListClient(),
        dailywaivers: new DailyWaiversClient(),
      },
      this.streamingPickRepository
    );
    this.streamingPickScoringService = new StreamingPickScoringService(
      this.playerStatsService,
      this.streamingPickRepository
    );
    this.streamingComparisonService = new StreamingComparisonService(
      this.streamingPickRepository
    );
    this.dailyBreakdownService = new DailyBreakdownService(
      this.streamingPickRepository
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

  public getStreamingPickRepository(): IStreamingPickRepository {
    if (!this.streamingPickRepository) {
      throw new Error("Container not initialized");
    }
    return this.streamingPickRepository;
  }

  public getStreamingPickIngestService(): StreamingPickIngestService {
    if (!this.streamingPickIngestService) {
      throw new Error("Container not initialized");
    }
    return this.streamingPickIngestService;
  }

  public getStreamingPickScoringService(): StreamingPickScoringService {
    if (!this.streamingPickScoringService) {
      throw new Error("Container not initialized");
    }
    return this.streamingPickScoringService;
  }

  public getStreamingComparisonService(): StreamingComparisonService {
    if (!this.streamingComparisonService) {
      throw new Error("Container not initialized");
    }
    return this.streamingComparisonService;
  }

  public getDailyBreakdownService(): DailyBreakdownService {
    if (!this.dailyBreakdownService) {
      throw new Error("Container not initialized");
    }
    return this.dailyBreakdownService;
  }
}
