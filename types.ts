
export interface Calculation {
  id: string;
  expression: string;
  result: string;
  timestamp: number;
}

export type TabType = 'calculator' | 'graph' | 'ai' | 'history';

export interface GraphPoint {
  x: number;
  y: number;
}
