import React, { useState } from 'react';
import QueryContent from '../../components/QueryContent';
import { Text, View } from 'react-native';
import {
  GradientScreen,
  Card,
  Field,
  InfoRow,
  PrimaryButton,
  ScreenHeader,
  SelectField,
  money,
  tabularNums,
} from '../../components/ui';
import { useCalculate, useDutyCategories } from '../../api/hooks';
import { ApiError } from '../../api/client';
import type { AppScreenProps } from '../../navigation/types';

export default function CalculatorScreen({
  navigation,
}: AppScreenProps<'Calculator'>) {
  const categories = useDutyCategories();
  const calculate = useCalculate();
  const [weight, setWeight] = useState('');
  const [dutyId, setDutyId] = useState('');
  const [value, setValue] = useState('');
  const [error, setError] = useState<string | null>(null);

  const submit = () => {
    if (!weight || !dutyId || !value) {
      setError('All fields are required.');
      return;
    }
    setError(null);
    calculate.mutate(
      { weight, duty_id: dutyId, value },
      {
        onError: (e) =>
          setError(e instanceof ApiError ? e.firstError : 'Unable to calculate.'),
      }
    );
  };

  const result = calculate.data;

  return (
    <GradientScreen>
      <ScreenHeader title="Duty calculator" onBack={() => navigation.goBack()} />
      <View className="mt-4">
        <Field
          icon="package"
          placeholder="Weight (lbs)"
          keyboardType="decimal-pad"
          value={weight}
          onChangeText={setWeight}
        />
        <QueryContent query={categories} resource="duty categories">
          <SelectField
            icon="tag"
            placeholder="Duty category"
            value={dutyId}
            options={(categories.data?.data ?? []).map((c) => ({
              label: c.name,
              value: String(c.id),
            }))}
            onChange={setDutyId}
          />
        </QueryContent>
        <Field
          icon="dollar-sign"
          placeholder="Item value (USD)"
          keyboardType="decimal-pad"
          value={value}
          onChangeText={setValue}
        />
        {error ? <Text className="font-normal text-danger text-center mb-4">{error}</Text> : null}
        <PrimaryButton title="Calculate" disabled={!categories.data || categories.isError} onPress={submit} loading={calculate.isPending} />

        {result ? (
          <Card className="mt-6">
            <Text className="text-lg font-semibold text-ink mb-2">Estimate</Text>
            <View className="rounded-2xl bg-surface px-4 py-2">
              <InfoRow label="Freight" value={money(result.freight_cost)} />
              <InfoRow label="Duty" value={money(result.duty_cost)} />
              <InfoRow label="GCT" value={money(result.gct)} />
              <InfoRow label="CAF" value={money(result.caf)} />
              <InfoRow label="Stamp" value={money(result.stamp)} />
              <InfoRow label="ENVL" value={money(result.envl)} />
              <InfoRow label="SCF" value={money(result.scf)} />
              <InfoRow label="Customs charge" value={money(result.customs_charge)} />
            </View>
            <View className="flex-row justify-between items-center px-4 pt-3">
              <Text className="text-lg font-semibold text-ink">Grand total</Text>
              <Text
                className="text-xl font-bold text-primary"
                style={tabularNums}
              >
                {money(result.grand_total)}
              </Text>
            </View>
          </Card>
        ) : null}
      </View>
    </GradientScreen>
  );
}
