-- Create RPC function for anonymous order tracking
-- This allows anonymous users to track orders by tracking_id without compromising security

CREATE OR REPLACE FUNCTION public.track_order_by_id(tracking_id_param TEXT)
RETURNS TABLE (
  id UUID,
  customer_name TEXT,
  whatsapp TEXT,
  customer_address TEXT,
  store_name TEXT,
  store_location TEXT,
  product_details TEXT,
  service_tier TEXT,
  service_fee NUMERIC,
  status request_status,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  tracking_id TEXT,
  receipt_url TEXT,
  payment_received BOOLEAN,
  payment_method TEXT,
  receipt_number TEXT
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    ir.id,
    ir.customer_name,
    ir.whatsapp,
    ir.customer_address,
    ir.store_name,
    ir.store_location,
    ir.product_details,
    ir.service_tier,
    ir.service_fee,
    ir.status,
    ir.created_at,
    ir.updated_at,
    ir.tracking_id,
    ir.receipt_url,
    ir.payment_received,
    ir.payment_method,
    ir.receipt_number
  FROM public.inspection_requests ir
  WHERE ir.tracking_id = tracking_id_param;
$$;

-- Create RPC function for anonymous order updates
CREATE OR REPLACE FUNCTION public.update_tracked_order(
  tracking_id_param TEXT,
  customer_name_param TEXT DEFAULT NULL,
  whatsapp_param TEXT DEFAULT NULL,
  customer_address_param TEXT DEFAULT NULL,
  store_name_param TEXT DEFAULT NULL,
  store_location_param TEXT DEFAULT NULL,
  product_details_param TEXT DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE public.inspection_requests
  SET
    customer_name = COALESCE(customer_name_param, customer_name),
    whatsapp = COALESCE(whatsapp_param, whatsapp),
    customer_address = COALESCE(customer_address_param, customer_address),
    store_name = COALESCE(store_name_param, store_name),
    store_location = COALESCE(store_location_param, store_location),
    product_details = COALESCE(product_details_param, product_details),
    updated_at = NOW()
  WHERE tracking_id = tracking_id_param
    AND status NOT IN ('completed', 'cancelled')
  RETURNING TRUE;
$$;

-- Create RPC function for cancelling tracked orders
CREATE OR REPLACE FUNCTION public.cancel_tracked_order(tracking_id_param TEXT)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE public.inspection_requests
  SET status = 'cancelled', updated_at = NOW()
  WHERE tracking_id = tracking_id_param
    AND status NOT IN ('completed', 'cancelled')
  RETURNING TRUE;
$$;