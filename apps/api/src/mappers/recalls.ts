import { z } from 'zod';
import type { Recall } from '@app/shared';
import { isoDate, optNumber, optString, parseRecords } from './common';

const SAFETY_RECALL = 'תקלה סידרתית בטיחותית';

const openRecallSchema = z.object({
  RECALL_ID: optNumber,
  SUG_RECALL: optString,
  SUG_TAKALA: optString,
  TEUR_TAKALA: optString,
  TAARICH_PTICHA: optString,
});

/** Open (unperformed) recalls for a plate, newest first. Rows without an ID are dropped. */
export function mapOpenRecalls(records: unknown[]): Recall[] {
  return parseRecords(openRecallSchema, records)
    .flatMap((r): Recall[] =>
      r.RECALL_ID === null
        ? []
        : [
            {
              id: r.RECALL_ID,
              kindRaw: r.SUG_RECALL,
              safety: r.SUG_RECALL === SAFETY_RECALL,
              categoryRaw: r.SUG_TAKALA,
              descriptionRaw: r.TEUR_TAKALA,
              openedDate: isoDate(r.TAARICH_PTICHA),
              fixMethodRaw: null,
              importer: null,
              phone: null,
              website: null,
            },
          ],
    )
    .sort((a, b) => (b.openedDate ?? '').localeCompare(a.openedDate ?? ''));
}

const recallNoticeSchema = z.object({
  RECALL_ID: optNumber,
  OFEN_TIKUN: optString,
  YEVUAN_TEUR: optString,
  TELEPHONE: optString,
  WEBSITE: optString,
});

export type RecallNotice = Pick<Recall, 'id' | 'fixMethodRaw' | 'importer' | 'phone' | 'website'>;

/** Manufacturer notices keyed by recall ID (first row per ID wins; rows repeat per model). */
export function mapRecallNotices(records: unknown[]): Map<number, RecallNotice> {
  const byId = new Map<number, RecallNotice>();
  for (const r of parseRecords(recallNoticeSchema, records)) {
    if (r.RECALL_ID === null || byId.has(r.RECALL_ID)) continue;
    byId.set(r.RECALL_ID, {
      id: r.RECALL_ID,
      fixMethodRaw: r.OFEN_TIKUN,
      importer: r.YEVUAN_TEUR,
      phone: r.TELEPHONE,
      website: r.WEBSITE,
    });
  }
  return byId;
}

export function enrichRecalls(recalls: Recall[], notices: Map<number, RecallNotice>): Recall[] {
  return recalls.map((recall) => {
    const notice = notices.get(recall.id);
    return notice ? { ...recall, ...notice } : recall;
  });
}
