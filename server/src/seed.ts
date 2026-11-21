import bcrypt from 'bcryptjs';
import prisma from './lib/prisma.js';

async function seed() {
  console.log('🌱 Starting Enterprise Database Seed...');

  // Clean existing data
  await prisma.notification.deleteMany();
  await prisma.activity.deleteMany();
  await prisma.attachment.deleteMany();
  await prisma.comment.deleteMany();
  await prisma.subtask.deleteMany();
  await prisma.taskTag.deleteMany();
  await prisma.tag.deleteMany();
  await prisma.task.deleteMany();
  await prisma.projectMember.deleteMany();
  await prisma.project.deleteMany();
  await prisma.user.deleteMany();

  const defaultPassword = await bcrypt.hash('Password123!', 10);

  // 1. Create Users
  console.log('👤 Creating enterprise team users...');
  const admin = await prisma.user.create({
    data: {
      email: 'admin@taskflow.com',
      name: 'Sarah Chen',
      password: defaultPassword,
      role: 'ADMIN',
      title: 'VP of Product & Platform',
      department: 'Executive Engineering',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
    },
  });

  const manager = await prisma.user.create({
    data: {
      email: 'manager@taskflow.com',
      name: 'Alex Rivera',
      password: defaultPassword,
      role: 'MANAGER',
      title: 'Lead Software Architect',
      department: 'Platform Architecture',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    },
  });

  const member = await prisma.user.create({
    data: {
      email: 'member@taskflow.com',
      name: 'Jordan Lee',
      password: defaultPassword,
      role: 'MEMBER',
      title: 'Senior Full-Stack Engineer',
      department: 'Product Engineering',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    },
  });

  const viewer = await prisma.user.create({
    data: {
      email: 'viewer@taskflow.com',
      name: 'Taylor Smith',
      password: defaultPassword,
      role: 'VIEWER',
      title: 'Principal Product Designer & Auditor',
      department: 'Design & Compliance',
      avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80',
    },
  });

  console.log('📁 Creating enterprise projects...');
  // 2. Create Projects
  const now = new Date();
  const nextMonth = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
  const twoMonths = new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000);

  const projectCloud = await prisma.project.create({
    data: {
      name: 'Enterprise Cloud Migration',
      key: 'FLOW',
      description: 'Zero-downtime database and microservices migration to distributed Kubernetes clusters.',
      color: '#4f46e5',
      status: 'ACTIVE',
      ownerId: admin.id,
      startDate: new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000),
      targetDate: nextMonth,
      members: {
        create: [
          { userId: admin.id, role: 'OWNER' },
          { userId: manager.id, role: 'MANAGER' },
          { userId: member.id, role: 'CONTRIBUTOR' },
          { userId: viewer.id, role: 'VIEWER' },
        ],
      },
    },
  });

  const projectPortal = await prisma.project.create({
    data: {
      name: 'Customer Portal 2.0',
      key: 'PORT',
      description: 'Next-generation self-serve customer analytics, billing automation, and team workspaces.',
      color: '#06b6d4',
      status: 'ACTIVE',
      ownerId: manager.id,
      startDate: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
      targetDate: twoMonths,
      members: {
        create: [
          { userId: manager.id, role: 'OWNER' },
          { userId: member.id, role: 'CONTRIBUTOR' },
          { userId: admin.id, role: 'MANAGER' },
        ],
      },
    },
  });

  const projectSec = await prisma.project.create({
    data: {
      name: 'SOC2 & Security Hardening',
      key: 'SEC',
      description: 'Annual SOC2 Type II compliance audit, penetration testing, and zero-trust IAM policies.',
      color: '#f59e0b',
      status: 'ACTIVE',
      ownerId: admin.id,
      startDate: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
      targetDate: nextMonth,
      members: {
        create: [
          { userId: admin.id, role: 'OWNER' },
          { userId: manager.id, role: 'MANAGER' },
          { userId: viewer.id, role: 'CONTRIBUTOR' },
        ],
      },
    },
  });

  console.log('🏷️ Creating tags...');
  // 3. Create Tags
  const tagList = [
    { name: 'backend', color: '#6366f1' },
    { name: 'frontend', color: '#ec4899' },
    { name: 'security', color: '#ef4444' },
    { name: 'database', color: '#8b5cf6' },
    { name: 'infra', color: '#10b981' },
    { name: 'ui/ux', color: '#06b6d4' },
    { name: 'performance', color: '#f59e0b' },
    { name: 'api', color: '#3b82f6' },
  ];

  const createdTags: Record<string, any> = {};
  for (const t of tagList) {
    createdTags[t.name] = await prisma.tag.create({ data: t });
  }

  console.log('📝 Creating rich tasks...');
  // Helper dates
  const overdueDate = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000);
  const todayDate = new Date(now.getTime() + 4 * 60 * 60 * 1000);
  const tomorrowDate = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const nextWeekDate = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  const nextTwoWeeksDate = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);

  const tasksData = [
    // FLOW Tasks
    {
      code: 'FLOW-101',
      title: 'Database connection pool optimization and query profiling',
      description: 'Profile slow queries during peak traffic. Implement PgBouncer connection pooling and adjust max connections to prevent connection starvation.\n\n### Acceptance Criteria\n- P99 latency under 45ms\n- Connection spike test with 1,000 concurrent simulated clients\n- Automated alerts on slow queries (>200ms)',
      status: 'IN_PROGRESS',
      priority: 'URGENT',
      type: 'TASK',
      projectId: projectCloud.id,
      assigneeId: member.id,
      reporterId: manager.id,
      dueDate: todayDate,
      estimatedHours: 16,
      actualHours: 9,
      orderIndex: 0,
      tags: ['backend', 'database', 'performance'],
      subtasks: [
        { title: 'Run baseline query telemetry benchmark', isCompleted: true },
        { title: 'Provision PgBouncer proxy on staging cluster', isCompleted: true },
        { title: 'Configure client idle timeouts and pool size thresholds', isCompleted: false },
        { title: 'Execute load test and document response latency curves', isCompleted: false },
      ],
    },
    {
      code: 'FLOW-102',
      title: 'Kubernetes ingress controller SSL/TLS certificate auto-renewal',
      description: 'Configure cert-manager with Let\'s Encrypt ACME DNS-01 challenge for wildcard domain SSL certificates across all ingress endpoints.',
      status: 'IN_PROGRESS',
      priority: 'HIGH',
      type: 'FEATURE',
      projectId: projectCloud.id,
      assigneeId: manager.id,
      reporterId: admin.id,
      dueDate: tomorrowDate,
      estimatedHours: 8,
      actualHours: 4,
      orderIndex: 1,
      tags: ['infra', 'security'],
      subtasks: [
        { title: 'Install cert-manager Helm chart v1.14', isCompleted: true },
        { title: 'Configure ClusterIssuer with Route53 DNS credentials', isCompleted: true },
        { title: 'Test renewal dry-run and alert channel trigger', isCompleted: false },
      ],
    },
    {
      code: 'FLOW-103',
      title: 'Implement Redis multi-region session cache replication',
      description: 'Set up Redis replication to keep user sessions synchronized between East and West clusters with sub-10ms replication latency.',
      status: 'TODO',
      priority: 'HIGH',
      type: 'TASK',
      projectId: projectCloud.id,
      assigneeId: member.id,
      reporterId: manager.id,
      dueDate: nextWeekDate,
      estimatedHours: 24,
      actualHours: 0,
      orderIndex: 0,
      tags: ['backend', 'infra'],
      subtasks: [
        { title: 'Review memory footprint and key eviction policies', isCompleted: false },
        { title: 'Implement cluster fallback logic in session middleware', isCompleted: false },
        { title: 'Conduct chaos monkey network partition test', isCompleted: false },
      ],
    },
    {
      code: 'FLOW-104',
      title: 'Fix edge case in WebSocket reconnect backoff algorithm',
      description: 'Under intermittent network disconnects, clients were making unbounded reconnection storms rather than jittered exponential backoff.',
      status: 'DONE',
      priority: 'URGENT',
      type: 'BUG',
      projectId: projectCloud.id,
      assigneeId: member.id,
      reporterId: admin.id,
      dueDate: overdueDate,
      estimatedHours: 6,
      actualHours: 5,
      orderIndex: 0,
      tags: ['frontend', 'performance'],
      subtasks: [
        { title: 'Reproduce rapid disconnect flakiness in unit tests', isCompleted: true },
        { title: 'Apply exponential backoff with full jitter formula', isCompleted: true },
        { title: 'Verify on mobile network throttled profile', isCompleted: true },
      ],
    },
    {
      code: 'FLOW-105',
      title: 'Automate blue-green deployment pipelines with ArgoCD',
      description: 'Create GitOps manifests and rollouts with automated canary analysis using Prometheus metric gates.',
      status: 'BACKLOG',
      priority: 'MEDIUM',
      type: 'IMPROVEMENT',
      projectId: projectCloud.id,
      assigneeId: manager.id,
      reporterId: admin.id,
      dueDate: nextTwoWeeksDate,
      estimatedHours: 32,
      actualHours: 0,
      orderIndex: 0,
      tags: ['infra', 'performance'],
      subtasks: [],
    },
    {
      code: 'FLOW-106',
      title: 'Overdue migration audit: review remaining legacy monolith endpoints',
      description: 'Three legacy reporting endpoints still hit the v1 MySQL database directly. Must be refactored to query GraphQL microservices.',
      status: 'TODO',
      priority: 'URGENT',
      type: 'TASK',
      projectId: projectCloud.id,
      assigneeId: member.id,
      reporterId: admin.id,
      dueDate: overdueDate,
      estimatedHours: 12,
      actualHours: 2,
      orderIndex: 1,
      tags: ['backend', 'api'],
      subtasks: [
        { title: 'Audit endpoint telemetry usage metrics', isCompleted: true },
        { title: 'Deprecate v1 endpoint route with sunset headers', isCompleted: false },
      ],
    },

    // PORT Tasks
    {
      code: 'PORT-101',
      title: 'Design high-contrast dark mode design tokens and theme switcher',
      description: 'Implement WCAG AAA compliant color palette tokens for enterprise users working in low-light environments.',
      status: 'DONE',
      priority: 'MEDIUM',
      type: 'FEATURE',
      projectId: projectPortal.id,
      assigneeId: viewer.id,
      reporterId: manager.id,
      dueDate: overdueDate,
      estimatedHours: 16,
      actualHours: 14,
      orderIndex: 0,
      tags: ['ui/ux', 'frontend'],
      subtasks: [
        { title: 'Build token palette in Tailwind configuration', isCompleted: true },
        { title: 'Test contrast ratios with axe-core automated scanner', isCompleted: true },
        { title: 'Implement system preference detection and sync', isCompleted: true },
      ],
    },
    {
      code: 'PORT-102',
      title: 'Interactive Real-Time Kanban Board with drag-and-drop',
      description: 'Deliver smooth drag-and-drop cards with optimistic updates, column WIP indicators, and instant multi-user socket synchronization.',
      status: 'IN_REVIEW',
      priority: 'URGENT',
      type: 'FEATURE',
      projectId: projectPortal.id,
      assigneeId: member.id,
      reporterId: manager.id,
      dueDate: todayDate,
      estimatedHours: 20,
      actualHours: 19,
      orderIndex: 0,
      tags: ['frontend', 'ui/ux'],
      subtasks: [
        { title: 'Create HTML5 drag and drop interaction handler', isCompleted: true },
        { title: 'Wire WebSocket broadcast events for board updates', isCompleted: true },
        { title: 'Keyboard accessible card movement shortcuts', isCompleted: true },
        { title: 'Cross-browser animation smoothness audit', isCompleted: false },
      ],
    },
    {
      code: 'PORT-103',
      title: 'Stripe subscription invoice webhook reconciliation',
      description: 'Handle customer invoice payment failed and subscription upgraded webhooks with idempotent database transactions.',
      status: 'TODO',
      priority: 'HIGH',
      type: 'TASK',
      projectId: projectPortal.id,
      assigneeId: member.id,
      reporterId: manager.id,
      dueDate: nextWeekDate,
      estimatedHours: 14,
      actualHours: 0,
      orderIndex: 0,
      tags: ['backend', 'api'],
      subtasks: [
        { title: 'Implement webhook signature verification', isCompleted: false },
        { title: 'Build replay queue for transient network errors', isCompleted: false },
      ],
    },
    {
      code: 'PORT-104',
      title: 'Export task data to CSV and JSON formatted reports',
      description: 'Support enterprise data compliance requirements with 1-click export of filtered task lists and metadata.',
      status: 'IN_PROGRESS',
      priority: 'MEDIUM',
      type: 'FEATURE',
      projectId: projectPortal.id,
      assigneeId: member.id,
      reporterId: admin.id,
      dueDate: tomorrowDate,
      estimatedHours: 8,
      actualHours: 6,
      orderIndex: 0,
      tags: ['frontend', 'api'],
      subtasks: [
        { title: 'Create RFC4180 compliant CSV serializer', isCompleted: true },
        { title: 'Add client-side streaming download trigger', isCompleted: true },
        { title: 'Include subtask completion and duration stats in export', isCompleted: false },
      ],
    },
    {
      code: 'PORT-105',
      title: 'Executive dashboard analytics widgets with Recharts',
      description: 'Render responsive charts showing task velocity, priority breakdown, completion trends, and member workload distribution.',
      status: 'IN_REVIEW',
      priority: 'HIGH',
      type: 'FEATURE',
      projectId: projectPortal.id,
      assigneeId: member.id,
      reporterId: admin.id,
      dueDate: tomorrowDate,
      estimatedHours: 18,
      actualHours: 17,
      orderIndex: 1,
      tags: ['frontend', 'ui/ux', 'performance'],
      subtasks: [
        { title: 'Build aggregation queries in analytics controller', isCompleted: true },
        { title: 'Format Recharts components with dark mode support', isCompleted: true },
        { title: 'Add real-time chart refresh on task status changes', isCompleted: true },
      ],
    },

    // SEC Tasks
    {
      code: 'SEC-101',
      title: 'Implement Role-Based Access Control (RBAC) guard middleware',
      description: 'Enforce strict role verification (ADMIN, MANAGER, MEMBER, VIEWER) on all REST endpoints and WebSocket room subscriptions.',
      status: 'DONE',
      priority: 'URGENT',
      type: 'TASK',
      projectId: projectSec.id,
      assigneeId: manager.id,
      reporterId: admin.id,
      dueDate: overdueDate,
      estimatedHours: 16,
      actualHours: 16,
      orderIndex: 0,
      tags: ['security', 'backend'],
      subtasks: [
        { title: 'Define granular permissions matrix for user roles', isCompleted: true },
        { title: 'Implement Express RBAC middleware check', isCompleted: true },
        { title: 'Add unit tests for unauthorized privilege escalation', isCompleted: true },
      ],
    },
    {
      code: 'SEC-102',
      title: 'Conduct automated OWASP Top 10 vulnerability scan',
      description: 'Run automated static and dynamic security scans (SAST/DAST) across all API routes, sanitization routines, and headers.',
      status: 'IN_PROGRESS',
      priority: 'HIGH',
      type: 'TASK',
      projectId: projectSec.id,
      assigneeId: manager.id,
      reporterId: admin.id,
      dueDate: todayDate,
      estimatedHours: 12,
      actualHours: 7,
      orderIndex: 0,
      tags: ['security'],
      subtasks: [
        { title: 'Configure CSP (Content Security Policy) and HSTS headers', isCompleted: true },
        { title: 'Review SQL injection protections via Prisma parameterized queries', isCompleted: true },
        { title: 'Audit JWT expiration and revoking strategies', isCompleted: false },
      ],
    },
    {
      code: 'SEC-103',
      title: 'Setup Audit Trail Logging for compliance verification',
      description: 'Record timestamped records for all task modifications, role changes, project creations, and user logins.',
      status: 'DONE',
      priority: 'HIGH',
      type: 'FEATURE',
      projectId: projectSec.id,
      assigneeId: member.id,
      reporterId: manager.id,
      dueDate: overdueDate,
      estimatedHours: 10,
      actualHours: 10,
      orderIndex: 1,
      tags: ['security', 'database'],
      subtasks: [
        { title: 'Create Activity schema with JSON details payload', isCompleted: true },
        { title: 'Hook activity logger to task and project controllers', isCompleted: true },
        { title: 'Expose filterable audit trail feed to Admins', isCompleted: true },
      ],
    },
    {
      code: 'SEC-104',
      title: 'Quarterly SOC2 Type II evidence collection and vendor review',
      description: 'Export access control lists, commit histories, and deployment logs for external auditors.',
      status: 'BACKLOG',
      priority: 'MEDIUM',
      type: 'TASK',
      projectId: projectSec.id,
      assigneeId: admin.id,
      reporterId: admin.id,
      dueDate: nextMonth,
      estimatedHours: 40,
      actualHours: 0,
      orderIndex: 0,
      tags: ['security'],
      subtasks: [],
    },
  ];

  for (const t of tasksData) {
    const { tags, subtasks, ...taskFields } = t;

    const task = await prisma.task.create({
      data: taskFields,
    });

    // Create subtasks
    if (subtasks && subtasks.length > 0) {
      await prisma.subtask.createMany({
        data: subtasks.map((st, i) => ({
          taskId: task.id,
          title: st.title,
          isCompleted: st.isCompleted,
          orderIndex: i,
        })),
      });
    }

    // Link tags
    if (tags && tags.length > 0) {
      for (const tagKey of tags) {
        if (createdTags[tagKey]) {
          await prisma.taskTag.create({
            data: {
              taskId: task.id,
              tagId: createdTags[tagKey].id,
            },
          });
        }
      }
    }
  }

  console.log('💬 Creating realistic comments...');
  const firstTask = await prisma.task.findFirst({ where: { code: 'FLOW-101' } });
  if (firstTask) {
    await prisma.comment.create({
      data: {
        taskId: firstTask.id,
        userId: manager.id,
        content: '@Sarah Chen We noticed a 15% spike in idle connections during the 09:00 UTC shift. I have assigned this to @Jordan Lee to profile PgBouncer parameters.',
      },
    });

    await prisma.comment.create({
      data: {
        taskId: firstTask.id,
        userId: member.id,
        content: 'Thanks @Alex Rivera! I am running the baseline query telemetry benchmarks right now. Staging PgBouncer is already spinning up.',
      },
    });
  }

  const kanbanTask = await prisma.task.findFirst({ where: { code: 'PORT-102' } });
  if (kanbanTask) {
    await prisma.comment.create({
      data: {
        taskId: kanbanTask.id,
        userId: viewer.id,
        content: 'The drag-and-drop animation looks exceptionally fluid! Checked on 120Hz display, 0 frame drops.',
      },
    });
  }

  console.log('🔔 Creating notifications...');
  await prisma.notification.createMany({
    data: [
      {
        userId: member.id,
        title: 'New Task Assigned',
        message: 'Alex Rivera assigned you to "Database connection pool optimization and query profiling" (FLOW-101)',
        type: 'ASSIGNMENT',
        taskId: firstTask?.id,
        isRead: false,
        createdAt: new Date(now.getTime() - 20 * 60 * 1000),
      },
      {
        userId: member.id,
        title: 'Approaching Deadline Alert',
        message: '"Interactive Real-Time Kanban Board" is due today!',
        type: 'DUE_SOON',
        taskId: kanbanTask?.id,
        isRead: false,
        createdAt: new Date(now.getTime() - 45 * 60 * 1000),
      },
      {
        userId: admin.id,
        title: 'Task Moved to Review',
        message: 'Jordan Lee moved "Interactive Real-Time Kanban Board" (PORT-102) to IN_REVIEW',
        type: 'STATUS_CHANGE',
        taskId: kanbanTask?.id,
        isRead: false,
        createdAt: new Date(now.getTime() - 90 * 60 * 1000),
      },
      {
        userId: manager.id,
        title: 'Security Audit Completed',
        message: 'Sarah Chen signed off on "Setup Audit Trail Logging" (SEC-103)',
        type: 'SYSTEM',
        isRead: true,
        createdAt: new Date(now.getTime() - 180 * 60 * 1000),
      },
    ],
  });

  console.log('📜 Creating initial activity logs...');
  await prisma.activity.createMany({
    data: [
      {
        userId: admin.id,
        projectId: projectCloud.id,
        taskId: firstTask?.id,
        action: 'CREATED',
        details: JSON.stringify({ message: 'Created task "Database connection pool optimization" (FLOW-101)' }),
        createdAt: new Date(now.getTime() - 24 * 60 * 60 * 1000),
      },
      {
        userId: manager.id,
        projectId: projectCloud.id,
        taskId: firstTask?.id,
        action: 'STATUS_CHANGED',
        details: JSON.stringify({ from: 'TODO', to: 'IN_PROGRESS' }),
        createdAt: new Date(now.getTime() - 12 * 60 * 60 * 1000),
      },
      {
        userId: member.id,
        projectId: projectPortal.id,
        taskId: kanbanTask?.id,
        action: 'STATUS_CHANGED',
        details: JSON.stringify({ from: 'IN_PROGRESS', to: 'IN_REVIEW' }),
        createdAt: new Date(now.getTime() - 2 * 60 * 60 * 1000),
      },
    ],
  });

  console.log('✅ Enterprise Database Seed Completed Successfully!');
}

seed()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
