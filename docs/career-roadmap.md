# Career Roadmap

## Target role

**ERP Business Process Automation Developer / ERP Application Developer**

The work I am aiming for combines business-process knowledge with software development. The job is to identify repetitive or error-prone workflows, build applications and integrations that perform them reliably, and demonstrate the operational value.

SAP is the initial specialization because of existing hands-on SAP Business One and distribution experience. The long-term skills should transfer to other ERP platforms such as Dynamics 365, NetSuite, Oracle, Infor and Odoo.

## What the work looks like

- Automate order, purchasing, receiving, inventory and shipping workflows.
- Build applications that retrieve, validate, compare and update business data.
- Connect ERP systems to carriers, supplier portals, databases and other applications.
- Create exception reports, approval steps, notifications and audit trails.
- Add AI-assisted document extraction and classification where it is useful.
- Quantify time saved, errors avoided and process improvements.

## Learning sequence and checkpoints

Timelines are estimates at roughly 15 hours of study per week. Progress is based on demonstrated ability, not dates. Apply as soon as a checkpoint makes you a credible candidate; do not wait until the end.

| Stage | Main learning | Evidence / milestone | Roles to begin targeting |
|---|---|---|---|
| 0 — Now | Leverage existing ERP and distribution experience | Resume examples of ERP processes, troubleshooting, process improvements and tools | ERP Support Analyst, Business Systems Support, Junior ERP Analyst, ERP Data Coordinator, Application Support Analyst |
| 1 — SQL | SQL, relational data, PostgreSQL/SQLite fundamentals | Distribution Operations Database and recorded walkthrough | Junior ERP Data Analyst, Master Data Analyst, Junior Systems Analyst, ERP Reporting Analyst |
| 2 — JavaScript | Programming fundamentals and application logic | Inventory Lookup and Reporting Application | Junior Automation Analyst, Business Applications Analyst, Operations Systems Analyst |
| 3 — TypeScript / Node.js | Backend development, REST APIs, JSON, authentication, testing and error handling | End-to-end Shipping Automation System | Junior Integration Developer, Automation Developer, Junior Backend / Application Developer |
| 4 — SAP CAP | CDS, OData, CAP services, authorization and SAP application patterns | Procurement / PO-GRPO-Invoice Comparator | Junior SAP CAP Developer, SAP Application Developer, ERP Application Developer |
| 5 — Integration | SAP Integration Suite, integration flows, APIs, SAP Build workflows | Direct-Ship Automation | Integration Developer, Business Process Automation Developer, SAP Integration Developer |
| 6 — Python / AI | Document processing, data workflows, AI APIs and extraction | AI-Assisted Invoice Processing | Automation Developer, Business Applications Developer, AI Workflow / Document Automation roles |

### Application strategy

- **Apply now:** existing ERP experience is relevant to support, systems and junior analyst roles. No certification is required before applying to every entry-level role.
- **During SQL and JavaScript:** keep applying to ERP/application support roles and add junior systems and automation roles when project evidence exists.
- **After Node.js and a working API integration:** broaden toward junior automation and integration development.
- **After CAP:** add SAP application and integration positions.
- Treat years-of-experience requirements as signals, not automatic disqualifiers. Apply when the core responsibilities match and the experience requirement is flexible.
- Fully remote work is the preferred arrangement. Check whether a role is truly remote, hybrid or requires occasional site visits.

## Technical learning order

1. SQL — retrieve, relate, aggregate and safely modify business data.
2. JavaScript — write application logic.
3. TypeScript — add stronger types and maintainability.
4. Node.js — build backend services and APIs.
5. SAP CAP — build SAP-oriented services and applications.
6. SAP Integration Suite and SAP Build — connect systems and orchestrate workflows.
7. Python — add document processing, data processing and AI capabilities.

ABAP, advanced BTP administration, EWM and deep S/4HANA functional configuration are not immediate priorities. Revisit them only if a target role or project makes them useful.

## Certifications

Certifications are supporting evidence, not the main objective.

- No certification is required before applying for suitable junior ERP/application support roles.
- A SQL course completion certificate is optional.
- Consider an official SAP CAP certification after building a CAP project and checking current exam availability.
- Consider Integration Suite certification after gaining practical integration experience.
- Do not prioritize SAP Business One certification or an S/4HANA functional-consultant certification for this career direction.

## Engineering standards

Every automation should be designed around business rules and reliable system behavior:

- Prefer supported APIs, OData or documented integration interfaces.
- Validate inputs and business rules before changing records.
- Prevent duplicate processing and make operations safe to retry where possible.
- Handle errors explicitly and record useful logs.
- Protect credentials and sensitive data.
- Use least-privilege access and authorization checks.
- Keep an audit trail for important business actions.
- Require human review for high-impact financial, inventory or purchasing actions when appropriate.
- Test with synthetic data before connecting to live systems.
