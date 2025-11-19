export enum ConflictType {
  BATTLE = 'Battle',
  PROTEST = 'Protest',
  RIOT = 'Riot',
  EXPLOSION = 'Explosion/Remote violence',
  VIOLENCE_AGAINST_CIVILIANS = 'Violence against civilians',
  STRATEGIC_DEVELOPMENT = 'Strategic development'
}

export interface ConflictEvent {
  id: string;
  date: string;
  type: ConflictType;
  subType?: string;
  actor1: string;
  actor2?: string;
  country: string;
  location: string;
  latitude: number;
  longitude: number;
  fatalities: number;
  description: string;
  source?: string;
}

export interface AnalysisResult {
  summary: string;
  keyActors: string[];
  trend: 'escalating' | 'de-escalating' | 'stable' | 'volatile';
  events: ConflictEvent[];
}

export interface MapViewport {
  center: [number, number];
  zoom: number;
}
