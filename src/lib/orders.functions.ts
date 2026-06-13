import { createServerFn } from '@tanstack/react-start';
import { z } from 'zod';
import { PHONE_REGEX } from '@/data/algeria';

const orderInputSchema = z.object({
  productId: z.string().uuid(),
  variantLabel: z.string().min(1).max(50),
  quantity: z.number().int().min(1).max(20),
  fullName: z.string().trim().min(2).max(100),
  phone: z.string().regex(PHONE_REGEX, 'Numéro de téléphone algérien invalide'),
  phoneAlt: z.string().regex(PHONE_REGEX).optional().or(z.literal('')),
  wilayaCode: z.number().int().min(1).max(99),
  commune: z.string().trim().min(1).max(150),
  address: z.string().max(300).optional().or(z.literal('')),
  deliveryType: z.enum(['home', 'stopdesk']),
  notes: z.string().max(500).optional().or(z.literal('')),
});

export type OrderInput = z.infer<typeof orderInputSchema>;

export const createOrder = createServerFn({ method: 'POST' })
  .inputValidator((data: unknown) => orderInputSchema.parse(data))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import('@/integrations/supabase/client.server');

    const { data: product, error: pErr } = await supabaseAdmin
      .from('products')
      .select('id, name, variants, is_active')
      .eq('id', data.productId)
      .maybeSingle();
    if (pErr || !product || !product.is_active) throw new Error('Produit introuvable ou indisponible.');

    const variants = (product.variants as Array<{ label: string; price: number }>) || [];
    const variant = variants.find((v) => v.label === data.variantLabel);
    if (!variant) throw new Error('Contenance sélectionnée invalide.');

    const { data: wilaya, error: wErr } = await supabaseAdmin
      .from('wilayas')
      .select('code, name, home_fee, stopdesk_fee, is_active')
      .eq('code', data.wilayaCode)
      .maybeSingle();
    if (wErr || !wilaya || !wilaya.is_active) throw new Error('Wilaya invalide ou indisponible.');

    const shippingFee = data.deliveryType === 'home' ? wilaya.home_fee : wilaya.stopdesk_fee;
    const subtotal = variant.price * data.quantity;
    const total = subtotal + shippingFee;

    const { data: order, error: oErr } = await supabaseAdmin
      .from('orders')
      .insert({
        full_name: data.fullName,
        phone: data.phone,
        phone_alt: data.phoneAlt || null,
        wilaya_code: wilaya.code,
        wilaya_name: wilaya.name,
        commune: data.commune,
        address: data.address || null,
        delivery_type: data.deliveryType,
        shipping_fee: shippingFee,
        subtotal,
        total,
        notes: data.notes || null,
      })
      .select('id, order_number, total')
      .single();

    if (oErr || !order) throw new Error('Échec création commande.');

    const { error: iErr } = await supabaseAdmin.from('order_items').insert({
      order_id: order.id,
      product_id: product.id,
      product_name: product.name,
      variant_label: variant.label,
      unit_price: variant.price,
      quantity: data.quantity,
      line_total: subtotal,
    });
    if (iErr) throw new Error('Échec enregistrement article.');

    return { orderNumber: order.order_number, total: Number(order.total) };
  });

const cartItemSchema = z.object({
  productId: z.string().uuid(),
  variantLabel: z.string().min(1).max(50),
  quantity: z.number().int().min(1).max(20),
});

const cartOrderSchema = z.object({
  items: z.array(cartItemSchema).min(1).max(20),
  fullName: z.string().trim().min(2).max(100),
  phone: z.string().regex(PHONE_REGEX),
  phoneAlt: z.string().regex(PHONE_REGEX).optional().or(z.literal('')),
  wilayaCode: z.number().int().min(1).max(99),
  commune: z.string().trim().min(1).max(150),
  address: z.string().max(300).optional().or(z.literal('')),
  deliveryType: z.enum(['home', 'stopdesk']),
  notes: z.string().max(500).optional().or(z.literal('')),
});

export const createCartOrder = createServerFn({ method: 'POST' })
  .inputValidator((data: unknown) => cartOrderSchema.parse(data))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import('@/integrations/supabase/client.server');

    const ids = Array.from(new Set(data.items.map((i) => i.productId)));
    const { data: prods, error: pErr } = await supabaseAdmin
      .from('products').select('id, name, variants, is_active').in('id', ids);
    if (pErr || !prods) throw new Error('Produits introuvables.');

    const { data: wilaya, error: wErr } = await supabaseAdmin
      .from('wilayas').select('code, name, home_fee, stopdesk_fee, is_active')
      .eq('code', data.wilayaCode).maybeSingle();
    if (wErr || !wilaya || !wilaya.is_active) throw new Error('Wilaya invalide.');

    const lines = data.items.map((it) => {
      const prod = prods.find((p) => p.id === it.productId);
      if (!prod || !prod.is_active) throw new Error('Produit indisponible.');
      const variants = (prod.variants as Array<{ label: string; price: number }>) || [];
      const variant = variants.find((v) => v.label === it.variantLabel);
      if (!variant) throw new Error(`Contenance invalide pour ${prod.name}.`);
      return {
        product_id: prod.id, product_name: prod.name,
        variant_label: variant.label, unit_price: variant.price,
        quantity: it.quantity, line_total: variant.price * it.quantity,
      };
    });

    const shippingFee = data.deliveryType === 'home' ? wilaya.home_fee : wilaya.stopdesk_fee;
    const subtotal = lines.reduce((s, l) => s + l.line_total, 0);
    const total = subtotal + shippingFee;

    const { data: order, error: oErr } = await supabaseAdmin.from('orders').insert({
      full_name: data.fullName, phone: data.phone, phone_alt: data.phoneAlt || null,
      wilaya_code: wilaya.code, wilaya_name: wilaya.name, commune: data.commune,
      address: data.address || null, delivery_type: data.deliveryType,
      shipping_fee: shippingFee, subtotal, total, notes: data.notes || null,
    }).select('id, order_number, total').single();
    if (oErr || !order) throw new Error('Échec création commande.');

    const { error: iErr } = await supabaseAdmin.from('order_items')
      .insert(lines.map((l) => ({ order_id: order.id, ...l })));
    if (iErr) throw new Error('Échec enregistrement articles.');

    return { orderNumber: order.order_number, total: Number(order.total) };
  });
