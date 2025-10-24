import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import QuoteBuilder from '../../../components/QuoteBuilder';
import { Database } from '../../../types';
import type { Customer } from '../../../types';

export default async function BuildPage() {
    const cookieStore = cookies()
    const supabase = createServerComponentClient<Database>({ cookies: () => cookieStore })

    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
        redirect('/');
    }
    
    const { data: customers, error } = await supabase.from('customers').select('*');
    if(error){
        console.error("Failed to fetch customers", error);
    }

    // Fix: Removed the incorrect data transformation. The fetched customer data now matches the expected prop type.
    const initialCustomers: Customer[] = customers || [];


    return <QuoteBuilder initialCustomers={initialCustomers} />;
}