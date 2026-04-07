import { TopNav } from '../components/layout/TopNav';
import { useConnections } from '../hooks/useConnections';
import { ServiceCard } from '../components/connections/ServiceCard';
import { Shield } from 'lucide-react';

export function Connections() {
  const { connections, isLoading, connectService, revokeService } = useConnections();

  if (isLoading) {
    return (
      <>
        <TopNav
          title="Service Connections"
          subtitle="Manage the services your AI agent can access via Token Vault"
        />
        <div className="p-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="card p-6 animate-pulse h-48" />
            ))}
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <TopNav
        title="Service Connections"
        subtitle="Manage the services your AI agent can access via Token Vault"
      />
      <div className="p-8 space-y-6">
        {/* Token Vault info banner */}
        <div className="card p-5 bg-gradient-to-r from-brand/5 to-accent/5 border-accent/20">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center shrink-0">
              <Shield className="w-5 h-5 text-accent" />
            </div>
            <div>
              <h3 className="font-semibold text-brand text-sm">Powered by Auth0 Token Vault</h3>
              <p className="text-xs text-text-muted mt-1">
                All OAuth tokens are managed exclusively by Auth0 Token Vault. The agent process never
                handles raw credentials. Tokens are fetched on-demand and can be revoked instantly.
              </p>
            </div>
          </div>
        </div>

        {/* Connection cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {connections.map((conn: any) => (
            <ServiceCard
              key={conn.service}
              service={conn.service}
              status={conn.status}
              connectedAt={conn.connectedAt}
              lastUsedAt={conn.lastUsedAt}
              onConnect={() => connectService.mutate(conn.service.toLowerCase())}
              onRevoke={() => {
                if (confirm(`Revoke ${conn.service} access? The agent will immediately lose access.`)) {
                  revokeService.mutate(conn.service.toLowerCase());
                }
              }}
              isConnecting={connectService.isPending}
            />
          ))}
        </div>
      </div>
    </>
  );
}
