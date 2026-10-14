# Citation Verification Agent

A free Streamlit app for checking references in a DOCX reference list against Crossref metadata and preparing Word and Excel review reports.

## Features
- Upload a DOCX file containing the reference list.
- Extract reference paragraphs and preview extraction before checking.
- Look up references using DOI, title, and bibliographic search against Crossref.
- Provide Google Scholar search links for manual investigation.
- Produce an Excel workbook with Full Audit, Manual Review, and Matched sheets.
- Produce a Word reference report. Only high-confidence matches are regenerated; uncertain records are retained as supplied and marked MANUAL CORRECTION REQUIRED.
- Uses the two requested decision labels: TOTALLY CORRECTED and MANUAL CORRECTION REQUIRED.

## Run locally
Python 3.10+ is recommended.

    python -m venv .venv
    # Windows:
    .venv\Scripts\activate
    # macOS/Linux:
    source .venv/bin/activate
    pip install -r requirements.txt
    streamlit run app.py

## Free deployment with Streamlit Community Cloud
1. Open https://share.streamlit.io/ and sign in with GitHub.
2. Select repository mritunjay-debug/Research.
3. Set branch to main.
4. Set Main file path to citation-verification-agent/app.py.
5. Deploy. The dependency file is in the same directory as the app.

GitHub Pages does not execute Python/Streamlit apps; use Streamlit Community Cloud for the web interface.

## Important limitations
- The app currently processes a DOCX containing a reference list; it does not edit in-text citations in a full manuscript.
- Reference parsing depends on the document's layout. Review the extracted preview before running checks.
- Crossref is not exhaustive. No result does not mean a citation is fabricated.
- Automated matching is conservative but not infallible. Always inspect suggested metadata, especially publication year, author order, article number, and online-first versus issue-year differences.
- The generated Word document is a separate report, not an in-place edit of the uploaded DOCX.
- Do not upload confidential manuscripts unless you are comfortable sending reference text to Crossref queries. The uploaded file itself is processed by the app; no app-specific persistent storage is configured.

## Dependencies
See requirements.txt.
