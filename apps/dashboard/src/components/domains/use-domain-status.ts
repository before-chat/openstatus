import type { DomainVerificationStatusProps } from "@openstatus/api/src/router/domain";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useCallback } from "react";

import type { StepCardVariant } from "@/components/forms/step-card";
import { useDeploymentConfig } from "@/lib/deployment-context";
import { useTRPC } from "@/lib/trpc/client";

export function useDomainStatus(domain?: string) {
  const trpc = useTRPC();
  const { customDomainCnameTarget, vercelDomainsConfigured } =
    useDeploymentConfig();
  const enabled = vercelDomainsConfigured && Boolean(domain);
  const {
    data: domainJson,
    refetch: refetchDomain,
    isLoading: isLoadingDomain,
    isRefetching: isRefetchingDomain,
  } = useQuery(
    trpc.domain.getDomainResponse.queryOptions({ domain }, { enabled }),
  );
  const {
    data: configJson,
    refetch: refetchConfig,
    isError: isConfigError,
    isLoading: isLoadingConfig,
    isRefetching: isRefetchingConfig,
  } = useQuery(
    trpc.domain.getConfigResponse.queryOptions({ domain }, { enabled }),
  );
  const {
    data: verificationJson,
    refetch: refetchVerification,
    isLoading: isLoadingVerification,
    isRefetching: isRefetchingVerification,
  } = useQuery(
    trpc.domain.verifyDomain.queryOptions(
      { domain },
      { enabled: enabled && !domainJson?.verified },
    ),
  );
  const {
    data: selfHostedStatus,
    refetch: refetchSelfHostedStatus,
    isFetching: isFetchingSelfHostedStatus,
  } = useQuery({
    queryKey: ["self-hosted-custom-domain-status", domain],
    queryFn: async () => {
      const response = await fetch(
        `https://${customDomainCnameTarget}/api/domain-check?domain=${encodeURIComponent(domain ?? "")}`,
        { cache: "no-store" },
      );

      const result: unknown = await response.json();
      const matchesDomain =
        typeof result === "object" &&
        result !== null &&
        "domain" in result &&
        result.domain === domain?.toLowerCase();

      return {
        configured:
          matchesDomain && "configured" in result && result.configured === true,
        dns: matchesDomain && "dns" in result && result.dns === true,
      };
    },
    enabled:
      !vercelDomainsConfigured &&
      Boolean(customDomainCnameTarget) &&
      Boolean(domain),
    retry: false,
    refetchOnWindowFocus: false,
  });
  const selfHostedDnsReady =
    selfHostedStatus?.configured === true && selfHostedStatus.dns === true;
  const {
    data: selfHostedHttpsReady,
    refetch: refetchSelfHostedHttps,
    isFetching: isFetchingSelfHostedHttps,
  } = useQuery({
    queryKey: ["self-hosted-custom-domain-https", domain],
    queryFn: async () => {
      try {
        const response = await fetch(`https://${domain}/api/domain-check`, {
          cache: "no-store",
          signal: AbortSignal.timeout(10_000),
        });
        if (!response.ok) return false;

        const result: unknown = await response.json();
        return (
          typeof result === "object" &&
          result !== null &&
          "configured" in result &&
          result.configured === true &&
          "domain" in result &&
          result.domain === domain?.toLowerCase()
        );
      } catch {
        return false;
      }
    },
    enabled: !vercelDomainsConfigured && selfHostedDnsReady && Boolean(domain),
    retry: false,
    refetchOnWindowFocus: false,
  });

  const dnsReady =
    !!domainJson?.verified && configJson?.misconfigured === false;
  const {
    data: certificateJson,
    refetch: refetchCertificate,
    isError: isCertificateError,
    isLoading: isLoadingCertificate,
    isRefetching: isRefetchingCertificate,
  } = useQuery(
    trpc.domain.getCertificateStatus.queryOptions(
      { domain },
      { enabled: dnsReady },
    ),
  );

  const issueCertificateMutation = useMutation(
    trpc.domain.issueCertificate.mutationOptions({
      onSuccess: () => refetchCertificate(),
    }),
  );

  const refreshAll = useCallback(() => {
    if (vercelDomainsConfigured) {
      refetchDomain();
      refetchConfig();
      refetchVerification();
      if (dnsReady) refetchCertificate();
    } else {
      refetchSelfHostedStatus();
      if (selfHostedDnsReady) refetchSelfHostedHttps();
    }
  }, [
    dnsReady,
    refetchCertificate,
    refetchConfig,
    refetchDomain,
    refetchSelfHostedHttps,
    refetchSelfHostedStatus,
    refetchVerification,
    selfHostedDnsReady,
    vercelDomainsConfigured,
  ]);

  let status: DomainVerificationStatusProps = "Valid Configuration";

  if (domainJson?.error?.code === "not_found") {
    // domain not found on Vercel project
    status = "Domain Not Found";

    // unknown error
  } else if (domainJson?.error) {
    status = "Unknown Error";

    // if domain is not verified, we try to verify now
  } else if (!domainJson?.verified) {
    status = "Pending Verification";

    // domain was just verified
    if (verificationJson?.verified) {
      status = "Valid Configuration";
    }
  } else if (configJson?.misconfigured || isConfigError) {
    status = "Invalid Configuration";
  } else if (
    isCertificateError ||
    (certificateJson && !certificateJson.ready)
  ) {
    status = "Generating SSL Certificate";
  } else {
    status = "Valid Configuration";
  }

  const isLoading = vercelDomainsConfigured
    ? isLoadingDomain ||
      isLoadingConfig ||
      isLoadingVerification ||
      (dnsReady && isLoadingCertificate) ||
      isRefetchingDomain ||
      isRefetchingConfig ||
      isRefetchingVerification ||
      isRefetchingCertificate
    : isFetchingSelfHostedStatus || isFetchingSelfHostedHttps;

  const steps = {
    dns:
      status === "Valid Configuration" ||
      status === "Pending Verification" ||
      status === "Generating SSL Certificate"
        ? "completed"
        : "active",
    verification:
      status === "Valid Configuration" ||
      status === "Generating SSL Certificate"
        ? "completed"
        : status === "Pending Verification"
          ? "active"
          : // "Invalid Configuration" means DNS is misconfigured but ownership is verified
            status === "Invalid Configuration"
            ? "completed"
            : "upcoming",
    certificate:
      status === "Valid Configuration"
        ? "completed"
        : status === "Generating SSL Certificate"
          ? "active"
          : "upcoming",
  } satisfies Record<string, StepCardVariant>;

  return {
    canRefresh:
      vercelDomainsConfigured || Boolean(customDomainCnameTarget && domain),
    managed: vercelDomainsConfigured,
    selfHostedDnsReady,
    selfHostedHttpsReady: selfHostedHttpsReady === true,
    selfHostedReady: selfHostedHttpsReady === true,
    status,
    domainJson,
    steps,
    refresh: refreshAll,
    issueCertificateMutation,
    isLoading,
  };
}
