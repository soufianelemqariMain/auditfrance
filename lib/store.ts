import { create } from "zustand";

export type VigipiratLevel =
  | "VIGILANCE_RENFORCEE"
  | "SECURITE_RENFORCEE"
  | "URGENCE_ATTENTAT";

export interface NewsItem {
  id: string;
  source: string;
  title: string;
  url: string;
  publishedAt: string;
}

export interface MapState {
  lat: number;
  lon: number;
  zoom: number;
}

export interface AppState {
  // Layer visibility
  layers: Record<string, boolean>;
  toggleLayer: (key: string) => void;

  // Vigipirate threat level
  vigipirate: VigipiratLevel;
  setVigipirate: (level: VigipiratLevel) => void;

  // Map viewport
  mapState: MapState;
  setMapState: (s: Partial<MapState>) => void;

  // RSS news items
  newsItems: NewsItem[];
  setNewsItems: (items: NewsItem[]) => void;

  // AI insight panel
  insightText: string;
  setInsightText: (text: string) => void;
  insightLoading: boolean;
  setInsightLoading: (v: boolean) => void;

  // 3D globe toggle
  is3D: boolean;
  toggle3D: () => void;
}

export const useAppStore = create<AppState>((set) => ({
  // Layers
  layers: {
    nuclear_plants: true,
    military_bases: true,
    data_centers:   true,
    telco_hubs:     true,
    departments:    true,
    weather_alerts: false,
    seismic:        false,
  },
  toggleLayer: (key: string) =>
    set((state) => ({
      layers: {
        ...state.layers,
        [key]: !state.layers[key],
      },
    })),

  // Vigipirate
  vigipirate: "SECURITE_RENFORCEE",
  setVigipirate: (level: VigipiratLevel) => set({ vigipirate: level }),

  // Map viewport — centred on metropolitan France
  mapState: { lat: 46.5, lon: 2.3, zoom: 5 },
  setMapState: (s: Partial<MapState>) =>
    set((state) => ({
      mapState: { ...state.mapState, ...s },
    })),

  // News
  newsItems: [],
  setNewsItems: (items: NewsItem[]) => set({ newsItems: Array.isArray(items) ? items : [] }),

  // AI insight
  insightText: "",
  setInsightText: (text: string) => set({ insightText: text }),
  insightLoading: false,
  setInsightLoading: (v: boolean) => set({ insightLoading: v }),

  // 3D toggle
  is3D: false,
  toggle3D: () => set((state) => ({ is3D: !state.is3D })),
}));
