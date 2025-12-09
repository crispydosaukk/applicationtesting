import { useState } from "react";

export default function useRefresh(refreshCallback) {
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = async () => {
    try {
      setRefreshing(true);
      await refreshCallback();  // screen-specific reload function
    } catch (error) {
      console.log("Refresh error:", error);
    } finally {
      setRefreshing(false);
    }
  };

  return { refreshing, onRefresh };
}
