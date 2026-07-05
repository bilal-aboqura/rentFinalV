interface SendWhatsAppAdminNotificationInput {
  to: string;
  message: string;
}

export interface WhatsAppDeliveryResult {
  delivered: boolean;
  provider: 'cloud_api' | 'manual';
  error?: string;
}

function digitsOnly(value: string): string {
  return value.replace(/[^\d]/g, '');
}

/**
 * Sends an admin WhatsApp notification when Cloud API credentials are
 * configured. Falls back cleanly to the manual wa.me flow otherwise.
 */
export async function sendWhatsAppAdminNotification(
  input: SendWhatsAppAdminNotificationInput,
): Promise<WhatsAppDeliveryResult> {
  const accessToken = process.env.WHATSAPP_CLOUD_ACCESS_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_CLOUD_PHONE_NUMBER_ID;
  const apiVersion = process.env.WHATSAPP_CLOUD_API_VERSION ?? 'v21.0';

  if (!accessToken || !phoneNumberId) {
    return { delivered: false, provider: 'manual' };
  }

  const to = digitsOnly(input.to);
  if (!to) {
    return { delivered: false, provider: 'manual', error: 'Missing destination number.' };
  }

  try {
    const response = await fetch(
      `https://graph.facebook.com/${apiVersion}/${phoneNumberId}/messages`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          recipient_type: 'individual',
          to,
          type: 'text',
          text: {
            preview_url: false,
            body: input.message,
          },
        }),
      },
    );

    if (!response.ok) {
      const body = await response.text();
      return {
        delivered: false,
        provider: 'cloud_api',
        error: body || `WhatsApp API error (${response.status})`,
      };
    }

    return { delivered: true, provider: 'cloud_api' };
  } catch (error) {
    return {
      delivered: false,
      provider: 'cloud_api',
      error: error instanceof Error ? error.message : 'Unknown WhatsApp error.',
    };
  }
}
