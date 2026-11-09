# Clinton Health Access Initiative (CHAI) - Market Shaping Practice
## Total Cost of Ownership (TCO) Model: Telecom Tower Battery Evaluation

This repository contains the interactive Total Cost of Ownership (TCO) model and case study deliverables evaluating **Standard Lead-Acid Batteries (LABs)** versus **Longer-Lasting LABs (IndusPower XL-Series)** for a telecom tower operator fleet of 10,000 towers in India.

### Overview
- **Fleet Scope**: 10,000 telecom towers (6 battery units per tower; 60,000 active battery units).
- **Core Question**: Does paying a higher initial upfront price (+22.9% unit cost premium) for extended-life batteries deliver commercial and environmental savings via reduced replacement frequency?
- **Key Findings**:
  - **Annual Fleet Savings**: **₹16.31 Cr / year** (-31.9% reduction in annual battery-related expenditures).
  - **CAPEX Payback Period**: **1.18 years (14.1 months)** to fully recover the incremental Year-1 CAPEX (₹19.20 Cr across the fleet).
  - **TCO Crossover Lifespan**: **24.5 months** (XL batteries remain cheaper as long as they last at least 24.5 months, providing an 11.5-month safety margin over the 36-month baseline expectation).
  - **Price Crossover Threshold**: **₹25,353 / unit** (Operator still saves money even if the XL price increases by up to +81.1% over standard).

---

### Project Structure
- `index.html` — Interactive web application configured for deployment (e.g., GitHub Pages).
- `tco_model_chai.html` — Fully self-contained, standalone HTML build with embedded styles, scripts, and logo (works offline without external dependencies).
- `styles.css` — Responsive stylesheet with mobile optimizations (touch targets, flexible layout, SVG scaling).
- `app.js` — Live reactive mathematical calculation engine and native SVG chart renderer.
- `template.html` — Base modular HTML template.
- `compile_html.py` — Compilation script to build both standalone and modular distributions.
- `Case Study Exercise.docx`, `Document A.docx`, `Document B.docx` — Case study source documents and background materials.
- `image.jpeg` — Official CHAI branding asset.

---

### How to Run Locally
1. Clone the repository:
   ```bash
   git clone https://github.com/akshit0801/CHAI.git
   cd CHAI
   ```
2. Open either `index.html` or `tco_model_chai.html` in any modern web browser (desktop, tablet, or mobile). No web server, Node.js, or external libraries are required.
