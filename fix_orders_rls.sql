-- Enable RLS on orders and order_items (just in case)
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

-- Allow users to insert their own orders
CREATE POLICY "Users can create orders" ON public.orders
FOR INSERT WITH CHECK (
    auth.uid() = user_id
);

-- Allow users to insert items for their own orders
-- Note: We check that the order belongs to the user
CREATE POLICY "Users can create order items" ON public.order_items
FOR INSERT WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.orders
        WHERE id = order_id
        AND user_id = auth.uid()
    )
);
