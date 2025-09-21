const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function applyRLSPolicies() {
  console.log("🔒 Applying RLS policies to unprotected tables...\n");

  const policies = [
    // Payment Methods
    {
      table: "payment_methods",
      commands: [
        "ALTER TABLE payment_methods ENABLE ROW LEVEL SECURITY",
        `CREATE POLICY "view_payment_methods_policy" ON payment_methods
         FOR SELECT USING (
           workspace_id IN (
             SELECT workspace_id FROM workspace_memberships
             WHERE user_id = auth.uid()
           )
         )`,
        `CREATE POLICY "manage_payment_methods_policy" ON payment_methods
         FOR ALL USING (
           workspace_id IN (
             SELECT workspace_id FROM workspace_memberships
             WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
           )
         )`,
      ],
    },
    // Subscriptions
    {
      table: "subscriptions",
      commands: [
        "ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY",
        `CREATE POLICY "view_subscriptions_policy" ON subscriptions
         FOR SELECT USING (
           workspace_id IN (
             SELECT workspace_id FROM workspace_memberships
             WHERE user_id = auth.uid()
           )
         )`,
        `CREATE POLICY "manage_subscriptions_policy" ON subscriptions
         FOR ALL USING (
           workspace_id IN (
             SELECT workspace_id FROM workspace_memberships
             WHERE user_id = auth.uid() AND role = 'owner'
           )
         )`,
      ],
    },
    // Invoices
    {
      table: "invoices",
      commands: [
        "ALTER TABLE invoices ENABLE ROW LEVEL SECURITY",
        `CREATE POLICY "view_invoices_policy" ON invoices
         FOR SELECT USING (
           workspace_id IN (
             SELECT workspace_id FROM workspace_memberships
             WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
           )
         )`,
        'CREATE POLICY "system_create_invoices_policy" ON invoices FOR INSERT WITH CHECK (true)',
      ],
    },
    // Workspace Invitations
    {
      table: "workspace_invitations",
      commands: [
        "ALTER TABLE workspace_invitations ENABLE ROW LEVEL SECURITY",
        `CREATE POLICY "view_invitations_policy" ON workspace_invitations
         FOR SELECT USING (
           email = (SELECT email FROM users WHERE id = auth.uid())
           OR invited_by = auth.uid()
           OR workspace_id IN (
             SELECT workspace_id FROM workspace_memberships
             WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
           )
         )`,
        `CREATE POLICY "create_invitations_policy" ON workspace_invitations
         FOR INSERT WITH CHECK (
           workspace_id IN (
             SELECT workspace_id FROM workspace_memberships
             WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
           )
         )`,
        `CREATE POLICY "update_invitations_policy" ON workspace_invitations
         FOR UPDATE USING (
           workspace_id IN (
             SELECT workspace_id FROM workspace_memberships
             WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
           )
         )`,
      ],
    },
    // Domains
    {
      table: "domains",
      commands: [
        "ALTER TABLE domains ENABLE ROW LEVEL SECURITY",
        `CREATE POLICY "view_domains_policy" ON domains
         FOR SELECT USING (
           workspace_id IN (
             SELECT workspace_id FROM workspace_memberships
             WHERE user_id = auth.uid()
           )
         )`,
        `CREATE POLICY "manage_domains_policy" ON domains
         FOR ALL USING (
           workspace_id IN (
             SELECT workspace_id FROM workspace_memberships
             WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
           )
         )`,
      ],
    },
    // Link Imports
    {
      table: "link_imports",
      commands: [
        "ALTER TABLE link_imports ENABLE ROW LEVEL SECURITY",
        `CREATE POLICY "view_imports_policy" ON link_imports
         FOR SELECT USING (
           workspace_id IN (
             SELECT workspace_id FROM workspace_memberships
             WHERE user_id = auth.uid()
           )
         )`,
        `CREATE POLICY "create_imports_policy" ON link_imports
         FOR INSERT WITH CHECK (
           workspace_id IN (
             SELECT workspace_id FROM workspace_memberships
             WHERE user_id = auth.uid()
           )
         )`,
      ],
    },
    // Tags
    {
      table: "tags",
      commands: [
        "ALTER TABLE tags ENABLE ROW LEVEL SECURITY",
        `CREATE POLICY "view_tags_policy" ON tags
         FOR SELECT USING (
           workspace_id IN (
             SELECT workspace_id FROM workspace_memberships
             WHERE user_id = auth.uid()
           )
         )`,
        `CREATE POLICY "manage_tags_policy" ON tags
         FOR ALL USING (
           workspace_id IN (
             SELECT workspace_id FROM workspace_memberships
             WHERE user_id = auth.uid()
           )
         )`,
      ],
    },
    // Usage Metrics
    {
      table: "usage_metrics",
      commands: [
        "ALTER TABLE usage_metrics ENABLE ROW LEVEL SECURITY",
        `CREATE POLICY "view_metrics_policy" ON usage_metrics
         FOR SELECT USING (
           workspace_id IN (
             SELECT workspace_id FROM workspace_memberships
             WHERE user_id = auth.uid()
           )
         )`,
        'CREATE POLICY "system_write_metrics_policy" ON usage_metrics FOR INSERT WITH CHECK (true)',
        'CREATE POLICY "system_update_metrics_policy" ON usage_metrics FOR UPDATE USING (true)',
      ],
    },
    // UTM Templates
    {
      table: "utm_templates",
      commands: [
        "ALTER TABLE utm_templates ENABLE ROW LEVEL SECURITY",
        `CREATE POLICY "view_utm_templates_policy" ON utm_templates
         FOR SELECT USING (
           workspace_id IN (
             SELECT workspace_id FROM workspace_memberships
             WHERE user_id = auth.uid()
           )
         )`,
        `CREATE POLICY "manage_utm_templates_policy" ON utm_templates
         FOR ALL USING (
           workspace_id IN (
             SELECT workspace_id FROM workspace_memberships
             WHERE user_id = auth.uid()
           )
         )`,
      ],
    },
  ];

  let successCount = 0;
  let failCount = 0;

  for (const { table, commands } of policies) {
    console.log(`📋 Processing ${table}...`);

    try {
      // Check if RLS is already enabled
      const rlsCheck = await prisma.$queryRaw`
        SELECT rowsecurity
        FROM pg_tables
        WHERE schemaname = 'public' AND tablename = ${table}
      `;

      if (rlsCheck[0]?.rowsecurity) {
        console.log(`   ⚠️  RLS already enabled on ${table}, skipping...`);
        continue;
      }

      // Apply each command
      for (const command of commands) {
        try {
          await prisma.$executeRawUnsafe(command);
          console.log(`   ✅ Applied: ${command.split(" ").slice(0, 3).join(" ")}...`);
        } catch (error) {
          if (error.message.includes("already exists")) {
            console.log(`   ⚠️  Policy already exists, skipping...`);
          } else {
            throw error;
          }
        }
      }

      successCount++;
      console.log(`   ✅ Successfully enabled RLS on ${table}\n`);
    } catch (error) {
      failCount++;
      console.error(`   ❌ Failed to enable RLS on ${table}: ${error.message}\n`);
    }
  }

  console.log("\n📊 Summary:");
  console.log(`   ✅ Successfully enabled RLS on ${successCount} tables`);
  if (failCount > 0) {
    console.log(`   ❌ Failed to enable RLS on ${failCount} tables`);
  }

  // Verify final RLS status
  console.log("\n🔍 Final RLS Status:");
  const finalStatus = await prisma.$queryRaw`
    SELECT tablename, rowsecurity
    FROM pg_tables
    WHERE schemaname = 'public'
    ORDER BY rowsecurity DESC, tablename
  `;

  const enabledTables = finalStatus.filter((t) => t.rowsecurity);
  const disabledTables = finalStatus.filter(
    (t) => !t.rowsecurity && t.tablename !== "_prisma_migrations"
  );

  console.log(`   ✅ Tables with RLS: ${enabledTables.length}`);
  console.log(`   ❌ Tables without RLS: ${disabledTables.length}`);

  if (disabledTables.length > 0) {
    console.log("\n   Tables still without RLS:");
    disabledTables.forEach((t) => console.log(`      - ${t.tablename}`));
  }

  await prisma.$disconnect();
}

applyRLSPolicies().catch((error) => {
  console.error("Fatal error:", error);
  prisma.$disconnect();
  process.exit(1);
});
