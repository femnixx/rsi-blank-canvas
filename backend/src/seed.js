import pg from "pg";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";

dotenv.config();

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || "postgres://postgres:postgres@localhost:5432/rsi_db",
});

const NOW = new Date();

async function seed() {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // Clear existing data (in reverse dependency order)
    await client.query("DELETE FROM workshop_attendance");
    await client.query("DELETE FROM workshop_registrations");
    await client.query("DELETE FROM workshop_materials");
    await client.query("DELETE FROM workshops");
    await client.query("DELETE FROM users");
    console.log("Cleared existing data");

    // 1. Create Admin user
    const adminHash = await bcrypt.hash("admin123", 10);
    const adminResult = await client.query(
      `INSERT INTO users (email, password_hash, role, nim)
       VALUES ($1, $2, $3, $4)
       RETURNING id`,
      ["admin@filkom.ub.ac.id", adminHash, "admin", "ADMIN001"]
    );
    const adminId = adminResult.rows[0].id;
    console.log("Created admin user");

    // 2. Create Student users with NIMs
    const students = [
      { email: "budi.santoso@student.ub.ac.id", nim: "2404001", name: "Budi Santoso" },
      { email: "siti.rahayu@student.ub.ac.id", nim: "2404002", name: "Siti Rahayu" },
      { email: "ahmad.fauzi@student.ub.ac.id", nim: "2404003", name: "Ahmad Fauzi" },
      { email: "dewi.lestari@student.ub.ac.id", nim: "2404004", name: "Dewi Lestari" },
      { email: "rudi.hermawan@student.ub.ac.id", nim: "2404005", name: "Rudi Hermawan" },
      { email: "maya.putri@student.ub.ac.id", nim: "2404006", name: "Maya Putri" },
      { email: "eko.prasetyo@student.ub.ac.id", nim: "2404007", name: "Eko Prasetyo" },
      { email: "lina.wulandari@student.ub.ac.id", nim: "2404008", name: "Lina Wulandari" },
      { email: "dani.saputra@student.ub.ac.id", nim: "2404009", name: "Dani Saputra" },
      { email: "rina.kurnia@student.ub.ac.id", nim: "2404010", name: "Rina Kurnia" },
    ];

    const studentIds = {};
    const studentHash = await bcrypt.hash("student123", 10);
    for (const s of students) {
      const res = await client.query(
        `INSERT INTO users (email, password_hash, role, nim)
         VALUES ($1, $2, $3, $4)
         RETURNING id`,
        [s.email, studentHash, "student", s.nim]
      );
      studentIds[s.nim] = { id: res.rows[0].id, email: s.email, name: s.name, nim: s.nim };
    }
    console.log(`Created ${students.length} student users`);

    // 3. Create Workshops (mix of past, ongoing, upcoming)
    const workshops = [
      {
        title: "Advanced React Patterns & Performance",
        description: "Deep dive into React optimization techniques: memo, useMemo, useCallback, virtualization, code splitting, and concurrent features. Hands-on workshop with real-world examples.",
        speaker_name: "Dr. Andi Wijaya, S.Kom., M.T.",
        event_date: new Date(NOW.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days from now
        location: "Lab Komputer 301, Gedung FILKOM",
      },
      {
        title: "Machine Learning Fundamentals with Python",
        description: "Introduction to ML concepts: supervised/unsupervised learning, regression, classification, clustering. Practical sessions with scikit-learn and pandas.",
        speaker_name: "Prof. Dr. Siti Nurhaliza, M.Sc.",
        event_date: new Date(NOW.getTime() + 14 * 24 * 60 * 60 * 1000).toISOString(), // 14 days from now
        location: "Aula Barat, Gedung FILKOM",
      },
      {
        title: "Cloud Native Development with Kubernetes",
        description: "Learn container orchestration: pods, services, deployments, configmaps, secrets, helm charts. Deploy microservices to local k8s cluster.",
        speaker_name: "Ir. Bambang Sutopo, M.Eng., Ph.D.",
        event_date: new Date(NOW.getTime() + 21 * 24 * 60 * 60 * 1000).toISOString(), // 21 days from now
        location: "Lab Jaringan 202, Gedung FILKOM",
      },
      {
        title: "UI/UX Design Sprint: From Research to Prototype",
        description: "5-day design sprint methodology: understand, define, sketch, decide, prototype, test. Figma hands-on with user testing.",
        speaker_name: "Des. Rina Marlina, S.Sn., M.Ds.",
        event_date: new Date(NOW.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days ago (past)
        location: "Studio Desain 101, Gedung FILKOM",
      },
      {
        title: "Cybersecurity Essentials: Web App Penetration Testing",
        description: "OWASP Top 10 vulnerabilities: SQLi, XSS, CSRF, authentication flaws. Burp Suite practical labs. Ethical hacking methodology.",
        speaker_name: "Dr. Hendra Gunawan, S.Kom., M.Kom., CISSP",
        event_date: new Date(NOW.getTime() - 10 * 24 * 60 * 60 * 1000).toISOString(), // 10 days ago (past)
        location: "Lab Security 404, Gedung FILKOM",
      },
      {
        title: "Mobile App Development with Flutter",
        description: "Cross-platform mobile development: Dart basics, widget tree, state management (Provider, Riverpod), navigation, API integration, deployment.",
        speaker_name: "Yoga Pratama, S.Kom., M.T.",
        event_date: new Date(NOW.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
        location: "Lab Mobile 303, Gedung FILKOM",
      },
    ];

    const workshopIds = [];
    for (const w of workshops) {
      const res = await client.query(
        `INSERT INTO workshops (title, description, speaker_name, event_date, location)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING id`,
        [w.title, w.description, w.speaker_name, w.event_date, w.location]
      );
      workshopIds.push({ id: res.rows[0].id, ...w });
    }
    console.log(`Created ${workshops.length} workshops`);

    // 4. Create Registrations
    // Workshop 1 (React) - upcoming, 5 registrants
    const reactRegs = [
      studentIds["2404001"], // Budi
      studentIds["2404002"], // Siti
      studentIds["2404003"], // Ahmad
      studentIds["2404004"], // Dewi
      studentIds["2404005"], // Rudi
    ];
    for (const s of reactRegs) {
      await client.query(
        `INSERT INTO workshop_registrations (workshop_id, user_id, student_nim)
         VALUES ($1, $2, $3)`,
        [workshopIds[0].id, s.id, s.nim]
      );
    }

    // Workshop 2 (ML) - upcoming, 4 registrants
    const mlRegs = [
      studentIds["2404002"], // Siti
      studentIds["2404004"], // Dewi
      studentIds["2404006"], // Maya
      studentIds["2404007"], // Eko
    ];
    for (const s of mlRegs) {
      await client.query(
        `INSERT INTO workshop_registrations (workshop_id, user_id, student_nim)
         VALUES ($1, $2, $3)`,
        [workshopIds[1].id, s.id, s.nim]
      );
    }

    // Workshop 3 (K8s) - upcoming, 3 registrants
    const k8sRegs = [
      studentIds["2404001"], // Budi
      studentIds["2404003"], // Ahmad
      studentIds["2404008"], // Lina
    ];
    for (const s of k8sRegs) {
      await client.query(
        `INSERT INTO workshop_registrations (workshop_id, user_id, student_nim)
         VALUES ($1, $2, $3)`,
        [workshopIds[2].id, s.id, s.nim]
      );
    }

    // Workshop 4 (UI/UX) - PAST, 6 registrants (some attended)
    const uxRegs = [
      studentIds["2404005"], // Rudi
      studentIds["2404006"], // Maya
      studentIds["2404007"], // Eko
      studentIds["2404008"], // Lina
      studentIds["2404009"], // Dani
      studentIds["2404010"], // Rina
    ];
    const uxRegIds = [];
    for (const s of uxRegs) {
      const res = await client.query(
        `INSERT INTO workshop_registrations (workshop_id, user_id, student_nim)
         VALUES ($1, $2, $3)
         RETURNING id`,
        [workshopIds[3].id, s.id, s.nim]
      );
      uxRegIds.push({ id: res.rows[0].id, user_id: s.id, nim: s.nim });
    }

    // Workshop 5 (Cybersecurity) - PAST, 5 registrants
    const secRegs = [
      studentIds["2404001"], // Budi
      studentIds["2404003"], // Ahmad
      studentIds["2404005"], // Rudi
      studentIds["2404009"], // Dani
      studentIds["2404010"], // Rina
    ];
    const secRegIds = [];
    for (const s of secRegs) {
      const res = await client.query(
        `INSERT INTO workshop_registrations (workshop_id, user_id, student_nim)
         VALUES ($1, $2, $3)
         RETURNING id`,
        [workshopIds[4].id, s.id, s.nim]
      );
      secRegIds.push({ id: res.rows[0].id, user_id: s.id, nim: s.nim });
    }

    // Workshop 6 (Flutter) - upcoming, 2 registrants
    const flutterRegs = [
      studentIds["2404002"], // Siti
      studentIds["2404010"], // Rina
    ];
    for (const s of flutterRegs) {
      await client.query(
        `INSERT INTO workshop_registrations (workshop_id, user_id, student_nim)
         VALUES ($1, $2, $3)`,
        [workshopIds[5].id, s.id, s.nim]
      );
    }
    console.log("Created workshop registrations");

    // 5. Create Attendance Records
    // UI/UX Workshop (past) - 4 attended, 2 absent
    const uxAttended = [uxRegIds[0], uxRegIds[1], uxRegIds[2], uxRegIds[3]]; // Rudi, Maya, Eko, Lina
    for (const r of uxAttended) {
      await client.query(
        `INSERT INTO workshop_attendance (registration_id, workshop_id, user_id, status, checked_in_at)
         VALUES ($1, $2, $3, 'present', $4)
         ON CONFLICT (workshop_id, user_id) DO NOTHING`,
        [r.id, workshopIds[3].id, r.user_id, new Date(NOW.getTime() - 3 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000).toISOString()]
      );
    }

    // Cybersecurity Workshop (past) - 3 attended, 2 absent
    const secAttended = [secRegIds[0], secRegIds[1], secRegIds[2]]; // Budi, Ahmad, Rudi
    for (const r of secAttended) {
      await client.query(
        `INSERT INTO workshop_attendance (registration_id, workshop_id, user_id, status, checked_in_at)
         VALUES ($1, $2, $3, 'present', $4)
         ON CONFLICT (workshop_id, user_id) DO NOTHING`,
        [r.id, workshopIds[4].id, r.user_id, new Date(NOW.getTime() - 10 * 24 * 60 * 60 * 1000 + 1 * 60 * 60 * 1000).toISOString()]
      );
    }
    console.log("Created attendance records");

    // 6. Create Workshop Materials
    const materials = [
      { workshopIdx: 0, title: "React Patterns Slides", file_url: "/uploads/react-patterns-slides.pdf" },
      { workshopIdx: 0, title: "React Performance Code Samples", file_url: "/uploads/react-code-samples.zip" },
      { workshopIdx: 1, title: "ML Fundamentals Notebook", file_url: "/uploads/ml-fundamentals.ipynb" },
      { workshopIdx: 1, title: "Scikit-learn Cheatsheet", file_url: "/uploads/sklearn-cheatsheet.pdf" },
      { workshopIdx: 2, title: "Kubernetes Manifests Examples", file_url: "/uploads/k8s-manifests.zip" },
      { workshopIdx: 2, title: "Helm Chart Tutorial", file_url: "/uploads/helm-tutorial.pdf" },
      { workshopIdx: 3, title: "Design Sprint Template (Figma)", file_url: "/uploads/design-sprint-template.fig" },
      { workshopIdx: 3, title: "User Research Guide", file_url: "/uploads/user-research-guide.pdf" },
      { workshopIdx: 4, title: "OWASP Top 10 Reference", file_url: "/uploads/owasp-top10.pdf" },
      { workshopIdx: 4, title: "Burp Suite Lab Guide", file_url: "/uploads/burp-suite-lab.pdf" },
      { workshopIdx: 5, title: "Flutter Widget Catalog", file_url: "/uploads/flutter-widgets.pdf" },
      { workshopIdx: 5, title: "State Management Comparison", file_url: "/uploads/state-mgmt-comparison.pdf" },
    ];

    for (const m of materials) {
      await client.query(
        `INSERT INTO workshop_materials (workshop_id, title, file_url)
         VALUES ($1, $2, $3)`,
        [workshopIds[m.workshopIdx].id, m.title, m.file_url]
      );
    }
    console.log(`Created ${materials.length} workshop materials`);

    await client.query("COMMIT");
    console.log("\n✅ Database seeded successfully!");
    console.log("\n📋 Test Credentials:");
    console.log("  Admin:    admin@filkom.ub.ac.id / admin123");
    console.log("  Students: (any email above) / student123");
    console.log("  NIMs:     2404001 - 2404010");
    console.log("\n🎯 Workshop Summary:");
    for (let i = 0; i < workshopIds.length; i++) {
      const w = workshopIds[i];
      const isPast = new Date(w.event_date) < NOW;
      const status = isPast ? "✅ PAST" : "🔜 UPCOMING";
      console.log(`  ${i+1}. ${w.title} - ${status} (${w.location})`);
    }
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("❌ Seed failed:", err);
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});