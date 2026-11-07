import React from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { ApiError } from '../api/client';
import { Icon } from './Icon';
import { LoadingView } from './ui';

interface QueryState {
  data: unknown;
  error: unknown;
  isPending: boolean;
  isError: boolean;
  isFetching: boolean;
  fetchStatus?: 'fetching' | 'paused' | 'idle';
  refetch: () => unknown;
}

export function QueryError({
  query,
  resource,
}: {
  query: Pick<QueryState, 'error' | 'isFetching' | 'refetch' | 'data'>;
  resource: string;
}) {
  const status = query.error instanceof ApiError ? query.error.status : 0;
  const message = status === 0
    ? 'Check your internet connection and try again.'
    : status === 408
      ? 'The connection took too long. Please try again.'
      : status === 404
        ? 'This information is no longer available. Try refreshing or go back.'
        : 'We could not reach your courier right now. Please try again.';

  return (
    <View className="rounded-2xl bg-white border border-line p-4 my-3" accessibilityLiveRegion="polite">
      <View className="flex-row items-center mb-2">
        <Icon name="alert-circle" size={21} color="#DC2626" />
        <Text className="flex-1 ml-2 font-semibold text-ink text-base">
          Unable to {query.data === undefined ? 'load' : 'refresh'} {resource}
        </Text>
      </View>
      <Text className="font-normal text-muted leading-5">{message}</Text>
      <Text selectable className="font-normal text-muted text-xs mt-2">
        Error code: {status ? `C101-HTTP-${status}` : 'C101-NETWORK'}
      </Text>
      {query.data !== undefined ? (
        <Text className="font-normal text-muted leading-5 mt-1">Showing previously loaded information.</Text>
      ) : null}
      <Pressable
        onPress={() => { query.refetch(); }}
        disabled={query.isFetching}
        accessibilityRole="button"
        accessibilityLabel={`Retry loading ${resource}`}
        accessibilityState={{ disabled: query.isFetching, busy: query.isFetching }}
        className="self-start flex-row items-center rounded-full bg-primary px-5 py-3 mt-3"
      >
        {query.isFetching ? <ActivityIndicator size="small" color="#FFFFFF" /> : <Icon name="refresh-ccw" size={17} color="#FFFFFF" />}
        <Text className="font-semibold text-white ml-2">{query.isFetching ? 'Retrying…' : 'Try again'}</Text>
      </Pressable>
    </View>
  );
}

/** Only successful empty responses may show an empty state; failed refreshes retain cached content. */
export default function QueryContent({ query, resource, children }: {
  query: QueryState;
  resource: string;
  children: React.ReactNode;
}) {
  const unavailable = query.isError || query.fetchStatus === 'paused';
  if (query.isPending && query.data === undefined && !unavailable) return <LoadingView />;
  return (
    <>
      {unavailable ? <QueryError query={query} resource={resource} /> : null}
      {(!unavailable || query.data !== undefined) ? children : null}
    </>
  );
}
