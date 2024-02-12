import { RolleResponseMerkmaleEnum } from '@/stores/RolleStore'

// Centralized rollenArten and merkmale
export const rollenArten: string[] = ['Lern', 'Lehr', 'Extern', 'Orgadmin', 'Leit', 'Sysadmin']
export const merkmale: string[] = ['Befristung ist Pflichtangabe', 'KoPers-Nr. ist Pflichtangabe']

// Mapping from backend role types to user choice format
const rollenArtenMapping: Record<string, string> = {
  LERN: 'Lern',
  LEHR: 'Lehr',
  EXTERN: 'Extern',
  ORGADMIN: 'Orgadmin',
  LEIT: 'Leit',
  SYSADMIN: 'Sysadmin'
}

// Mapping for Merkmale from the backend response to UI
const merkmaleMapping: Record<string, keyof typeof RolleResponseMerkmaleEnum | undefined> = {
  'Befristung ist Pflichtangabe': 'BefristungPflicht',
  'KoPers-Nr. ist Pflichtangabe': 'KopersPflicht'
}

// Mapping for UI display text based on RolleResponseMerkmaleEnum
const merkmaleToDisplayTextMapping: Record<RolleResponseMerkmaleEnum, string> = {
  BEFRISTUNG_PFLICHT: 'Befristung ist Pflichtangabe',
  KOPERS_PFLICHT: 'KoPers-Nr. ist Pflichtangabe'
}

// Function to map selected Merkmale input to enum keys
export function mapMerkmaleToEnumKeys(
  selectedMerkmaleInput: string[] | null
): (keyof typeof RolleResponseMerkmaleEnum)[] {
  return (
    selectedMerkmaleInput
      ?.map((merkmal: string) => merkmaleMapping[merkmal])
      .filter(
        (
          item: 'BefristungPflicht' | 'KopersPflicht' | undefined
        ): item is keyof typeof RolleResponseMerkmaleEnum => item !== undefined
      ) || []
  )
}

// Function to map RolleResponseMerkmaleEnum keys to display text
export function mapEnumKeysToDisplayText(
  selectedMerkmaleInput: RolleResponseMerkmaleEnum | RolleResponseMerkmaleEnum[] | null
): string[] {
  const merkmaleArray: RolleResponseMerkmaleEnum[] = Array.isArray(selectedMerkmaleInput)
    ? selectedMerkmaleInput
    : selectedMerkmaleInput
      ? [selectedMerkmaleInput]
      : []

  return merkmaleArray.map(
    (key: RolleResponseMerkmaleEnum) => merkmaleToDisplayTextMapping[key] || key
  )
}

// Function to convert backend role type to user choice format
export function mapRollenArtToUserFormat(rollenArt: string): string {
  return rollenArtenMapping[rollenArt.toUpperCase()] || rollenArt
}
