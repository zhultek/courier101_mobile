export interface InvoiceAttachment {
  uri: string;
  name: string;
  mimeType: string;
  size?: number;
  file?: File;
}

export const MAX_INVOICE_BYTES = 10 * 1024 * 1024;

const imageTypes: Record<string, string> = {
  jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', gif: 'image/gif',
  webp: 'image/webp', heic: 'image/heic', heif: 'image/heif', avif: 'image/avif',
  bmp: 'image/bmp', tif: 'image/tiff', tiff: 'image/tiff',
};

/** Providers sometimes omit MIME metadata or return application/octet-stream. */
export function invoiceMimeType(name: string, mimeType?: string | null): string {
  if (mimeType && mimeType !== 'application/octet-stream') return mimeType.toLowerCase();
  const extension = name.split('.').pop()?.toLowerCase() ?? '';
  return extension === 'pdf' ? 'application/pdf' : imageTypes[extension] ?? 'application/octet-stream';
}

export function invoiceAttachmentError(attachment: InvoiceAttachment): string | null {
  if (attachment.mimeType !== 'application/pdf' && !attachment.mimeType.startsWith('image/')) {
    return 'Choose a PDF or an image for your invoice.';
  }
  if (attachment.size !== undefined && attachment.size > MAX_INVOICE_BYTES) {
    return 'Your invoice must be 10 MB or smaller.';
  }
  return null;
}

export async function appendInvoice(form: FormData, attachment: InvoiceAttachment, platform: string): Promise<void> {
  if (platform === 'web') {
    // Browser FormData needs the actual file bytes, not React Native's URI descriptor.
    const file = attachment.file ?? await (await fetch(attachment.uri)).blob();
    if (file.size > MAX_INVOICE_BYTES) throw new Error('Your invoice must be 10 MB or smaller.');
    form.append('invoice[]', file, attachment.name);
  } else {
    form.append('invoice[]', {
      uri: attachment.uri,
      name: attachment.name,
      type: attachment.mimeType,
    } as unknown as Blob);
  }
}
