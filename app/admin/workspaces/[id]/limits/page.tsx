'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Loader2, Save, RefreshCw, Shield, Clock, AlertTriangle } from 'lucide-react'
import { trpc } from '@/lib/trpc/client'
import { toast } from 'sonner'
import { formatDistanceToNow } from 'date-fns'

export default function AdminWorkspaceLimitsPage() {
  const params = useParams()
  const router = useRouter()
  const workspaceId = params.id as string
  
  const [baseLimits, setBaseLimits] = useState({
    maxLinks: 0,
    maxClicks: 0,
    maxUsers: 0,
  })
  
  const [customOverrides, setCustomOverrides] = useState({
    beta_user: false,
    vip_customer: false,
  })
  
  const [tempIncrease, setTempIncrease] = useState({
    metric: 'links' as 'links' | 'clicks' | 'users',
    amount: 100,
    days: 30,
    reason: '',
  })
  
  // Fetch workspace limits
  const { data: workspace, isLoading, refetch } = trpc.adminLimits.getWorkspaceLimits.useQuery({
    workspaceId,
  })
  
  // Fetch audit logs
  const { data: auditLogs } = trpc.adminLimits.getLimitAuditLogs.useQuery({
    workspaceId,
    limit: 20,
  })
  
  // Mutations
  const updateBaseLimits = trpc.adminLimits.updateBaseLimits.useMutation({
    onSuccess: () => {
      toast.success('Base limits updated successfully')
      refetch()
    },
    onError: (error) => {
      toast.error(error.message)
    },
  })
  
  const setCustomOverridesMutation = trpc.adminLimits.setCustomOverrides.useMutation({
    onSuccess: () => {
      toast.success('Custom overrides updated successfully')
      refetch()
    },
    onError: (error) => {
      toast.error(error.message)
    },
  })
  
  const grantTempIncrease = trpc.adminLimits.grantTemporaryIncrease.useMutation({
    onSuccess: () => {
      toast.success('Temporary increase granted successfully')
      refetch()
      setTempIncrease({
        metric: 'links',
        amount: 100,
        days: 30,
        reason: '',
      })
    },
    onError: (error) => {
      toast.error(error.message)
    },
  })
  
  const removeOverrides = trpc.adminLimits.removeCustomOverrides.useMutation({
    onSuccess: () => {
      toast.success('All custom overrides removed')
      refetch()
    },
    onError: (error) => {
      toast.error(error.message)
    },
  })
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }
  
  if (!workspace) {
    return (
      <div className="container mx-auto p-6">
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Workspace not found or you don't have permission to manage limits.
          </AlertDescription>
        </Alert>
      </div>
    )
  }
  
  const customLimits = workspace.workspace.custom_limits as any
  const hasCustomOverrides = customLimits && Object.keys(customLimits).length > 0
  
  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Workspace Limits Management</h1>
          <p className="text-muted-foreground mt-1">
            Manage usage limits and overrides for {workspace.workspace.name}
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => router.push(`/admin/workspaces/${workspaceId}`)}
        >
          Back to Workspace
        </Button>
      </div>
      
      {/* Current Usage */}
      <Card>
        <CardHeader>
          <CardTitle>Current Usage</CardTitle>
          <CardDescription>
            Real-time usage statistics for this workspace
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            <UsageMetric
              label="Links"
              current={workspace.workspace.currentUsage.links}
              limit={workspace.workspace.max_links}
              isUnlimited={workspace.workspace.max_links === -1}
            />
            <UsageMetric
              label="Clicks (Monthly)"
              current={workspace.workspace.currentUsage.clicks}
              limit={workspace.workspace.max_clicks}
              isUnlimited={workspace.workspace.max_clicks === -1}
            />
            <UsageMetric
              label="Team Members"
              current={workspace.workspace.currentUsage.users}
              limit={workspace.workspace.max_users}
              isUnlimited={workspace.workspace.max_users === -1}
            />
          </div>
          
          {hasCustomOverrides && (
            <Alert className="mt-4">
              <Shield className="h-4 w-4" />
              <AlertDescription>
                This workspace has custom overrides applied.
                {customLimits.beta_user && ' Beta user access enabled.'}
                {customLimits.vip_customer && ' VIP customer status active.'}
                {customLimits.temp_increases && ' Temporary increases active.'}
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
      
      {/* Management Tabs */}
      <Tabs defaultValue="base-limits">
        <TabsList>
          <TabsTrigger value="base-limits">Base Limits</TabsTrigger>
          <TabsTrigger value="overrides">Custom Overrides</TabsTrigger>
          <TabsTrigger value="temporary">Temporary Increases</TabsTrigger>
          <TabsTrigger value="audit">Audit Logs</TabsTrigger>
        </TabsList>
        
        <TabsContent value="base-limits" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Base Plan Limits</CardTitle>
              <CardDescription>
                Adjust the base limits for this workspace. Use -1 for unlimited.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="max-links">Max Links</Label>
                  <Input
                    id="max-links"
                    type="number"
                    value={baseLimits.maxLinks || workspace.workspace.max_links}
                    onChange={(e) => setBaseLimits({
                      ...baseLimits,
                      maxLinks: parseInt(e.target.value) || 0
                    })}
                    placeholder="Enter -1 for unlimited"
                  />
                </div>
                <div>
                  <Label htmlFor="max-clicks">Max Clicks (Monthly)</Label>
                  <Input
                    id="max-clicks"
                    type="number"
                    value={baseLimits.maxClicks || workspace.workspace.max_clicks}
                    onChange={(e) => setBaseLimits({
                      ...baseLimits,
                      maxClicks: parseInt(e.target.value) || 0
                    })}
                    placeholder="Enter -1 for unlimited"
                  />
                </div>
                <div>
                  <Label htmlFor="max-users">Max Users</Label>
                  <Input
                    id="max-users"
                    type="number"
                    value={baseLimits.maxUsers || workspace.workspace.max_users}
                    onChange={(e) => setBaseLimits({
                      ...baseLimits,
                      maxUsers: parseInt(e.target.value) || 0
                    })}
                    placeholder="Enter -1 for unlimited"
                  />
                </div>
              </div>
              
              <Button
                onClick={() => updateBaseLimits.mutate({
                  workspaceId,
                  ...baseLimits
                })}
                disabled={updateBaseLimits.isPending}
              >
                {updateBaseLimits.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Save className="mr-2 h-4 w-4" />
                )}
                Update Base Limits
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="overrides" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Custom Access Overrides</CardTitle>
              <CardDescription>
                Grant special access privileges to this workspace
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Beta User Access</Label>
                    <p className="text-sm text-muted-foreground">
                      Grants unlimited access to all features
                    </p>
                  </div>
                  <Switch
                    checked={customOverrides.beta_user || customLimits?.beta_user || false}
                    onCheckedChange={(checked) => setCustomOverrides({
                      ...customOverrides,
                      beta_user: checked
                    })}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <Label>VIP Customer Status</Label>
                    <p className="text-sm text-muted-foreground">
                      Premium support and unlimited resources
                    </p>
                  </div>
                  <Switch
                    checked={customOverrides.vip_customer || customLimits?.vip_customer || false}
                    onCheckedChange={(checked) => setCustomOverrides({
                      ...customOverrides,
                      vip_customer: checked
                    })}
                  />
                </div>
              </div>
              
              <div className="flex gap-2">
                <Button
                  onClick={() => setCustomOverridesMutation.mutate({
                    workspaceId,
                    customLimits: customOverrides
                  })}
                  disabled={setCustomOverridesMutation.isPending}
                >
                  {setCustomOverridesMutation.isPending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="mr-2 h-4 w-4" />
                  )}
                  Apply Overrides
                </Button>
                
                {hasCustomOverrides && (
                  <Button
                    variant="destructive"
                    onClick={() => removeOverrides.mutate({ workspaceId })}
                    disabled={removeOverrides.isPending}
                  >
                    Remove All Overrides
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="temporary" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Grant Temporary Increase</CardTitle>
              <CardDescription>
                Provide a temporary limit increase for specific metrics
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Metric</Label>
                  <Select
                    value={tempIncrease.metric}
                    onValueChange={(value) => setTempIncrease({
                      ...tempIncrease,
                      metric: value as 'links' | 'clicks' | 'users'
                    })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="links">Links</SelectItem>
                      <SelectItem value="clicks">Clicks</SelectItem>
                      <SelectItem value="users">Users</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label>Increase Amount</Label>
                  <Input
                    type="number"
                    value={tempIncrease.amount}
                    onChange={(e) => setTempIncrease({
                      ...tempIncrease,
                      amount: parseInt(e.target.value) || 0
                    })}
                    min="1"
                  />
                </div>
                
                <div>
                  <Label>Valid for (days)</Label>
                  <Input
                    type="number"
                    value={tempIncrease.days}
                    onChange={(e) => setTempIncrease({
                      ...tempIncrease,
                      days: parseInt(e.target.value) || 1
                    })}
                    min="1"
                    max="90"
                  />
                </div>
                
                <div>
                  <Label>Reason (optional)</Label>
                  <Input
                    value={tempIncrease.reason}
                    onChange={(e) => setTempIncrease({
                      ...tempIncrease,
                      reason: e.target.value
                    })}
                    placeholder="e.g., Special promotion"
                  />
                </div>
              </div>
              
              <Button
                onClick={() => grantTempIncrease.mutate({
                  workspaceId,
                  metric: tempIncrease.metric,
                  increaseAmount: tempIncrease.amount,
                  daysValid: tempIncrease.days,
                  reason: tempIncrease.reason || undefined,
                })}
                disabled={grantTempIncrease.isPending}
              >
                {grantTempIncrease.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Clock className="mr-2 h-4 w-4" />
                )}
                Grant Temporary Increase
              </Button>
              
              {customLimits?.temp_increases && (
                <Alert>
                  <Clock className="h-4 w-4" />
                  <AlertDescription>
                    Active temporary increase expires{' '}
                    {formatDistanceToNow(new Date(customLimits.temp_increases.expires), {
                      addSuffix: true
                    })}
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="audit" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Audit Logs</CardTitle>
              <CardDescription>
                History of all limit changes and overrides
              </CardDescription>
            </CardHeader>
            <CardContent>
              {auditLogs?.logs && auditLogs.logs.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Action</TableHead>
                      <TableHead>User</TableHead>
                      <TableHead>Details</TableHead>
                      <TableHead>Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {auditLogs.logs.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell>
                          <Badge variant="outline">
                            {log.action.replace(/_/g, ' ')}
                          </Badge>
                        </TableCell>
                        <TableCell>{log.users?.email || 'System'}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {JSON.stringify(log.metadata, null, 2).slice(0, 50)}...
                        </TableCell>
                        <TableCell>
                          {formatDistanceToNow(new Date(log.created_at), {
                            addSuffix: true
                          })}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-muted-foreground text-center py-4">
                  No audit logs found
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

function UsageMetric({ 
  label, 
  current, 
  limit, 
  isUnlimited 
}: {
  label: string
  current: number
  limit: number
  isUnlimited: boolean
}) {
  const percentage = isUnlimited ? 0 : (current / limit) * 100
  
  return (
    <div className="space-y-2">
      <div className="flex justify-between text-sm">
        <span className="font-medium">{label}</span>
        <span>
          {current.toLocaleString()}
          {!isUnlimited && ` / ${limit.toLocaleString()}`}
          {isUnlimited && ' (Unlimited)'}
        </span>
      </div>
      {!isUnlimited && (
        <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
          <div
            className={`h-full ${
              percentage >= 100 
                ? 'bg-red-500' 
                : percentage >= 80 
                ? 'bg-orange-500' 
                : 'bg-green-500'
            }`}
            style={{ width: `${Math.min(percentage, 100)}%` }}
          />
        </div>
      )}
    </div>
  )
}