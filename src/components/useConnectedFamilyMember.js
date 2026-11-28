import { useEffect, useState } from "react";
import { CONNECTED_PROFILE_ID, connectionsEnabled, familyConnection } from "../api/familyConnectionsApi.js";

export default function useConnectedFamilyMember(enabled = true, retry = 0) {
  const [member, setMember] = useState(null);
  useEffect(() => {
    if (!enabled || !connectionsEnabled) return;
    const controller = new AbortController();
    familyConnection(controller.signal).then(({ connection }) => {
      if (!controller.signal.aborted) {
        setMember(connection ? { ...connection, isConnected: true, memberId: connection.linkedMemberId || CONNECTED_PROFILE_ID } : null);
      }
    }).catch(() => {
      if (!controller.signal.aborted) setMember(null);
    });
    return () => controller.abort();
  }, [enabled, retry]);
  return enabled ? member : null;
}
