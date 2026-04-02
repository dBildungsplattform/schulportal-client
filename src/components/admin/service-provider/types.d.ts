export type RollenerweiterungAssignErrorDialogProps = {
  isDialogVisible: boolean;
  filename?: string;
  dstNr: string;
  serviceProviderName: string;
  errors: MappedRollenerweiterungAssignError[];
};

export type MappedRollenerweiterungAssignError = {
  rolle: string;
  message: string;
};
