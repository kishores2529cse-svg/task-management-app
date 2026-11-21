import { server } from './index.js';

let passedTests = 0;
let failedTests = 0;

function assert(condition: boolean, testName: string) {
  if (condition) {
    console.log(`  ✅ PASS: ${testName}`);
    passedTests++;
  } else {
    console.error(`  ❌ FAIL: ${testName}`);
    failedTests++;
  }
}

async function waitForServer(): Promise<number> {
  if (server.listening) {
    const addr = server.address();
    return typeof addr === 'object' && addr ? addr.port : 5000;
  }
  return new Promise((resolve) => {
    server.on('listening', () => {
      const addr = server.address();
      resolve(typeof addr === 'object' && addr ? addr.port : 5000);
    });
  });
}

async function runTests() {
  const port = await waitForServer();
  // Brief pause for routes to register
  await new Promise((r) => setTimeout(r, 500));

  const BASE_URL = `http://127.0.0.1:${port}/api`;

  console.log('\n========================================');
  console.log(`🧪 RUNNING PRODUCTION ENTERPRISE TEST SUITE on port ${port}`);
  console.log('========================================\n');

  try {
    // 1. Health check
    console.log('1. Testing System Health & API Readiness...');
    const healthRes = await fetch(`${BASE_URL}/health`);
    const healthData = await healthRes.json() as any;
    assert(healthRes.status === 200, 'Health check returns HTTP 200');
    assert(healthData.status === 'ok', 'Health status is "ok"');

    // 2. Auth: Admin Login
    console.log('\n2. Testing Authentication & Token Issuance...');
    const adminLoginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@taskflow.com',
        password: 'Password123!',
      }),
    });
    const adminLoginData = await adminLoginRes.json() as any;
    assert(adminLoginRes.status === 200, 'Admin login succeeds with 200');
    assert(Boolean(adminLoginData.data?.token), 'JWT token returned in login response');
    assert(adminLoginData.data?.user?.role === 'ADMIN', 'Admin user has role ADMIN');
    const adminToken = adminLoginData.data?.token;

    // 3. Auth: Member Login
    const memberLoginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'member@taskflow.com',
        password: 'Password123!',
      }),
    });
    const memberLoginData = await memberLoginRes.json() as any;
    assert(memberLoginRes.status === 200, 'Member login succeeds with 200');
    const memberToken = memberLoginData.data?.token;

    // 4. Auth: Viewer Login
    const viewerLoginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'viewer@taskflow.com',
        password: 'Password123!',
      }),
    });
    const viewerLoginData = await viewerLoginRes.json() as any;
    assert(viewerLoginRes.status === 200, 'Viewer login succeeds with 200');
    const viewerToken = viewerLoginData.data?.token;

    // 5. RBAC Enforcement: Viewer cannot create tasks
    console.log('\n3. Testing Role-Based Access Control (RBAC)...');
    const projectsRes = await fetch(`${BASE_URL}/projects`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const projectsData = await projectsRes.json() as any;
    const testProjectId = projectsData.data.projects[0].id;

    const viewerCreateRes = await fetch(`${BASE_URL}/tasks`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${viewerToken}`,
      },
      body: JSON.stringify({
        projectId: testProjectId,
        title: 'Viewer unauthorized attempt',
      }),
    });
    assert(
      viewerCreateRes.status === 403,
      'RBAC: Viewer blocked from creating tasks (HTTP 403 Forbidden)'
    );

    // 6. RBAC: Member cannot modify user roles
    const memberRoleChangeRes = await fetch(`${BASE_URL}/users/${adminLoginData.data.user.id}/role`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${memberToken}`,
      },
      body: JSON.stringify({ role: 'VIEWER' }),
    });
    assert(
      memberRoleChangeRes.status === 403,
      'RBAC: Member blocked from updating roles (HTTP 403 Forbidden)'
    );

    // 7. Task Lifecycle & CRUD
    console.log('\n4. Testing Task Lifecycle & CRUD Operations...');
    const createTaskRes = await fetch(`${BASE_URL}/tasks`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        projectId: testProjectId,
        title: 'Enterprise Integration Test Automated Task',
        description: 'Verifying end-to-end task workflow and subtask verification.',
        status: 'TODO',
        priority: 'URGENT',
        type: 'FEATURE',
        assigneeId: memberLoginData.data.user.id,
        dueDate: new Date(Date.now() + 86400000).toISOString(),
        tags: ['automated-test', 'ci-cd'],
        subtasks: ['Write unit test', 'Verify assertions'],
      }),
    });
    const createTaskData = await createTaskRes.json() as any;
    assert(createTaskRes.status === 201, 'Task created successfully with HTTP 201');
    const createdTask = createTaskData.data?.task;
    assert(Boolean(createdTask?.code), `Task code generated properly: ${createdTask?.code}`);
    assert(createdTask?.priority === 'URGENT', 'Priority properly set to URGENT');

    // 8. Status Transition (Kanban move)
    console.log('\n5. Testing Kanban Status Transitions & Progress Tracking...');
    const statusChangeRes = await fetch(`${BASE_URL}/tasks/${createdTask.id}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({ status: 'IN_PROGRESS' }),
    });
    const statusChangeData = await statusChangeRes.json() as any;
    assert(statusChangeRes.status === 200, 'Status moved to IN_PROGRESS');
    assert(statusChangeData.data?.task?.status === 'IN_PROGRESS', 'Task status correctly updated');

    // 9. Subtask creation and toggle
    console.log('\n6. Testing Subtasks & Verification Checklist...');
    const subtaskRes = await fetch(`${BASE_URL}/tasks/${createdTask.id}/subtasks`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({ title: 'Deploy to canary cluster' }),
    });
    const subtaskData = await subtaskRes.json() as any;
    assert(subtaskRes.status === 201, 'Subtask added with HTTP 201');
    const subtaskId = subtaskData.data?.subtask?.id;

    const toggleSubtaskRes = await fetch(`${BASE_URL}/tasks/subtasks/${subtaskId}/toggle`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const toggleSubtaskData = await toggleSubtaskRes.json() as any;
    assert(toggleSubtaskData.data?.subtask?.isCompleted === true, 'Subtask toggled to completed');

    // 10. Comments & Mentions
    console.log('\n7. Testing Discussion Comments & Mentions...');
    const commentRes = await fetch(`${BASE_URL}/comments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        taskId: createdTask.id,
        content: 'Reviewing automated test progress @Jordan Lee',
      }),
    });
    const commentData = await commentRes.json() as any;
    assert(commentRes.status === 201, 'Comment created with HTTP 201');
    assert(commentData.data?.comment?.content?.includes('@Jordan Lee'), 'Comment preserved mention content');

    // 11. Analytics Aggregation
    console.log('\n8. Testing Executive Analytics Aggregation...');
    const analyticsRes = await fetch(`${BASE_URL}/analytics`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const analyticsData = await analyticsRes.json() as any;
    assert(analyticsRes.status === 200, 'Analytics endpoint returns HTTP 200');
    assert(analyticsData.data?.metrics?.totalTasks > 0, 'Total tasks metric is greater than 0');
    assert(analyticsData.data?.statusData?.length > 0, 'Status distribution charts populated');
    assert(analyticsData.data?.priorityData?.length > 0, 'Priority distribution charts populated');

    // 12. Batch Operations (Bulk Status)
    console.log('\n9. Testing Bulk / Batch Operations...');
    const batchRes = await fetch(`${BASE_URL}/tasks/batch`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        taskIds: [createdTask.id],
        action: 'update_status',
        value: 'DONE',
      }),
    });
    assert(batchRes.status === 200, 'Bulk status update returns HTTP 200');

    // 13. Audit Log Verification
    console.log('\n10. Testing Audit Trail & Compliance Activity...');
    const activityRes = await fetch(`${BASE_URL}/activities?taskId=${createdTask.id}`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const activityData = await activityRes.json() as any;
    assert(activityRes.status === 200, 'Activity endpoint returns HTTP 200');
    assert(activityData.data?.activities?.length > 0, 'Activities recorded for task actions');

    // Clean up created test task
    await fetch(`${BASE_URL}/tasks/${createdTask.id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${adminToken}` },
    });

    console.log('\n========================================');
    console.log(`🎉 TEST SUMMARY: ${passedTests} PASSED, ${failedTests} FAILED`);
    console.log('========================================\n');

    process.exit(failedTests > 0 ? 1 : 0);
  } catch (err) {
    console.error('Test execution error:', err);
    process.exit(1);
  }
}

runTests();
