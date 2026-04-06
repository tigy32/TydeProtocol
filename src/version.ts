// Wire protocol version used by the Tyde remote control handshake.
export const TYDE_PROTOCOL_VERSION = 2 as const;

// Version header exchanged during the Tyde remote control handshake.
export interface TydeVersionHeader {
  protocol_version: number;
  tyde_version: string;
}

// Compatibility signal for handshake version headers.
export interface TydeVersionCompatibility {
  protocolCompatible: boolean;
  tydeVersionMatch: boolean;
}

export function compareTydeVersionHeaders(
  local: TydeVersionHeader,
  remote: TydeVersionHeader,
): TydeVersionCompatibility {
  return {
    protocolCompatible: local.protocol_version === remote.protocol_version,
    tydeVersionMatch: local.tyde_version === remote.tyde_version,
  };
}
