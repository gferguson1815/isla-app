const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function checkRLSPolicies() {
  try {
    // Get all RLS policies
    const policies = await prisma.$queryRaw`
      SELECT
        schemaname,
        tablename,
        policyname,
        permissive,
        roles,
        cmd,
        qual,
        with_check
      FROM pg_policies
      WHERE schemaname = 'public'
      ORDER BY tablename, policyname
    `;

    console.log("\n🔒 RLS Policies by Table:\n");

    // Group policies by table
    const policiesByTable = {};
    policies.forEach((policy) => {
      if (!policiesByTable[policy.tablename]) {
        policiesByTable[policy.tablename] = [];
      }
      policiesByTable[policy.tablename].push(policy);
    });

    // Tables with RLS enabled from previous query
    const rlsEnabledTables = [
      "analytics_aggregates",
      "audit_logs",
      "campaigns",
      "click_events",
      "folders",
      "links",
      "users",
      "workspace_memberships",
      "workspaces",
    ];

    // Check each RLS-enabled table
    rlsEnabledTables.forEach((tableName) => {
      if (tableName === "_prisma_migrations") return; // Skip system table

      const tablePolicies = policiesByTable[tableName] || [];

      if (tablePolicies.length === 0) {
        console.log(`❌ ${tableName}: RLS ENABLED but NO POLICIES (blocking all access!)`);
      } else {
        console.log(`✅ ${tableName}: ${tablePolicies.length} policies`);
        tablePolicies.forEach((policy) => {
          const cmdLabel = policy.cmd.padEnd(8);
          console.log(`   - ${policy.policyname} (${cmdLabel}) for roles: ${policy.roles}`);
        });
      }
      console.log("");
    });

    // Summary
    const tablesWithPolicies = Object.keys(policiesByTable).length;
    const totalPolicies = policies.length;
    const tablesWithoutPolicies = rlsEnabledTables.filter(
      (t) => t !== "_prisma_migrations" && !policiesByTable[t]
    );

    console.log("📊 Summary:");
    console.log(`   - Total policies: ${totalPolicies}`);
    console.log(`   - Tables with policies: ${tablesWithPolicies}`);
    console.log(`   - RLS-enabled tables without policies: ${tablesWithoutPolicies.length}`);

    if (tablesWithoutPolicies.length > 0) {
      console.log("\n⚠️  WARNING: The following tables have RLS enabled but no policies:");
      console.log("   (This means they will block ALL access except for service role!)");
      tablesWithoutPolicies.forEach((t) => console.log(`   - ${t}`));
    }
  } catch (error) {
    console.error("❌ Error checking policies:", error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkRLSPolicies();
