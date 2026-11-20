# Portfolio Presentation Standard

The portfolio exists to provide evidence of practical ability while transitioning into a technical role. A course completion badge is useful, but a working project with a clear explanation is stronger evidence.

## Every substantial project should include

1. **Business problem** — what repetitive, slow or error-prone task needs solving?
2. **Intended user** — who would use the tool?
3. **Solution overview** — what does the application do?
4. **Architecture** — diagram the application, database and external systems.
5. **Technology stack** — list languages, frameworks, databases and APIs.
6. **Working demonstration** — screenshots and a short screen-recorded walkthrough.
7. **Source code** — organized, readable and reproducible.
8. **Setup instructions** — explain how to run it using synthetic data.
9. **Testing** — show normal cases, edge cases and failure handling.
10. **Results and limitations** — describe what works, what remains incomplete and what should improve next.

## Demo video format

Aim for 5–10 minutes for a small project:
- 0:00–1:00 — business problem and context.
- 1:00–2:00 — architecture or database structure.
- 2:00–6:00 — demonstrate the most meaningful functionality.
- 6:00–8:00 — explain key technical decisions and error handling.
- 8:00–10:00 — limitations, next improvements and potential business value.

A simple screen recording with clear narration is enough. Editing and production polish are optional.

## README layout

Recommended sections:
- Overview
- Business problem
- Features
- Demo video
- Screenshots
- Architecture
- Tech stack
- Data model / API design
- Setup and usage
- Tests
- Results
- Limitations and future work

## Be accurate about impact

Do not claim savings or results that have not been measured. If a number is hypothetical, label it as an estimate or scenario. For example, compare a clearly stated assumed manual processing time with the measured runtime of the prototype.

## Public repository safety

- Use synthetic data and fictional entities.
- Never commit API keys, passwords, tokens or connection strings.
- Do not publish employer records, customer details, supplier invoices or internal screenshots.
- Use environment variables and provide a safe example environment file.
- Explain when an integration is simulated rather than connected to a live service.
