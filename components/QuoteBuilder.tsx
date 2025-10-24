'use client';
import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from './AuthProvider';
// Fix: Import Database type to explicitly type supabase payloads
import type { Customer, Product, QuoteItem, Database } from '../types';
import { useTranslation } from 'react-i18next';
import { createClient } from '../lib/supabase';
import LocaleSwitcher from './LocaleSwitcher';
import { CustomerComboBox } from './ui/customer-combobox';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { GoogleGenAI, Type } from "@google/genai";

// Debounce hook
const useDebounce = (value: string, delay: number) => {
    const [debouncedValue, setDebouncedValue] = useState(value);
    useEffect(() => {
        const handler = setTimeout(() => { setDebouncedValue(value); }, delay);
        return () => { clearTimeout(handler); };
    }, [value, delay]);
    return debouncedValue;
};

interface QuoteBuilderProps {
    initialCustomers?: Customer[];
}

const QuoteBuilder: React.FC<QuoteBuilderProps> = ({ initialCustomers }) => {
    const { t } = useTranslation();
    const { user, profile, signOut } = useAuth();
    const supabase = createClient();
    
    // Column 1 State
    const [customers, setCustomers] = useState<Customer[]>(initialCustomers || []);
    const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
    const [projectName, setProjectName] = useState('');

    // Column 2 State
    const [allProducts, setAllProducts] = useState<Product[]>([]);
    const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const debouncedSearchQuery = useDebounce(searchQuery, 300);
    const [isProductLoading, setIsProductLoading] = useState(true);
    const [aiRequest, setAiRequest] = useState('');
    const [isAiLoading, setIsAiLoading] = useState(false);

    // Column 3 State
    const [quoteItems, setQuoteItems] = useState<QuoteItem[]>([]);
    const [discountTier, setDiscountTier] = useState("0%");

    // Modal State
    const [productToAdd, setProductToAdd] = useState<Product | null>(null);
    const [addQuantity, setAddQuantity] = useState(1);
    
    // Submission State
    const [isSaving, setIsSaving] = useState(false);
    const [pdfUrl, setPdfUrl] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    // Fetch customers (if not provided) and products
    useEffect(() => {
        const fetchData = async () => {
            setIsProductLoading(true);
            const productPromise = supabase.rpc('get_products_with_permission');
            const customerPromise = initialCustomers 
                ? Promise.resolve({ data: initialCustomers, error: null }) 
                : supabase.from('customers').select('*');

            const [productsRes, customersRes] = await Promise.all([
                productPromise,
                customerPromise
            ]);

            if (productsRes.error) console.error("Error fetching products", productsRes.error);
            else {
                setAllProducts(productsRes.data || []);
                setFilteredProducts(productsRes.data || []);
            }

            if (customersRes.error) console.error("Error fetching customers", customersRes.error);
            else setCustomers(customersRes.data || []);

            setIsProductLoading(false);
        };
        fetchData();
    }, [supabase, initialCustomers]);

    // Filter products based on search
     useEffect(() => {
        const query = debouncedSearchQuery.toLowerCase();
        if (!query) {
            setFilteredProducts(allProducts);
            return;
        }
        const filtered = allProducts.filter(p =>
            p.name.toLowerCase().includes(query) ||
            p.sku?.toLowerCase().includes(query) ||
            p.tags?.some(tag => tag.toLowerCase().includes(query))
        );
        setFilteredProducts(filtered);
    }, [debouncedSearchQuery, allProducts]);

    // Quote Calculations
    const { subtotal, grandTotal, totalCost, profitMargin } = useMemo(() => {
        const sub = quoteItems.reduce((acc, item) => acc + item.total_price, 0);
        const discountValue = parseFloat(discountTier) / 100;
        const grand = sub * (1 - discountValue);
        
        let cost: number | null = null;
        let margin: number | null = null;
        if (profile?.role === 'admin') {
            cost = quoteItems.reduce((acc, item) => {
                const itemCost = item.product.cost_price ?? 0;
                return acc + (itemCost * item.quantity);
            }, 0);
            margin = grand > 0 ? ((grand - cost) / grand) : 0;
        }

        return { subtotal: sub, grandTotal: grand, totalCost: cost, profitMargin: margin };
    }, [quoteItems, discountTier, profile]);

    // Handlers
    const handleAddToQuote = (product: Product, quantity: number) => {
        if (quantity <= 0) return;
        setQuoteItems(prev => {
            const existingItem = prev.find(item => item.product.id === product.id);
            if (existingItem) {
                return prev.map(item =>
                    item.product.id === product.id
                        ? { ...item, quantity: item.quantity + quantity, total_price: (item.quantity + quantity) * item.unit_sale_price }
                        : item
                );
            }
            return [...prev, {
                product,
                quantity,
                unit_sale_price: product.sale_price,
                total_price: product.sale_price * quantity,
            }];
        });
        setProductToAdd(null);
        setAddQuantity(1);
    };
    
    const handleUpdateQuantity = (productId: string, newQuantity: number) => {
        if (newQuantity <= 0) {
            handleRemoveItem(productId);
            return;
        }
        setQuoteItems(prev => prev.map(item =>
            item.product.id === productId
                ? { ...item, quantity: newQuantity, total_price: newQuantity * item.unit_sale_price }
                : item
        ));
    };

    const handleRemoveItem = (productId: string) => {
        setQuoteItems(prev => prev.filter(item => item.product.id !== productId));
    };
    
    const handleSmartRequest = async () => {
        if (!aiRequest.trim() || allProducts.length === 0) return;
        setIsAiLoading(true);
        setError(null);
    
        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
    
            const response = await ai.models.generateContent({
                model: "gemini-2.5-flash",
                contents: `Based on the user request: "${aiRequest}", suggest products from the following list. Only include products that are explicitly mentioned or clearly implied. For each suggested product, provide its ID and a reasonable quantity. \n\nAvailable Products:\n${allProducts.map(p => `- ${p.name} (ID: ${p.id}, Tags: ${p.tags?.join(', ') || 'N/A'})`).join('\n')}`,
                config: {
                    responseMimeType: "application/json",
                    responseSchema: {
                        type: Type.ARRAY,
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                productId: {
                                    type: Type.STRING,
                                    description: "The ID of the suggested product."
                                },
                                quantity: {
                                    type: Type.NUMBER,
                                    description: "The suggested quantity for the product."
                                }
                            },
                            required: ["productId", "quantity"]
                        }
                    }
                }
            });
    
            const jsonStr = response.text.trim();
            const suggestions = JSON.parse(jsonStr) as { productId: string; quantity: number }[];
    
            if (suggestions && suggestions.length > 0) {
                const newItems: QuoteItem[] = [];
                for (const suggestion of suggestions) {
                    const product = allProducts.find(p => p.id === suggestion.productId);
                    if (product) {
                        newItems.push({
                            product,
                            quantity: suggestion.quantity,
                            unit_sale_price: product.sale_price,
                            total_price: product.sale_price * suggestion.quantity
                        });
                    }
                }
                setQuoteItems(prevItems => {
                    const updatedItems = [...prevItems];
                    newItems.forEach(newItem => {
                        const existingIndex = updatedItems.findIndex(item => item.product.id === newItem.product.id);
                        if (existingIndex > -1) {
                            const existingItem = updatedItems[existingIndex];
                            const newQuantity = existingItem.quantity + newItem.quantity;
                            updatedItems[existingIndex] = { ...existingItem, quantity: newQuantity, total_price: newQuantity * existingItem.unit_sale_price };
                        } else {
                            updatedItems.push(newItem);
                        }
                    });
                    return updatedItems;
                });
            } else {
                setError(t('QuoteBuilder.aiNoSuggestions'));
            }
    
        } catch (e: any) {
            console.error("AI Smart Request failed:", e);
            setError(e.message || t('QuoteBuilder.aiRequestFailed'));
        } finally {
            setIsAiLoading(false);
        }
    };


    const handleSaveAndGenerate = async () => {
        if (!selectedCustomer || !projectName.trim() || quoteItems.length === 0 || !user) {
            setError(t('QuoteBuilder.validationError'));
            return;
        }
        setIsSaving(true);
        setError(null);
        setPdfUrl(null);

        try {
            // Fix: Explicitly type the insert payload to ensure it matches the expected type, resolving the 'not assignable to never' error.
            const quoteToInsert: Database['public']['Tables']['quotes']['Insert'] = {
                customer_id: selectedCustomer.id,
                project_name: projectName,
                total_sale_price: grandTotal,
                discount_tier_applied: discountTier === '0%' ? null : discountTier,
                created_by_profile_id: user.id,
                total_cost_price: totalCost,
            };

            const { data: quoteData, error: quoteError } = await supabase
                .from('quotes')
                .insert([quoteToInsert])
                .select()
                .single();

            if (quoteError) throw quoteError;
            if (!quoteData) throw new Error("Failed to create quote, no data returned.");
            
            const newQuoteId = quoteData.id;

            const itemsToInsert = quoteItems.map(item => ({
                quote_id: newQuoteId,
                product_id: item.product.id,
                quantity: item.quantity,
                unit_sale_price: item.unit_sale_price,
            }));
            const { error: itemsError } = await supabase.from('quote_items').insert(itemsToInsert);
            if (itemsError) throw itemsError;

            const { data: functionData, error: functionError } = await supabase.functions.invoke('generate-quote-pdf', {
                body: { quote_id: newQuoteId },
            });

            if (functionError) throw functionError;
            
            if (functionData.pdfUrl) {
                setPdfUrl(functionData.pdfUrl);
            } else {
                throw new Error("Edge function did not return a PDF URL.");
            }

        } catch (e: any) {
            console.error("Failed to save quote:", e);
            setError(`Failed to save quote: ${e.message}`);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 text-foreground p-4 lg:p-6">
            <header className="flex justify-between items-center mb-6 pb-4 border-b">
                <div>
                    <h1 className="text-2xl font-bold text-primary">{t('QuoteBuilder.title')}</h1>
                    <p className="text-secondary">{t('QuoteBuilder.welcome')}, {user?.email}</p>
                </div>
                <div className="flex items-center gap-2">
                    <LocaleSwitcher />
                    <Button variant="outline" onClick={signOut}>{t('QuoteBuilder.logout')}</Button>
                </div>
            </header>
            
            {error && (
                 <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
                    <strong className="font-bold">{t('QuoteBuilder.errorAlert')}</strong>
                    <span className="block sm:inline ltr:ml-2 rtl:mr-2">{error}</span>
                 </div>
            )}
             {pdfUrl && (
                 <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative mb-4" role="alert">
                    <strong className="font-bold">{t('QuoteBuilder.successAlert')}</strong>
                    <span className="block sm:inline ltr:ml-2 rtl:mr-2">{t('QuoteBuilder.quoteCreatedSuccess')}</span>
                    <a href={pdfUrl} target="_blank" rel="noopener noreferrer" className="font-bold underline ltr:ml-4 rtl:mr-4">{t('QuoteBuilder.downloadPDF')}</a>
                 </div>
            )}

            <main className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <section className="lg:col-span-1 bg-white p-6 rounded-lg shadow-md border space-y-6">
                    <h2 className="text-xl font-semibold text-primary border-b pb-3">{t('QuoteBuilder.column1Title')}</h2>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">{t('QuoteBuilder.customerLabel')}</label>
                        <CustomerComboBox customers={customers} onSelectCustomer={setSelectedCustomer} />
                    </div>
                    <div>
                        <label htmlFor="project-name" className="block text-sm font-medium text-gray-700 mb-1">{t('QuoteBuilder.projectNameLabel')}</label>
                        <Input id="project-name" value={projectName} onChange={(e) => setProjectName(e.target.value)} placeholder={t('QuoteBuilder.projectNamePlaceholder')} />
                    </div>
                </section>

                <section className="lg:col-span-1 bg-white p-6 rounded-lg shadow-md border flex flex-col">
                    <h2 className="text-xl font-semibold text-primary border-b pb-3 mb-4">{t('QuoteBuilder.column2Title')}</h2>
                    <Input placeholder={t('QuoteBuilder.searchPlaceholder')} value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="mb-4" />
                    <div className="mb-4 p-4 border rounded-md bg-accent-2/20">
                         <h3 className="font-semibold mb-2 text-accent-1">{t('QuoteBuilder.aiRequestTitle')}</h3>
                         <Textarea value={aiRequest} onChange={(e) => setAiRequest(e.target.value)} rows={3} placeholder={t('QuoteBuilder.aiRequestPlaceholder')} className="mb-2" />
                         <Button onClick={handleSmartRequest} disabled={isAiLoading} className="w-full bg-accent-1 hover:bg-accent-1/90">
                            {isAiLoading ? t('QuoteBuilder.aiRequestLoading') : t('QuoteBuilder.aiRequestButton')}
                         </Button>
                    </div>

                    <div className="flex-grow overflow-y-auto -m-2 p-2 h-96">
                        {isProductLoading ? <p className="text-center text-gray-500">{t('QuoteBuilder.loadingProducts')}</p> : (
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                {filteredProducts.map(p => (
                                    <button key={p.id} onClick={() => setProductToAdd(p)} className="border rounded-lg p-2 text-center hover:shadow-lg hover:border-primary transition group">
                                        <img src={p.image_url || 'https://placehold.co/150'} alt={p.name} className="w-full h-24 object-cover rounded-md mb-2" />
                                        <h4 className="text-sm font-semibold group-hover:text-primary">{p.name}</h4>
                                        <p className="text-xs text-gray-500">{p.sale_price.toFixed(2)} {t('QuoteBuilder.currency')}</p>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </section>

                <section className="lg:col-span-1 bg-white p-6 rounded-lg shadow-md border flex flex-col">
                    <h2 className="text-xl font-semibold text-primary border-b pb-3 mb-4">{t('QuoteBuilder.column3Title')}</h2>
                    <div className="flex-grow overflow-y-auto -mx-6 px-6">
                         {quoteItems.length === 0 ? (
                             <p className="text-gray-500 text-center mt-8">{t('QuoteBuilder.noProductsAdded')}</p>
                        ): (
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b"><th className="text-start font-semibold p-2">{t('QuoteBuilder.product')}</th><th className="text-center font-semibold p-2">{t('QuoteBuilder.quantity')}</th><th className="text-end font-semibold p-2">{t('QuoteBuilder.total')}</th></tr>
                                </thead>
                                <tbody>
                                    {quoteItems.map(item => (
                                        <tr key={item.product.id} className="border-b">
                                            <td className="p-2">{item.product.name}</td>
                                            <td className="p-2 w-24"><Input type="number" value={item.quantity} onChange={(e) => handleUpdateQuantity(item.product.id, parseInt(e.target.value) || 0)} className="w-full text-center"/></td>
                                            <td className="p-2 text-end font-mono">{item.total_price.toFixed(2)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                    <div className="mt-auto pt-4 border-t space-y-3">
                        <div className="flex justify-between items-center text-md"><span className="font-semibold">{t('QuoteBuilder.subtotal')}:</span><span className="font-mono">{subtotal.toFixed(2)} {t('QuoteBuilder.currency')}</span></div>
                        <div className="space-y-2">
                             <label className="font-semibold">{t('QuoteBuilder.discount')}:</label>
                             <div className="flex justify-between gap-2">
                                {["0%", "5%", "10%", "15%"].map(d => (
                                    <Button key={d} onClick={() => setDiscountTier(d)} variant={discountTier === d ? 'default' : 'secondary'} className="w-full py-1 text-sm">{d === "0%" ? t('QuoteBuilder.noDiscount') : d}</Button>
                                ))}
                             </div>
                        </div>
                        <div className="flex justify-between items-center text-xl font-bold text-primary border-t pt-2"><span>{t('QuoteBuilder.grandTotal')}:</span><span className="font-mono">{grandTotal.toFixed(2)} {t('QuoteBuilder.currency')}</span></div>
                        {profile?.role === 'admin' && totalCost !== null && profitMargin !== null && (
                            <div className="bg-blue-50 border border-primary/50 rounded-md p-3 mt-4 text-sm">
                                <h3 className="font-bold text-primary mb-2">{t('QuoteBuilder.adminPanelTitle')}</h3>
                                <div className="flex justify-between"><span>{t('QuoteBuilder.totalCost')}:</span><span className="font-mono">{totalCost.toFixed(2)} {t('QuoteBuilder.currency')}</span></div>
                                <div className="flex justify-between"><span>{t('QuoteBuilder.profitMargin')}:</span><span className={`font-mono font-bold ${profitMargin < 0.1 ? 'text-red-500': 'text-green-600'}`}>{(profitMargin * 100).toFixed(1)}%</span></div>
                            </div>
                        )}
                        <Button onClick={handleSaveAndGenerate} disabled={isSaving} className="w-full py-3 mt-4 text-lg font-bold bg-secondary hover:bg-secondary/90 text-white">{isSaving ? t('QuoteBuilder.savingButton') : t('QuoteBuilder.saveButton')}</Button>
                    </div>
                </section>
            </main>

            <Dialog open={!!productToAdd} onOpenChange={(isOpen) => !isOpen && setProductToAdd(null)}>
                <DialogContent>
                    <DialogHeader><DialogTitle>{productToAdd?.name}</DialogTitle></DialogHeader>
                    <img src={productToAdd?.image_url || 'https://placehold.co/300'} alt={productToAdd?.name} className="w-full h-48 object-cover rounded-md" />
                    <div>
                        <label htmlFor="quantity" className="block text-sm font-medium text-gray-700 mb-1">{t('QuoteBuilder.quantity')}</label>
                        <Input type="number" id="quantity" value={addQuantity} onChange={(e) => setAddQuantity(parseInt(e.target.value) || 1)} min="1" autoFocus />
                    </div>
                    <div className="flex gap-4">
                        <Button onClick={() => productToAdd && handleAddToQuote(productToAdd, addQuantity)} className="flex-1">{t('QuoteBuilder.addToQuoteButton')}</Button>
                        <Button onClick={() => setProductToAdd(null)} variant="outline" className="flex-1">{t('QuoteBuilder.cancel')}</Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default QuoteBuilder;