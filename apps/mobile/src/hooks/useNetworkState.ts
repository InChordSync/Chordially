import { useEffect, useState } from 'react';
import NetInfo from '@react-native-community/netinfo';

interface NetworkState {
  isConnected: boolean;
  connectionType: string | null;
  isInternetReachable: boolean | null;
}

export function useNetworkState(): NetworkState {
  const [networkState, setNetworkState] = useState<NetworkState>({
    isConnected: true,
    connectionType: null,
    isInternetReachable: null,
  });

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      setNetworkState({
        isConnected: state.isConnected ?? false,
        connectionType: state.type ?? null,
        isInternetReachable: state.isInternetReachable ?? null,
      });
    });

    return () => {
      unsubscribe();
    };
  }, []);

  return networkState;
}
