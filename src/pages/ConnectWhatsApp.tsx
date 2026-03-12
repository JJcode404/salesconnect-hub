import React, { useCallback, useEffect, useRef, useState } from "react";
import { useOrganization } from "@/contexts/OrganizationContext";
import { AppLayout, PageContainer } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

const META_APP_ID = import.meta.env.VITE_META_APP_ID;
const META_CONFIG_ID = import.meta.env.VITE_META_EMBEDDED_SIGNUP_CONFIG_ID;

const META_SIGNUP_ORIGINS = new Set([
  "https://www.facebook.com",
  "https://web.facebook.com",
  "https://business.facebook.com",
]);

const SIGNUP_TIMEOUT = 1000 * 60 * 3;

export default function ConnectWhatsApp() {
  const { toast } = useToast();
  const { refreshWhatsAppNumbers } = useOrganization();

  const signupTimer = useRef(null);
  const retryCount = useRef(0);

  const [loading, setLoading] = useState(false);
  const [sdkLoaded, setSdkLoaded] = useState(false);
  const [connected, setConnected] = useState(false);
  const [loadingConnection, setLoadingConnection] = useState(true);

  const [accountData, setAccountData] = useState({
    businessId: "",
    wabaId: "",
    numbers: [],
    status: "",
  });

  /*
  ====================================
  LOAD EXISTING CONNECTION
  ====================================
  */

  const loadExistingConnection = useCallback(async () => {
    console.log("Loading WhatsApp connection");

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
    } catch (err) {
      console.error("Failed loading connection", err);
      setConnected(false);
    } finally {
      setLoadingConnection(false);
    }
  }, []);

  useEffect(() => {
    loadExistingConnection();
  }, [loadExistingConnection]);

  /*
  ====================================
  META SDK LOADER
  ====================================
  */

  useEffect(() => {
    if (window.FB) {
      setSdkLoaded(true);
      return;
    }

    console.log("Opening  Setup");

    const script = document.createElement("script");
    script.src = "https://connect.facebook.net/en_US/sdk.js";
    script.async = true;
    script.defer = true;

    document.body.appendChild(script);

    script.onload = () => {
      console.log("Meta SDK loaded");

      window.FB.init({
        appId: META_APP_ID,
        cookie: true,
        xfbml: false,
        version: "v24.0",
      });

      setSdkLoaded(true);
    };
  }, []);

  /*
  ====================================
  START EMBEDDED SIGNUP
  ====================================
  */

  const startOnboarding = () => {
    if (!sdkLoaded) {
      toast({
        title: "Loading Setup",
        description: "Please wait a moment",
        variant: "destructive",
      });
      return;
    }

    console.log("Starting WhatsApp Embedded Signup");

    setLoading(true);

    signupTimer.current = setTimeout(() => {
      console.warn("Signup timeout");

      setLoading(false);

      toast({
        title: "Signup timeout",
        description: "Please try again",
        variant: "destructive",
      });
    }, SIGNUP_TIMEOUT);

    window.FB.login(
      function (response) {
        console.log("FB.login response", response);

        if (!response.authResponse) {
          console.warn("User cancelled login");

          setLoading(false);

          return;
        }

        const code = response.authResponse.code;

        if (!code) {
          console.error("Authorization code missing");
          setLoading(false);
        }
      },
      {
        config_id: META_CONFIG_ID,
        response_type: "code",
        override_default_response_type: true,
        scope:
          "whatsapp_business_management,whatsapp_business_messaging,business_management",
        extras: {
          setup: {},
        },
      },
    );
  };

  /*
  ====================================
  signup response message  from meta listener
  ====================================
  */

  useEffect(() => {
    const handleMessage = async (event) => {
      console.log("Meta message event:", event);

      if (!META_SIGNUP_ORIGINS.has(event.origin)) {
        console.warn("Ignored origin:", event.origin);
        return;
      }

      let data = event.data;

      if (typeof data === "string") {
        try {
          data = JSON.parse(data);
        } catch {
          return;
        }
      }

      if (!data || data.type !== "WA_EMBEDDED_SIGNUP") {
        return;
      }

      console.log("Embedded signup event:", data);

      if (String(data.event).toUpperCase() !== "FINISH") {
        console.log("Signup not finished");
        return;
      }

      clearTimeout(signupTimer.current);

      const payload = data.data || {};

      const wabaId = payload.waba_id;
      const phoneNumberId = payload.phone_number_id;
      const code =
        payload.authorization_code || payload.code || payload.auth_code;

      console.log("Extracted payload:", {
        wabaId,
        phoneNumberId,
        code,
      });

      if (!code || !wabaId) {
        toast({
          title: "Signup failed",
          description: "Missing authorization code",
          variant: "destructive",
        });

        setLoading(false);
        return;
      }

      /*
      ====================================
     User signed up successfully..so we send data to backend
      ====================================
      */

      try {
        console.log("Sending signup data to backend");

        const result = await api.organization.connectWhatsAppBusiness({
          code,
          wabaId,
          phoneNumberId,
        });

        console.log("Backend result", result);

        await refreshWhatsAppNumbers();

        setConnected(true);

        setAccountData({
          businessId: result.data.organization.businessId || "",
          wabaId: result.data.organization.whatsappBusinessAccountId || "",
          numbers: result.data.numbers || [],
          status: result.data.organization.whatsappStatus || "CONNECTED",
        });

        toast({
          title: "WhatsApp connected successfully",
        });
      } catch (err) {
        console.error("Connection error", err);

        if (retryCount.current < 2) {
          retryCount.current += 1;

          console.warn("Retrying backend request");

          return handleMessage(event);
        }

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

    return () => {
      window.removeEventListener("message", handleMessage);
    };
  }, [refreshWhatsAppNumbers, toast]);

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
              disabled={loading || !sdkLoaded}
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

              {accountData.numbers.map((num) => (
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

            <Button
              onClick={() => {
                setConnected(false);
                startOnboarding();
              }}
            >
              Reconnect WhatsApp
            </Button>
          </div>
        )}
      </PageContainer>
    </AppLayout>
  );
}
