/**
 * Seed for CCTU StudyHub.
 *
 * The taxonomy below is a *provisional* CCTU structure — §9 of the design plan
 * lists "real faculty/department/course list" as an open item to confirm with
 * the school. Replace the FACULTIES constant with the official list and re-run
 * `npm run db:seed`; it upserts, so it is safe to run repeatedly.
 */
import { PrismaClient, MaterialType, Role } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { mkdir, writeFile } from 'fs/promises';
import path from 'path';
import { randomUUID } from 'crypto';

const prisma = new PrismaClient();

const slug = (s: string) =>
  s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

const FACULTIES: {
  name: string;
  departments: { name: string; courses: [string, string, number][] }[];
}[] = [
  {
    name: 'Faculty of Engineering',
    departments: [
      {
        name: 'Civil Engineering',
        courses: [
          ['CENG 101', 'Engineering Drawing I', 100],
          ['CENG 205', 'Strength of Materials', 200],
          ['CENG 301', 'Structural Analysis', 300],
          ['CENG 412', 'Geotechnical Engineering', 400],
        ],
      },
      {
        name: 'Electrical and Electronic Engineering',
        courses: [
          ['EENG 103', 'Circuit Theory I', 100],
          ['EENG 214', 'Electrical Machines', 200],
          ['EENG 322', 'Power Systems Analysis', 300],
          ['EENG 401', 'Control Systems', 400],
        ],
      },
      {
        name: 'Mechanical Engineering',
        courses: [
          ['MENG 102', 'Engineering Mechanics', 100],
          ['MENG 231', 'Thermodynamics I', 200],
          ['MENG 315', 'Fluid Mechanics', 300],
        ],
      },
    ],
  },
  {
    name: 'Faculty of Applied Sciences',
    departments: [
      {
        name: 'Computer Science',
        courses: [
          ['CSC 101', 'Introduction to Computing', 100],
          ['CSC 204', 'Data Structures and Algorithms', 200],
          ['CSC 308', 'Database Systems', 300],
          ['CSC 401', 'Software Engineering', 400],
        ],
      },
      {
        name: 'Statistics and Mathematical Sciences',
        courses: [
          ['MATH 111', 'Algebra and Trigonometry', 100],
          ['STAT 202', 'Probability and Statistics', 200],
          ['MATH 305', 'Numerical Methods', 300],
        ],
      },
      {
        name: 'Science Laboratory Technology',
        courses: [
          ['SLT 105', 'General Chemistry', 100],
          ['SLT 210', 'Analytical Techniques', 200],
        ],
      },
    ],
  },
  {
    name: 'Faculty of Business and Management Studies',
    departments: [
      {
        name: 'Accountancy',
        courses: [
          ['ACC 101', 'Principles of Accounting', 100],
          ['ACC 210', 'Cost and Management Accounting', 200],
          ['ACC 320', 'Taxation and Fiscal Policy', 300],
        ],
      },
      {
        name: 'Marketing',
        courses: [
          ['MKT 104', 'Principles of Marketing', 100],
          ['MKT 302', 'Consumer Behaviour', 300],
        ],
      },
      {
        name: 'Procurement and Supply Chain Management',
        courses: [
          ['PSM 201', 'Public Procurement Law', 200],
          ['PSM 306', 'Logistics Management', 300],
        ],
      },
    ],
  },
  {
    name: 'Faculty of Built and Natural Environment',
    departments: [
      {
        name: 'Building Technology',
        courses: [
          ['BTC 110', 'Construction Technology I', 100],
          ['BTC 304', 'Quantity Surveying', 300],
        ],
      },
      {
        name: 'Estate Management',
        courses: [
          ['EST 202', 'Property Valuation', 200],
          ['EST 401', 'Land Law and Administration', 400],
        ],
      },
    ],
  },
  {
    name: 'Faculty of Applied Arts and Technology',
    departments: [
      {
        name: 'Fashion Design and Textiles',
        courses: [
          ['FDT 101', 'Textile Science', 100],
          ['FDT 208', 'Pattern Drafting', 200],
        ],
      },
      {
        name: 'Hospitality and Tourism Management',
        courses: [
          ['HTM 105', 'Introduction to Hospitality', 100],
          ['HTM 301', 'Food and Beverage Management', 300],
        ],
      },
    ],
  },
];

/** Build a tiny but structurally valid one-page PDF so seeded downloads work. */
function makePdf(title: string, subtitle: string) {
  const esc = (s: string) => s.replace(/([\\()])/g, '\\$1');
  const content = `BT /F1 20 Tf 60 760 Td (${esc(title)}) Tj ET
BT /F1 12 Tf 60 730 Td (${esc(subtitle)}) Tj ET
BT /F1 10 Tf 60 700 Td (Sample document seeded for CCTU StudyHub development.) Tj ET`;

  const objects = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>',
    `<< /Length ${content.length} >>\nstream\n${content}\nendstream`,
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
  ];

  let pdf = '%PDF-1.4\n';
  const offsets: number[] = [];
  objects.forEach((body, i) => {
    offsets.push(pdf.length);
    pdf += `${i + 1} 0 obj\n${body}\nendobj\n`;
  });
  const xrefStart = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  offsets.forEach((o) => {
    pdf += `${o.toString().padStart(10, '0')} 00000 n \n`;
  });
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF`;
  return Buffer.from(pdf, 'latin1');
}

async function storeSeedPdf(title: string, subtitle: string) {
  const key = `materials/seed/${randomUUID()}-${slug(title)}.pdf`;
  const dest = path.join(process.cwd(), 'storage', key);
  const buffer = makePdf(title, subtitle);
  await mkdir(path.dirname(dest), { recursive: true });
  await writeFile(dest, buffer);
  return { key, url: `/api/files/${key}`, size: buffer.length };
}

async function upsertUser(opts: {
  email: string;
  name: string;
  role: Role;
  password: string;
  phone?: string;
  indexNumber?: string;
  addedById?: string;
}) {
  const passwordHash = await bcrypt.hash(opts.password, 10);
  return prisma.user.upsert({
    where: { email: opts.email },
    update: {
      name: opts.name,
      role: opts.role,
      phone: opts.phone,
      indexNumber: opts.indexNumber,
      addedById: opts.addedById,
    },
    create: {
      email: opts.email,
      name: opts.name,
      role: opts.role,
      passwordHash,
      phone: opts.phone,
      indexNumber: opts.indexNumber,
      addedById: opts.addedById,
    },
  });
}

async function main() {
  console.log('› Seeding taxonomy…');
  const courseIndex: Record<string, string> = {};

  for (const f of FACULTIES) {
    const faculty = await prisma.faculty.upsert({
      where: { slug: slug(f.name) },
      update: { name: f.name },
      create: { name: f.name, slug: slug(f.name) },
    });

    for (const d of f.departments) {
      const department = await prisma.department.upsert({
        where: { slug: slug(d.name) },
        update: { name: d.name, facultyId: faculty.id },
        create: { name: d.name, slug: slug(d.name), facultyId: faculty.id },
      });

      for (const [code, title, level] of d.courses) {
        const course = await prisma.course.upsert({
          where: { code_departmentId: { code, departmentId: department.id } },
          update: { title, level },
          create: { code, title, level, departmentId: department.id },
        });
        courseIndex[code] = course.id;
      }
    }
  }

  console.log('› Seeding users…');
  const admin = await upsertUser({
    email: (process.env.SEED_ADMIN_EMAIL || 'admin@cctu.edu.gh').toLowerCase(),
    name: 'StudyHub Super Admin',
    role: 'SUPER_ADMIN',
    password: process.env.SEED_ADMIN_PASSWORD || 'ChangeMe123!',
    phone: '+233200000000',
  });

  const lecturer = await upsertUser({
    email: 'k.mensah@cctu.edu.gh',
    name: 'Dr. Kwabena Mensah',
    role: 'LECTURER',
    password: 'Lecturer123!',
    phone: '+233240000001',
    addedById: admin.id,
  });

  const lecturer2 = await upsertUser({
    email: 'a.boateng@cctu.edu.gh',
    name: 'Dr. Ama Boateng',
    role: 'LECTURER',
    password: 'Lecturer123!',
    phone: '+233240000002',
    addedById: admin.id,
  });

  const ta = await upsertUser({
    email: 'j.owusu@cctu.edu.gh',
    name: 'Joseph Owusu (TA)',
    role: 'TA',
    password: 'Assistant123!',
    phone: '+233240000003',
    addedById: lecturer.id,
  });

  const student = await upsertUser({
    email: 'student@cctu.edu.gh',
    name: 'Akosua Danso',
    role: 'STUDENT',
    password: 'Student123!',
    phone: '+233550000001',
    indexNumber: 'CS/2022/0451',
  });

  const student2 = await upsertUser({
    email: 'kofi@cctu.edu.gh',
    name: 'Kofi Asare',
    role: 'STUDENT',
    password: 'Student123!',
    phone: '+233550000002',
    indexNumber: 'CE/2021/0187',
  });

  // Assign primary lecturers to a handful of courses.
  await prisma.course.updateMany({
    where: { id: { in: [courseIndex['CSC 204'], courseIndex['CSC 308'], courseIndex['CSC 401']] } },
    data: { lecturerId: lecturer.id },
  });
  await prisma.course.updateMany({
    where: { id: { in: [courseIndex['CENG 301'], courseIndex['CENG 412']] } },
    data: { lecturerId: lecturer2.id },
  });

  console.log('› Seeding materials…');
  const materialSeed: {
    code: string;
    title: string;
    type: MaterialType;
    by: string;
    free: boolean;
    price?: number;
    status: 'APPROVED' | 'PENDING';
    auto: boolean;
    year: string;
    semester: string;
    lecturerName: string;
  }[] = [
    { code: 'CSC 204', title: 'Data Structures — End of Semester Exam', type: 'PAST_EXAM', by: lecturer.id, free: true, status: 'APPROVED', auto: true, year: '2023/2024', semester: 'First Semester', lecturerName: 'Dr. Kwabena Mensah' },
    { code: 'CSC 204', title: 'Data Structures — Complete Tutorial Pack', type: 'TUTORIAL', by: ta.id, free: false, price: 8, status: 'APPROVED', auto: true, year: '2024/2025', semester: 'First Semester', lecturerName: 'Dr. Kwabena Mensah' },
    { code: 'CSC 308', title: 'Database Systems — Normalisation Handout', type: 'HANDOUT', by: lecturer.id, free: true, status: 'APPROVED', auto: true, year: '2024/2025', semester: 'Second Semester', lecturerName: 'Dr. Kwabena Mensah' },
    { code: 'CSC 308', title: 'Database Systems — Mid-Semester Quiz with Solutions', type: 'QUIZ', by: student.id, free: false, price: 5, status: 'APPROVED', auto: false, year: '2023/2024', semester: 'Second Semester', lecturerName: 'Dr. Kwabena Mensah' },
    { code: 'CSC 401', title: 'Software Engineering — Past Questions 2019-2024', type: 'PAST_EXAM', by: student2.id, free: false, price: 12, status: 'APPROVED', auto: false, year: '2023/2024', semester: 'First Semester', lecturerName: 'Dr. Kwabena Mensah' },
    { code: 'CENG 301', title: 'Structural Analysis — Worked Examples', type: 'TUTORIAL', by: lecturer2.id, free: true, status: 'APPROVED', auto: true, year: '2024/2025', semester: 'First Semester', lecturerName: 'Dr. Ama Boateng' },
    { code: 'CENG 412', title: 'Geotechnical Engineering — Soil Mechanics Text', type: 'BOOK', by: lecturer2.id, free: false, price: 20, status: 'APPROVED', auto: true, year: '2022/2023', semester: 'Second Semester', lecturerName: 'Dr. Ama Boateng' },
    { code: 'ACC 210', title: 'Cost Accounting — Revision Booklet', type: 'HANDOUT', by: student.id, free: true, status: 'PENDING', auto: false, year: '2024/2025', semester: 'First Semester', lecturerName: 'Mr. Yaw Frimpong' },
    { code: 'EENG 322', title: 'Power Systems — Final Year Thesis Sample', type: 'THESIS', by: student2.id, free: false, price: 15, status: 'PENDING', auto: false, year: '2023/2024', semester: 'Second Semester', lecturerName: 'Dr. Eric Tetteh' },
    { code: 'MATH 111', title: 'Algebra & Trigonometry — Past Exam 2022/2023', type: 'PAST_EXAM', by: student.id, free: true, status: 'APPROVED', auto: false, year: '2022/2023', semester: 'First Semester', lecturerName: 'Mrs. Gifty Nkrumah' },
  ];

  const existing = await prisma.material.count();
  if (existing === 0) {
    for (const m of materialSeed) {
      const file = await storeSeedPdf(m.title, `${m.code} · ${m.year}`);
      await prisma.material.create({
        data: {
          title: m.title,
          type: m.type,
          courseId: courseIndex[m.code],
          uploadedById: m.by,
          lecturerName: m.lecturerName,
          academicYear: m.year,
          semester: m.semester,
          isFree: m.free,
          price: m.free ? null : m.price,
          fileUrl: file.url,
          fileKey: file.key,
          fileName: `${slug(m.title)}.pdf`,
          fileSize: file.size,
          mimeType: 'application/pdf',
          status: m.status,
          autoPublished: m.auto,
          reviewedById: m.status === 'APPROVED' && !m.auto ? admin.id : null,
          reviewedAt: m.status === 'APPROVED' && !m.auto ? new Date() : null,
          downloadCount: Math.floor(Math.random() * 180),
        },
      });
    }
  } else {
    console.log(`  (skipped — ${existing} materials already present)`);
  }

  console.log('› Seeding points, subscriptions and affiliate links…');
  if ((await prisma.pointTransaction.count()) === 0) {
    await prisma.pointTransaction.createMany({
      data: [
        {
          userId: student.id,
          source: 'UPLOAD_VERIFIED',
          courseId: courseIndex['CSC 308'],
          points: 10,
          note: 'Upload approved by Super Admin',
          studentName: 'Akosua Danso',
          indexNumber: 'CS/2022/0451',
        },
        {
          userId: student.id,
          source: 'PURCHASE_AWARDED',
          courseId: courseIndex['CSC 204'],
          points: 5,
          note: 'Purchased tutorial pack',
          awardedById: lecturer.id,
          studentName: 'Akosua Danso',
          indexNumber: 'CS/2022/0451',
        },
        {
          userId: student2.id,
          source: 'UPLOAD_VERIFIED',
          courseId: courseIndex['CSC 401'],
          points: 10,
          note: 'Upload approved by Super Admin',
          studentName: 'Kofi Asare',
          indexNumber: 'CE/2021/0187',
        },
      ],
    });
  }

  if ((await prisma.affiliateLink.count()) === 0) {
    await prisma.affiliateLink.createMany({
      data: [
        {
          label: 'Summarise this with NotebookLM',
          description:
            'Drop the PDF into NotebookLM and get a study guide, FAQ and audio overview.',
          targetUrl: 'https://notebooklm.google.com/',
          placement: 'post-download',
        },
        {
          label: 'Turn this into flashcards with Quizlet',
          description: 'Auto-generate flashcards from your handout before the exam.',
          targetUrl: 'https://quizlet.com/',
          placement: 'post-download',
        },
        {
          label: 'Print & bind at the campus press',
          description: 'Bulk printing discounts for StudyHub students.',
          targetUrl: 'https://example.com/campus-press',
          placement: 'material-page',
        },
      ],
    });
  }

  if ((await prisma.notificationSubscription.count()) === 0) {
    await prisma.notificationSubscription.createMany({
      data: [
        { studentId: student.id, courseId: courseIndex['CSC 204'] },
        { studentId: student.id, courseId: courseIndex['CSC 308'] },
        { studentId: student2.id, courseId: courseIndex['CENG 301'] },
        { studentId: student2.id, lecturerId: lecturer.id },
      ],
    });
  }

  console.log('\n✔ Seed complete.\n');
  console.log('  Super Admin :', admin.email, '/', process.env.SEED_ADMIN_PASSWORD || 'ChangeMe123!');
  console.log('  Lecturer    : k.mensah@cctu.edu.gh / Lecturer123!');
  console.log('  TA          : j.owusu@cctu.edu.gh / Assistant123!');
  console.log('  Student     : student@cctu.edu.gh / Student123!\n');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
