import React, { useState, createElement } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Search, ArrowLeft, Package, Clock, CheckCircle, XCircle, AlertCircle, Edit as EditIcon, X, Save, Loader2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { TrackingDisplay } from '@/components/TrackingDisplay';

// Show warning if supabase is not available
if (!supabase) {
  console.warn('Supabase client is not available. Tracking features will be disabled.');
}

const trackingSchema = z.object({
  trackingId: z.string().min(1, 'Tracking ID is required'),
});

type TrackingFormData = z.infer<typeof trackingSchema>;

const editSchema = z.object({
  customerName: z.string().min(2, "Name must be at least 2 characters"),
  whatsapp: z.string().regex(/^\+?[1-9]\d{1,14}$/, "Invalid phone number format"),
  customerAddress: z.string().optional(),
  storeName: z.string().min(2, "Store name must be at least 2 characters"),
  storeLocation: z.string().min(5, "Location must be at least 5 characters"),
  productDetails: z.string().min(10, "Product details must be at least 10 characters"),
});

type EditFormData = z.infer<typeof editSchema>;

const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline"; icon: React.ElementType }> = {
  pending: { label: "Pending", variant: "outline", icon: Clock },
  assigned: { label: "Assigned", variant: "secondary", icon: AlertCircle },
  in_progress: { label: "In Progress", variant: "default", icon: Package },
  completed: { label: "Completed", variant: "default", icon: CheckCircle },
  cancelled: { label: "Cancelled", variant: "destructive", icon: XCircle },
};

const serviceTierLabels: Record<string, string> = {
  inspection: "Inspection Only",
  "inspection-payment": "Inspection + Payment",
  "full-service": "Full Service",
  goods: "Goods & Items",
  vehicle: "Vehicles & Machinery",
  property: "Land & Property",
  documents: "Documents & Ownership Papers",
};

interface RequestData {
  id: string;
  customer_name: string;
  store_name: string;
  store_location: string;
  product_details: string;
  service_tier: string;
  service_fee: number | null;
  status: string;
  assigned_agent_id: string | null;
  created_at: string;
  payment_received: boolean | null;
  payment_method: string | null;
  receipt_number: string | null;
  whatsapp: string;
  customer_address: string | null;
  tracking_id: string;
}

export default function TrackOrder() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [request, setRequest] = useState<RequestData | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  const {
    register: registerTracking,
    handleSubmit: handleTrackingSubmit,
    formState: { errors: trackingErrors },
    reset: resetTracking,
  } = useForm<TrackingFormData>({
    resolver: zodResolver(trackingSchema),
  });

  const {
    register: registerEdit,
    handleSubmit: handleEditSubmit,
    formState: { errors: editErrors, isSubmitting },
    setValue,
    reset: resetEdit,
  } = useForm<EditFormData>({
    resolver: zodResolver(editSchema),
  });

  const onTrackingSubmit = async (data: TrackingFormData) => {
    // Skip if supabase is not available
    if (!supabase) {
      console.warn('Supabase client not available, skipping tracking');
      toast({
        title: "Error",
        description: "Tracking is not available at the moment",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const { data: requestData, error } = await supabase
        .from('inspection_requests')
        .select('id, customer_name, store_name, store_location, product_details, service_tier, service_fee, status, assigned_agent_id, created_at, payment_received, payment_method, receipt_number, whatsapp, customer_address, tracking_id')
        .eq('tracking_id', data.trackingId.toUpperCase())
        .single();

      if (error || !requestData || (Array.isArray(requestData) && requestData.length === 0)) {
        toast({
          title: "Not Found",
          description: "No request found with this tracking ID.",
          variant: "destructive",
        });
        return;
      }

      setRequest(Array.isArray(requestData) ? requestData[0] : requestData);
      resetTracking();
    } catch (error) {
      console.error('Error tracking request:', error);
      toast({
        title: "Error",
        description: "Failed to track request. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const onEditSubmit = async (data: EditFormData) => {
    if (!request) return;

    // Skip if supabase is not available
    if (!supabase) {
      console.warn('Supabase client not available, skipping edit');
      toast({
        title: "Error",
        description: "Editing is not available at the moment",
        variant: "destructive",
      });
      return;
    }

    try {
      const { data: result, error } = await supabase
        .from('inspection_requests')
        .update({
          customer_name: data.customerName,
          whatsapp: data.whatsapp,
          customer_address: data.customerAddress || null,
          store_name: data.storeName,
          store_location: data.storeLocation,
          product_details: data.productDetails,
        })
        .eq('tracking_id', request.tracking_id)
        .select()
        .single();

      if (error || !result) throw error;

      // Update local state
      setRequest({
        ...request,
        customer_name: data.customerName,
        whatsapp: data.whatsapp,
        customer_address: data.customerAddress || null,
        store_name: data.storeName,
        store_location: data.storeLocation,
        product_details: data.productDetails,
      });

      setIsEditing(false);
      toast({
        title: "Updated",
        description: "Your request has been updated successfully.",
      });
    } catch (error) {
      console.error('Error updating request:', error);
      toast({
        title: "Error",
        description: "Failed to update request. Please try again.",
        variant: "destructive",
      });
    }
  };

  const cancelRequest = async () => {
    if (!request) return;

    // Skip if supabase is not available
    if (!supabase) {
      console.warn('Supabase client not available, skipping cancel');
      toast({
        title: "Error",
        description: "Cancellation is not available at the moment",
        variant: "destructive",
      });
      return;
    }

    try {
      const { data: result, error } = await supabase
        .from('inspection_requests')
        .update({ status: 'cancelled' })
        .eq('tracking_id', request.tracking_id)
        .select()
        .single();

      if (error || !result) throw error;

      setRequest({ ...request, status: 'cancelled' });
      toast({
        title: "Request Cancelled",
        description: "Your request has been cancelled.",
      });
    } catch (error) {
      console.error('Error cancelling request:', error);
      toast({
        title: "Error",
        description: "Failed to cancel request. Please try again.",
        variant: "destructive",
      });
    }
  };

  const startEdit = () => {
    if (!request) return;

    setValue('customerName', request.customer_name);
    setValue('whatsapp', request.whatsapp);
    setValue('customerAddress', request.customer_address || '');
    setValue('storeName', request.store_name);
    setValue('storeLocation', request.store_location);
    setValue('productDetails', request.product_details);
    setIsEditing(true);
  };

  const canEditOrCancel = request && !['completed', 'cancelled'].includes(request.status);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <span className="font-bold text-xl">Track Your Order</span>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-2xl">
        {/* Tracking Display - show when we have a request */}
        {request && <TrackingDisplay trackingId={request.tracking_id} />}
        
        {!request ? (
          /* Tracking Form */
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <div className="w-16 h-16 rounded-2xl bg-accent flex items-center justify-center mx-auto mb-6">
              <Search className="w-8 h-8 text-primary" />
            </div>
            <h1 className="text-3xl font-bold text-foreground mb-4">Track Your Inspection Request</h1>
            <p className="text-muted-foreground mb-8">
              Enter your tracking ID to view the status and details of your inspection request.
            </p>

            <Card className="max-w-md mx-auto">
              <CardHeader>
                <CardTitle>Enter Tracking ID</CardTitle>
                <CardDescription>
                  Your tracking ID was provided after submitting your request.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleTrackingSubmit(onTrackingSubmit)} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="trackingId">Tracking ID</Label>
                    <Input
                      id="trackingId"
                      placeholder="STZ-1234567890-ABCDE"
                      {...registerTracking('trackingId')}
                      className="text-center font-mono"
                    />
                    {trackingErrors.trackingId && (
                      <p className="text-sm text-red-600">{trackingErrors.trackingId.message}</p>
                    )}
                  </div>
                  <Button 
                    type="submit" 
                    className="w-full"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Tracking...
                      </>
                    ) : (
                      <>
                        <Search className="mr-2 h-4 w-4" />
                        Track Request
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </motion.div>
        ) : isEditing ? (
          /* Edit Form */
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div className="flex items-center justify-between">
              <h1 className="text-2xl font-bold text-foreground">Edit Request</h1>
              <Button variant="ghost" size="icon" onClick={() => setIsEditing(false)}>
                <X className="w-5 h-5" />
              </Button>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Edit Request Details</CardTitle>
                <CardDescription>
                  Update your inspection request information
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleEditSubmit(onEditSubmit)} className="space-y-6">
                  {/* Customer Information */}
                  <div className="space-y-4">
                    <h3 className="font-semibold text-foreground">Customer Information</h3>
                    <div className="space-y-2">
                      <Label htmlFor="customerName">Full Name</Label>
                      <Input
                        id="customerName"
                        placeholder="John Doe"
                        {...registerEdit("customerName")}
                      />
                      {editErrors.customerName && (
                        <p className="text-sm text-red-600">{editErrors.customerName.message}</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="whatsapp">WhatsApp Number</Label>
                      <Input
                        id="whatsapp"
                        placeholder="+265 999 123 456"
                        {...registerEdit("whatsapp")}
                      />
                      {editErrors.whatsapp && (
                        <p className="text-sm text-red-600">{editErrors.whatsapp.message}</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="customerAddress">Delivery Address (Optional)</Label>
                      <Input
                        id="customerAddress"
                        placeholder="House number, street, city"
                        {...registerEdit("customerAddress")}
                      />
                    </div>
                  </div>

                  {/* Store Information */}
                  <div className="space-y-4 pt-4 border-t border-border">
                    <h3 className="font-semibold text-foreground">Store Information</h3>
                    <div className="space-y-2">
                      <Label htmlFor="storeName">Store Name</Label>
                      <Input
                        id="storeName"
                        placeholder="e.g., Samsung Store, Hi-Fi Centre"
                        {...registerEdit("storeName")}
                      />
                      {editErrors.storeName && (
                        <p className="text-sm text-red-600">{editErrors.storeName.message}</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="storeLocation">Store Location</Label>
                      <Input
                        id="storeLocation"
                        placeholder="City, Area, Landmark"
                        {...registerEdit("storeLocation")}
                      />
                      {editErrors.storeLocation && (
                        <p className="text-sm text-red-600">{editErrors.storeLocation.message}</p>
                      )}
                    </div>
                  </div>

                  {/* Product Details */}
                  <div className="space-y-4 pt-4 border-t border-border">
                    <h3 className="font-semibold text-foreground">Product Details</h3>
                    <div className="space-y-2">
                      <Label htmlFor="productDetails">Product Description</Label>
                      <Textarea
                        id="productDetails"
                        placeholder="Describe the product, including model, color, specifications, expected price, etc."
                        className="min-h-[120px]"
                        {...registerEdit("productDetails")}
                      />
                      {editErrors.productDetails && (
                        <p className="text-sm text-red-600">{editErrors.productDetails.message}</p>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <Button 
                      type="submit" 
                      className="flex-1"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className="mr-2 h-4 w-4" />
                          Save Changes
                        </>
                      )}
                    </Button>
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => setIsEditing(false)}
                      disabled={isSubmitting}
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </motion.div>
        ) : (
          /* Request Details */
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <Button variant="ghost" size="icon" onClick={() => setRequest(null)} className="mb-2">
                  <ArrowLeft className="w-4 h-4" />
                </Button>
                <h1 className="text-2xl font-bold text-foreground">Request Details</h1>
                <p className="text-muted-foreground">
                  Tracking ID: <span className="font-mono">{request.tracking_id}</span>
                </p>
              </div>
              {canEditOrCancel && (
                <div className="flex gap-2">
                  <Button variant="outline" onClick={startEdit}>
                    <EditIcon className="w-4 h-4 mr-2" />
                    Edit
                  </Button>
                  <Button variant="destructive" onClick={cancelRequest}>
                    <X className="w-4 h-4 mr-2" />
                    Cancel
                  </Button>
                </div>
              )}
            </div>

            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Package className="w-5 h-5" />
                    {request.store_name}
                  </CardTitle>
                  <Badge variant={statusConfig[request.status]?.variant || "outline"} className="text-sm">
                    {statusConfig[request.status]?.icon && 
                      createElement(statusConfig[request.status].icon, { className: "w-3 h-3 mr-1" })
                    }
                    {statusConfig[request.status]?.label || request.status}
                  </Badge>
                </div>
                <CardDescription>
                  Submitted on {new Date(request.created_at).toLocaleDateString()}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Customer Information */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-foreground border-b pb-2">Customer Information</h3>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">Name</p>
                      <p className="font-medium">{request.customer_name}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">WhatsApp</p>
                      <p className="font-medium">{request.whatsapp}</p>
                    </div>
                    {request.customer_address && (
                      <div className="space-y-1 md:col-span-2">
                        <p className="text-sm text-muted-foreground">Address</p>
                        <p className="font-medium">{request.customer_address}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Store Information */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-foreground border-b pb-2">Store Information</h3>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">Store Name</p>
                      <p className="font-medium">{request.store_name}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">Location</p>
                      <p className="font-medium">{request.store_location}</p>
                    </div>
                  </div>
                </div>

                {/* Product Details */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-foreground border-b pb-2">Product Details</h3>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Description</p>
                    <p className="font-medium whitespace-pre-wrap">{request.product_details}</p>
                  </div>
                </div>

                {/* Service Information */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-foreground border-b pb-2">Service Information</h3>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">Service Type</p>
                      <p className="font-medium">{serviceTierLabels[request.service_tier] || request.service_tier}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">Service Fee</p>
                      <p className="font-medium">MWK {request.service_fee?.toLocaleString() || '0'}</p>
                    </div>
                    {request.payment_method && (
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">Payment Method</p>
                        <p className="font-medium capitalize">{request.payment_method}</p>
                      </div>
                    )}
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">Payment Status</p>
                      <p className="font-medium">
                        {request.payment_received ? (
                          <span className="text-green-600">Received</span>
                        ) : (
                          <span className="text-yellow-600">Pending</span>
                        )}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Receipt Information */}
                {request.receipt_number && (
                  <div className="space-y-4">
                    <h3 className="font-semibold text-foreground border-b pb-2">Receipt Information</h3>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">Receipt Number</p>
                        <p className="font-medium font-mono">{request.receipt_number}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">Receipt Uploaded</p>
                        <p className="font-medium">
                          {request.receipt_uploaded_at 
                            ? new Date(request.receipt_uploaded_at).toLocaleDateString()
                            : 'Not uploaded'}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}
      </main>
    </div>
  );
}