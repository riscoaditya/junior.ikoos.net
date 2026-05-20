import type { StageManifest, StagesIndex } from '../types/stageAsset';

const STAGES_INDEX_URL = '/assets/stages/stages.json';

async function fetchJson<T>(url: string): Promise<T> {
  const response = await fetch(url, { cache: 'no-store' });
  if (!response.ok) {
    throw new Error(`Gagal membaca ${url}. Status: ${response.status}`);
  }
  return response.json() as Promise<T>;
}

export async function loadStagesIndex() {
  return fetchJson<StagesIndex>(STAGES_INDEX_URL);
}

export async function loadStageManifest(manifestUrl: string) {
  return fetchJson<StageManifest>(manifestUrl);
}

export async function loadDefaultStage() {
  const index = await loadStagesIndex();
  const defaultStage = index.stages.find((stage) => stage.id === index.defaultStageId) || index.stages[0];
  if (!defaultStage) throw new Error('Tidak ada stage di /public/assets/stages/stages.json');
  const manifest = await loadStageManifest(defaultStage.manifest);
  return { index, summary: defaultStage, manifest };
}
