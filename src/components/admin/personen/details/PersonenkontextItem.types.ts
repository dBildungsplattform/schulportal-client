import type { Zuordnung } from '@/stores/types/Zuordnung';

export enum PendingState {
  'CREATED',
  'DELETED',
}

export type Props = {
  zuordnung: Zuordnung & { klasse?: string };
  pendingState?: PendingState;
  showUnlimitedBefristung?: boolean;
  noMargin?: boolean;
};
