import { useBranding } from '../../theme/BrandingProvider';
import React, { useState } from 'react';
import { Platform, Pressable, Text, View } from 'react-native';
import { Icon } from '../../components/Icon';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import {
  GradientScreen,
  Field,
  PrimaryButton,
  ScreenHeader,
} from '../../components/ui';
import { useCreatePrealert } from '../../api/hooks';
import { ApiError, toFormData } from '../../api/client';
import type { AppScreenProps } from '../../navigation/types';
import { notify } from '../../utils/dialogs';
import { appendInvoice, invoiceAttachmentError, invoiceMimeType, InvoiceAttachment } from '../../utils/prealertInvoice';

export default function CreatePrealertScreen({
  navigation,
  route,
}: AppScreenProps<'CreatePrealert'>) {
  const brand = useBranding();
  const create = useCreatePrealert();
  const [carrier, setCarrier] = useState('');
  const [trackingNumber, setTrackingNumber] = useState(
    route.params?.trackingNumber ?? ''
  );
  const [description, setDescription] = useState('');
  const [value, setValue] = useState('');
  const [invoice, setInvoice] = useState<InvoiceAttachment | null>(null);
  const [choosing, setChoosing] = useState(false);
  const [preparing, setPreparing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectInvoice = (attachment: InvoiceAttachment) => {
    const validationError = invoiceAttachmentError(attachment);
    setError(validationError);
    if (!validationError) setInvoice(attachment);
  };

  const pickInvoice = async (source: 'photos' | 'files') => {
    if (choosing || preparing || create.isPending) return;
    setChoosing(true);
    try {
      if (source === 'files') {
        const result = await DocumentPicker.getDocumentAsync({
          type: ['application/pdf', 'image/*'],
          copyToCacheDirectory: true,
          multiple: false,
        });
        if (result.canceled) return;
        const asset = result.assets[0];
        selectInvoice({ ...asset, mimeType: invoiceMimeType(asset.name, asset.mimeType) });
      } else {
        const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: 'images', quality: 0.8 });
        if (result.canceled) return;
        const asset = result.assets[0];
        const name = asset.fileName ?? 'invoice.jpg';
        selectInvoice({ uri: asset.uri, name, size: asset.fileSize, file: asset.file, mimeType: invoiceMimeType(name, asset.mimeType) });
      }
    } catch {
      setError('Unable to open your files. Please try again.');
    } finally {
      setChoosing(false);
    }
  };

  const submit = async () => {
    if (preparing || create.isPending || choosing) return;
    if (!carrier || !trackingNumber || !description || !value) {
      setError('All fields are required');
      return;
    }
    if (!invoice) {
      setError('Please attach the invoice for this package');
      return;
    }
    const validationError = invoiceAttachmentError(invoice);
    if (validationError) {
      setError(validationError);
      return;
    }
    setError(null);
    setPreparing(true);
    try {
      const form = toFormData({ carrier, tracking_number: trackingNumber, description, value });
      await appendInvoice(form, invoice, Platform.OS);
      await create.mutateAsync(form);
      notify('Prealert created', 'Your prealert has been submitted.');
      navigation.goBack();
    } catch (e) {
      setError(e instanceof ApiError ? e.firstError : e instanceof Error ? e.message : 'Unable to create prealert. Please try again.');
    } finally {
      setPreparing(false);
    }
  };

  return (
    <GradientScreen>
      <ScreenHeader title="New prealert" onBack={() => navigation.goBack()} />
      <View className="mt-4">
        <Field
          icon="truck"
          placeholder="Carrier (e.g. Amazon, DHL)"
          value={carrier}
          onChangeText={setCarrier}
        />
        <Field
          icon="hash"
          placeholder="Tracking number"
          autoCapitalize="none"
          value={trackingNumber}
          onChangeText={setTrackingNumber}
        />
        <Field
          icon="file-text"
          placeholder="Description"
          keyboardType="default"
          inputMode="text"
          value={description}
          onChangeText={setDescription}
        />
        <Field
          icon="dollar-sign"
          placeholder="Value (USD)"
          keyboardType="decimal-pad"
          value={value}
          onChangeText={setValue}
        />
        <Text className="font-semibold text-ink text-base mb-1">Invoice</Text>
        <Text className="font-normal text-muted mb-3">PDF or image, up to 10 MB</Text>
        <View className="flex-row gap-3 mb-4">
          <Pressable
            onPress={() => pickInvoice('photos')}
            disabled={choosing || preparing || create.isPending}
            accessibilityRole="button"
            className="flex-1 items-center rounded-2xl bg-white border border-line px-3 py-4"
          >
            <Text className="font-semibold text-primary">Photo library</Text>
          </Pressable>
          <Pressable
            onPress={() => pickInvoice('files')}
            disabled={choosing || preparing || create.isPending}
            accessibilityRole="button"
            className="flex-1 items-center rounded-2xl bg-white border border-line px-3 py-4"
          >
            <Text className="font-semibold text-primary">Choose file</Text>
          </Pressable>
        </View>
        {invoice ? (
          <View className="flex-row items-center rounded-2xl bg-primary-light border border-primary/30 px-4 py-3 mb-4">
            <Icon name={invoice.mimeType === 'application/pdf' ? 'file-text' : 'paperclip'} size={20} color={brand.primary} />
            <Text className="flex-1 px-3 font-medium text-ink" numberOfLines={2}>{invoice.name}</Text>
            <Pressable
              onPress={() => setInvoice(null)}
              disabled={preparing || create.isPending}
              accessibilityRole="button"
              accessibilityLabel="Remove attached invoice"
              className="p-3"
            >
              <Icon name="x" size={20} color={brand.primary} />
            </Pressable>
          </View>
        ) : null}
        {error ? <Text className="font-normal text-danger text-center mb-4">{error}</Text> : null}
        <PrimaryButton title="Submit prealert" onPress={submit} loading={preparing || create.isPending} disabled={choosing} />
      </View>
    </GradientScreen>
  );
}
