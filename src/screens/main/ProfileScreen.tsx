import React from 'react';
import {Pressable, Switch, Text, View } from 'react-native';
import { Icon, IconName } from '../../components/Icon';
import { GradientScreen, Card, ScreenHeader } from '../../components/ui';
import {
  useDeleteAccount,
  useLogout,
  useProfile,
  useUpdateSetting,
} from '../../api/hooks';
import { useAuth } from '../../store/auth';
import type { AppScreenProps } from '../../navigation/types';
import { confirmAction, notify } from '../../utils/dialogs';

function MenuRow({
  icon,
  label,
  onPress,
  danger,
}: {
  icon: IconName;
  label: string;
  onPress: () => void;
  danger?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      className="flex-row items-center py-4 border-b border-line"
    >
      <View
        className={`w-9 h-9 rounded-xl items-center justify-center ${
          danger ? 'bg-danger-light' : 'bg-primary-light'
        }`}
      >
        <Icon name={icon} size={17} color={danger ? '#DC2626' : '#2563EB'} />
      </View>
      <Text
        className={`flex-1 ml-3 text-base font-medium ${
          danger ? 'text-danger' : 'text-ink'
        }`}
      >
        {label}
      </Text>
      <Icon name="chevron-right" size={20} color="#94A3B8" />
    </Pressable>
  );
}

export default function ProfileScreen({ navigation }: AppScreenProps<'Profile'>) {
  const storedUser = useAuth((s) => s.user);
  const profile = useProfile();
  const user = profile.data?.data ?? storedUser;
  const logout = useLogout();
  const deleteAccount = useDeleteAccount();
  const updateSetting = useUpdateSetting();

  const confirmDelete = () => {
    confirmAction(
      'Delete account',
      'This permanently deletes your account and cannot be undone. Continue?',
      'Delete',
      () => deleteAccount.mutate()
    );
  };

  return (
    <GradientScreen>
      <ScreenHeader title="Profile" onBack={() => navigation.goBack()} />
      <Card className="items-center py-6 mt-2">
        <View className="w-20 h-20 rounded-full bg-primary-light items-center justify-center">
          <Text className="text-primary text-2xl font-bold">
            {(user?.first_name?.[0] ?? '') + (user?.last_name?.[0] ?? '')}
          </Text>
        </View>
        <Text className="text-lg font-semibold text-ink mt-3">
          {user?.first_name} {user?.last_name}
        </Text>
        <Text className="font-normal text-muted">{user?.email}</Text>
        <View className="mt-2 px-4 py-1 rounded-full bg-primary-light">
          <Text className="text-primary font-semibold">Mailbox {user?.mailbox}</Text>
        </View>
      </Card>

      <Card className="mt-4 py-1 px-5">
        <MenuRow
          icon="edit-3"
          label="Edit profile"
          onPress={() => navigation.navigate('EditProfile')}
        />
        <MenuRow
          icon="lock"
          label="Change password"
          onPress={() => navigation.navigate('ChangePassword')}
        />
        <MenuRow
          icon="percent"
          label="Duty calculator"
          onPress={() => navigation.navigate('Calculator')}
        />
        <MenuRow
          icon="dollar-sign"
          label="Shipping rates"
          onPress={() => navigation.navigate('Rates')}
        />
        <MenuRow
          icon="users"
          label="Authorized users"
          onPress={() => navigation.navigate('AuthorizedUsers')}
        />
      </Card>

      <Card className="mt-4 px-5">
        <View className="flex-row items-center justify-between py-3 border-b border-line">
          <Text className="font-normal text-base text-ink">Package updates</Text>
          <Switch
            value={user?.settings?.package_update ?? true}
            onValueChange={(value) =>
              updateSetting.mutate({ setting: 'package-update', value })
            }
            trackColor={{ true: '#2563EB' }}
          />
        </View>
        <View className="flex-row items-center justify-between py-3">
          <Text className="font-normal text-base text-ink">Promotional emails</Text>
          <Switch
            value={user?.settings?.promotional_email ?? true}
            onValueChange={(value) =>
              updateSetting.mutate({ setting: 'promotional-email', value })
            }
            trackColor={{ true: '#2563EB' }}
          />
        </View>
      </Card>

      <Card className="mt-4 py-1 px-5">
        <MenuRow icon="log-out" label="Sign out" onPress={() => logout.mutate()} />
        <MenuRow icon="trash-2" label="Delete account" onPress={confirmDelete} danger />
      </Card>
    </GradientScreen>
  );
}
