import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding NextGen Research and Innovation Press database...');

  // Clean existing data
  await prisma.aLM_cleanup?.(); // if any
  await prisma.auditEvent.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.dOIDepositAttempt.deleteMany();
  await prisma.dOIRecord.deleteMany();
  await prisma.articleKeyword.deleteMany();
  await prisma.articleReference.deleteMany();
  await prisma.publishedArticle.deleteMany();
  await prisma.discussionMessage.deleteMany();
  await prisma.editorialDecision.deleteMany();
  await prisma.reviewReport.deleteMany();
  await prisma.reviewAssignment.deleteMany();
  await prisma.manuscriptVersion.deleteMany();
  await prisma.manuscriptFile.deleteMany();
  await prisma.submissionAuthor.deleteMany();
  await prisma.submission.deleteMany();
  await prisma.issue.deleteMany();
  await prisma.volume.deleteMany();
  await prisma.editorialBoardMember.deleteMany();
  await prisma.userRoleAssignment.deleteMany();
  await prisma.journal.deleteMany();
  await prisma.session.deleteMany();
  await prisma.account.deleteMany();
  await prisma.user.deleteMany();
  await prisma.systemSetting.deleteMany();

  const defaultPassword = await bcrypt.hash('NextGen2026!', 10);

  // 1. Create Core Users
  const masterAdmin = await prisma.user.create({
    data: {
      name: 'Dr. Evelyn Vance',
      email: 'admin@nextgen-press.org',
      passwordHash: defaultPassword,
      affiliation: 'NextGen Press Governance Board',
      country: 'United States',
      orcid: '0000-0002-1825-0097',
      bio: 'Executive Director and Master Publisher at NextGen Research and Innovation Press.',
      roleAssignments: {
        create: [
          { role: 'MASTER_ADMIN' },
          { role: 'AUTHOR' }
        ]
      }
    }
  });

  const editorMarcus = await prisma.user.create({
    data: {
      name: 'Prof. Marcus Chen',
      email: 'editor.chen@nextgen-press.org',
      passwordHash: defaultPassword,
      affiliation: 'Massachusetts Institute of Technology (MIT)',
      country: 'United States',
      orcid: '0000-0003-4921-8840',
      bio: 'Professor of Computer Science and Machine Learning. Editor-in-Chief for JSTAI.',
      roleAssignments: {
        create: [
          { role: 'EDITOR' },
          { role: 'JOURNAL_MANAGER' },
          { role: 'AUTHOR' }
        ]
      }
    }
  });

  const editorElena = await prisma.user.create({
    data: {
      name: 'Dr. Elena Alvarez',
      email: 'editor.alvarez@nextgen-press.org',
      passwordHash: defaultPassword,
      affiliation: 'Imperial College London',
      country: 'United Kingdom',
      orcid: '0000-0001-9034-7112',
      bio: 'Reader in Systems Engineering and Computational Architecture. Senior Editor for NECR.',
      roleAssignments: {
        create: [
          { role: 'EDITOR' },
          { role: 'AUTHOR' }
        ]
      }
    }
  });

  const reviewerTuring = await prisma.user.create({
    data: {
      name: 'Dr. Alan K. Vance-Turing',
      email: 'reviewer.turing@univ.edu',
      passwordHash: defaultPassword,
      affiliation: 'Cambridge Computing Laboratory',
      country: 'United Kingdom',
      orcid: '0000-0002-5511-9304',
      bio: 'Expert in algorithmic verification, distributed systems, and neural optimization.',
      roleAssignments: {
        create: [
          { role: 'REVIEWER' },
          { role: 'AUTHOR' }
        ]
      }
    }
  });

  const reviewerSommer = await prisma.user.create({
    data: {
      name: 'Dr. Sophia Sommer',
      email: 'reviewer.sommer@tech.ac.uk',
      passwordHash: defaultPassword,
      affiliation: 'ETH Zürich - Department of Computer Science',
      country: 'Switzerland',
      orcid: '0000-0003-1288-4491',
      bio: 'Senior Researcher focusing on federated learning, cryptography, and edge hardware.',
      roleAssignments: {
        create: [
          { role: 'REVIEWER' },
          { role: 'AUTHOR' }
        ]
      }
    }
  });

  const authorDavid = await prisma.user.create({
    data: {
      name: 'Dr. David Lewis',
      email: 'author.lewis@research.org',
      passwordHash: defaultPassword,
      affiliation: 'Stanford Artificial Intelligence Laboratory (SAIL)',
      country: 'United States',
      orcid: '0000-0001-6789-2311',
      bio: 'Postdoctoral Fellow researching decentralized compute networks and large-scale deep learning systems.',
      roleAssignments: {
        create: [
          { role: 'AUTHOR' }
        ]
      }
    }
  });

  const authorAmina = await prisma.user.create({
    data: {
      name: 'Dr. Amina Patel',
      email: 'author.patel@globaltech.edu',
      passwordHash: defaultPassword,
      affiliation: 'National University of Singapore (NUS)',
      country: 'Singapore',
      orcid: '0000-0002-8812-7095',
      bio: 'Assistant Professor working on trustworthy cryptographic protocols and zero-knowledge systems.',
      roleAssignments: {
        create: [
          { role: 'AUTHOR' }
        ]
      }
    }
  });

  console.log('Created users and assigned roles.');

  // 2. Create Journals
  const journalJSTAI = await prisma.journal.create({
    data: {
      slug: 'jstai',
      title: 'Journal of Science, Technology & AI',
      abbreviation: 'J. Sci. Technol. AI',
      description: 'A peer-reviewed, open-access international scholarly journal advancing foundational and applied innovations in computer science, machine intelligence, neural architectures, and scientific computing.',
      aimsScope: 'JSTAI publishes original research, systematic reviews, and technical notes spanning machine learning theory, autonomous systems, scalable cloud architectures, generative models, quantum algorithms, and computational physics. All submissions undergo double-anonymous peer review.',
      publisher: 'NextGen Research and Innovation Press',
      printIssn: '2834-9102',
      onlineIssn: '2834-9110',
      peerReviewPolicy: 'Rigorous double-anonymous peer review conducted by independent domain experts. Minimum two review reports required prior to editorial decision.',
      openAccessPolicy: 'Diamond Open Access: immediate and unrestricted global access with no fees for readers or authors.',
      licensingPolicy: 'Creative Commons Attribution 4.0 International (CC BY 4.0)',
      apcInfo: 'All article processing charges (APCs) are fully sponsored by NextGen Press Foundation for the current publishing year.',
      contactEmail: 'jstai-editorial@nextgen-press.org',
      logoUrl: '/logos/jstai-logo.svg',
      coverImageUrl: '/covers/jstai-cover.jpg',
      editorialBoard: {
        create: [
          {
            userId: editorMarcus.id,
            roleTitle: 'Editor-in-Chief',
            affiliation: 'MIT Computer Science & AI Lab',
            displayOrder: 1
          },
          {
            userId: reviewerTuring.id,
            roleTitle: 'Associate Editor - Algorithms & Optimization',
            affiliation: 'Cambridge Computing Laboratory',
            displayOrder: 2
          },
          {
            userId: reviewerSommer.id,
            roleTitle: 'Section Editor - Distributed Intelligence',
            affiliation: 'ETH Zürich',
            displayOrder: 3
          }
        ]
      }
    }
  });

  const journalNECR = await prisma.journal.create({
    data: {
      slug: 'necr',
      title: 'NextGen Engineering & Computing Review',
      abbreviation: 'NextGen Eng. Comput. Rev.',
      description: 'Disseminating rigorous theoretical, experimental, and applied engineering solutions for cyber-physical infrastructure, sustainable microelectronics, and advanced systems architecture.',
      aimsScope: 'Emphasizes high-impact contributions in embedded systems, renewable energy grid control, resilient telecommunications, robotic automation, and novel computing hardware.',
      publisher: 'NextGen Research and Innovation Press',
      printIssn: '2941-1044',
      onlineIssn: '2941-1052',
      peerReviewPolicy: 'Double-anonymous peer review with comprehensive technical and reproducibility verifications.',
      openAccessPolicy: 'Open Access under CC BY 4.0 license.',
      licensingPolicy: 'Creative Commons Attribution 4.0 International (CC BY 4.0)',
      apcInfo: 'Waived for academic institutions during the 2026 inaugural volume.',
      contactEmail: 'necr-editorial@nextgen-press.org',
      editorialBoard: {
        create: [
          {
            userId: editorElena.id,
            roleTitle: 'Editor-in-Chief',
            affiliation: 'Imperial College London',
            displayOrder: 1
          }
        ]
      }
    }
  });

  const journalIHLS = await prisma.journal.create({
    data: {
      slug: 'ihls',
      title: 'Interdisciplinary Health & Life Sciences',
      abbreviation: 'Interdiscip. Health Life Sci.',
      description: 'Bridging computational medicine, genomics, clinical informatics, and biomedical engineering to accelerate translational healthcare breakthroughs.',
      aimsScope: 'Publishes interdisciplinary research combining AI-driven diagnostic imaging, biostatistics, synthetic biology, and clinical informatics with clinical trial datasets.',
      publisher: 'NextGen Research and Innovation Press',
      printIssn: '2988-3412',
      onlineIssn: '2988-3420',
      peerReviewPolicy: 'Rigorous peer review with dedicated biostatistical screening.',
      openAccessPolicy: 'Immediate open access under Creative Commons Attribution 4.0.',
      licensingPolicy: 'Creative Commons Attribution 4.0 International (CC BY 4.0)',
      contactEmail: 'ihls-editorial@nextgen-press.org',
    }
  });

  console.log('Created journals and editorial boards.');

  // 3. Create Volumes and Issues for JSTAI
  const volume1 = await prisma.volume.create({
    data: {
      journalId: journalJSTAI.id,
      volumeNumber: 1,
      year: 2026,
      title: 'Volume 1 (2026): Foundational and Scalable Machine Intelligence',
      description: 'Inaugural volume showcasing breakthrough architectures in neural networks, verification, and distributed execution.'
    }
  });

  const issue1 = await prisma.issue.create({
    data: {
      journalId: journalJSTAI.id,
      volumeId: volume1.id,
      issueNumber: 1,
      year: 2026,
      title: 'Inaugural Issue: Scalable AI & Neural Systems',
      description: 'Features peer-reviewed research on high-dimensional optimization, decentralized verification, and transformer silicon.',
      status: 'PUBLISHED',
      publicationDate: new Date('2026-03-15T00:00:00Z'),
      editorialIntroduction: 'We are proud to introduce Volume 1, Issue 1 of the Journal of Science, Technology & AI. In this issue, leading scholars present landmark findings in heterogeneous cluster orchestration and cryptographic smart contract verification.'
    }
  });

  const issue2 = await prisma.issue.create({
    data: {
      journalId: journalJSTAI.id,
      volumeId: volume1.id,
      issueNumber: 2,
      year: 2026,
      title: 'Special Issue on Privacy-Preserving and Edge Computing',
      description: 'Focused on zero-knowledge verification, edge transformers, and federated learning architectures.',
      status: 'IN_PROGRESS',
      scheduledPublishDate: new Date('2026-11-30T00:00:00Z'),
      editorialIntroduction: 'Currently assembling peer-reviewed manuscripts scheduled for late 2026 publication.'
    }
  });

  console.log('Created volumes and issues.');

  // 4. Create Published Articles in JSTAI Issue 1
  // Submission 1: Published
  const sub1 = await prisma.submission.create({
    data: {
      submissionNumber: 'NGR-2026-0001',
      journalId: journalJSTAI.id,
      authorId: authorDavid.id,
      articleType: 'RESEARCH_ARTICLE',
      title: 'Neural Foundations of High-Dimensional Optimization in Heterogeneous Compute Clusters',
      subtitle: 'A Gradient Decomposition Approach for Asynchronous Multi-GPU Workloads',
      abstract: 'Distributed training of massive neural models across heterogeneous hardware topologies introduces non-trivial communication latency and gradient drift. In this paper, we propose TensorSync, an asynchronous gradient decomposition framework that adaptively quantizes stochastic gradient vectors based on interconnect bandwidth profiles. Evaluated on a 512-GPU heterogeneous cluster, our approach achieves a 2.4x speedup over conventional AllReduce primitives while preserving exact model convergence across vision and transformer benchmarks.',
      discipline: 'Computer Science - Machine Learning & Distributed Systems',
      status: 'PUBLISHED',
      reviewModel: 'DOUBLE_ANONYMOUS',
      conflictOfInterest: 'The authors declare that they have no competing financial interests.',
      ethicsStatement: 'Not applicable. The study utilized open synthetic benchmark datasets and simulated distributed workloads.',
      fundingInfo: 'Supported in part by National Science Foundation Grant CNS-2401882.',
      dataAvailability: 'Complete benchmark scripts and simulation configurations are archived at Zenodo and GitHub.',
      assignedEditorId: editorMarcus.id,
      submittedAt: new Date('2026-01-10T14:22:00Z'),
      acceptedAt: new Date('2026-02-28T09:15:00Z'),
      publishedAt: new Date('2026-03-15T00:00:00Z'),
      coAuthors: {
        create: [
          {
            firstName: 'David',
            lastName: 'Lewis',
            email: 'author.lewis@research.org',
            affiliation: 'Stanford University',
            country: 'United States',
            orcid: '0000-0001-6789-2311',
            isCorresponding: true,
            authorOrder: 1
          },
          {
            firstName: 'Kavita',
            lastName: 'Raman',
            email: 'k.raman@berkeley.edu',
            affiliation: 'UC Berkeley',
            country: 'United States',
            orcid: '0000-0002-4410-1893',
            isCorresponding: false,
            authorOrder: 2
          }
        ]
      },
      files: {
        create: [
          {
            versionNumber: 1,
            fileType: 'MANUSCRIPT_DOCX',
            originalFileName: 'TensorSync_Optimization_Final.docx',
            storageKey: 'submissions/NGR-2026-0001/v1/TensorSync_Optimization_Final.docx',
            storageUrl: '/storage/sample-manuscript.docx',
            mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            fileSize: 428900,
            isConfidential: false,
            uploadedById: authorDavid.id
          },
          {
            versionNumber: 1,
            fileType: 'FINAL_TYPESET_PDF',
            originalFileName: 'JSTAI_2026_001_Lewis_TensorSync.pdf',
            storageKey: 'published/jstai/2026/JSTAI_2026_001_Lewis_TensorSync.pdf',
            storageUrl: '/storage/published/JSTAI_2026_001_Lewis_TensorSync.pdf',
            mimeType: 'application/pdf',
            fileSize: 1048576,
            isConfidential: false,
            uploadedById: editorMarcus.id
          }
        ]
      },
      editorialDecisions: {
        create: [
          {
            editorId: editorMarcus.id,
            decision: 'ACCEPT',
            rationale: 'Reviewers unanimously commended the rigorous theoretical foundation and impressive empirical speedups on heterogeneous GPU clusters.',
            commentsToAuthor: 'Congratulations on an outstanding submission. We are pleased to accept your manuscript for publication in JSTAI Vol 1 Iss 1.',
            versionNumber: 1,
            decidedAt: new Date('2026-02-28T09:15:00Z')
          }
        ]
      }
    }
  });

  const pubArticle1 = await prisma.publishedArticle.create({
    data: {
      submissionId: sub1.id,
      journalId: journalJSTAI.id,
      issueId: issue1.id,
      title: sub1.title,
      abstract: sub1.abstract,
      doi: '10.5555/jstai.2026.001',
      doiStatus: 'REGISTERED',
      articleNumber: '001',
      pageRange: '1-16',
      pdfStorageKey: 'published/jstai/2026/JSTAI_2026_001_Lewis_TensorSync.pdf',
      pdfUrl: '/storage/published/JSTAI_2026_001_Lewis_TensorSync.pdf',
      license: 'CC BY 4.0',
      citationString: 'Lewis, D., & Raman, K. (2026). Neural Foundations of High-Dimensional Optimization in Heterogeneous Compute Clusters. Journal of Science, Technology & AI, 1(1), 1-16. https://doi.org/10.5555/jstai.2026.001',
      viewsCount: 1420,
      downloadsCount: 512,
      publishedAt: new Date('2026-03-15T00:00:00Z'),
      references: {
        create: [
          {
            orderIndex: 1,
            rawText: 'Dean, J., et al. (2012). Large Scale Distributed Deep Networks. Advances in Neural Information Processing Systems, 25, 1223-1231.',
            doi: '10.5555/nips.2012.01223'
          },
          {
            orderIndex: 2,
            rawText: 'Li, M., et al. (2014). Scaling Distributed Machine Learning with the Parameter Server. 11th USENIX Symposium on Operating Systems Design and Implementation (OSDI 14), 583-598.'
          },
          {
            orderIndex: 3,
            rawText: 'Shoeybi, M., et al. (2019). Megatron-LM: Training Multi-Billion Parameter Language Models Using Model Parallelism. arXiv preprint arXiv:1909.08053.'
          }
        ]
      },
      keywords: {
        create: [
          { keyword: 'Distributed Deep Learning' },
          { keyword: 'Heterogeneous Computing' },
          { keyword: 'Gradient Quantization' },
          { keyword: 'AllReduce Optimization' },
          { keyword: 'Asynchronous Synchronization' }
        ]
      }
    }
  });

  const doi1 = await prisma.dOIRecord.create({
    data: {
      submissionId: sub1.id,
      doi: '10.5555/jstai.2026.001',
      prefix: '10.5555',
      suffix: 'jstai.2026.001',
      agency: 'CROSSREF',
      status: 'REGISTERED',
      depositBatchId: 'crossref-batch-20260315-001',
      responseMessage: 'HTTP 200 OK. Crossref submission accepted and registered in production database.',
      registeredAt: new Date('2026-03-15T01:10:00Z'),
      lastAttemptAt: new Date('2026-03-15T01:10:00Z'),
      retryCount: 0,
      depositAttempts: {
        create: [
          {
            attemptedAt: new Date('2026-03-15T01:10:00Z'),
            requestPayload: '<doi_batch><body/></doi_batch>',
            responseStatus: 200,
            responseBody: '{"status":"SUCCESS","message":"Record created with DOI 10.5555/jstai.2026.001"}',
            isSuccessful: true
          }
        ]
      }
    }
  });

  // Submission 2: Published
  const sub2 = await prisma.submission.create({
    data: {
      submissionNumber: 'NGR-2026-0002',
      journalId: journalJSTAI.id,
      authorId: authorAmina.id,
      articleType: 'RESEARCH_ARTICLE',
      title: 'Autonomous Verification of Distributed Smart Contracts via Symbolic Execution',
      abstract: 'Decentralized state machines remain highly vulnerable to re-entrancy and arithmetic underflow defects. This paper introduces VeriChain, a symbolic execution engine tailored for EVM-compatible bytecode that automates the generation of inductive safety invariants. Across 12,000 audited contracts, VeriChain discovered 47 critical zero-day vulnerabilities with zero false positives.',
      discipline: 'Computer Science - Cryptography & Formal Methods',
      status: 'PUBLISHED',
      reviewModel: 'DOUBLE_ANONYMOUS',
      conflictOfInterest: 'No competing interests declared.',
      assignedEditorId: editorMarcus.id,
      submittedAt: new Date('2026-01-20T11:00:00Z'),
      acceptedAt: new Date('2026-03-01T16:40:00Z'),
      publishedAt: new Date('2026-03-15T00:00:00Z'),
      coAuthors: {
        create: [
          {
            firstName: 'Amina',
            lastName: 'Patel',
            email: 'author.patel@globaltech.edu',
            affiliation: 'National University of Singapore',
            country: 'Singapore',
            orcid: '0000-0002-8812-7095',
            isCorresponding: true,
            authorOrder: 1
          }
        ]
      },
      files: {
        create: [
          {
            versionNumber: 1,
            fileType: 'MANUSCRIPT_DOCX',
            originalFileName: 'VeriChain_Symbolic_Execution.docx',
            storageKey: 'submissions/NGR-2026-0002/v1/VeriChain_Symbolic_Execution.docx',
            storageUrl: '/storage/sample-manuscript.docx',
            mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            fileSize: 312000,
            isConfidential: false,
            uploadedById: authorAmina.id
          }
        ]
      }
    }
  });

  await prisma.publishedArticle.create({
    data: {
      submissionId: sub2.id,
      journalId: journalJSTAI.id,
      issueId: issue1.id,
      title: sub2.title,
      abstract: sub2.abstract,
      doi: '10.5555/jstai.2026.002',
      doiStatus: 'REGISTERED',
      articleNumber: '002',
      pageRange: '17-31',
      pdfStorageKey: 'published/jstai/2026/JSTAI_2026_002_Patel_VeriChain.pdf',
      pdfUrl: '/storage/published/JSTAI_2026_002_Patel_VeriChain.pdf',
      license: 'CC BY 4.0',
      citationString: 'Patel, A. (2026). Autonomous Verification of Distributed Smart Contracts via Symbolic Execution. Journal of Science, Technology & AI, 1(1), 17-31. https://doi.org/10.5555/jstai.2026.002',
      viewsCount: 980,
      downloadsCount: 320,
      publishedAt: new Date('2026-03-15T00:00:00Z'),
      keywords: {
        create: [
          { keyword: 'Formal Methods' },
          { keyword: 'Smart Contract Security' },
          { keyword: 'Symbolic Execution' },
          { keyword: 'Vulnerability Detection' }
        ]
      }
    }
  });

  await prisma.dOIRecord.create({
    data: {
      submissionId: sub2.id,
      doi: '10.5555/jstai.2026.002',
      prefix: '10.5555',
      suffix: 'jstai.2026.002',
      agency: 'CROSSREF',
      status: 'REGISTERED',
      depositBatchId: 'crossref-batch-20260315-002',
      registeredAt: new Date('2026-03-15T01:10:00Z')
    }
  });

  // 5. Create In-Flight Submissions for Workflow Testing
  // Submission 3: UNDER_REVIEW
  const sub3 = await prisma.submission.create({
    data: {
      submissionNumber: 'NGR-2026-0003',
      journalId: journalJSTAI.id,
      authorId: authorDavid.id,
      articleType: 'RESEARCH_ARTICLE',
      title: 'Energy-Efficient Transformer Inference on Edge-Decomposable Silicon',
      abstract: 'Deploying foundation models on battery-constrained edge nodes requires fundamental trade-offs between memory bandwidth and quantized matrix operations. We design a sparsity-aware accelerator yielding 38 TOPs/W.',
      discipline: 'Computer Science - Hardware & Embedded Systems',
      status: 'UNDER_REVIEW',
      reviewModel: 'DOUBLE_ANONYMOUS',
      assignedEditorId: editorMarcus.id,
      submittedAt: new Date('2026-04-01T10:00:00Z'),
      coAuthors: {
        create: [
          {
            firstName: 'David',
            lastName: 'Lewis',
            email: 'author.lewis@research.org',
            affiliation: 'Stanford University',
            isCorresponding: true,
            authorOrder: 1
          }
        ]
      },
      files: {
        create: [
          {
            versionNumber: 1,
            fileType: 'MANUSCRIPT_DOCX',
            originalFileName: 'Edge_Transformer_Silicon_v1.docx',
            storageKey: 'submissions/NGR-2026-0003/v1/Edge_Transformer_Silicon_v1.docx',
            mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            fileSize: 512000,
            isConfidential: true,
            uploadedById: authorDavid.id
          }
        ]
      },
      reviewAssignments: {
        create: [
          {
            reviewerId: reviewerTuring.id,
            editorId: editorMarcus.id,
            status: 'ACCEPTED',
            dueDate: new Date('2026-11-20T00:00:00Z'),
            invitationDate: new Date('2026-04-02T00:00:00Z'),
            responseDate: new Date('2026-04-03T00:00:00Z')
          },
          {
            reviewerId: reviewerSommer.id,
            editorId: editorMarcus.id,
            status: 'INVITED',
            dueDate: new Date('2026-11-20T00:00:00Z'),
            invitationDate: new Date('2026-04-02T00:00:00Z')
          }
        ]
      }
    }
  });

  // Submission 4: REVISIONS_REQUESTED (with submitted review report)
  const sub4 = await prisma.submission.create({
    data: {
      submissionNumber: 'NGR-2026-0004',
      journalId: journalJSTAI.id,
      authorId: authorAmina.id,
      articleType: 'RESEARCH_ARTICLE',
      title: 'Differential Privacy in Collaborative Federated Healthcare Models',
      abstract: 'Clinical institutions seeking to build collaborative prognostic models face strict patient privacy mandates. We present PrivClinical, a federated averaging architecture with moments accountant bounding.',
      discipline: 'Computer Science - Biomedical Informatics & Privacy',
      status: 'REVISIONS_REQUESTED',
      reviewModel: 'DOUBLE_ANONYMOUS',
      assignedEditorId: editorMarcus.id,
      submittedAt: new Date('2026-03-20T12:00:00Z'),
      coAuthors: {
        create: [
          {
            firstName: 'Amina',
            lastName: 'Patel',
            email: 'author.patel@globaltech.edu',
            affiliation: 'National University of Singapore',
            isCorresponding: true,
            authorOrder: 1
          }
        ]
      },
      files: {
        create: [
          {
            versionNumber: 1,
            fileType: 'MANUSCRIPT_DOCX',
            originalFileName: 'PrivClinical_Federated_v1.docx',
            storageKey: 'submissions/NGR-2026-0004/v1/PrivClinical_Federated_v1.docx',
            mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            fileSize: 450000,
            isConfidential: true,
            uploadedById: authorAmina.id
          }
        ]
      },
      editorialDecisions: {
        create: [
          {
            editorId: editorMarcus.id,
            decision: 'MINOR_REVISION',
            rationale: 'Reviewer recommendations are largely positive; please address the empirical privacy budget epsilon calibration in Section 4.2.',
            commentsToAuthor: 'Please submit a revised Word document and point-by-point response letter within 30 days.',
            versionNumber: 1,
            decidedAt: new Date('2026-04-10T14:00:00Z')
          }
        ]
      }
    }
  });

  // Create completed review report for sub4
  const assignmentForSub4 = await prisma.reviewAssignment.create({
    data: {
      submissionId: sub4.id,
      reviewerId: reviewerSommer.id,
      editorId: editorMarcus.id,
      status: 'COMPLETED',
      dueDate: new Date('2026-04-08T00:00:00Z'),
      completedDate: new Date('2026-04-07T18:00:00Z'),
      report: {
        create: {
          recommendation: 'MINOR_REVISION',
          rating: 4,
          commentsForAuthors: 'Strong paper with timely medical application. Please clarify the noise multiplier sigma calculation for extreme non-IID patient cohort splits.',
          confidentialCommentsForEditors: 'High-quality methodology, ready for acceptance once the minor empirical calibration is expanded.'
        }
      }
    }
  });

  // Submission 5: SUBMITTED (Awaiting desk screening)
  const sub5 = await prisma.submission.create({
    data: {
      submissionNumber: 'NGR-2026-0005',
      journalId: journalJSTAI.id,
      authorId: authorDavid.id,
      articleType: 'SHORT_COMMUNICATION',
      title: 'Zero-Knowledge Proofs for Scalable Cross-Chain Interoperability',
      abstract: 'We formalize a succinct non-interactive argument of knowledge (SNARK) circuit for cross-chain state verification requiring under 45,000 gas units per transaction batch.',
      discipline: 'Computer Science - Cryptography',
      status: 'SUBMITTED',
      reviewModel: 'DOUBLE_ANONYMOUS',
      submittedAt: new Date('2026-04-14T09:30:00Z'),
      coAuthors: {
        create: [
          {
            firstName: 'David',
            lastName: 'Lewis',
            email: 'author.lewis@research.org',
            affiliation: 'Stanford University',
            isCorresponding: true,
            authorOrder: 1
          }
        ]
      },
      files: {
        create: [
          {
            versionNumber: 1,
            fileType: 'MANUSCRIPT_DOCX',
            originalFileName: 'ZK_CrossChain_Proof.docx',
            storageKey: 'submissions/NGR-2026-0005/v1/ZK_CrossChain_Proof.docx',
            mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            fileSize: 280000,
            isConfidential: true,
            uploadedById: authorDavid.id
          }
        ]
      }
    }
  });

  // Submission 6: ACCEPTED / PRODUCTION (Ready for DOI preparation & issue scheduling)
  const sub6 = await prisma.submission.create({
    data: {
      submissionNumber: 'NGR-2026-0006',
      journalId: journalJSTAI.id,
      authorId: authorAmina.id,
      articleType: 'RESEARCH_ARTICLE',
      title: 'Quantum-Resilient Lattice Cryptography for Aerospace Telemetry',
      abstract: 'Next-generation satellite constellations require quantum-immune authenticated encryption with microsecond roundtrip latencies. We implement Module-LWE encryption on radiation-hardened FPGA silicon.',
      discipline: 'Computer Science & Aerospace Engineering',
      status: 'ACCEPTED',
      reviewModel: 'DOUBLE_ANONYMOUS',
      assignedEditorId: editorMarcus.id,
      submittedAt: new Date('2026-02-15T10:00:00Z'),
      acceptedAt: new Date('2026-04-12T15:00:00Z'),
      coAuthors: {
        create: [
          {
            firstName: 'Amina',
            lastName: 'Patel',
            email: 'author.patel@globaltech.edu',
            affiliation: 'National University of Singapore',
            isCorresponding: true,
            authorOrder: 1
          }
        ]
      },
      files: {
        create: [
          {
            versionNumber: 1,
            fileType: 'MANUSCRIPT_DOCX',
            originalFileName: 'Quantum_Lattice_Aerospace.docx',
            storageKey: 'submissions/NGR-2026-0006/v1/Quantum_Lattice_Aerospace.docx',
            mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            fileSize: 490000,
            isConfidential: true,
            uploadedById: authorAmina.id
          }
        ]
      },
      editorialDecisions: {
        create: [
          {
            editorId: editorMarcus.id,
            decision: 'ACCEPT',
            rationale: 'All reviewer suggestions have been rigorously incorporated. Hardware benchmarks confirm performance under aerospace conditions.',
            commentsToAuthor: 'Accepted for publication in Issue 2.',
            versionNumber: 1,
            decidedAt: new Date('2026-04-12T15:00:00Z')
          }
        ]
      }
    }
  });

  // Draft DOI for sub6
  await prisma.dOIRecord.create({
    data: {
      submissionId: sub6.id,
      doi: '10.5555/jstai.2026.003',
      prefix: '10.5555',
      suffix: 'jstai.2026.003',
      agency: 'CROSSREF',
      status: 'DRAFT'
    }
  });

  // 6. Create Initial Audit Events
  await prisma.auditEvent.createMany({
    data: [
      {
        userId: masterAdmin.id,
        action: 'BOOTSTRAP_ADMIN',
        entityType: 'USER',
        entityId: masterAdmin.id,
        details: JSON.stringify({ email: masterAdmin.email, note: 'Platform initial master administrator provisioned' })
      },
      {
        userId: editorMarcus.id,
        action: 'PUBLISH_ARTICLE',
        entityType: 'SUBMISSION',
        entityId: sub1.id,
        details: JSON.stringify({ doi: '10.5555/jstai.2026.001', journal: 'jstai', volume: 1, issue: 1 })
      },
      {
        userId: editorMarcus.id,
        action: 'RECORD_EDITORIAL_DECISION',
        entityType: 'SUBMISSION',
        entityId: sub6.id,
        details: JSON.stringify({ decision: 'ACCEPT', submissionNumber: 'NGR-2026-0006' })
      }
    ]
  });

  // 7. System Settings
  await prisma.systemSetting.createMany({
    data: [
      {
        key: 'PLATFORM_NAME',
        value: 'NextGen Research and Innovation Press',
        description: 'Organization name'
      },
      {
        key: 'MASTER_ADMIN_INITIALIZED',
        value: 'true',
        description: 'Flag indicating master administrator bootstrap has completed'
      },
      {
        key: 'CROSSREF_DOI_PREFIX',
        value: '10.5555',
        description: 'Current DOI registration prefix'
      },
      {
        key: 'CROSSREF_MODE',
        value: 'test',
        description: 'Deposit mode (test or production)'
      }
    ]
  });

  console.log('Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
