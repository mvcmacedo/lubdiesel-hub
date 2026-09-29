'use client';

import { ContactsView } from '@/components/features/contacts-view';

export default function ResellersPage() {
  return (
    <ContactsView
      title="Revendedores"
      description="Rede de potenciais e atuais revendedores."
      fixedType="RESELLER"
    />
  );
}
