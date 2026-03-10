import React, { useCallback, useEffect, useState } from "react";
import { useOrganization } from "@/contexts/OrganizationContext";
import { AppLayout, PageContainer } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

const WHATSAPP_EMBEDDED_SIGNUP_URL = import.meta.env
  .VITE_META_BUSINESS_PARTNER_LINK;

const META_SIGNUP_ORIGINS = new Set([
  "https://www.facebook.com",
  "https://web.facebook.com",
  "https://business.facebook.com",
]);

export default function ConnectWhatsApp() {
  const { toast } = useToast();
  const { refreshWhatsAppNumbers } = useOrganization();

  const [popup, setPopup] = useState<Window | null>(null);
  const [loading, setLoading] = useState(false);
  const [connected, setConnected] = useState(false);
  const [loadingConnection, setLoadingConnection] = useState(true);

  const [accountData, setAccountData] = useState({
    businessId: "",
    wabaId: "",
    numbers: [] as any[],
    status: "",
  });

  /*
  =============================
  LOAD EXISTING CONNECTION
  =============================
  */

  const loadExistingConnection = useCallback(async () => {
    try {
      const result = await api.organization.getWhatsAppConnection();

      if (!result?.organization?.whatsappBusinessAccountId) {
        setConnected(false);
        return;
      }

      setConnected(true);

      setAccountData({
        businessId: result.organization.businessId || "",
        wabaId: result.organization.whatsappBusinessAccountId,
        numbers: result.numbers || [],
        status: result.organization.whatsappStatus || "CONNECTED",
      });
    } catch {
      setConnected(false);
    } finally {
      setLoadingConnection(false);
    }
  }, []);

  useEffect(() => {
    loadExistingConnection();
  }, [loadExistingConnection]);

  /*
  =============================
  START EMBEDDED SIGNUP
  =============================
  */

  const startOnboarding = () => {
    if (!WHATSAPP_EMBEDDED_SIGNUP_URL) {
      toast({
        title: "Missing Meta signup link",
        description:
          "Set VITE_META_BUSINESS_PARTNER_LINK in your frontend .env",
        variant: "destructive",
      });
      return;
    }

    const width = 600;
    const height = 700;

    const left = window.screen.width / 2 - width / 2;
    const top = window.screen.height / 2 - height / 2;

    const newPopup = window.open(
      WHATSAPP_EMBEDDED_SIGNUP_URL,
      "WhatsAppSignup",
      `width=${width},height=${height},top=${top},left=${left}`,
    );

    if (!newPopup) {
      toast({
        title: "Popup blocked",
        description: "Allow popups and try again.",
        variant: "destructive",
      });
      return;
    }

    setPopup(newPopup);
    setLoading(true);
  };

  /*
  =============================
  LISTEN FOR META SUCCESS
  =============================
  */

  useEffect(() => {
    const handleMessage = async (event: MessageEvent) => {
      if (!META_SIGNUP_ORIGINS.has(event.origin)) return;

      const data =
        typeof event.data === "string"
          ? JSON.parse(event.data)
          : event.data || {};

      if (data.type !== "WA_EMBEDDED_SIGNUP") return;
      if (String(data.event).toUpperCase() !== "FINISH") return;

      const payload = data.data || data;

      const wabaId = payload.waba_id;
      const code = payload.code;
      const phoneNumberId = payload.phone_number_id;

      if (!wabaId || !code) {
        toast({
          title: "Signup failed",
          description: "Missing data returned from Meta",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      try {
        const result = await api.organization.connectWhatsAppBusiness({
          code,
          wabaId,
          phoneNumberId,
        });

        if (popup && !popup.closed) popup.close();

        await refreshWhatsAppNumbers().catch(() => {});

        setConnected(true);

        setAccountData({
          businessId: result.organization?.businessId || "",
          wabaId: result.organization?.whatsappBusinessAccountId || "",
          numbers: result.numbers || [],
          status: result.organization?.whatsappStatus || "CONNECTED",
        });

        toast({
          title: "WhatsApp connected successfully",
        });
      } catch (err: any) {
        toast({
          title: "Connection failed",
          description: err?.message || "Unknown error",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    window.addEventListener("message", handleMessage);

    return () => window.removeEventListener("message", handleMessage);
  }, [popup, refreshWhatsAppNumbers, toast]);

  if (loadingConnection) {
    return (
      <AppLayout>
        <PageContainer>
          <p>Loading WhatsApp connection...</p>
        </PageContainer>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <PageContainer>
        {!connected && (
          <div className="space-y-6">
            <h1 className="text-2xl font-semibold">Connect WhatsApp</h1>

            <Button
              onClick={startOnboarding}
              disabled={loading}
              className="bg-green-600 text-white"
            >
              {loading ? "Opening..." : "Start Onboarding"}
            </Button>
          </div>
        )}

        {connected && (
          <div className="space-y-6">
            <h1 className="text-2xl font-semibold">WhatsApp Connected</h1>

            <div className="border rounded p-4 space-y-2">
              <p>
                <b>Business ID:</b> {accountData.businessId}
              </p>

              <p>
                <b>WABA ID:</b> {accountData.wabaId}
              </p>

              <p>
                <b>Status:</b> {accountData.status}
              </p>
            </div>

            <div className="border rounded p-4 space-y-3">
              <h3>Phone Numbers</h3>

              {accountData.numbers.map((num: any) => (
                <div
                  key={num.id}
                  className="border rounded p-3 flex justify-between"
                >
                  <div>
                    <p>{num.displayName}</p>
                    <p className="text-sm text-muted-foreground">
                      {num.phoneNumber}
                    </p>
                  </div>

                  {num.isPrimary && (
                    <span className="text-xs bg-green-100 px-2 py-1 rounded">
                      Primary
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </PageContainer>
    </AppLayout>
  );
}
