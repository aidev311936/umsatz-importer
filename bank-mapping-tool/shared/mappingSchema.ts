export interface BankMapping {
  id?: number;
  bank_name: string;
  booking_date: string[];
  amount: string[];
  booking_text: string[];
  booking_type: string[];
  booking_date_parse_format: string;
  without_header: boolean;
  detection_hints: Record<string, unknown>;
  created_on?: string;
  updated_on?: string;
}

export type BankMappingUpsertInput = Omit<BankMapping, 'id' | 'created_on' | 'updated_on'>;
