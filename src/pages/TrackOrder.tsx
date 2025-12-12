import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Search, ArrowLeft, Package, Clock, CheckCircle, XCircle, AlertCircle, Edit, X, Save } from 'lucide-react';
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
  productDetails: z.string().min(10, "Please provide more details about the product"),
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
};

export default function TrackOrder() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [request, setRequest] = useState<any>(null);
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
    setIsLoading(true);
    try {
      const { data: requestData, error } = await supabase
        .rpc('track_order_by_id', { tracking_id_param: data.trackingId.toUpperCase() });

      if (error || !requestData || requestData.length === 0) {
        toast({
          title: "Not Found",
          description: "No request found with this tracking ID.",
          variant: "destructive",
        });
        return;
      }

      setRequest(requestData[0]);
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

    try {
      const { data: result, error } = await supabase
        .rpc('update_tracked_order', {
          tracking_id_param: request.tracking_id,
          customer_name_param: data.customerName,
          whatsapp_param: data.whatsapp,
          customer_address_param: data.customerAddress || null,
          store_name_param: data.storeName,
          store_location_param: data.storeLocation,
          product_details_param: data.productDetails,
        });

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

    try {
      const { data: result, error } = await supabase
        .rpc('cancel_tracked_order', { tracking_id_param: request.tracking_id });

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
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? 'Searching...' : 'Track Request'}
                  </Button>
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
            <div className="text-center">
              <h1 className="text-3xl font-bold text-foreground mb-2">Request Details</h1>
              <p className="text-muted-foreground">Tracking ID: <span className="font-mono font-semibold">{request.tracking_id}</span></p>
            </div>

            {/* Status Card */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Package className="w-5 h-5" />
                      Request Status
                    </CardTitle>
                    <CardDescription>Current status of your inspection request</CardDescription>
                  </div>
                  <Badge variant={statusConfig[request.status]?.variant || 'outline'} className="gap-1">
                    {(() => {
                      const StatusIcon = statusConfig[request.status]?.icon;
                      return StatusIcon ? <StatusIcon className="w-3 h-3" /> : null;
                    })()}
                    {statusConfig[request.status]?.label || request.status}
                  </Badge>
                </div>
              </CardHeader>
            </Card>

            {/* Request Details */}
            {!isEditing ? (
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Request Information</CardTitle>
                    {canEditOrCancel && (
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={startEdit}>
                          <Edit className="w-4 h-4 mr-2" />
                          Edit
                        </Button>
                        <Button variant="destructive" size="sm" onClick={cancelRequest}>
                          <X className="w-4 h-4 mr-2" />
                          Cancel
                        </Button>
                      </div>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium">Customer Name</Label>
                      <p className="text-foreground">{request.customer_name}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">WhatsApp</Label>
                      <p className="text-foreground">{request.whatsapp}</p>
                    </div>
                  </div>

                  <div>
                    <Label className="text-sm font-medium">Address</Label>
                    <p className="text-foreground">{request.customer_address || 'Not provided'}</p>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium">Store Name</Label>
                      <p className="text-foreground">{request.store_name}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Store Location</Label>
                      <p className="text-foreground">{request.store_location}</p>
                    </div>
                  </div>

                  <div>
                    <Label className="text-sm font-medium">Service Type</Label>
                    <p className="text-foreground">{serviceTierLabels[request.service_tier] || request.service_tier}</p>
                  </div>

                  <div>
                    <Label className="text-sm font-medium">Product Details</Label>
                    <p className="text-foreground">{request.product_details}</p>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium">Service Fee</Label>
                      <p className="text-foreground font-semibold">MWK {request.service_fee.toLocaleString()}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Submitted</Label>
                      <p className="text-foreground">{new Date(request.created_at).toLocaleDateString()}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : (
              /* Edit Form */
              <Card>
                <CardHeader>
                  <CardTitle>Edit Request</CardTitle>
                  <CardDescription>Update your request information</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleEditSubmit(onEditSubmit)} className="space-y-4">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="customerName">Full Name</Label>
                        <Input
                          id="customerName"
                          {...registerEdit('customerName')}
                        />
                        {editErrors.customerName && (
                          <p className="text-sm text-red-600">{editErrors.customerName.message}</p>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="whatsapp">WhatsApp Number</Label>
                        <Input
                          id="whatsapp"
                          {...registerEdit('whatsapp')}
                        />
                        {editErrors.whatsapp && (
                          <p className="text-sm text-red-600">{editErrors.whatsapp.message}</p>
                        )}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="customerAddress">Your Address (for delivery)</Label>
                      <Textarea
                        id="customerAddress"
                        {...registerEdit('customerAddress')}
                      />
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="storeName">Store/Seller Name</Label>
                        <Input
                          id="storeName"
                          {...registerEdit('storeName')}
                        />
                        {editErrors.storeName && (
                          <p className="text-sm text-red-600">{editErrors.storeName.message}</p>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="storeLocation">Store Location</Label>
                        <Input
                          id="storeLocation"
                          {...registerEdit('storeLocation')}
                        />
                        {editErrors.storeLocation && (
                          <p className="text-sm text-red-600">{editErrors.storeLocation.message}</p>
                        )}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="productDetails">Product Details</Label>
                      <Textarea
                        id="productDetails"
                        {...registerEdit('productDetails')}
                      />
                      {editErrors.productDetails && (
                        <p className="text-sm text-red-600">{editErrors.productDetails.message}</p>
                      )}
                    </div>

                    <div className="flex gap-2 pt-4">
                      <Button type="submit" disabled={isSubmitting}>
                        {isSubmitting ? 'Saving...' : <><Save className="w-4 h-4 mr-2" />Save Changes</>}
                      </Button>
                      <Button type="button" variant="outline" onClick={() => setIsEditing(false)}>
                        <X className="w-4 h-4 mr-2" />
                        Cancel
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            )}

            {/* Track Another Button */}
            <div className="text-center">
              <Button variant="outline" onClick={() => setRequest(null)}>
                Track Another Request
              </Button>
            </div>
          </motion.div>
        )}
      </main>
    </div>
  );
}