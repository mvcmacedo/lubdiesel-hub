'use client';

import { ContactsView } from '@/components/features/contacts-view';

export default function CustomersPage() {
  return (
    <ContactsView
      title="Clientes"
      description="Contatos convertidos em clientes."
      fixedType="CUSTOMER"
    />
  );
}
