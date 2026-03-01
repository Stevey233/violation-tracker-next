export type AppRole = 'admin' | 'member';

export type ViolationType = 'abuse' | 'harassment' | 'hate' | 'spam' | 'other';

export interface Profile {
  id: string;
  display_name: string;
  role: AppRole;
  created_at: string;
}

export interface ViolationRecord {
  id: string;
  player_uid: string;
  message_text: string;
  violation_type: ViolationType;
  occurred_at: string;
  reporter_id: string;
  note: string;
  created_at: string;
}

export interface EvidenceFile {
  id: string;
  record_id: string;
  storage_path: string;
  mime_type: string;
  uploaded_by: string;
  created_at: string;
}

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: Profile;
        Insert: Partial<Profile> & { id: string };
        Update: Partial<Profile>;
      };
      violation_records: {
        Row: ViolationRecord;
        Insert: Omit<ViolationRecord, 'id' | 'created_at'> & Partial<Pick<ViolationRecord, 'id' | 'created_at'>>;
        Update: Partial<ViolationRecord>;
      };
      evidence_files: {
        Row: EvidenceFile;
        Insert: Omit<EvidenceFile, 'id' | 'created_at'> & Partial<Pick<EvidenceFile, 'id' | 'created_at'>>;
        Update: Partial<EvidenceFile>;
      };
    };
  };
}

