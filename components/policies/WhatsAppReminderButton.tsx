'use client';

import React from 'react';
import { MessageCircle } from 'lucide-react';

interface WhatsAppReminderButtonProps {
  clientName: string;
  clientPhone: string;
  policyNumber: string;
}

export default function WhatsAppReminderButton({
  clientName,
  clientPhone,
  policyNumber,
}: WhatsAppReminderButtonProps) {
  const handleSendReminder = () => {
    // 1. Sanitize phone number: strip all non-numeric characters
    let sanitizedPhone = clientPhone.replace(/\D/g, '');

    // 2. If resulting string length is exactly 10, prepend '91'
    if (sanitizedPhone.length === 10) {
      sanitizedPhone = '91' + sanitizedPhone;
    }

    // 3. Message template (Bilingual) preserving exact line breaks and formatting
    const message = `Dear ${clientName},
A gentle reminder that your LIC policy ${policyNumber} premium is due. Please ensure payment to avoid a lapse.

પ્રિય ${clientName},
નમ્ર વિનંતી કે તમારી LIC પોલિસી ${policyNumber} નું પ્રીમિયમ ભરવાનું બાકી છે. પોલિસી લેપ્સ ન થાય તે માટે કૃપા કરીને સમયસર ચૂકવણી કરો.`;

    // 4. Use encodeURIComponent on the entire message string
    const encodedMessage = encodeURIComponent(message);

    // 5. Generate the wa.me URL
    const url = `https://wa.me/${sanitizedPhone}?text=${encodedMessage}`;

    // 6. Open in a new window/tab safely
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <button
      onClick={handleSendReminder}
      className="inline-flex items-center justify-center gap-1.5 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold shadow-md shadow-emerald-950/20 hover:shadow-emerald-500/20 active:scale-95 transition-all duration-150 border border-emerald-500/10"
      title="Send WhatsApp Reminder"
    >
      <MessageCircle className="w-3.5 h-3.5" />
      <span>Send Reminder</span>
    </button>
  );
}
