import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from 'jsr:@supabase/supabase-js@2'

interface BulkProcessRequest {
  operation: 'assign_agents' | 'update_status' | 'bulk_import' | 'data_cleanup'
  data: any[]
  filters?: Record<string, any>
  organizationId: string
}

Deno.serve(async (req: Request) => {
  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const { operation, data, filters, organizationId }: BulkProcessRequest = await req.json()

    // Validate user permissions
    const authHeader = req.headers.get('Authorization')
    const token = authHeader?.replace('Bearer ', '')
    
    if (!token) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      )
    }

    const { data: { user } } = await supabase.auth.getUser(token)
    if (!user) {
      return new Response(
        JSON.stringify({ error: 'Invalid token' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Check if user has bulk operation permissions
    const { data: hasPermission } = await supabase
      .rpc('current_user_has_permission', { permission_name: 'inspection_request.update.all' })

    if (!hasPermission) {
      return new Response(
        JSON.stringify({ error: 'Insufficient permissions for bulk operations' }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      )
    }

    let result
    switch (operation) {
      case 'assign_agents':
        result = await bulkAssignAgents(supabase, data, organizationId, user.id)
        break
      case 'update_status':
        result = await bulkUpdateStatus(supabase, data, filters, organizationId, user.id)
        break
      case 'bulk_import':
        result = await bulkImport(supabase, data, organizationId, user.id)
        break
      case 'data_cleanup':
        result = await dataCleanup(supabase, filters, organizationId, user.id)
        break
      default:
        return new Response(
          JSON.stringify({ error: 'Invalid operation' }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        )
    }

    // Log the bulk operation
    await supabase
      .from('audit_logs')
      .insert({
        table_name: 'bulk_operations',
        operation: operation,
        user_id: user.id,
        organization_id: organizationId,
        new_values: { processedCount: result.processedCount, successCount: result.successCount },
        metadata: { operation, duration: result.duration }
      })

    return new Response(
      JSON.stringify(result),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error in bulk processing:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
})

async function bulkAssignAgents(supabase: any, assignments: any[], organizationId: string, userId: string) {
  const startTime = Date.now()
  let successCount = 0
  let errors: any[] = []

  for (const assignment of assignments) {
    try {
      const { inspectionId, agentIds } = assignment

      // Validate inspection belongs to organization
      const { data: inspection } = await supabase
        .from('inspection_requests')
        .select('id')
        .eq('id', inspectionId)
        .eq('organization_id', organizationId)
        .single()

      if (!inspection) {
        throw new Error('Inspection not found or access denied')
      }

      // Update assignment
      const { error } = await supabase
        .from('inspection_requests')
        .update({ 
          assigned_agents: agentIds,
          updated_at: new Date().toISOString()
        })
        .eq('id', inspectionId)

      if (error) throw error

      successCount++
    } catch (error) {
      errors.push({
        inspectionId: assignment.inspectionId,
        error: error.message
      })
    }
  }

  return {
    processedCount: assignments.length,
    successCount,
    errorCount: errors.length,
    errors,
    duration: Date.now() - startTime
  }
}

async function bulkUpdateStatus(supabase: any, updates: any[], filters: any, organizationId: string, userId: string) {
  const startTime = Date.now()
  let successCount = 0
  let errors: any[] = []

  // Get records to update based on filters
  let query = supabase
    .from('inspection_requests')
    .select('id')

  if (filters) {
    Object.entries(filters).forEach(([key, value]) => {
      if (Array.isArray(value)) {
        query = query.in(key, value)
      } else {
        query = query.eq(key, value)
      }
    })
  }

  query = query.eq('organization_id', organizationId)

  const { data: records, error: fetchError } = await query
  if (fetchError) throw fetchError

  for (const update of updates) {
    try {
      const { inspectionId, status, notes } = update

      // Update record
      const { error } = await supabase
        .from('inspection_requests')
        .update({ 
          status,
          notes: notes || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', inspectionId)
        .eq('organization_id', organizationId)

      if (error) throw error

      successCount++
    } catch (error) {
      errors.push({
        inspectionId: update.inspectionId,
        error: error.message
      })
    }
  }

  return {
    processedCount: updates.length,
    successCount,
    errorCount: errors.length,
    errors,
    duration: Date.now() - startTime
  }
}

async function bulkImport(supabase: any, records: any[], organizationId: string, userId: string) {
  const startTime = Date.now()
  let successCount = 0
  let errors: any[] = []

  // Process in batches to avoid timeouts
  const batchSize = 50
  for (let i = 0; i < records.length; i += batchSize) {
    const batch = records.slice(i, i + batchSize)

    for (const record of batch) {
      try {
        // Validate required fields
        if (!record.user_id || !record.property_address) {
          throw new Error('Missing required fields: user_id, property_address')
        }

        // Insert record
        const { error } = await supabase
          .from('inspection_requests')
          .insert({
            ...record,
            organization_id: organizationId,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            status: record.status || 'pending',
            priority: record.priority || 'medium'
          })

        if (error) throw error

        successCount++
      } catch (error) {
        errors.push({
          record,
          error: error.message
        })
      }
    }

    // Small delay between batches to prevent overwhelming the database
    if (i + batchSize < records.length) {
      await new Promise(resolve => setTimeout(resolve, 100))
    }
  }

  return {
    processedCount: records.length,
    successCount,
    errorCount: errors.length,
    errors,
    duration: Date.now() - startTime
  }
}

async function dataCleanup(supabase: any, filters: any, organizationId: string, userId: string) {
  const startTime = Date.now()
  let deletedCount = 0
  let errors: any[] = []

  try {
    // Find old completed inspections (older than 1 year)
    const cutoffDate = new Date()
    cutoffDate.setFullYear(cutoffDate.getFullYear() - 1)

    let query = supabase
      .from('inspection_requests')
      .select('id, created_at')
      .eq('organization_id', organizationId)
      .eq('status', 'completed')
      .lt('created_at', cutoffDate.toISOString())

    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (key === 'older_than_days') {
          const days = parseInt(value as string)
          const date = new Date()
          date.setDate(date.getDate() - days)
          query = query.lt('created_at', date.toISOString())
        }
      })
    }

    const { data: oldRecords, error: fetchError } = await query
    if (fetchError) throw fetchError

    // Archive old records (soft delete)
    for (const record of oldRecords || []) {
      try {
        const { error } = await supabase
          .from('inspection_requests')
          .update({ 
            status: 'archived',
            updated_at: new Date().toISOString()
          })
          .eq('id', record.id)

        if (error) throw error

        deletedCount++
      } catch (error) {
        errors.push({
          id: record.id,
          error: error.message
        })
      }
    }

  } catch (error) {
    errors.push({
      error: error.message
    })
  }

  return {
    processedCount: deletedCount,
    successCount: deletedCount - errors.length,
    errorCount: errors.length,
    errors,
    duration: Date.now() - startTime
  }
}
