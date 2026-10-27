import React, { useEffect, useState } from 'react';
import { get, post, patch, upload } from '../api';
import { Card, Btn, Pill, Toolbar, SectionHead, Select, Input, Textarea, Empty } from '../components/UI';
import Modal from '../components/Modal';
import { useToast } from '../components/Toast';

export default function DueDiligence() {
  const toast = useToast();
  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
  const isInvestorOrAdmin = currentUser.role === 'investor' || currentUser.role === 'admin';

  const [deals, setDeals] = useState([]);
  const [selectedDealId, setSelectedDealId] = useState(1);
  const [documents, setDocuments] = useState([]);
  const [uploadOpen, setUploadOpen] = useState(false);

  // Upload Form
  const [docCategory, setDocCategory] = useState('Financial');
  const [docName, setDocName] = useState('');
  const [docFile, setDocFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  // Investment memo state
  const [memoText, setMemoText] = useState('High market demand for integrated founder tooling. Verified team pedigree and pilot traction. Next milestone is seed syndicate closing.');
  const [assessment, setAssessment] = useState({ market: '8.4 / 10', team: '9.2 / 10', traction: '7.8 / 10', risk: 'Medium-Low' });
  const [savingMemo, setSavingMemo] = useState(false);

  const loadDeals = async () => {
    try {
      const data = await get('/deals');
      setDeals(data);
      if (data.length) {
        setSelectedDealId(data[0].id);
        loadDocuments(data[0].id);
        if (data[0].notes) setMemoText(data[0].notes);
      }
    } catch {}
  };

  const loadDocuments = async dId => {
    try {
      const docs = await get(`/deals/${dId}/documents`);
      setDocuments(docs);
    } catch (err) {
      toast.error('Failed to load diligence documents');
    }
  };

  useEffect(() => {
    loadDeals();
  }, []);

  async function handleUpload(e) {
    e.preventDefault();
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('category', docCategory);
      formData.append('document_name', docName || (docFile ? docFile.name : 'Verified Document'));
      if (docFile) formData.append('file', docFile);

      await upload(`/deals/${selectedDealId}/documents`, formData);
      toast.success('Due diligence document recorded!');
      setUploadOpen(false);
      setDocName('');
      setDocFile(null);
      loadDocuments(selectedDealId);
    } catch (err) {
      toast.error(err.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  }

  async function updateDocStatus(docId, status) {
    try {
      await patch(`/due-diligence/${docId}`, { status });
      toast.success(`Document marked as "${status}"!`);
      loadDocuments(selectedDealId);
    } catch (err) {
      toast.error('Failed to update document status');
    }
  }

  async function handleSaveMemo() {
    setSavingMemo(true);
    try {
      await patch(`/deals/${selectedDealId}`, { notes: memoText });
      toast.success('Investment memo saved to deal record!');
    } catch (err) {
      toast.error('Failed to save memo');
    } finally {
      setSavingMemo(false);
    }
  }

  const selectedDeal = deals.find(d => d.id === selectedDealId) || deals[0];
  const docStatuses = ['Requested', 'Uploaded', 'Under Review', 'Verified', 'Issue'];

  return (
    <div className="page">
      <Toolbar
        eyebrow="AUDIT & VERIFICATION"
        title="Due Diligence Room"
        action={
          <Btn onClick={() => setUploadOpen(true)}>
            ＋ Upload Document
          </Btn>
        }
      />

      <div className="filterbar">
        <div className="field">
          <span>Active Deal Opportunity</span>
          <select
            value={selectedDealId}
            onChange={e => {
              const id = Number(e.target.value);
              setSelectedDealId(id);
              loadDocuments(id);
              const deal = deals.find(d => d.id === id);
              if (deal?.notes) setMemoText(deal.notes);
            }}
          >
            {deals.map(d => (
              <option key={d.id} value={d.id}>
                {d.startup_name} — {d.title} ({d.stage})
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="dd-grid">
        {/* Document Checklist */}
        <Card>
          <SectionHead
            eyebrow={`${(selectedDeal?.startup_name || 'STARTUP').toUpperCase()} · DEAL #${selectedDealId}`}
            title="Diligence Document Repository"
            action={<Pill tone="success">{documents.filter(d => d.status === 'Verified').length}/{documents.length} Verified</Pill>}
          />

          <div className="document-list">
            {documents.map(doc => (
              <div className="document-row" key={doc.id}>
                <div className="doc-icon">▤</div>
                <div>
                  <b>{doc.document_name}</b>
                  <span>{doc.category} Document · Status: {doc.status}</span>
                </div>

                <div>
                  <Pill tone={doc.status === 'Verified' ? 'success' : (doc.status === 'Under Review' ? 'warning' : '')}>
                    {doc.status}
                  </Pill>
                </div>

                <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                  {isInvestorOrAdmin ? (
                    <select
                      value={doc.status}
                      onChange={e => updateDocStatus(doc.id, e.target.value)}
                      style={{ fontSize: '9px', padding: '3px', maxWidth: '105px' }}
                    >
                      {docStatuses.map(st => (
                        <option key={st} value={st}>{st}</option>
                      ))}
                    </select>
                  ) : null}

                  {doc.file_url ? (
                    <a
                      href={doc.file_url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-btn"
                      style={{ padding: '4px 8px', background: '#eef4ff', borderRadius: '6px' }}
                    >
                      Download
                    </a>
                  ) : (
                    <button
                      type="button"
                      onClick={() => toast.info(`Viewing recorded record: ${doc.document_name}`)}
                    >
                      Inspect
                    </button>
                  )}
                </div>
              </div>
            ))}

            {!documents.length && (
              <Empty
                title="No documents uploaded for this deal"
                text="Upload pitch decks, incorporation filings, or financial statements."
                action={<Btn onClick={() => setUploadOpen(true)}>Upload First Document</Btn>}
              />
            )}
          </div>
        </Card>

        {/* Investment Assessment Memo */}
        <Card>
          <SectionHead
            eyebrow="INVESTMENT COMMITTEE"
            title="Diligence Assessment"
          />

          <div className="assessment">
            <div>
              <span>Market Validation</span>
              <b>{assessment.market}</b>
            </div>
            <div>
              <span>Team Capability</span>
              <b>{assessment.team}</b>
            </div>
            <div>
              <span>Early Traction</span>
              <b>{assessment.traction}</b>
            </div>
            <div>
              <span>Risk Profile</span>
              <b>{assessment.risk}</b>
            </div>
          </div>

          <Textarea
            label="Investment Committee Thesis & Memo"
            rows={5}
            value={memoText}
            onChange={e => setMemoText(e.target.value)}
            style={{ margin: '15px 20px', width: 'calc(100% - 40px)' }}
          />

          <div style={{ padding: '0 20px 20px' }}>
            <Btn
              style={{ width: '100%' }}
              onClick={handleSaveMemo}
              loading={savingMemo}
            >
              Save Diligence Memo ✓
            </Btn>
          </div>
        </Card>
      </div>

      {/* Upload Document Modal */}
      {uploadOpen && (
        <Modal
          eyebrow="DILIGENCE REPOSITORY"
          title="Upload Due Diligence Document"
          close={() => setUploadOpen(false)}
        >
          <form className="modal-form" onSubmit={handleUpload}>
            <Select
              label="Document Category"
              value={docCategory}
              onChange={e => setDocCategory(e.target.value)}
            >
              <option value="Financial">Financial (Revenue, Bank Statements, Cap Table)</option>
              <option value="Legal">Legal (Incorporation, Founder Agreements, IP)</option>
              <option value="Product">Product & Tech (Architecture, Security, Codebase)</option>
              <option value="Business">Business (Pitch Deck, Market Research, Competitor Analysis)</option>
            </Select>

            <Input
              label="Document Name / Title"
              placeholder="e.g. Audited Cap Table & Equity Breakdown"
              value={docName}
              onChange={e => setDocName(e.target.value)}
            />

            <div className="field">
              <span>Select File (PDF, DOCX, XLSX, PNG)</span>
              <input
                type="file"
                onChange={e => setDocFile(e.target.files[0])}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '10px' }}>
              <Btn variant="outline" onClick={() => setUploadOpen(false)}>Cancel</Btn>
              <Btn type="submit" loading={uploading}>Upload to Deal Room →</Btn>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
