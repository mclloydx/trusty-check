import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from 'jsr:@supabase/supabase-js@2'

interface ReportRequest {
  organizationId: string
  reportType: 'inspection_summary' | 'user_activity' | 'performance_metrics'
  dateRange: {
    startDate: string
    endDate: string
  }
  format: 'json' | 'csv' | 'pdf'
}

Deno.serve(async (req: Request) => {
  try {
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Parse request body
    const { organizationId, reportType, dateRange, format }: ReportRequest = await req.json()

    // Validate request
    if (!organizationId || !reportType || !dateRange) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Generate report based on type
    let reportData
    switch (reportType) {
      case 'inspection_summary':
        reportData = await generateInspectionSummary(supabase, organizationId, dateRange)
        break
      case 'user_activity':
        reportData = await generateUserActivityReport(supabase, organizationId, dateRange)
        break
      case 'performance_metrics':
        reportData = await generatePerformanceMetrics(supabase, organizationId, dateRange)
        break
      default:
        return new Response(
          JSON.stringify({ error: 'Invalid report type' }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        )
    }

    // Format response based on requested format
    let responseData
    let contentType = 'application/json'

    switch (format) {
      case 'csv':
        responseData = convertToCSV(reportData)
        contentType = 'text/csv'
        break
      case 'pdf':
        responseData = await convertToPDF(reportData, reportType)
        contentType = 'application/pdf'
        break
      default:
        responseData = JSON.stringify(reportData)
    }

    // Log the report generation
    await supabase
      .from('audit_logs')
      .insert({
        table_name: 'reports',
        operation: 'generate',
        user_id: req.headers.get('Authorization')?.split(' ')[1],
        organization_id: organizationId,
        new_values: { reportType, dateRange, format },
        metadata: { generated_at: new Date().toISOString() }
      })

    return new Response(responseData, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${reportType}_report.${format}"`
      }
    })

  } catch (error) {
    console.error('Error generating report:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
})

async function generateInspectionSummary(supabase: any, organizationId: string, dateRange: any) {
  const { startDate, endDate } = dateRange

  // Get inspection statistics
  const { data: inspections } = await supabase
    .from('inspection_requests')
    .select('*')
    .eq('organization_id', organizationId)
    .gte('created_at', startDate)
    .lte('created_at', endDate)

  // Calculate summary statistics
  const total = inspections?.length || 0
  const completed = inspections?.filter(i => i.status === 'completed').length || 0
  const pending = inspections?.filter(i => i.status === 'pending').length || 0
  const inProgress = inspections?.filter(i => i.status === 'in_progress').length || 0

  // Group by priority
  const byPriority = inspections?.reduce((acc: any, inspection) => {
    acc[inspection.priority] = (acc[inspection.priority] || 0) + 1
    return acc
  }, {})

  // Group by status over time
  const statusTrend = inspections?.reduce((acc: any, inspection) => {
    const date = new Date(inspection.created_at).toISOString().split('T')[0]
    if (!acc[date]) acc[date] = { pending: 0, in_progress: 0, completed: 0 }
    acc[date][inspection.status]++
    return acc
  }, {})

  return {
    summary: {
      total,
      completed,
      pending,
      inProgress,
      completionRate: total > 0 ? (completed / total * 100).toFixed(2) : 0
    },
    byPriority,
    statusTrend,
    inspections: inspections || []
  }
}

async function generateUserActivityReport(supabase: any, organizationId: string, dateRange: any) {
  const { startDate, endDate } = dateRange

  // Get user activity from audit logs
  const { data: activities } = await supabase
    .from('audit_logs')
    .select('*')
    .eq('organization_id', organizationId)
    .gte('timestamp', startDate)
    .lte('timestamp', endDate)

  // Get user details
  const { data: users } = await supabase
    .from('profiles')
    .select('*')
    .in('id', [...new Set(activities?.map(a => a.user_id).filter(Boolean))])

  // Group activities by user
  const userActivity = users?.map(user => {
    const userActivities = activities?.filter(a => a.user_id === user.id) || []
    return {
      user: {
        id: user.id,
        email: user.email,
        fullName: user.full_name
      },
      totalActions: userActivities.length,
      actionsByType: userActivities.reduce((acc: any, activity) => {
        acc[activity.operation] = (acc[activity.operation] || 0) + 1
        return acc
      }, {}),
      lastActivity: userActivities.length > 0 
        ? new Date(Math.max(...userActivities.map(a => new Date(a.timestamp).getTime())))
        : null
    }
  })

  return {
    totalUsers: users?.length || 0,
    totalActions: activities?.length || 0,
    userActivity: userActivity || []
  }
}

async function generatePerformanceMetrics(supabase: any, organizationId: string, dateRange: any) {
  const { startDate, endDate } = dateRange

  // Get inspection request performance data
  const { data: inspections } = await supabase
    .from('inspection_requests')
    .select('*')
    .eq('organization_id', organizationId)
    .gte('created_at', startDate)
    .lte('created_at', endDate)

  // Calculate performance metrics
  const completedInspections = inspections?.filter(i => i.status === 'completed') || []
  
  const completionTimes = completedInspections.map(inspection => {
    const created = new Date(inspection.created_at)
    const updated = new Date(inspection.updated_at)
    return (updated.getTime() - created.getTime()) / (1000 * 60 * 60) // hours
  })

  const avgCompletionTime = completionTimes.length > 0
    ? completionTimes.reduce((sum, time) => sum + time, 0) / completionTimes.length
    : 0

  const medianCompletionTime = completionTimes.length > 0
    ? completionTimes.sort((a, b) => a - b)[Math.floor(completionTimes.length / 2)]
    : 0

  // Performance by priority
  const performanceByPriority = completedInspections.reduce((acc: any, inspection) => {
    if (!acc[inspection.priority]) {
      acc[inspection.priority] = { count: 0, totalTime: 0 }
    }
    const completionTime = (new Date(inspection.updated_at).getTime() - new Date(inspection.created_at).getTime()) / (1000 * 60 * 60)
    acc[inspection.priority].count++
    acc[inspection.priority].totalTime += completionTime
    return acc
  }, {})

  // Calculate averages by priority
  Object.keys(performanceByPriority).forEach(priority => {
    const data = performanceByPriority[priority]
    data.averageTime = data.totalTime / data.count
  })

  return {
    summary: {
      totalInspections: inspections?.length || 0,
      completedInspections: completedInspections.length,
      avgCompletionTime: avgCompletionTime.toFixed(2),
      medianCompletionTime: medianCompletionTime.toFixed(2)
    },
    performanceByPriority,
    completionTimes
  }
}

function convertToCSV(data: any): string {
  if (Array.isArray(data)) {
    if (data.length === 0) return ''
    
    const headers = Object.keys(data[0])
    const csvRows = [headers.join(',')]
    
    for (const row of data) {
      const values = headers.map(header => {
        const value = row[header]
        return typeof value === 'string' && value.includes(',') 
          ? `"${value}"` 
          : value
      })
      csvRows.push(values.join(','))
    }
    
    return csvRows.join('\n')
  } else {
    // Handle nested objects
    const flatten = (obj: any, prefix = ''): string[] => {
      const rows: string[] = []
      
      if (Array.isArray(obj)) {
        obj.forEach((item, index) => {
          rows.push(...flatten(item, `${prefix}${index}.`))
        })
      } else if (typeof obj === 'object' && obj !== null) {
        Object.entries(obj).forEach(([key, value]) => {
          if (typeof value === 'object' && value !== null) {
            rows.push(...flatten(value, `${prefix}${key}.`))
          } else {
            rows.push(`${prefix}${key},${value}`)
          }
        })
      }
      
      return rows
    }
    
    return 'Key,Value\n' + flatten(data).join('\n')
  }
}

async function convertToPDF(data: any, reportType: string): Promise<Uint8Array> {
  // Simple PDF generation - in a real implementation, you'd use a library like jsPDF
  const pdfContent = `
    Report: ${reportType}
    Generated: ${new Date().toISOString()}
    
    ${JSON.stringify(data, null, 2)}
  `
  
  return new TextEncoder().encode(pdfContent)
}
