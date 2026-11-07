import React from 'react';
import QueryContent from '../../components/QueryContent';
import {FlatList, Pressable, Text, View } from 'react-native';
import { Icon, IconName } from '../../components/Icon';
import {
  GradientScreen,
  Card,
  EmptyView,
  ScreenHeader,
} from '../../components/ui';
import { useAuthorizedUsers, useDeleteAuthorizedUser } from '../../api/hooks';
import type { AppScreenProps } from '../../navigation/types';
import { confirmAction, notify } from '../../utils/dialogs';

export default function AuthorizedUsersScreen({
  navigation,
}: AppScreenProps<'AuthorizedUsers'>) {
  const users = useAuthorizedUsers();
  const remove = useDeleteAuthorizedUser();

  const confirmDelete = (id: number, name: string) => {
    confirmAction(
      'Remove authorized user',
      `Remove ${name} from your account?`,
      'Remove',
      () => remove.mutate(id)
    );
  };

  return (
    <GradientScreen scroll={false}>
      <ScreenHeader
        title="Authorized users"
        onBack={() => navigation.goBack()}
        right={
          <Pressable
            onPress={() => navigation.navigate('CreateAuthorizedUser')}
            className="w-11 h-11 rounded-full bg-primary items-center justify-center active:bg-primary-dark"
          >
            <Icon name="plus" size={20} color="#fff" />
          </Pressable>
        }
      />
      <QueryContent query={users} resource="authorized users">
        <FlatList
          data={users.data?.data ?? []}
          keyExtractor={(u) => String(u.id)}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 40 }}
          ListEmptyComponent={
            <EmptyView message="No authorized users. Add someone who can collect packages for you." />
          }
          renderItem={({ item }) => (
            <Card className="mb-3 flex-row items-center">
              <View className="w-12 h-12 rounded-full bg-primary-light items-center justify-center">
                <Text className="text-primary font-bold">
                  {(item.first_name?.[0] ?? '') + (item.last_name?.[0] ?? '')}
                </Text>
              </View>
              <View className="flex-1 ml-3">
                <Text className="text-ink font-semibold text-base">
                  {item.first_name} {item.last_name}
                </Text>
                {item.id_number ? (
                  <Text className="font-normal text-muted">ID: {item.id_number}</Text>
                ) : null}
              </View>
              <Pressable
                onPress={() =>
                  confirmDelete(item.id, `${item.first_name} ${item.last_name}`)
                }
                className="w-11 h-11 rounded-full border border-line items-center justify-center"
              >
                <Icon name="trash-2" size={18} color="#DC2626" />
              </Pressable>
            </Card>
          )}
        />
      </QueryContent>
    </GradientScreen>
  );
}
