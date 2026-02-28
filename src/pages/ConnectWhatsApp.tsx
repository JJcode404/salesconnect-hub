import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AppLayout, PageContainer } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import { useOrganization } from "@/contexts/OrganizationContext";
import { useToast } from "@/hooks/use-toast";

export default function ConnectWhatsApp() {
  const { refreshWhatsAppNumbers } = useOrganization();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [businessId, setBusinessId] = useState<string | null>(null);
  const [wabaId, setWabaId] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const base = (import.meta.env.VITE_API_URL || "http://localhost:3000")
          .replace(/\/$/, "");
        const headers: HeadersInit = {
          Accept: "application/json",
        };

        if (/https?:\/\/[^/]*ngrok/i.test(base)) {
          (headers as Record<string, string>)["ngrok-skip-browser-warning"] =
            "true";
        }

        const resp = await fetch(`${base}/config`, { headers });
        if (!resp.ok) return;
        const contentType = resp.headers.get("content-type") || "";
        if (!contentType.toLowerCase().includes("application/json")) {
          const text = await resp.text().catch(() => "");
          const looksLikeHtml =
            text.trimStart().startsWith("<!DOCTYPE") ||
            text.trimStart().startsWith("<html");

          if (looksLikeHtml) {
            throw new Error(
              "Received HTML instead of JSON from /config. Check VITE_API_URL or ngrok tunnel/browser warning.",
            );
          }

          throw new Error(
            `Expected JSON from /config but got '${contentType || "unknown"}'`,
          );
        }
        const json = await resp.json();
        if (json?.businessId) setBusinessId(String(json.businessId));
      } catch (err) {
        console.error("Failed fetching /config", err);
      }
    })();
  }, []);

  const copyBusinessId = async () => {
    if (!businessId) return;
    try {
      await navigator.clipboard.writeText(businessId);
      toast({ title: "Business ID copied" });
    } catch {
      toast({ title: "Failed to copy Business ID", variant: "destructive" });
    }
  };

  const handleManualConnect = async () => {
    if (!wabaId.trim()) {
      toast({
        title: "WABA ID is required",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      await api.organization.manualConnectWhatsApp({
        wabaId: wabaId.trim(),
      });
      await refreshWhatsAppNumbers();
      toast({
        title: "WhatsApp connected successfully",
        description: "Redirecting you to the dashboard...",
      });
      navigate("/dashboard");
    } catch (err: any) {
      toast({
        title: "Manual connection failed",
        description: err?.message || "Unknown error",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AppLayout>
      <PageContainer>
        <div className="space-y-6">
          <h1 className="text-2xl font-semibold">Connect WhatsApp</h1>
          <p className="text-sm text-muted-foreground">
            Use manual partner sharing to grant access to your customer&apos;s
            WhatsApp Business Account.
          </p>

          <div className="rounded border p-4 space-y-3">
            <h3 className="font-medium">Your Business ID</h3>
            <p className="text-sm text-muted-foreground">
              Share this ID with your customer so they can add your business as
              a partner in Meta Business Settings.
            </p>
            <div className="flex gap-2 items-center">
              <code className="px-2 py-1 rounded bg-muted text-sm">
                {businessId || "Set META_BUSINESS_ID in backend .env"}
              </code>
              <Button
                onClick={copyBusinessId}
                disabled={!businessId}
                variant="outline"
              >
                Copy
              </Button>
            </div>
          </div>

          <div className="rounded border p-4 space-y-4">
            <h3 className="font-medium">Customer Manual Steps</h3>
            <ol className="list-decimal pl-5 text-sm text-muted-foreground space-y-1">
              <li>Open Meta Business Settings.</li>
              <li>Go to Accounts → WhatsApp accounts.</li>
              <li>Select their WABA and assign your Business ID as partner.</li>
              <li>Grant Manage WhatsApp account and Messaging permissions.</li>
              <li>Ensure Phone Number access is also shared.</li>
              <li>Paste WABA ID below and test.</li>
            </ol>
          </div>

          <div className="rounded border p-4 space-y-4">
            <h3 className="font-medium">Paste WABA ID</h3>
            <div className="space-y-2">
              <label className="text-sm">WABA ID</label>
              <input
                className="input w-full"
                value={wabaId}
                onChange={(e) => setWabaId(e.target.value)}
                placeholder="e.g. 123456789012345"
              />
            </div>

            <Button
              onClick={handleManualConnect}
              disabled={isLoading}
              className="bg-brand text-white"
            >
              {isLoading ? "Testing & Connecting..." : "Test Connection"}
            </Button>
          </div>
        </div>
      </PageContainer>
    </AppLayout>
  );
}
