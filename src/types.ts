export interface ContactResponse {
  contact: {
    primaryContatctId: number;
    emails: string[];
    phoneNumbers: string[];
    secondaryContactIds: number[];
  };
}

export interface IdentifyRequest {
  email?: string;
  phoneNumber?: string | number;
}