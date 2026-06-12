/**
 * mveSettings — local, persisted-in-session settings the shell owns directly
 * (separate from the engine bridge): the chosen on-device local model and a
 * cache of provider API keys. Same subscribe() pattern as ThemeStore.
 *
 * API keys are also pushed to the native MVE bridge (SharedPreferences) when
 * present; the local model selection is honored once the MorsVitaEst engine is
 * linked (until then it's a saved preference).
 */
export interface LocalModel {
  id: string;
  name: string;
  params: string;
  size: string;
  note: string;
}

export const LOCAL_MODELS: LocalModel[] = [
  { id: 'qwen2.5-3b-instruct', name: 'Qwen2.5 3B Instruct', params: '3B', size: '1.9 GB', note: 'Balanced, multilingual' },
  { id: 'llama3.2-3b', name: 'Llama 3.2 3B', params: '3B', size: '2.0 GB', note: 'Strong general chat' },
  { id: 'gemma2-2b', name: 'Gemma 2 2B', params: '2B', size: '1.6 GB', note: 'Lightest, fastest' },
  { id: 'phi3.5-mini', name: 'Phi-3.5 Mini', params: '3.8B', size: '2.2 GB', note: 'Great at reasoning' },
];

type Listener = () => void;

const state = {
  localModelId: null as string | null,
  localEnabled: false,
};
const listeners = new Set<Listener>();
const emit = () => listeners.forEach(fn => fn());

export const MveSettings = {
  subscribe(fn: Listener): () => void {
    listeners.add(fn);
    return () => listeners.delete(fn);
  },
  get() {
    return { ...state };
  },
  setLocalModel(id: string | null) {
    state.localModelId = id;
    emit();
  },
  setLocalEnabled(on: boolean) {
    state.localEnabled = on;
    emit();
  },
  activeModel(): LocalModel | null {
    return LOCAL_MODELS.find(m => m.id === state.localModelId) ?? null;
  },
};
