
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { PayPalScriptProvider } from "@paypal/react-paypal-js";
import PaymentForm from "@/components/payment/PaymentForm";
import PaymentError from "@/components/payment/PaymentError";
import LoadingState from "@/components/payment/LoadingState";
import { usePaymentDetails } from "@/hooks/usePaymentDetails";
import { supabase } from "@/lib/supabase";

const PaymentPage = () => {
  const { userId } = useParams();
  const { details, loading, error } = usePaymentDetails(userId);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [paypalClientId, setPaypalClientId] = useState<string>("sb"); // Default to sandbox
  
  useEffect(() => {
    // Try to get the PayPal client ID from Supabase
    const fetchPayPalConfig = async () => {
      try {
        const { data, error } = await supabase.functions.invoke('get-paypal-client-id');
        if (data?.clientId && !error) {
          console.log('Using PayPal client ID from config');
          setPaypalClientId(data.clientId);
        }
      } catch (err) {
        console.warn('Could not fetch PayPal client ID, using sandbox mode', err);
        // Continue with sandbox mode if there's an error
      }
    };
    
    fetchPayPalConfig();
  }, []);
  
  console.log('Payment page rendering with:', { userId, details, loading, error, paymentError });
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-blue-50 p-4">
        <LoadingState />
      </div>
    );
  }
  
  if (error || paymentError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-blue-50 p-4">
        <PaymentError error={paymentError || error || 'Payment error'} />
      </div>
    );
  }
  
  return (
    <PayPalScriptProvider options={{ 
      clientId: paypalClientId,
      currency: "USD",
      intent: "capture"
    }}>
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-blue-50 p-4">
        <Card className="w-full max-w-lg">
          <CardHeader>
            <CardTitle>Send a Message to {details?.userName || 'User'}</CardTitle>
            <CardDescription>
              Your message will be delivered with a guaranteed response within 24 hours
            </CardDescription>
          </CardHeader>
          <CardContent>
            {details && userId && (
              <PaymentForm 
                userId={userId} 
                price={details.price} 
                onSuccess={() => window.location.href = '/payment-success'} 
                onError={(message) => setPaymentError(message)}
              />
            )}
          </CardContent>
        </Card>
      </div>
    </PayPalScriptProvider>
  );
};

export default PaymentPage;
