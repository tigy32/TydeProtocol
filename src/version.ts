// Wire protocol version used by the Tyde remote control handshake.
export const TYDE_PROTOCOL_VERSION = 2;

// Version header exchanged during the Tyde remote control handshake.
export interface TydeVersionHeader {
  protocol_version: number;
  tyde_version: string;
}
