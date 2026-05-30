// Small data-fetching hooks wrapping the API client.

import { useCallback, useEffect, useState } from "react";

import { getPainting, listPaintings } from "../api/client";
import type { PaintingDetail, PaintingSummary } from "../types/painting";

interface AsyncState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

export function usePaintingList(): AsyncState<PaintingSummary[]> & {
  reload: () => void;
} {
  const [state, setState] = useState<AsyncState<PaintingSummary[]>>({
    data: null,
    loading: true,
    error: null,
  });

  const reload = useCallback(() => {
    setState((s) => ({ ...s, loading: true, error: null }));
    listPaintings()
      .then((data) => setState({ data, loading: false, error: null }))
      .catch((err) =>
        setState({ data: null, loading: false, error: String(err.message ?? err) }),
      );
  }, []);

  useEffect(() => reload(), [reload]);

  return { ...state, reload };
}

export function usePainting(id: number): AsyncState<PaintingDetail> {
  const [state, setState] = useState<AsyncState<PaintingDetail>>({
    data: null,
    loading: true,
    error: null,
  });

  useEffect(() => {
    let active = true;
    setState({ data: null, loading: true, error: null });
    getPainting(id)
      .then((data) => active && setState({ data, loading: false, error: null }))
      .catch(
        (err) =>
          active &&
          setState({ data: null, loading: false, error: String(err.message ?? err) }),
      );
    return () => {
      active = false;
    };
  }, [id]);

  return state;
}
